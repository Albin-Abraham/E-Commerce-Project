import type { FieldEvents } from "@ui/form/fields";
import type { ConditionGroup } from "@ui/form/types/condition";
import type { ValidationSettings } from "@ui/form/types/validation";

export const EmployeeValidationRules = {
  // 1. Validations
  validations: {
    fullName: {
      rules: [
        { type: "required" },
        { type: "min", value: 4 },
        { type: "pattern", value: "^[^0-9]" },
        { type: "alphaOnly", value: " " },
      ],
      validateOn: ["change", "blur"],
    } as ValidationSettings,
    email: {
      rules: [{ type: "required" }, { type: "email" }],
      validateOn: ["change", "blur"],
    } as ValidationSettings,
    phone: {
      rules: [{ type: "required" }, { type: "phone" }],
      validateOn: ["change", "blur"],
    } as ValidationSettings,
  },

  // 2. Events
  events: {
    fullName: {
      beforeChange: (_field, value) => {
        // Block numbers in names
        if (/\d/.test(value)) {
          alert("Names cannot contain numbers!");
          return false;
        }
        return true;
      },
    } as FieldEvents<any>,
  },

  // 3. Conditions
  conditions: {
    isWorkPermit: {
      groups: [
        {
          action: "show",
          rules: [
            { field: "citizenship", operator: "equals", value: "permit" },
          ],
        },
      ],
    } as unknown as { groups: ConditionGroup[] },
  },
};
