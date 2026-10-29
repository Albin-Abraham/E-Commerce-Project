/**
 * @file validation-proxy.ts
 * @description The engine's built-in `ValidationAdapter` implementation.
 *
 * `ValidationProxy` is the **default validator** used when no external adapter
 * (e.g., Yup, Zod) is provided to `FormCore`. It validates fields against the
 * rules defined inline in the field schema (`field.validation.rules[]`) using
 * the pluggable strategies in {@link ValidationRegistry}.
 *
 * ## Rule Priority (highest → lowest)
 * 1. **Rule-level message** (`rule.message`) — explicit override per rule entry.
 * 2. **Field-level override** (`messageConfig[fieldId][ruleCode]`) — overrides per field.
 * 3. **Strategy default** (`ValidationStrategy.defaultMessage()`) — generated from label.
 *
 * ## Validation flow per field
 * ```
 * validate(field, value, values)
 *   │
 *   ├── 1. Top-level `field.required` shorthand check
 *   ├── 2. Iterate `field.validation.rules[]` → check rule.when → run each strategy
 *   └── 3. Implicit type checks (e.g., field.type === "email" auto-adds email rule)
 * ```
 *
 * ## 2C: rule.when (Conditional Validation)
 * Each rule can have an optional `when: ConditionExpression`. If the condition
 * evaluates to false against the current form values, the rule is **skipped**.
 * This enables context-sensitive validation without splitting schemas.
 *
 * ## 2E: Cross-field Validation
 * `validate(field, value, values)` now receives the full form values snapshot.
 * Strategies that need to compare against another field (e.g., `matches`) can
 * use `values` to read the dependent field's current value.
 *
 * ## Implements
 * {@link ValidationAdapter} — can be swapped for any external adapter.
 */
import i18n from "@i18n/i18n";
import { resolveTranslation } from "./utils";
import type { FormField, ValidationRule } from "./domain";
import { ConditionProxy } from "./condition-proxy";
import type { DetailedError } from "./int-types";
import { ReactiveEngine } from "./modules/reactive-engine";
import type { ValidationAdapter } from "./validation-adapter";
import { ValidationRegistry } from "./validation-registry";

/**
 * Configuration map for per-field, per-rule message overrides.
 *
 * Shape: `{ [fieldId]: { [ruleCode]: "custom message" } }`
 *
 * @example
 * const config: ValidationMessageConfig = {
 *   "email_field_id": {
 *     "required": "Please enter your email address",
 *     "email": "That doesn't look like a valid email"
 *   }
 * };
 * const form = new Form(definition, {}, config);
 */
export interface ValidationMessageConfig {
  [fieldId: string]: {
    [ruleCode: string]: string; // e.g. "required": "Custom required message"
  };
}

export class ValidationProxy implements ValidationAdapter {
  private messageMap: ValidationMessageConfig = {};
  private conditionProxy?: ConditionProxy;
  private reactiveEngine?: ReactiveEngine;
  private i18nNamespace: string;

  constructor(
    config?: ValidationMessageConfig,
    reactiveEngine?: ReactiveEngine,
    i18nNamespace: string = "features:forms"
  ) {
    if (config) {
      this.messageMap = config;
    }
    this.reactiveEngine = reactiveEngine;
    this.i18nNamespace = i18nNamespace;
  }

  /**
   * Resolves the error message for a specific rule failure on a specific field.
   */
  public getMessage(code: string, field: FormField, rule?: any): string {
    // Resolve the field label once for all resolution paths
    const resolvedLabel =
      resolveTranslation(field.label, this.i18nNamespace) || field.name || "";
    const fieldWithResolvedLabel = { ...field, label: resolvedLabel };

    // 1. Check field-level override in the message config
    if (this.messageMap[field.id] && this.messageMap[field.id][code]) {
      return this.formatMessage(
        this.messageMap[field.id][code],
        fieldWithResolvedLabel,
        {}
      );
    }

    // 2. Try to resolve from i18n namespace (e.g. 'validation.required')
    const i18nKey = `validation.${code}`;
    const translatedMessage = i18n.t(i18nKey, {
      ns: this.i18nNamespace,
      defaultValue: "",
    });

    if (translatedMessage && translatedMessage !== i18nKey) {
      return this.formatMessage(
        translatedMessage,
        fieldWithResolvedLabel,
        rule || {}
      );
    }

    // 3. Delegate to the strategy's default message generator
    const strategy = ValidationRegistry[code];
    if (strategy) {
      const dummyRule = rule || { type: code, value: undefined };
      return strategy.defaultMessage(dummyRule, fieldWithResolvedLabel);
    }

    return "Invalid value";
  }

  /**
   * Replaces template tokens in a message string with actual values.
   * Supports {label} and any key from params.
   */
  private formatMessage(
    template: string,
    field: FormField,
    params: any
  ): string {
    const label = field.label as string;

    // Support both {{label}} and {label} (i18next style)
    // Order matters: replace double braces first to avoid partial matches
    let msg = template.replace(/{{label}}/g, label).replace(/{label}/g, label);

    // Make formatting extremely robust by mapping standard rule properties to friendly aliases
    const formatParams = { ...params };
    if (params && params.value !== undefined) {
      formatParams.min = params.value;
      formatParams.max = params.value;
      formatParams.limit = params.value;
      formatParams.length = params.value;
    }

    Object.keys(formatParams).forEach((key) => {
      const val = String(formatParams[key]);
      msg = msg
        .replace(new RegExp(`{{${key}}}`, "g"), val)
        .replace(new RegExp(`{${key}}`, "g"), val);
    });

    return msg;
  }

  /**
   * Validates a single field against all applicable rules.
   * Implements the {@link ValidationAdapter.validateField} contract.
   *
   * Delegates to the internal {@link validate} method.
   *
   * @param field  - The full field definition.
   * @param value  - The field's current value.
   * @param values - The full form values object (available for cross-field rules).
   * @returns Array of {@link DetailedError}s. Empty = valid.
   */
  public async validateField(
    field: FormField,
    value: any,
    values: any
  ): Promise<DetailedError[]> {
    return this.validate(field, value, values || {});
  }

  /**
   * Screens a candidate value against the field's character-class rules and
   * reports which rules it violates.
   *
   * Pure — it does not write to form state and does not validate. Used by
   * `disableDeferredValidation` to detect disallowed characters *before* the
   * value is stored, so the engine can reject the candidate instead of
   * persisting a silently-rewritten one.
   *
   * Rules whose condition (`when`) does not hold are skipped, and strategies
   * with no `sanitize` (e.g. arbitrary-regex `pattern`) pass through — those are
   * caught by the subsequent `validate` pass instead.
   *
   * @param field  - The field whose `validation.rules` define the allowed set.
   * @param value  - The incoming, not-yet-stored value.
   * @returns `value` normalized to the allowed character set, plus a
   *          {@link DetailedError} for each rule whose `sanitize` had to alter
   *          the input (i.e. the character-class violations).
   */
  public screenValue(
    field: FormField,
    value: any
  ): { value: any; errors: DetailedError[] } {
    const rules = field.validation?.rules;
    if (!Array.isArray(rules) || rules.length === 0) {
      return { value, errors: [] };
    }

    let out = value;
    const violations: ValidationRule[] = [];

    for (const rule of rules) {
      const strategy = ValidationRegistry[rule.type];
      if (!strategy?.sanitize) continue;

      if (rule.when) {
        const shouldRun = this.conditionProxy
          ? this.conditionProxy.evaluateExpression((rule as any).when)
          : true;
        if (!shouldRun) continue;
      }

      const next = strategy.sanitize(out, rule, field);
      // A sanitizer that had to change the input means the input contained
      // characters the rule forbids. Report it instead of silently rewriting,
      // so the caller can reject the value rather than store a mangled one.
      if (next !== out) violations.push(rule);
      out = next;
    }

    // Resolve messages here, where the strategy and message config live, so the
    // caller does not need the proxy's `getMessage` on its adapter contract.
    const errors: DetailedError[] = violations.map((rule) => ({
      code: rule.type,
      message:
        rule.message ||
        this.getMessage(rule.type, field, rule) ||
        ValidationRegistry[rule.type]?.defaultMessage(rule, field) ||
        `${field.label || field.name} contains disallowed characters`,
      fieldId: field.id,
    }));

    return { value: out, errors };
  }

  /**
   * Whole-form validation. The engine drives per-field validation in a loop,
   * so this method is intentionally a no-op stub for the internal adapter.
   *
   * External adapters (Yup, Zod) that prefer whole-schema validation can
   * implement this instead.
   *
   * @returns Empty object — no errors (engine handles field-by-field).
   */
  public validateForm(_values: any): Record<string, DetailedError[]> {
    // Engine-driven: FormValidator calls validateField per field in a loop.
    // This method is unused by the internal adapter — see FormValidator.submit().
    return {};
  }

  /**
   * Core validation runner for a single field.
   *
   * **Pass 1 — Top-level `required` shorthand:**
   * If `field.required === true`, runs the `required` strategy immediately.
   *
   * **Pass 2 — Explicit `validation.rules[]` array:**
   * For each rule:
   *   - **[2C]** If `rule.when` is a `ConditionExpression`, evaluate it first.
   *     If the when-condition is false, skip this rule entirely.
   *   - Look up the rule's strategy and run it.
   *   - **[2E]** Pass the full `values` snapshot to `strategy.validate()` for cross-field access.
   *
   * **Pass 3 — Implicit type-based rules:**
   * Certain field types imply a validation rule (e.g., `type: "email"`).
   *
   * @param field  - The field definition to validate against.
   * @param value  - The field's current value.
   * @param values - The full form values object (for cross-field rules and rule.when).
   * @returns Array of {@link DetailedError} objects. Empty = field is valid.
   */
  public async validate(
    field: FormField,
    value: any,
    values: Record<string, any> = {}
  ): Promise<DetailedError[]> {
    const errors: DetailedError[] = [];

    // ── Pass 1: Top-level required shorthand ───────────────────────────────
    let isRequired = !!field.required;
    if (
      isRequired &&
      typeof field.required !== "boolean" &&
      this.reactiveEngine
    ) {
      this.reactiveEngine.updateValues(values);
      isRequired = this.reactiveEngine.evaluateReactiveValue(
        field.required as any
      );
    }

    if (isRequired) {
      const strategy = ValidationRegistry["required"];
      const dummyRule = { type: "required" } as any;
      if (!strategy.validate(value, dummyRule, field, values)) {
        errors.push({
          code: "required",
          message: this.getMessage("required", field, dummyRule),
          fieldId: field.id,
        });
      }
    }

    // ── Pass 2: Explicit validation rules array ────────────────────────────
    if (field.validation?.rules) {
      for (const rule of field.validation.rules) {
        // Skip duplicate required if Pass 1 already caught it
        if (
          rule.type === "required" &&
          errors.some((e) => e.code === "required")
        ) {
          continue;
        }

        // ── 2C: rule.when — conditional validation ────────────────────
        // If this rule has a `when` condition, evaluate it first.
        // Skip the rule if the condition is not satisfied.
        if ((rule as any).when) {
          if (!this.conditionProxy) {
            this.conditionProxy = new ConditionProxy(values);
          } else {
            this.conditionProxy.updateValues(values);
          }
          const shouldRun = this.conditionProxy.evaluateExpression(
            (rule as any).when
          );
          if (!shouldRun) continue; // Condition not met — skip this rule
        }

        const strategy = ValidationRegistry[rule.type];
        if (strategy) {
          // ── 2E: Pass values for cross-field strategy access ───────
          const isValid = await strategy.validate(value, rule, field, values);
          if (!isValid) {
            errors.push({
              code: rule.type,
              message: rule.message || this.getMessage(rule.type, field, rule),
              fieldId: field.id,
            });
          }
        } else {
          console.warn(
            `[ValidationProxy] No strategy for rule type: "${rule.type}". Register it via registerValidationStrategy().`
          );
        }
      }
    }

    // ── Pass 3: Implicit type-based rules ─────────────────────────────────
    // If the field type matches a strategy in the registry, run it automatically.
    // Explicitly excluded: date and time (handled by native pickers/parsers).
    // Skipped for empty, non-required fields to avoid false positives
    // (e.g. optional email field with no value should not fail format check).
    const EXCLUDED_TYPES = ["date", "time", "text", "password", "textarea"];

    if (
      field.type &&
      !EXCLUDED_TYPES.includes(field.type) &&
      ValidationRegistry[field.type]
    ) {
      const isOptionalAndEmpty = !field.required && !value;
      if (isOptionalAndEmpty) return errors;
      const strategy = ValidationRegistry[field.type];
      const dummyRule = { type: field.type } as any;

      if (!(await strategy.validate(value, dummyRule, field, values))) {
        // Only add if not already captured in Pass 2
        if (!errors.some((e) => e.code === field.type)) {
          errors.push({
            code: field.type,
            message: this.getMessage(field.type, field, dummyRule),
            fieldId: field.id,
          });
        }
      }
    }

    return errors;
  }
}
