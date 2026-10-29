/**
 * Employee Onboarding UI Configuration (DCS Compliant)
 *
 * Defines the "Visual Presentation" layer only. No business logic.
 * - settings: Global density/mode
 * - sections: Layout and field-specific overrides
 */
export const EmployeeUIConfig = {
  settings: {
    width: "centered",
    density: "comfortable",
  },
  sections: {
    tab_personal: {
      layout: { type: "grid", columns: 12, gap: 6 },
      fields: {
        identity_group: {
          layout: { type: "group", columns: 12 },
          fields: {
            fullName: {
              layout: { columnSpan: 12 },
              properties: {
                placeholder: "Enter full legal name",
                labelPlacement: "side",
                borderRadius: "full",
              },
              meta: { ui: { icon: "user", variant: "outlined" } },
            },
            email: {
              layout: { columnSpan: 6 },
              properties: {
                placeholder: "email@example.com",
                labelPlacement: "side",
              },
              meta: { ui: { icon: "mail" } },
            },
            phone: {
              layout: { columnSpan: 6 },
              properties: {
                placeholder: "(555) 000-0000",
                labelPlacement: "side",
              },
              meta: { ui: { icon: "phone" } },
            },
          },
        },
      },
    },
    tab_employment: {
      layout: {
        type: "card",
        variant: "outlined",
        padding: "8",
        borderRadius: "large",
      },
      fields: {
        department: {
          layout: { columnSpan: 6 },
          meta: { ui: { icon: "briefcase" } },
        },
        citizenship: {
          layout: { columnSpan: 6 },
          properties: {
            placeholder: "Select status",
            labelPlacement: "side",
            borderRadius: "none",
          },
          meta: { ui: { variant: "filled" } },
        },
        permit_details: {
          layout: { type: "grid", columns: 12, gap: 4 },
          fields: {
            permitNumber: {
              layout: { columnSpan: 6 },
              properties: { labelPlacement: "side" },
              meta: { ui: { variant: "underlined" } },
            },
            expiryDate: {
              layout: { columnSpan: 6 },
              properties: { labelPlacement: "side" },
              meta: { ui: { variant: "underlined" } },
            },
          },
        },
      },
    },
  },
} as const;
