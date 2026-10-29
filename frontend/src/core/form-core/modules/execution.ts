/**
 * @file execution.ts
 * @description Orchestrates the field-value update pipeline and middleware chain.
 *
 * ## Responsibility
 * `FormExecution` is the **action coordinator** — it processes the side effects
 * that ripple from a single `setValue` call:
 *
 * ```
 * setValue(field, value)
 *   │
 *   ├── 1. Write value  (via ValueProxy)
 *   ├── 2. Mark dirty + increment version (vitality update)
 *   └── processFieldChange()
 *         ├── 3. Validate (if mode === 'onChange')
 *         ├── 4. Run middleware chain
 *         └── 5. Re-evaluate visibility
 * ```
 *
 * ## Middleware
 * Consumers can register middleware via `use(fn)`. Each middleware receives the
 * full `FormCore` context and optionally the changed `fieldId`. Middleware runs
 * in registration order, and each function is awaited (supports async middleware).
 *
 * Common middleware uses:
 * - Prefilling dependent fields when a primary field changes.
 * - Fetching remote options based on a selection.
 * - Logging/analytics on every change.
 *
 * ## Validation-Mode Gating
 * `FormExecution` only triggers immediate validation when `validationMode === 'onChange'`.
 * For `'onBlur'` and `'lazy'` modes, validation is triggered via {@link handleFieldBlur}.
 * For `'onSubmit'` and `'manual'`, `FormValidator.submit()` / `validateFields()` are called directly.
 *
 * ## Circular Dependency Resolution
 * `FormExecution` needs `FormCore` context for middleware (to expose the full API).
 * But `FormCore` creates `FormExecution` in its constructor. To break this circular
 * dependency, `coreContext` is a **late-binding callback** (`() => FormCore`) passed
 * in at construction. It is only called during `setValue` / `handleFieldBlur`,
 * not during construction — so by that time, `FormCore` is fully initialized.
 */
import type { FormCore } from "@form-core/engine";
import { DebugManager } from "@form-core/modules/debug-manager";
import { FieldResolver } from "@form-core/modules/resolver";
import { FormRuntime } from "@form-core/modules/runtime";
import { StateManager } from "@form-core/modules/state-manager";
import { FormValidator } from "@form-core/modules/validator";
import { FormVisibility } from "@form-core/modules/visibility";
import { ReactiveTransactionCoordinator } from "@form-core/modules/transaction-coordinator";

export class FormExecution<T extends Record<string, any>> {
  /**
   * Unified reactive transaction coordinator (10/10 Enterprise Requirement).
   * Executes multi-tier dependencies (Compute -> Visibility -> Async Options -> Validation)
   * in strict topological order within an atomic batch window.
   */
  public readonly coordinator: ReactiveTransactionCoordinator<T>;

  /**
   * Registered middleware functions. Called in insertion order during each `setValue`.
   * Each function receives `{ form, fieldId }` and may be async.
   *
   * @note Known trade-off: if middleware calls `form.setValue()` on another field,
   * that triggers a nested `notify()` call before the outer `setValue` finishes.
   * This produces multiple sequential React re-renders per user action instead of one
   * batched update. Acceptable for now; a batching mechanism would be needed to fix it.
   */
  private middlewareFns: Array<
    (context: { form: FormCore<T>; fieldId?: string }) => void | Promise<void>
  > = [];

  /**
   * Debounce timers for field-level validation.
   * Maps fieldId -> Timeout ID.
   */
  private validationTimers: Map<string, any> = new Map();

  /** Default debounce for onChange validation. */
  private validationDebounceMs = 300;

  /**
   * @param resolver      - Resolves field definitions from ID or name.
   * @param stateManager  - Provides vitality state for marking fields dirty.
   * @param runtime       - Provides `valueProxy` (for writing values) and proxy refs.
   * @param validator     - Runs validation when the current mode requires it.
   * @param visibility    - Re-evaluates visibility after every value change.
   * @param debug         - Logs each `setValue` call when debug mode is active.
   * @param coreContext   - **Late-binding callback** returning the `FormCore` instance.
   * @param validationDebounceMs - Optional override for validation debounce.
   */
  constructor(
    private resolver: FieldResolver,
    private stateManager: StateManager<T>,
    private runtime: FormRuntime<T>,
    private validator: FormValidator<T>,
    private visibility: FormVisibility<T>,
    private debug: DebugManager<T>,
    private coreContext: () => FormCore<T>,
    validationDebounceMs?: number
  ) {
    if (validationDebounceMs !== undefined) {
      this.validationDebounceMs = validationDebounceMs;
    }
    this.coordinator = new ReactiveTransactionCoordinator<T>(
      this.resolver,
      this.stateManager,
      this.runtime,
      this.validator,
      this.visibility,
      this.debug,
      () => this.coreContext()?.remoteOptions
    );
  }

  /**
   * The main entry point for all field value changes in the engine.
   *
   * Accepts either a field **ID** or a field **name**. Resolves the field definition,
   * writes the value, updates vitality, then triggers all side effects.
   *
   * **Pipeline:**
   * 1. Log the action (if debug enabled).
   * 2. Resolve field ID and name from identifier (ID or name string).
   * 3. Write the value into state via `ValueProxy` (mutates in-place).
   * 4. Mark the field as `dirty: true` and increment its `version`.
   * 5. Process field change side effects (validate, middleware, visibility).
   * 6. Notify subscribers via `stateManager.notify()`.
   *
   * @param fieldIdentifier - The field's ID or name to update.
   * @param value           - The new value to assign.
   *
   * @example
   * await execution.setValue("email", "alice@example.com");
   * await execution.setValue("email_field_id", "alice@example.com"); // By ID too
   */
  async setValue(fieldIdentifier: string | keyof T, value: any) {
    this.debug.log("setValue", { fieldIdentifier, value });

    // Resolve the field definition
    const field = this.resolver.resolveField(fieldIdentifier as string);
    const fieldId = field
      ? field.id
      : this.resolver.nameToIdMap[fieldIdentifier as string] ||
        (fieldIdentifier as string);
    const fieldName = field ? field.name : (fieldIdentifier as string);

    if (!fieldName) {
      console.error(
        `[FormCore] Cannot set value for field without name: ${fieldId}`
      );
      return;
    }

    // 0. PRE-PHASE: Custom normalizers (Level 1 Handler Hook)
    // Run custom handleChange if defined for this field type.
    let finalValue = value;
    const fieldType = this.resolver.getFieldType(fieldId);
    if (fieldType?.handleChange) {
      finalValue = fieldType.handleChange(value, {
        form: this.coreContext(),
        fieldId,
        fieldName,
      });
    }

    // 0b. PRE-WRITE SCREEN (opt-in via `disableDeferredValidation`)
    // Reject illegal input (forbidden characters, failed rules) BEFORE it
    // reaches form.values, so nothing is stored and then flagged. Never throws:
    // a rejected value leaves the previous one in place with the error recorded.
    if (this.coreContext().isDeferredValidationDisabled()) {
      const screened = await this.validator.screenCandidate(
        fieldId,
        finalValue
      );
      if (!screened.accepted) {
        this.debug.log("setValue rejected", { fieldId, value: finalValue });
        return;
      }
    }

    // 1. PHASE 1: Synchronous Value Update (O(1) Vitality)
    // Update value and vitality immediately so controlled inputs and synchronous subscribers
    // (e.g. URL sync, form state listeners) receive the new value without tick delay.
    this.runtime.valueProxy.setValue(
      this.stateManager.state.values,
      fieldName,
      finalValue
    );

    const vitality = this.stateManager.state.vitality[fieldId];
    const isActuallyDirty = vitality?.initialValue !== value;

    this.stateManager.setVitality(fieldId, {
      dirty: isActuallyDirty,
      version: (vitality?.version || 0) + 1,
    });

    this.stateManager.notifyField(fieldId);

    // 2. PHASE 2: Asynchronous Side Effects (Multi-Tier Transaction Coordinator)
    // Run computed cascading, visibility pruning, dynamic options, and validation in batch.
    await this.stateManager.batch(async () => {
      await this.processFieldChange(fieldId);
    });
  }

  /**
   * Runs the ordered side-effect pipeline after a field value changes.
   *
   * **Step 1 — Conditional validation:**
   * Only runs if `validationMode === 'onChange'`. For other modes, validation
   * is triggered from different callsites (blur handler, submit).
   *
   * **Step 2 — Middleware chain:**
   * Runs all registered middleware in insertion order. Each is awaited.
   * Middleware can update other fields, trigger async lookups, etc.
   *
   * **Step 3 — Visibility evaluation:**
   * Re-computes field visibility based on the new values. Applies side effects
   * for newly hidden fields (clear errors, null values).
   *
   * @param changedFieldId - The ID of the field that just changed.
   */
  private async processFieldChange(changedFieldId: string) {
    const form = this.coreContext(); // Resolve FormCore via late-binding callback
    const mode = form.getValidationMode();

    // Conditional validation: only validate immediately if mode is 'onChange'
    // OR if the field explicitly requests 'change' validation.
    const field = this.resolver.resolveField(changedFieldId);
    const validateOn = (field?.validation as any)?.validateOn;
    const shouldValidateOnChange =
      mode === "onChange" ||
      (mode === "lazy" &&
        form.stateManager.state.performance?.lastSubmissionDurationMs !==
          undefined) ||
      (form.stateManager.state.validity[changedFieldId] &&
        !form.stateManager.state.validity[changedFieldId].valid) ||
      (Array.isArray(validateOn) && validateOn.includes("change"));

    // Run registered middleware chain
    await this.runMiddleware(changedFieldId);

    const isDebounced = shouldValidateOnChange && this.validationDebounceMs > 0;
    if (this.validationTimers.has(changedFieldId)) {
      clearTimeout(this.validationTimers.get(changedFieldId));
      this.validationTimers.delete(changedFieldId);
    }

    if (isDebounced) {
      const timer = setTimeout(async () => {
        this.validationTimers.delete(changedFieldId);
        await this.validator.validateField(changedFieldId);
        this.stateManager.notifyField(changedFieldId);
      }, this.validationDebounceMs);

      this.validationTimers.set(changedFieldId, timer);
    }

    // Execute unified reactive transaction:
    // Tier 1 (Compute) -> Tier 2 (Visibility) -> Tier 3 (Remote Options) -> Tier 4 (Validation)
    const affectedFields = await this.coordinator.executeTransaction(
      changedFieldId,
      {
        validateChangedField: shouldValidateOnChange && !isDebounced,
      }
    );

    // Notify all affected fields
    for (const fieldId of affectedFields) {
      this.stateManager.notifyField(fieldId);
    }
  }

  /**
   * Evaluates a single computed field in O(1) and cascades downstream in O(D).
   *
   * @param fieldId - The computed field to re-evaluate.
   * @param visited - Guard against cyclic loops.
   * @private
   */
  private recomputeSingleComputedField(
    fieldId: string,
    visited: Set<string> = new Set()
  ) {
    this.coordinator.recomputeSingleComputedField(fieldId, visited);
  }

  /**
   * Fallback method for full-sweep computed re-evaluation when dependencies are unknown.
   *
   * @param changedFieldName - The name of the field that just changed.
   * @private
   */
  private recomputeComputedFields(changedFieldName: string) {
    const deps =
      this.resolver.registry.getDependenciesForField(changedFieldName);
    if (deps.computed.size > 0) {
      for (const compId of deps.computed) {
        this.recomputeSingleComputedField(compId);
      }
      return;
    }

    const values = this.stateManager.state.values;
    this.runtime.reactiveEngine.updateValues(values);

    const fields = this.resolver.registry.getAllFields();

    for (const field of fields) {
      if (!field.computed) continue;

      const compDeps = field.computed.dependsOn ?? [];
      if (!compDeps.includes(changedFieldName)) continue;

      const newValue = this.runtime.reactiveEngine.evaluateComputedField(
        field.computed
      );

      // Update the value if it changed
      if (field.name) {
        const currentVal = this.runtime.valueProxy.getValue(values, field.name);
        if (currentVal !== newValue) {
          this.runtime.valueProxy.setValue(values, field.name, newValue);
          this.recomputeComputedFields(field.name);
        }
      }
    }
  }

  // ── Blur Handler ───────────────────────────────────────────────────────────

  /**
   * Handles a field blur event — triggers validation when mode requires it.
   *
   * Called by {@link ReactFormAdapter}'s `onBlur` handler after calling `setTouched`.
   *
   * Triggers validation for `'onBlur'` and `'lazy'` modes only.
   * After validation, notifies subscribers so error messages appear in the UI.
   *
   * @param fieldId - The field that just lost focus.
   *
   * @example
   * // In ReactFormAdapter:
   * onBlur: () => {
   *   core.setTouched(fieldId, true);
   *   core.execution.handleFieldBlur(fieldId); // ← triggers this
   * }
   */
  async handleFieldBlur(fieldId: string) {
    const form = this.coreContext();
    const mode = form.getValidationMode();

    // Validate on blur for 'onBlur' and 'lazy' modes
    // OR if the field explicitly requests 'blur' validation.
    const field = this.resolver.resolveField(fieldId);
    const validateOn = (field?.validation as any)?.validateOn;
    const shouldValidateOnBlur =
      mode === "onBlur" ||
      mode === "lazy" ||
      (Array.isArray(validateOn) && validateOn.includes("blur"));

    if (shouldValidateOnBlur) {
      await this.forceValidateField(fieldId);
    }
  }

  /**
   * Immediately triggers validation for a field, bypassing any pending debounce.
   * Used by imperative API calls (validate, submit) to ensure immediate feedback.
   */
  async forceValidateField(fieldId: string) {
    if (this.validationTimers.has(fieldId)) {
      clearTimeout(this.validationTimers.get(fieldId));
      this.validationTimers.delete(fieldId);
    }
    await this.validator.validateField(fieldId);
    this.stateManager.notifyField(fieldId);
  }

  // ── Middleware ─────────────────────────────────────────────────────────────

  /**
   * Registers a middleware function to run on every field value change.
   *
   * Middleware functions are awaited in insertion order. Each receives:
   * - `form` — the full `FormCore<T>` instance (can call any public API).
   * - `fieldId` — the ID of the field that changed.
   *
   * @param fn - The middleware function to register.
   *
   * @example
   * // Prefill "end_date" to 30 days after "start_date" changes:
   * form.use(async ({ form, fieldId }) => {
   *   if (fieldId === "start_date_id") {
   *     const start = form.values.start_date;
   *     if (start) {
   *       const end = addDays(new Date(start), 30).toISOString().split("T")[0];
   *       await form.setValue("end_date", end);
   *     }
   *   }
   * });
   */
  use(
    fn: (context: {
      form: FormCore<T>;
      fieldId?: string;
    }) => void | Promise<void>
  ) {
    this.middlewareFns.push(fn);
  }

  /**
   * Runs all registered middleware functions sequentially (in order, awaited).
   *
   * @param fieldId - The changed field's ID, forwarded to each middleware.
   */
  private async runMiddleware(fieldId?: string) {
    const form = this.coreContext();
    for (const fn of this.middlewareFns) {
      await fn({ form, fieldId }); // Sequential — order matters
    }
  }
}
