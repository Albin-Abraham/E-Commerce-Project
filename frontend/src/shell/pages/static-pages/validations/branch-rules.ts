import type { FieldEvents } from "@ui/form/fields";
import type { FieldConditionExpression } from "@ui/form/types/condition";
import type { ValidationSettings } from "@ui/form/types/validation";

/*
 * Branch Form Logic Module
 *
 * Separates "Business Logic" from "UI Structure".
 * - Validation Rules
 * - Event Handlers (Side Effects)
 * - Conditional Logic (Visibility)
 */

export const BranchValidationRules = {
  // 1. Validation Rules (Pure Logic)
  validations: {
    name: {
      rules: [
        { type: "required", message: "Branch Name is required" },
        { type: "min", value: 3, message: "Must be at least 3 characters" },
      ],
    } as ValidationSettings,

    code: {
      rules: [
        { type: "required", message: "Code is required" },
        {
          type: "pattern",
          value: "^BR-\\d{3}$",
          message: "Format must be BR-XXX (e.g. BR-001)",
        },
      ],
    } as ValidationSettings,

    status: {
      rules: [{ type: "required", message: "Status is required" }],
    } as ValidationSettings,
  },

  // 2. Event Handlers (Interactions)
  events: {
    name: {
      onChange: (_field: any, value: any) => {
        console.log(`[BranchRules] Name Changed: ${value}`);
      },
    } as FieldEvents<any>,

    code: {
      onBlur: (_field: any, _value: any) => {},
      onChange: (_field: any, value: any) => {
        if (value && typeof value === "string") {
          return value.toUpperCase().replace(/\s+/g, "-");
        }
        return value;
      },
    } as FieldEvents<any>,
  },

  // 3. Conditional Logic (Dynamic Visibility)
  conditions: {
    // Example: Only show "Work Permit" if Citizenship is "Permit"
    // (Adapted for Branch context example if we had one, e.g. "Construction" status -> "Completion Date")
    isConstruction: {
      groups: [
        {
          action: "show",
          rules: [
            { field: "status", operator: "equals", value: "construction" },
          ],
        },
      ],
    } satisfies FieldConditionExpression,
  },
};
