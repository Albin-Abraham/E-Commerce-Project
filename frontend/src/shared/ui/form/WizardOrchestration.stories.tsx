import type { Meta, StoryObj } from "@storybook/react-vite";

import { Form } from "./Form";
import type { EntityDefinition } from "./types/application";
import { compileEntityToFormDef } from "./utils/mdap-compiler";

const meta: Meta<typeof Form> = {
  title: "Form/Orchestration/Wizard MDAP Entity",
  component: Form,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof Form>;

/**
 * ── MDAP COMPLIANT IMPLEMENTATION ──────────────────────────────────────────
 * Notice how we now define an `EntityDefinition` separating Content,
 * Surface, and Presentation, rather than a flattened FormDefinition.
 */
const VehicleEntity: EntityDefinition = {
  id: "vehicle-wizard-entity",
  name: "Vehicle Registration",
  content: {
    id: "vehicle-content",
    title: "Vehicle Registration",
    sections: [
      {
        id: "step-vehicle-info",
        title: "Vehicle Information",
        description:
          "Group fields related to uniquely identifying the vehicle.",
        fields: [
          {
            id: "reg_number",
            name: "regNumber",
            type: "text",
            label: "Registration Number",
            required: true,
            meta: { ui: { icon: "hash" } },
            layout: { columnSpan: 6 },
          },
          {
            id: "engine_number",
            name: "engineNumber",
            type: "text",
            label: "Engine Number",
            required: true,
            meta: { ui: { icon: "settings" } },
            layout: { columnSpan: 6 },
          },
        ],
      },
      {
        id: "step-classification",
        title: "Vehicle Classification",
        description: "Details that describe the vehicle type and specs.",
        fields: [
          {
            id: "class_of_vehicle",
            name: "vehicleClass",
            type: "select",
            label: "Class of Vehicle",
            options: [
              { label: "Heavy Duty", value: "hd" },
              { label: "Light Transit", value: "lt" },
            ],
            layout: { columnSpan: 6 },
          },
          {
            id: "fuel_type",
            name: "fuelType",
            type: "select",
            label: "Fuel Type",
            options: [
              { label: "Electric", value: "ev" },
              { label: "Hybrid", value: "hybrid" },
              { label: "Diesel", value: "diesel" },
            ],
            layout: { columnSpan: 6 },
          },
        ],
      },
      {
        id: "step-purchase",
        title: "Purchase Information",
        description: "Cost-related info for ownership tracking.",
        fields: [
          {
            id: "purchase_amount",
            name: "amount",
            type: "text",
            label: "Purchased Amount",
            layout: { columnSpan: 6 },
            properties: { placeholder: "0.00" },
          },
        ],
      },
    ],
  },
  surface: {
    ui: {
      target: "screen",
      density: "comfortable",
      shell: {
        layoutMode: "dashboard",
        width: "full",
        wizard: {
          enabled: true,
          stepperType: "sidebar",
          linear: true,
        },
      } as any,
    },
  },
  presentation: {
    style: {
      classNames: {
        root: "form-root flex flex-col gap-6",
      },
    },
  },
};

export const OperationalSidebar: Story = {
  args: {
    // Compile the MDAP Entity down to a flat FormDefinition at runtime
    definition: compileEntityToFormDef(
      VehicleEntity,
      "vehicle-wizard",
      "Complete Registration"
    ),
  },
};

const OnboardingEntity: EntityDefinition = {
  id: "onboarding-wizard-entity",
  name: "Onboarding",
  content: {
    id: "onboarding-content",
    title: "Onboarding",
    sections: [
      {
        id: "profile",
        title: "Profile",
        fields: [
          {
            id: "fullname",
            name: "fullName",
            type: "text",
            label: "Full Name",
            layout: { columnSpan: 12 },
            properties: {
              borderRadius: "large",
            },
            meta: { ui: { icon: "user" } },
          },
        ],
      },
      {
        id: "preferences",
        title: "Preferences",
        fields: [
          {
            id: "theme-pref",
            name: "theme",
            type: "select",
            label: "Dark Mode vs Light Mode",
            options: [
              { label: "Dark", value: "dark" },
              { label: "Light", value: "light" },
            ],
            layout: { columnSpan: 12 },
            meta: {
              ui: {
                classNames: {
                  base: "bg-white/5 border-white/10 text-white",
                },
              },
            },
          },
          {
            id: "email-alerts",
            name: "emailAlerts",
            type: "switch",
            label: "Email Notifications",
            layout: { columnSpan: 12 },
            properties: { placeholder: "Receive weekly digest emails" },
          },
        ],
      },
      {
        id: "data-access",
        title: "Data Access",
        fields: [
          {
            id: "access_modules",
            name: "accessModules",
            type: "multiselect",
            label: "Module Access",
            options: [
              { label: "Appointments", value: "appt" },
              { label: "Staff Management", value: "staff" },
              { label: "Billing", value: "billing" },
              { label: "Reports", value: "reports" },
            ],
            layout: { columnSpan: 12 },
            meta: {
              ui: {
                classNames: {
                  base: "bg-white/5 border-white/10 text-white",
                },
              },
            },
          },
        ],
      },
    ],
  },
  surface: {
    ui: {
      target: "screen",
      density: "spacious",
      shell: {
        layoutMode: "portal",
        wizard: {
          enabled: true,
          stepperType: "top",
          linear: false,
        },
      } as any,
    },
  },
  presentation: {
    style: {
      classNames: {
        atmosphere: "opacity-40",
        root: "!text-slate-100",
      },
    },
  },
};

export const IdentityPortalWizard: Story = {
  args: {
    // Compile the MDAP Entity down to a flat FormDefinition at runtime
    definition: compileEntityToFormDef(
      OnboardingEntity,
      "onboarding-wizard",
      "Personalize Experience"
    ),
  },
};
