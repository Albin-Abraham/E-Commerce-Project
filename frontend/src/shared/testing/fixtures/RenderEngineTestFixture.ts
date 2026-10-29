// src/testing/fixtures/RenderEngineTestFixture.ts
import type { FormDefinition } from "@ui/form/types";

/**
 * RENDER_ENGINE_TEST_SCHEMA
 *
 * Specifically designed to validate:
 * 1. Grid Auto-Flow Spans (col-span-x)
 * 2. Recursive Parent Context (Card inside Container)
 * 3. Shell Surface Unification
 */
export const RENDER_ENGINE_TEST_SCHEMA: FormDefinition = {
  id: "render-engine-audit",
  title: "Render Engine Audit",
  description: "Internal diagnostic for the v2.1.0 CSS-Grid engine.",
  settings: {
    layoutMode: "dashboard",
    density: "comfortable",
  },
  sections: [
    {
      id: "grid_orchestration",
      title: "Grid Orchestration",
      layout: { type: "grid", columns: 12, gap: "md" },
      fields: [
        {
          id: "field_full",
          name: "fieldFull",
          type: "text",
          label: "Full Width",
          layout: { columnSpan: 12 },
        },
        {
          id: "field_half_left",
          name: "fieldHalfLeft",
          type: "text",
          label: "Half Left",
          layout: { columnSpan: 6 },
        },
        {
          id: "field_half_right",
          name: "fieldHalfRight",
          type: "text",
          label: "Half Right",
          layout: { columnSpan: 6 },
        },
      ],
    },
    {
      id: "recursive_nesting",
      title: "Recursive Nesting",
      layout: { type: "grid", columns: 12, gap: "md" },
      fields: [
        {
          id: "outer_container",
          name: "outerContainer",
          type: "container",
          label: "Outer Wrapper",
          layout: { columnSpan: 12 },
          properties: {
            padding: "p-4",
            border: "border-primary",
          },
          fields: [
            {
              id: "inner_card",
              name: "innerCard",
              type: "card",
              label: "Inner Card",
              layout: { columnSpan: 12 }, // Should be 12/12 of the container
              fields: [
                {
                  id: "nested_field",
                  name: "nestedField",
                  type: "text",
                  label: "Nested Target",
                  layout: { columnSpan: 6 }, // Should be 6/12 of the card
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  submitLabel: "Run Audit",
};

export const ENTERPRISE_PROFILE_SCHEMA: FormDefinition = {
  id: "showcase-form",
  title: "Enterprise Profile",
  description: "Comprehensive data management with semantic styling handles.",
  sections: [
    {
      id: "primary_details",
      title: "Corporate Identity",
      layout: {
        type: "card",
        variant: "outlined",
        gap: "md",
        elevation: "sm",
      } as any,
      fields: [
        {
          id: "org_name",
          name: "orgName",
          type: "text",
          label: "Organization Name",
          required: true,
          layout: {
            columnSpan: 8,
          },
          properties: {
            placeholder: "Enter legal entity name...",
            intent: "primary",
          },
          meta: {
            ui: {
              icon: "building-2",
            },
          },
        },
        {
          id: "org_code",
          name: "orgCode",
          type: "text",
          label: "Global Code",
          layout: {
            columnSpan: 4,
          },
          properties: {
            placeholder: "ORG-000",
          },
          meta: {
            ui: {
              icon: "hash",
            },
          },
        },
        {
          id: "sector",
          name: "sector",
          type: "select",
          label: "Industry Sector",
          required: true,
          layout: {
            columnSpan: 12,
          },
          properties: {
            intent: "info",
          },
          options: [
            {
              label: "Technology & Software",
              value: "tech",
            },
            {
              label: "Financial Services",
              value: "finance",
            },
            {
              label: "Healthcare & Life Sciences",
              value: "health",
            },
            {
              label: "Energy & Manufacturing",
              value: "energy",
            },
          ],
        },
      ],
    },
  ],
  submitLabel: "Update Global Profile",
  cancelLabel: "Discard Changes",
};

export const PRIMITIVE_FIELDS_SCHEMA: FormDefinition = {
  id: "primitive-audit",
  title: "Primitive Audit",
  sections: [
    {
      id: "input_prowess",
      title: "Input Prowess",
      fields: [
        {
          id: "text_target",
          name: "textTarget",
          type: "text",
          label: "Text Input",
          required: true,
          layout: { columnSpan: 6 },
          properties: { placeholder: "Type here..." },
        },
        {
          id: "select_target",
          name: "selectTarget",
          type: "select",
          label: "Select Menu",
          layout: { columnSpan: 6 },
          options: [
            { label: "Option A", value: "a" },
            { label: "Option B", value: "b" },
          ],
        },
        {
          id: "textarea_target",
          name: "textareaTarget",
          type: "textarea",
          label: "Extended Notes",
          layout: { columnSpan: 12 },
          properties: { placeholder: "Long form notes..." },
        },
        {
          id: "checkbox_target",
          name: "checkboxTarget",
          type: "checkbox",
          label: "Consent Toggle",
          layout: { columnSpan: 12 },
        },
      ],
    },
  ],
  submitLabel: "Finalize Audit",
};

export const VEHICLE_WIZARD_SCHEMA: FormDefinition = {
  id: "vehicle-wizard",
  title: "Vehicle Registration",
  description:
    "Complete the mandatory registration for enterprise transit vehicles.",
  submitLabel: "Complete Registration",
  settings: {
    layoutMode: "dashboard",
    wizard: {
      enabled: true,
      stepperType: "sidebar",
      linear: true,
    },
  },
  sections: [
    {
      id: "step-vehicle-info",
      title: "Vehicle Information",
      description: "Group fields related to uniquely identifying the vehicle.",
      fields: [
        {
          id: "reg_number",
          name: "regNumber",
          type: "text",
          label: "Registration Number",
          required: true,
          layout: { columnSpan: 6 },
        },
        {
          id: "engine_number",
          name: "engineNumber",
          type: "text",
          label: "Engine Number",
          required: true,
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
};
