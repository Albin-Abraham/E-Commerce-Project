import type { FormDefinition } from "@form-core/domain";

/**
 * ComprehensiveFormFixture.ts
 *
 * Canonical test fixture modeling an end-to-end multi-step enterprise onboarding wizard.
 * Exercises:
 *  - Step 1: Account classification (radio) + dynamic conditional fields (companyName, taxId)
 *  - Step 2: Security credentials (email, password, confirmPassword)
 *  - Step 3: Preferences & agreements (checkbox notifications, required terms)
 *  - Wizard settings: linear stepped navigation with step-level validation gating
 */
export const COMPREHENSIVE_FORM_FIXTURE: FormDefinition = {
  id: "zenos-onboarding-wizard",
  title: "ZenOS Enterprise Onboarding",
  settings: {
    wizard: {
      enabled: true,
      linear: true,
    },
  },
  sections: [
    {
      id: "step_account",
      title: "Account Setup",
      description: "Define your organization or individual profile",
      fields: [
        {
          id: "accountType",
          name: "accountType",
          type: "radio",
          label: "Account Type",
          required: true,
          options: [
            { label: "Individual", value: "individual" },
            { label: "Business Organization", value: "business" },
          ],
        },
        {
          id: "fullName",
          name: "fullName",
          type: "text",
          label: "Full Name",
          required: true,
          placeholder: "e.g. John Doe",
        },
        {
          id: "companyName",
          name: "companyName",
          type: "text",
          label: "Company Legal Name",
          required: true,
          placeholder: "e.g. Acme Corp Inc.",
          conditions: {
            groups: [
              {
                action: "show",
                rules: [
                  {
                    field: "accountType",
                    operator: "equals",
                    value: "business",
                  },
                ],
              },
            ],
          },
        },
        {
          id: "taxId",
          name: "taxId",
          type: "text",
          label: "Tax ID / EIN",
          required: false,
          placeholder: "e.g. 12-3456789",
          conditions: {
            groups: [
              {
                action: "show",
                rules: [
                  {
                    field: "accountType",
                    operator: "equals",
                    value: "business",
                  },
                ],
              },
            ],
          },
        },
      ],
    },
    {
      id: "step_security",
      title: "Security & Credentials",
      description: "Configure secure authentication credentials",
      fields: [
        {
          id: "email",
          name: "email",
          type: "email",
          label: "Corporate Email",
          required: true,
          placeholder: "name@company.com",
          validation: {
            rules: [
              {
                type: "email",
                message: "Please enter a valid corporate email address",
              },
            ],
          },
        },
        {
          id: "password",
          name: "password",
          type: "password",
          label: "Password",
          required: true,
          validation: {
            rules: [
              {
                type: "minLength",
                value: 8,
                message: "Password must be at least 8 characters long",
              },
            ],
          },
        },
      ],
    },
    {
      id: "step_review",
      title: "Preferences & Confirmation",
      description: "Set notification preferences and review commitments",
      fields: [
        {
          id: "newsletter",
          name: "newsletter",
          type: "checkbox",
          label: "Subscribe to ZenOS product updates and security bulletins",
          required: false,
        },
        {
          id: "termsAgreed",
          name: "termsAgreed",
          type: "checkbox",
          label: "I agree to the ZenOS Enterprise Service Terms and Data Processing Addendum",
          required: true,
        },
      ],
    },
  ],
};
