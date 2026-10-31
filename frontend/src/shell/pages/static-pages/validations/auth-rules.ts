import type { ValidationSettings } from "@ui/form/types/validation";

/*
 * Auth Form Logic Module — Business Logic Boundary
 *
 * Defines WHAT the form validates and how data transforms.
 * Zero UI knowledge. Zero framework coupling.
 */

export const AuthValidationRules = {
  // ── Validation Rules (Pure Domain Logic) ─────────────────────────────────
  validations: {
    username: {
      rules: [
        { type: "required", message: "Email is required" },
        { type: "email", message: "Please enter a valid email address" },
      ],
    } as ValidationSettings,

    password: {
      rules: [
        { type: "required", message: "Password is required" },
        { type: "min", value: 8, message: "Must be at least 8 characters" },
      ],
    } as ValidationSettings,

    name: {
      rules: [
        { type: "required", message: "Full name is required" },
        {
          type: "min",
          value: 2,
          message: "Name must be at least 2 characters",
        },
      ],
    } as ValidationSettings,

    confirm_password: {
      rules: [
        { type: "required", message: "Please confirm your password" },
        {
          type: "matches",
          value: "password",
          message: "Passwords do not match",
        },
      ],
    } as ValidationSettings,

    company_name: {
      rules: [
        { type: "required", message: "Company name is required" },
        {
          type: "min",
          value: 2,
          message: "Company name must be at least 2 characters",
        },
      ],
    } as ValidationSettings,

    tax_id: {
      rules: [
        { type: "required", message: "Tax / VAT / GST ID is required" },
      ],
    } as ValidationSettings,
  },

  // ── Event Handlers (Side Effects / Transformers) ──────────────────────────
  events: {
    username: {
      onChange: (value: any) => {
        if (value && typeof value === "string") {
          return value.toLowerCase().trim();
        }
        return value;
      },
    },
  },
};
