import type { EntityDefinition } from "../../types/application";

export interface EmployeeOnboardingFormModel {
  fullName: string;
  email: string;
  department: string;
  role: string;
  baseSalary: number;
  isContractor: boolean;
  contractDurationMonths?: number;
}

/**
 * Full 6-Layer MDAP Entity Fixture for Testing
 */
export const SAMPLE_EMPLOYEE_MDAP_ENTITY: EntityDefinition<EmployeeOnboardingFormModel> = {
  id: "employee-onboarding",
  name: "Employee Onboarding Entity",
  version: "1.0.0",

  // Layer 1: Content (Pure Business Domain Semantics)
  content: {
    id: "employee-content",
    title: "Employee Onboarding",
    description: "Enterprise Onboarding Contract",
    sections: [
      {
        id: "personal_info",
        title: "Personal Information",
        fields: [
          {
            id: "fullName",
            name: "fullName",
            type: "text",
            label: "Full Name",
            required: true,
            layout: { columnSpan: 6 },
          },
          {
            id: "email",
            name: "email",
            type: "text",
            label: "Corporate Email",
            required: true,
            layout: { columnSpan: 6 },
          },
        ],
      },
      {
        id: "job_details",
        title: "Job Assignment",
        fields: [
          {
            id: "department",
            name: "department",
            type: "select",
            label: "Department",
            required: true,
            options: [
              { value: "engineering", label: "Engineering" },
              { value: "hr", label: "Human Resources" },
              { value: "finance", label: "Finance" },
            ],
            layout: { columnSpan: 6 },
          },
          {
            id: "role",
            name: "role",
            type: "text",
            label: "Job Title",
            required: true,
            layout: { columnSpan: 6 },
          },
          {
            id: "baseSalary",
            name: "baseSalary",
            type: "text",
            label: "Base Salary ($)",
            required: true,
            layout: { columnSpan: 12 },
          },
          {
            id: "isContractor",
            name: "isContractor",
            type: "checkbox",
            label: "Independent Contractor",
            layout: { columnSpan: 12 },
          },
        ],
      },
    ],
  },

  // Layer 2: Behavior (Validation, Pipeline, Middleware)
  behavior: {
    pipeline: {
      middleware: [],
    },
    validation: {
      mode: "onBlur",
      reValidateMode: "onChange",
    },
  },

  // Layer 3: Surface (UI Layout, Spacing, Density)
  surface: {
    ui: {
      density: "spacious",
      shell: {
        header: { show: true, title: "New Employee Record" },
        footer: { show: true, submitText: "Complete Onboarding" },
      },
    },
  },

  // Layer 4: Presentation (Theming, Style tokens)
  presentation: {
    style: {
      cardVariant: "glass",
      density: "spacious",
    },
  },
};
