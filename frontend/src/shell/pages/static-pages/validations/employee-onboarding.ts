import type { ValidationSettings } from "@ui/form/types/validation";

// Extracted JSON-driven validation rules
export const EmployeeOnboardingValidationRules: Record<
  string,
  ValidationSettings
> = {
  firstName: {
    rules: [
      { type: "required", message: "First name is required" },
      {
        type: "min",
        value: 4,
        message: "First name must be more than 3 characters",
      },
    ],
  },
  lastName: {
    rules: [
      { type: "required", message: "Last name is required" },
      {
        type: "min",
        value: 3,
        message: "Last name must be at least 3 characters",
      },
    ],
  },
  phone: {
    // Optional per the v2.1 onboarding contract — validated only in-field
    // when a value is present (the engine skips empty values for non-required
    // rules; keep no rules so an empty phone never blocks navigation).
    rules: [],
  },
};

export const EmployeeOnboardingEvents = {
  id_number: {
    onChange: (_field: any, value: any) => {
      if (typeof value === "string") {
        // Auto-format as X-XXXX-XXXX
        const v = value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
        if (v.length > 5)
          return `${v.slice(0, 1)}-${v.slice(1, 5)}-${v.slice(5, 9)}`;
        if (v.length > 1) return `${v.slice(0, 1)}-${v.slice(1)}`;
        return v;
      }
      return value;
    },
    onValidate: (_field: any, value: any) => {
      if (!value) return "Government ID is required";
      if (!/^([A-Z0-9])-([A-Z0-9]{4})-([A-Z0-9]{4})$/.test(value)) {
        return "ID must match format X-XXXX-XXXX";
      }
      return true; // true means valid
    },
  },
  visa_number: {
    onChange: (_field: any, value: any) => {
      return typeof value === "string" ? value.toUpperCase() : value;
    },
    onValidate: (_field: any, value: any) => {
      if (!value) return "Visa Number is required";
      return value.length >= 6
        ? true
        : "Visa Number must be at least 6 characters";
    },
  },
};

export const handleMockServerResponse = async (
  _payload: any
): Promise<Record<string, string> | void> => {
  // Simulate server-side validation delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // In a real app, the server would re-validate.
  // Here we assume the client validation that passed is sufficient for the demo.
  // Or we could implement a lightweight check here matching the rules above.
  return;
};
