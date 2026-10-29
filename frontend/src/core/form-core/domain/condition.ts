/** Operators supported in conditions */
export type ConditionOperator =
  | "equals"
  | "eq"
  | "notEquals"
  | "ne"
  | "in"
  | "notIn"
  | "contains"
  | "greaterThan"
  | "lessThan"
  | "greaterThanOrEqual"
  | "lessThanOrEqual"
  | "startsWith"
  | "endsWith"
  | "regex"
  | "empty"
  | "notEmpty"
  | "between"
  | "notBetween";

/** A single conditional rule */
export interface ConditionRule {
  /**
   * The **name** (dot-notation path) of the field to read from form values.
   * This MUST match the field's `name` property, NOT its `id`.
   * @example "address.city"  // not "city_field_id"
   */
  field: string;
  /** Operator for comparison */
  operator: ConditionOperator;
  /** Value(s) to compare with */
  value?: string | number | boolean | Array<string | number>;
}

// ---------------------------------------------------------------------------
// Full action set (used by ConditionGroup in ValidationRule.when)
// ---------------------------------------------------------------------------

/** All possible group actions including validate (used in ValidationRule.when) */
export type ConditionAction =
  | "show"
  | "hide"
  | "enable"
  | "disable"
  | "setValue"
  | "validate";

/** Group of rules with a logical operator and action */
export interface ConditionGroup {
  /** Action to apply when rules match */
  action: ConditionAction;
  /** Logical operator for combining rules in the group (default AND) */
  logic?: "AND" | "OR";
  /** Rules in this group */
  rules: ConditionRule[];
}

/** Full conditional expression (generic — used in ValidationRule.when) */
export interface ConditionExpression {
  /** Logical operator between groups (default AND) */
  logic?: "AND" | "OR";
  /** Groups of rules */
  groups: ConditionGroup[];
}

// ---------------------------------------------------------------------------
// Narrowed set for field.conditions / section.meta.conditions
// ---------------------------------------------------------------------------

/**
 * Actions valid inside a **field or section** condition expression.
 */
export type FieldConditionAction =
  | "show"
  | "hide"
  | "enable"
  | "disable"
  | "setValue";

/** Narrowed ConditionGroup for field/section conditions (no `validate`) */
export interface FieldConditionGroup extends Omit<ConditionGroup, "action"> {
  action: FieldConditionAction;
  /**
   * For `action: "setValue"` — the target **field name** (dot-notation) to set.
   * @example "address.city"
   */
  targetField?: string;
  /** The value to assign when the rules match */
  targetValue?: any;
}

/**
 * Condition expression for use in `field.conditions` and `section.meta.conditions`.
 * Narrowed to exclude `validate` — use `ValidationRule.when` for conditional validation.
 */
export interface FieldConditionExpression {
  /** Logical operator between groups (default AND) */
  logic?: "AND" | "OR";
  groups: FieldConditionGroup[];
}
