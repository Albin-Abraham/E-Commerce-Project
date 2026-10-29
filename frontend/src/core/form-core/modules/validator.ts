/**
 * @file validator.ts
 * @description Orchestrates field and form validation against a pluggable adapter.
 *
 * ## Responsibility
 * `FormValidator` is the **validation orchestrator** — it coordinates when and
 * which fields get validated, delegates the actual rule-running to a
 * {@link ValidationAdapter}, and writes results to {@link ErrorManager}.
 *
 * It does NOT implement validation rules itself. The strategy is injected
 * via the `ValidationAdapter` interface, making it trivially swappable
 * (internal registry, Yup, Zod, server-side, etc.).
 *
 * ## Validation-mode gating
 * `FormValidator` methods are called by different parts of the engine
 * depending on the active `ValidationMode`:
 *
 * | Mode       | Called From           | When                      |
 * |------------|-----------------------|---------------------------|
 * | `onChange` | `FormExecution`       | After every value update  |
 * | `onBlur`   | `FormExecution`       | On field blur             |
 * | `lazy`     | `FormExecution`       | On blur (pre-submit), then onChange after first submit |
 * | `onSubmit` | `FormCore.submit()`   | Only on explicit submit   |
 * | `manual`   | Caller               | Explicit `validateFields` |
 *
 * ## Repeater / Template Guard
 * Fields without a `vitality` entry (i.e., repeater template fields that were
 * skipped during initialization) are automatically excluded from validation.
 * This prevents ghost errors on template fields that never have real values.
 */
import type { DetailedError } from "@form-core/int-types";
import type { ValidationAdapter } from "@form-core/validation-adapter";

import { DebugManager } from "./debug-manager";
import { ErrorManager } from "./error-manager";
import { FieldResolver } from "./resolver";
import { FormRuntime } from "./runtime";
import { StateManager } from "./state-manager";

export class FormValidator<T extends Record<string, any>> {
  private pendingValidations = new Map<string, number>();

  /**
   * @param validator      - The pluggable validation strategy (e.g., `ValidationProxy`, `YupAdapter`).
   *   Can be replaced at runtime via {@link setValidator}.
   * @param resolver       - Resolves field definitions from IDs.
   * @param stateManager   - Provides current values, vitality, and visibility state.
   * @param errorManager   - Gateway for writing validation results (errors) to state.
   * @param runtime        - Provides `valueProxy` for reading field values by path.
   * @param debugManager   - Optional DebugManager for performance logging.
   * @param isFieldHidden  - Optional predicate for runtime-hidden fields (e.g., permission `"hidden"`); skipped like invisible fields.
   */
  constructor(
    private validator: ValidationAdapter,
    private resolver: FieldResolver,
    private stateManager: StateManager<T>,
    private errorManager: ErrorManager<T>,
    private runtime: FormRuntime<T>,
    private debugManager?: DebugManager<T>,
    private isFieldHidden?: (fieldId: string) => boolean
  ) {}

  /**
   * Replaces the active validation adapter at runtime.
   *
   * Useful when validation strategy needs to change dynamically, e.g.:
   * - Switching from internal validation to a server-side adapter after login.
   * - Applying a stricter schema after a wizard step is completed.
   *
   * @param validator - The new {@link ValidationAdapter} to use from now on.
   */
  setValidator(validator: ValidationAdapter) {
    this.validator = validator;
  }

  /**
   * Helper that resolves a promise or value within a timeout duration.
   */
  private async executeWithTimeout<R>(
    promise: Promise<R> | R,
    timeoutMs: number,
    fallback: R,
    fieldId: string
  ): Promise<R> {
    if (!(promise instanceof Promise)) return promise;
    return new Promise<R>((resolve) => {
      const timer = setTimeout(() => {
        console.warn(
          `[FormValidator] Async validation timed out for field "${fieldId}" after ${timeoutMs}ms.`
        );
        if (this.debugManager) {
          this.debugManager.log("validationTimeout", { fieldId, timeoutMs });
        }
        resolve(fallback);
      }, timeoutMs);

      promise.then(
        (res) => {
          clearTimeout(timer);
          resolve(res);
        },
        (err) => {
          clearTimeout(timer);
          console.error(
            `[FormValidator] Async validation failed for field "${fieldId}":`,
            err
          );
          if (this.debugManager) {
            this.debugManager.log("validationError", {
              fieldId,
              error: String(err),
            });
          }
          resolve(fallback);
        }
      );
    });
  }

  /**
   * Validates a single field by ID.
   *
   * **Guards (will skip validation if any apply):**
   * 1. Field has no vitality entry → it's a repeater template; skip.
   * 2. Field definition cannot be resolved → unknown field; skip.
   * 3. Field is currently hidden (`visibility === false`) or runtime-hidden
   *    (permission `"hidden"`) → clear errors and skip.
   *    Hidden fields cannot fail validation — they won't appear in the submit payload.
   *
   * **After guards:** reads the field's value via `ValueProxy`, calls the adapter's
   * `validateField()`, awaits the result (supports async adapters), then writes
   * the errors to `ErrorManager`.
   *
   * @param fieldId - The ID of the field to validate.
   *
   * @example
   * await validator.validateField("email_id");
   * // If email is invalid: errorManager.setErrors("email_id", [{ code: "email", ... }])
   * // If email is valid:   errorManager.setErrors("email_id", [])
   */
  async validateField(fieldId: string) {
    // 1. Field resolution & Template Guard
    const field = this.resolver.resolveField(fieldId);
    if (!field || (field as any).isTemplate) return;

    const stateKey = (field as any).stateKey || fieldId;

    // Guard 3: Hidden fields are skipped and their errors are cleared
    if (
      this.stateManager.state.visibility[stateKey] === false ||
      this.isFieldHidden?.(fieldId)
    ) {
      this.errorManager.setErrors(stateKey, []);
      return;
    }

    // Read the current value using same path-based access used everywhere else
    const value = this.runtime.valueProxy.getValue(
      this.stateManager.state.values,
      field.name || ""
    );

    const startTime = performance.now();
    const transactionId = (this.pendingValidations.get(fieldId) || 0) + 1;
    this.pendingValidations.set(fieldId, transactionId);

    // 2A. Run Standard Validation (pluggable adapter)
    const standardResult = this.validator.validateField(
      field,
      value,
      this.stateManager.state.values
    );

    const fieldType = this.resolver.getFieldType(fieldId);
    let customResult: any;
    if (fieldType?.validate) {
      customResult = fieldType.validate(value, {
        form: this.stateManager.state, // Pass state as context for now
        field,
      });
    }

    const isAsync =
      standardResult instanceof Promise || customResult instanceof Promise;

    if (isAsync) {
      this.errorManager.setPending(fieldId, true);
    }

    const timeoutMs = (field.validation as any)?.timeoutMs || 5000;
    let errors: DetailedError[] = [];

    try {
      const standardErrors = await this.executeWithTimeout(
        standardResult,
        timeoutMs,
        [],
        fieldId
      );

      let customErrors: any = [];
      if (customResult !== undefined) {
        customErrors = await this.executeWithTimeout(
          customResult,
          timeoutMs,
          [],
          fieldId
        );
      }

      // Check transaction ID to ensure we haven't been cancelled by a newer keystroke
      if (this.pendingValidations.get(fieldId) !== transactionId) {
        if (this.debugManager) {
          this.debugManager.log("validateFieldCancelled", {
            fieldId,
            transactionId,
          });
        }
        return;
      }

      errors = [...standardErrors];
      if (customErrors) {
        const formattedCustomErrors = Array.isArray(customErrors)
          ? customErrors
          : [{ code: "custom", message: String(customErrors), fieldId }];
        errors = [...errors, ...formattedCustomErrors];
      }
    } catch (e) {
      console.error(
        `[FormValidator] Unexpected error validating field ${fieldId}:`,
        e
      );
      if (this.pendingValidations.get(fieldId) !== transactionId) return;
    } finally {
      if (isAsync) {
        this.errorManager.setPending(fieldId, false);
      }
    }

    const duration = performance.now() - startTime;
    if (this.debugManager) {
      this.debugManager.log("validateField", {
        fieldId,
        errorsCount: errors.length,
        durationMs: duration,
        timestamp: Date.now(),
      });
    }

    // Write results to state via ErrorManager
    this.errorManager.setErrors(fieldId, errors);
  }

  /**
   * Screens a candidate value *before* it is written to form state.
   *
   * Backs `disableDeferredValidation`. Two independent gates, both of which
   * **reject** rather than rewrite or throw:
   *
   *  1. **Character gate** — the field's `sanitize` rules normalize the candidate
   *     to the allowed character set. If normalization had to change the input,
   *     the candidate contains forbidden characters (`_`, `,`, `#`, …) and is
   *     rejected. The value is *not* stored in its mangled form.
   *  2. **Validation gate** — the candidate is validated against the full rule
   *     set (covering rules a sanitizer cannot express, e.g. arbitrary-regex
   *     `pattern`, `minLength`). Any error rejects the write.
   *
   * On rejection the previous value stays in `form.values` and the errors are
   * recorded on the field, so nothing is thrown and the caller cannot observe an
   * exception from `setValue`.
   *
   * Unlike {@link validateField}, this validates a value that is not yet stored,
   * so it does not read the current value and does not run `fieldType.validate`
   * custom checks (those run after the write).
   *
   * @param fieldId    - The field being changed.
   * @param candidate  - The incoming value, after any `handleChange` normalizer.
   * @returns `accepted: false` (with `value` left at `candidate`) when rejected.
   */
  async screenCandidate(
    fieldId: string,
    candidate: any
  ): Promise<{ value: any; accepted: boolean }> {
    const field = this.resolver.resolveField(fieldId);
    if (!field || (field as any).isTemplate) {
      return { value: candidate, accepted: true };
    }

    const stateKey = (field as any).stateKey || fieldId;
    const values = this.stateManager.state.values;

    // ── Gate 1: character gate ───────────────────────────────────────────
    let errors: DetailedError[] = [];

    if (this.validator.screenValue) {
      errors = this.validator.screenValue(field, candidate, values).errors;
    }

    // ── Gate 2: full rule validation ─────────────────────────────────────
    // Always runs, so rules without a sanitizer (e.g. `pattern`) still reject
    // rather than merely flagging a value that is already in state.
    if (errors.length === 0) {
      errors = await this.validator.validateField(field, candidate, values);
    }

    if (errors.length > 0) {
      this.errorManager.setErrors(stateKey, errors);
      this.stateManager.notifyField(fieldId);
      // Rejected: report the original candidate, never the normalized form.
      return { value: candidate, accepted: false };
    }

    // Accepted. Clear any error left over from a previous rejection so a
    // recovered field stops showing a stale message. Mirrors what
    // `validateField` does on success; skipped when already clean to avoid
    // notifying subscribers on every keystroke.
    if (this.stateManager.state.validity[stateKey]?.errors?.length) {
      this.errorManager.setErrors(stateKey, []);
      this.stateManager.notifyField(fieldId);
    }

    return { value: candidate, accepted: true };
  }

  /**
   * Validates multiple fields in parallel and returns whether all are valid.
   *
   * All field validations are kicked off concurrently via `Promise.all`,
   * then a single validity check is done after all settle.
   *
   * @param fieldIds - Array of field IDs to validate.
   * @returns `true` if every specified field is valid after validation; `false` if any failed.
   *
   * @example
   * const isValid = await validator.validateFields(["name_id", "email_id"]);
   */
  async validateFields(fieldIds: string[]): Promise<boolean> {
    const startTime = performance.now();
    // Kick off all validations in parallel
    const promises = fieldIds.map(async (id) => {
      // Fix #7: warn in dev if a field ID has no state entry — likely a typo or stale ID
      if (
        process.env.NODE_ENV !== "production" &&
        !this.stateManager.state.vitality[id]
      ) {
        console.warn(
          `[FormValidator] validateFields: field "${id}" has no vitality entry.`,
          "Validation will be skipped. Is the field ID correct?"
        );
      }
      await this.validateField(id);
    });
    await Promise.all(promises);

    const duration = performance.now() - startTime;
    this.stateManager.setPerformance({
      lastValidationDurationMs: duration,
    });

    if (this.debugManager) {
      this.debugManager.log("validateFields", {
        fieldIds,
        durationMs: duration,
        timestamp: Date.now(),
      });
    }

    // Check validity after all promises resolve
    return fieldIds.every((id) => this.errorManager.isValid(id));
  }

  /**
   * Runs full-form validation as part of a form submission attempt.
   *
   * **Steps:**
   * 1. Determine **active fields** — all fields that have a vitality entry
   *    (excludes repeater templates). This is the canonical set of "real" fields.
   * 2. Mark all active fields as `touched: true` — triggers error display in the UI
   *    even for fields the user hasn't interacted with.
   * 3. Validate all active fields in parallel.
   * 4. Return `true` only if all validity entries in the state are `valid: true`.
   *
   * @returns `true` if the form is valid and safe to submit; `false` if any field failed.
   *
   * @example
   * const canSubmit = await validator.submit();
   * if (canSubmit) {
   *   await api.save(form.values);
   * }
   */
  async submit(): Promise<boolean> {
    // Determine fields that actually exist in state (excludes template fields)
    const allFieldIds = Object.keys(this.resolver.registry.definition.fields);
    const activeFieldIds = allFieldIds.filter(
      (id) => this.stateManager.state.vitality[id]
    );

    // Mark all active fields as touched — the UI uses this to decide whether to show errors
    activeFieldIds.forEach((id) => {
      if (!this.stateManager.state.vitality[id]) {
        // Safety check — shouldn't happen with above filter, but guards dynamic edge cases
        this.stateManager.state.vitality[id] = {
          touched: false,
          dirty: false,
          focused: false,
          version: 0,
        };
      }
      this.stateManager.state.vitality[id].touched = true;
    });
    this.stateManager.notify(); // Notify after batch vitality update

    // Run validations for all active fields
    await this.validateFields(activeFieldIds);

    // Fix #1: Only check validity for fields that were actually validated.
    // Using Object.values(validity).every() was wrong — it also checked externally-injected
    // errors for fields not in activeFieldIds (e.g., stale server errors on hidden fields),
    // which silently blocked submission.
    return activeFieldIds.every((id) => this.errorManager.isValid(id));
  }
}
