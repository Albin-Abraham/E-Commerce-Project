/**
 * @file condition-proxy.ts
 * @description Evaluates conditional logic (field visibility, disabled state, setValue triggers)
 * against the current form values.
 *
 * ## Responsibility
 * The `ConditionProxy` is a **pure evaluator** — it takes the current form values
 * and a field's condition schema, and returns answers: "should this field be visible?",
 * "should this field be disabled?", "what values should be set on other fields?"
 *
 * It does NOT mutate state. It does NOT know about React. It is a stateless
 * computation engine over a snapshot of values.
 *
 * ## Condition Schema Structure
 * ```
 * ConditionExpression
 *  └── groups: ConditionGroup[]  (AND/OR between groups)
 *       └── rules: ConditionRule[] (AND/OR within a group)
 *            └── { field, operator, value }
 * ```
 *
 * ## Supported Group Actions
 * | Action     | Method            | Effect                                          |
 * |------------|-------------------|-------------------------------------------------|
 * | `show`     | `isVisible()`     | Field is visible when rules pass                |
 * | `hide`     | `isVisible()`     | Field is hidden when rules pass                 |
 * | `enable`   | `isEnabled()`     | Field is interactable when rules pass           |
 * | `disable`  | `isEnabled()`     | Field is disabled when rules pass               |
 * | `setValue` | `getSetValueEffects()` | Other fields get values when rules pass    |
 * | `validate` | Used by ValidationProxy (rule.when logic)        |                                                 |
 *
 * ## Used By
 * - {@link FormVisibility.evaluateVisibility} — calls `isVisible()` and `isEnabled()`.
 * - {@link FormRuntime} — holds the singleton instance shared across modules.
 * - {@link ValidationProxy} — calls `evaluateExpression()` for `rule.when` checks.
 */
import { get } from "lodash-es";

import type {
  FormField,
  ConditionExpression,
  ConditionGroup,
  ConditionOperator,
} from "./domain";
import { conditionRegistry } from "./condition-registry";

/** Context provided to functional predicates for edge-case logic */
export interface ConditionContext {
  validity: Record<string, any>;
  vitality: Record<string, any>;
  metadata: Record<string, any>;
  fieldId?: string;
}

export class ConditionProxy {
  /** Snapshot of the current form values used in all rule evaluations. */
  private values: Record<string, any> = {};
  /** Full context for functional predicates */
  private context: ConditionContext = {
    validity: {},
    vitality: {},
    metadata: {},
  };

  /**
   * @param initialValues - The form's initial `ValuesState`.
   * @param initialContext - Optional initial context (validity, metadata, etc).
   */
  constructor(
    initialValues: Record<string, any> = {},
    initialContext?: Partial<ConditionContext>
  ) {
    this.updateValues(initialValues);
    if (initialContext) {
      this.context = { ...this.context, ...initialContext };
    }
  }

  /**
   * Refreshes the internal values and context used for condition evaluation.
   */
  updateValues(
    values: Record<string, any>,
    context?: Partial<ConditionContext>
  ) {
    this.values = values;
    if (context) {
      this.context = { ...this.context, ...context };
    }
  }

  /**
   * Determines whether a field should be visible given the current form values.
   *
   * **Resolution order:**
   * 1. If `field.visible` is a static `boolean` → return it directly (short-circuit).
   * 2. If `field.conditions` is defined (canonical) → evaluate it.
   * 3. If `field.meta.conditions` is defined (deprecated) → evaluate it.
   * 4. Default: `true` (all fields are visible unless explicitly hidden).
   *
   * @param field - The field definition to check visibility for.
   * @returns `true` if the field should be rendered; `false` if it should be hidden.
   *
   * @example
   * // ✅ Canonical — use field.conditions at the root
   * const field = {
   *   id: "completion_date",
   *   conditions: {
   *     groups: [{
   *       action: "show",
   *       rules: [{ field: "status", operator: "equals", value: "construction" }]
   *     }]
   *   }
   * };
   * proxy.isVisible(field); // true when status === "construction"
   */
  isVisible(field: FormField): boolean {
    // 1. Explicit Functional Override (Highest Priority)
    if (typeof field.visible === "function") {
      return field.visible(this.values, { ...this.context, fieldId: field.id });
    }

    // 2. Canonical path: field.conditions (with normalized meta.conditions fallback)
    const expr = field.conditions || (field as any).meta?.conditions;
    if (expr) {
      return this.evaluateExpression(expr as any, ["show", "hide"], field.id);
    }

    // 3. Static boolean override
    if (typeof field.visible === "boolean") {
      return field.visible;
    }

    // 5. Default: visible
    return true;
  }

  /**
   * Determines whether a field should be **enabled** (interactive) given
   * current form values.
   *
   * Evaluates groups with `action: "enable" | "disable"`.
   * Ignores `show`/`hide`/`setValue`/`validate` groups.
   *
   * @param field - The field definition to check.
   * @returns `true` if the field should be enabled; `false` if it should be disabled.
   */
  isEnabled(field: FormField): boolean {
    // 1. Explicit Functional Override (Highest Priority)
    if (typeof field.enabled === "function") {
      return field.enabled(this.values, { ...this.context, fieldId: field.id });
    }

    // 2. Static disabled override from field properties
    if ((field as any).disabled === true) return false;

    // 3. Condition expression from schema (canonical root-level path)
    const conditionSource = field.conditions;
    if (conditionSource) {
      return this.evaluateExpression(
        conditionSource,
        ["enable", "disable"],
        field.id
      );
    }

    // Default: enabled
    return true;
  }

  /**
   * Returns any `setValue` effects that should fire for this field.
   *
   * @param field - The field definition to check.
   * @returns Array of `{ fieldName, value }` pairs to apply. May be empty.
   */
  getSetValueEffects(
    field: FormField
  ): Array<{ fieldName: string; value: any }> {
    // Canonical root-level conditions
    const groups = field.conditions?.groups;
    if (!groups) return [];

    const effects: Array<{ fieldName: string; value: any }> = [];

    for (const group of groups) {
      if (group.action !== "setValue") continue;

      const { logic = "AND", rules } = group;
      const results = rules.map((r: any) => this.evaluateRule(r, field.id));
      const passed =
        logic === "AND" ? results.every(Boolean) : results.some(Boolean);

      if (passed) {
        const g = group as any;
        if (g.targetField !== undefined && g.targetValue !== undefined) {
          effects.push({ fieldName: g.targetField, value: g.targetValue });
        }
      }
    }

    return effects;
  }

  /**
   * Evaluates top-level `ConditionExpression` by reducing its groups.
   *
   * `expression.logic` controls how groups are combined:
   * - `"AND"` → all groups must be true (default).
   * - `"OR"` → at least one group must be true.
   *
   * @param expression - The top-level condition expression from `field.meta.conditions`.
   * @returns `true` if the expression as a whole passes.
   */
  /**
   * Evaluates top-level `ConditionExpression` by reducing its groups.
   *
   * Now **public** so `ValidationProxy` can call it for `rule.when` evaluation.
   *
   * `expression.logic` controls how groups are combined:
   * - `"AND"` → all groups must be true (default).
   * - `"OR"` → at least one group must be true.
   *
   * @param expression  - The top-level condition expression.
   * @param actionFilter - If provided, only groups matching these actions are evaluated.
   *   Groups with other actions are treated as transparent (return true).
   *   This scopes the evaluation to e.g. only 'show'/'hide' without polluting the result
   *   with 'enable'/'disable' groups.
   * @returns `true` if the expression as a whole passes.
   */
  public evaluateExpression(
    expression: ConditionExpression,
    actionFilter?: string[],
    contextId?: string
  ): boolean {
    const { logic = "AND", groups } = expression;

    // No groups = unconditionally passes
    if (!groups || groups.length === 0) return true;

    // Filter to only the groups that apply to this evaluation scope
    const applicableGroups = actionFilter
      ? groups.filter((g: any) => actionFilter.includes(g.action))
      : groups;

    // No applicable groups = return the correct transparent default:
    // - For show/hide: default is visible (true)
    // - For enable/disable: default is enabled (true)
    if (applicableGroups.length === 0) return true;

    if (logic === "AND") {
      return applicableGroups.every((g: any) => this.evaluateGroup(g, contextId));
    } else {
      return applicableGroups.some((g: any) => this.evaluateGroup(g, contextId));
    }
  }

  /**
   * Evaluates a single `ConditionGroup` — a set of rules combined by AND/OR logic.
   *
   * **Supported actions:**
   * - `action: "show"` — field is visible when the group's rules are satisfied.
   * - `action: "hide"` — field is hidden when the group's rules are satisfied (inverse of show).
   *
   * Unknown actions emit a dev-mode console.warn and are treated as transparent (always pass).
   *
   * @param group - The condition group to evaluate.
   * @returns `true` if the field should remain **visible**; `false` if it should be **hidden**.
   */
  private evaluateGroup(group: ConditionGroup, contextId?: string): boolean {
    const { logic = "AND", rules, action } = group;

    // Evaluate each rule in the group
    const results = rules.map((rule: any) => this.evaluateRule(rule, contextId));

    const rulesPassed =
      logic === "AND"
        ? results.every((r: any) => r) // All rules must pass
        : results.some((r: any) => r); // At least one rule must pass

    if (action === "show") {
      // Field is visible when the show-rules are satisfied
      return rulesPassed;
    }

    if (action === "hide") {
      // Field is hidden when the hide-rules are satisfied — inverse of show
      return !rulesPassed;
    }

    if (action === "enable") {
      // Field is enabled when the enable-rules are satisfied
      return rulesPassed;
    }

    if (action === "disable") {
      // Field is disabled when the disable-rules are satisfied — inverse of enable
      return !rulesPassed;
    }

    // setValue and validate groups are handled by dedicated methods —
    // evaluateGroup() is only called for show/hide/enable/disable via evaluateExpression(actionFilter)
    // so reaching here for setValue/validate is a usage error.
    if (
      process.env.NODE_ENV !== "production" &&
      action !== "setValue" &&
      action !== "validate"
    ) {
      console.warn(
        `[ConditionProxy] Unknown condition action: "${action}". Treating as transparent (field stays visible/enabled).`,
        'Supported actions: "show", "hide", "enable", "disable", "setValue", "validate"'
      );
    }
    return true;
  }

  /**
   * Evaluates a single atomic rule: `{ field, operator, value }`.
   *
   * Uses lodash `get` for deep path resolution (e.g., `"address.city"`).
   *
   * **Supported operators:**
   * | Operator           | Behaviour                                              |
   * |--------------------|--------------------------------------------------------|
   * | `equals`           | Loose equality (`==`) — handles "1" == 1              |
   * | `notEquals`        | Loose inequality (`!=`)                                |
   * | `greaterThan`      | Numeric comparison (`>`)                               |
   * | `lessThan`         | Numeric comparison (`<`)                               |
   * | `greaterThanOrEqual` | Numeric comparison (`>=`)                            |
   * | `lessThanOrEqual`  | Numeric comparison (`<=`)                              |
   * | `contains`         | Array includes OR string includes                      |
   * | `in`               | `targetValue` array includes `fieldValue`             |
   * | `notIn`            | `targetValue` array does not include `fieldValue`     |
   * | `startsWith`       | String `startsWith`                                    |
   * | `endsWith`         | String `endsWith`                                      |
   * | `empty`            | null / undefined / empty string                        |
   * | `notEmpty`         | Not null / undefined / empty string                    |
   *
   * @param rule - The atomic rule to evaluate.
   * @param rule.field    - Dot-notation path to the form value to check.
   * @param rule.operator - The comparison operator.
   * @param rule.value    - The target value to compare against.
   * @returns `true` if the rule passes; `false` otherwise.
   */
  private evaluateRule(
    rule: {
      field: string;
      operator: ConditionOperator;
      value?: any;
    },
    ruleContextId?: string
  ): boolean {
    const { field, operator, value: targetValue } = rule;

    // ── 1. Index Interpolation ───────────────────────────────────────────
    // If the rule path contains [index], we try to resolve it from the context
    // of the field being evaluated (e.g., "conditions[2].operator" -> index=2).
    const resolvedPath = this.interpolateIndex(field, ruleContextId);

    // Resolve the actual form value using lodash get (supports "a.b.c" paths)
    const fieldValue = get(this.values, resolvedPath);

    // ── DX Hardening ──────────────────────────────────────────────────────
    if (process.env.NODE_ENV !== "production" && fieldValue === undefined) {
      console.warn(
        `[FormCore] 🔍 Condition resolution failed: Field "${resolvedPath}" not found in current state.`,
        {
          requestedPath: resolvedPath,
          originalPath: field,
        }
      );
    }

    // ── 2. Smart Object Resolution ────────────────────────────────────────
    // If the field value is an object (e.g. { value: 10, unit: 'kg' }),
    // we automatically target the .value property for comparisons.
    const resolvedFieldValue =
      typeof fieldValue === "object" &&
      fieldValue !== null &&
      "value" in fieldValue
        ? fieldValue.value
        : fieldValue;

    // ── 3. Registry Delegation ───────────────────────────────────────────
    return conditionRegistry.evaluate(
      operator,
      resolvedFieldValue,
      targetValue
    );
  }

  /**
   * Replaces [index] or {{index}} tokens with the actual index from the context ID.
   * Example: "items[index].name" + "items[2].age" -> "items[2].name"
   */
  private interpolateIndex(path: string, contextId?: string): string {
    if (!path.includes("index") || !contextId) return path;

    // Extract the index from the context ID (e.g., "items[2].field" -> "2")
    const indexMatch = contextId.match(/\[(\d+)\]/);
    if (!indexMatch) return path;

    const index = indexMatch[1];
    return path
      .replace(/\[index\]/g, `[${index}]`)
      .replace(/{{index}}/g, index);
  }
}
