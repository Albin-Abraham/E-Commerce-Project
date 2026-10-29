/**
 * ProgrammaticControlsFixture.ts
 *
 * Schema fixtures for testing useWatch, useController, useFormContext<T>,
 * and the new vertical DOM field types (accordion, fieldset, group, tabs).
 *
 * Key convention: all fields use `key` so id === name === key everywhere.
 */
import type { FormDefinition } from "@ui/form/types";

// ─────────────────────────────────────────────────────────────────────────────
//  PROGRAMMATIC CONTROLS FIXTURE
//  Tests: useWatch, useController, useFormContext, cascading visibility
// ─────────────────────────────────────────────────────────────────────────────

export const PROGRAMMATIC_CONTROLS_FIXTURE: FormDefinition = {
  id: "programmatic-controls-test",
  title: "Programmatic Controls Test",
  sections: [
    {
      id: "main_section",
      title: "Programmatic Controls",
      layout: { type: "grid", columns: 12 },
      fields: [
        {
          key: "role",
          type: "select",
          label: "Role",
          layout: { columnSpan: 12 },
          options: [
            { label: "User", value: "user" },
            { label: "Admin", value: "admin" },
          ],
        },
        {
          key: "email",
          type: "text",
          label: "Email",
          layout: { columnSpan: 12 },
          required: true,
          validation: { rules: [{ type: "email" }] },
        },
        // This field is only visible when role === "admin"
        {
          key: "admin_code",
          type: "text",
          label: "Admin Code",
          layout: { columnSpan: 12 },
          conditions: {
            groups: [
              {
                rules: [{ field: "role", operator: "eq", value: "admin" }],
                action: "show",
              },
            ],
          },
          visible: false, // hidden by default
        },
        // Mirrors email value to test useWatch reactivity
        {
          key: "email_confirm",
          type: "text",
          label: "Confirm Email",
          layout: { columnSpan: 12 },
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
//  VERTICAL DOM FIXTURE
//  Tests: accordion, fieldset, group, tabs — all vertical structural containers
// ─────────────────────────────────────────────────────────────────────────────

export const VERTICAL_DOM_FIXTURE: FormDefinition = {
  id: "vertical-dom-test",
  title: "Vertical DOM Elements Test",
  sections: [
    // ── Accordion ──────────────────────────────────────────────────────────
    {
      id: "accordion_section",
      title: "Accordion",
      layout: { type: "grid", columns: 12 },
      fields: [
        {
          id: "advanced_accordion",
          type: "accordion",
          label: "Advanced Settings",
          layout: { columnSpan: 12 },
          customData: { defaultOpen: false },
          fields: [
            {
              key: "timeout",
              type: "number",
              label: "Timeout (ms)",
              layout: { columnSpan: 12 },
            },
          ],
        },
      ],
    },

    // ── Fieldset ────────────────────────────────────────────────────────────
    {
      id: "fieldset_section",
      title: "Fieldset",
      layout: { type: "grid", columns: 12 },
      fields: [
        {
          id: "address_fieldset",
          type: "fieldset",
          label: "Shipping Address",
          description: "Where should we deliver?",
          layout: { columnSpan: 12 },
          fields: [
            {
              key: "street",
              type: "text",
              label: "Street",
              layout: { columnSpan: 12 },
            },
            {
              key: "city",
              type: "text",
              label: "City",
              layout: { columnSpan: 6 },
            },
          ],
        },
      ],
    },

    // ── Group ───────────────────────────────────────────────────────────────
    {
      id: "group_section",
      title: "Group",
      layout: { type: "grid", columns: 12 },
      fields: [
        {
          id: "full_name_group",
          type: "group",
          label: "Full Name",
          required: true,
          layout: { columnSpan: 12 },
          fields: [
            {
              key: "first_name",
              type: "text",
              label: "First",
              layout: { columnSpan: 6 },
            },
            {
              key: "last_name",
              type: "text",
              label: "Last",
              layout: { columnSpan: 6 },
            },
          ],
        },
      ],
    },

    // ── Tabs ────────────────────────────────────────────────────────────────
    {
      id: "tabs_section",
      title: "Tabs",
      layout: { type: "tabs" },
      fields: [
        {
          id: "tab_general",
          type: "section",
          label: "General",
          layout: { type: "grid", columns: 12 },
          fields: [
            {
              key: "display_name",
              type: "text",
              label: "Display Name",
              layout: { columnSpan: 12 },
            },
          ],
        },
        {
          id: "tab_security",
          type: "section",
          label: "Security",
          layout: { type: "grid", columns: 12 },
          fields: [
            {
              key: "current_password",
              type: "password",
              label: "Current Password",
              layout: { columnSpan: 12 },
            },
          ],
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
//  HEADLESS ENGINE FIXTURE (FormCore — no React)
//  Tests: engine setValue, validation, visibility, middleware — pure JS
// ─────────────────────────────────────────────────────────────────────────────

export const HEADLESS_ENGINE_FIXTURE: FormDefinition = {
  id: "headless-engine-test",
  title: "Headless Engine Test",
  sections: [
    {
      id: "s1",
      title: "Engine Test",
      fields: [
        {
          key: "country",
          type: "select",
          label: "Country",
          options: [
            { label: "USA", value: "us" },
            { label: "Canada", value: "ca" },
          ],
          required: true,
        },
        {
          key: "province",
          type: "text",
          label: "Province",
          visible: false,
          conditions: {
            groups: [
              {
                rules: [{ field: "country", operator: "eq", value: "ca" }],
                action: "show",
              },
            ],
          },
        },
        {
          key: "state",
          type: "text",
          label: "State",
          visible: false,
          conditions: {
            groups: [
              {
                rules: [{ field: "country", operator: "eq", value: "us" }],
                action: "show",
              },
            ],
          },
        },
        {
          key: "notes",
          type: "textarea",
          label: "Notes",
          validation: { rules: [{ type: "maxLength", value: 100 }] },
        },
      ],
    },
  ],
};
