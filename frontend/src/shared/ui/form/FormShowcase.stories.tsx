import type { Meta, StoryObj } from "@storybook/react-vite";

import { Form } from "./Form";
import type { FormDefinition } from "@form-core/domain";

/**
 * FORM SHOWCASE: Modern Architecture v2
 *
 * Demonstrates the full integration of:
 * 1. Box Model ContainerField (display, flex, grid, gap, padding)
 * 2. CSS Auto-Flow Grid (no JS row grouping)
 * 3. New Advanced Field Types: switch, range, file, multiselect
 * 4. Fluid Design Tokens (clamp-based typography and spacing)
 */

const meta: Meta<typeof Form> = {
  title: "Form/Layouts/Modern Architecture Showcase",
  component: Form,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <div className="app-section bg-subtle min-h-screen">
        <div className="app-container max-w-4xl">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Form>;

// ─── Story 1: Enterprise Profile (Card layout section) ─────────────────────

export const HighDensityEnterprise: Story = {
  args: {
    definition: {
      id: "showcase-form-compact",
      title: "Enterprise Profile (Compact Density)",
      description:
        "High-density data management optimized for dashboard grids and analytical forms.",
      settings: {
        density: "compact",
        width: "contained",
      },
      sections: [
        {
          id: "primary_details",
          title: "Corporate Identity",
          // Valid CardLayoutConfig — wraps this section in CardField
          layout: {
            type: "card",
            variant: "outlined",
            gap: "md",
            elevation: "sm",
          },
          fields: [
            {
              id: "org_name",
              name: "orgName",
              type: "text",
              label: "Organization Name",
              required: true,
              layout: { columnSpan: 8 },
              properties: {
                placeholder: "Enter legal entity name...",
                intent: "primary",
              },
              meta: { ui: { icon: "building-2" } },
            },
            {
              id: "org_code",
              name: "orgCode",
              type: "text",
              label: "Global Code",
              layout: { columnSpan: 4 },
              properties: { placeholder: "ORG-000" },
              meta: { ui: { icon: "hash" } },
            },
            {
              id: "sector",
              name: "sector",
              type: "select",
              label: "Industry Sector",
              required: true,
              layout: { columnSpan: 12 },
              properties: { intent: "info" },
              // ✅ options must be top-level, not inside properties
              options: [
                { label: "Technology & Software", value: "tech" },
                { label: "Financial Services", value: "finance" },
                { label: "Healthcare & Life Sciences", value: "health" },
                { label: "Energy & Manufacturing", value: "energy" },
              ],
            },
          ],
        },
      ],
      submitLabel: "Update Global Profile",
      cancelLabel: "Discard Changes",
    },
    debug: true,
  },
};

export const SpaciousEnterprise: Story = {
  args: {
    definition: {
      id: "showcase-form-spacious",
      title: "Enterprise Profile (Spacious Density)",
      description:
        "Spacious layout with 48px input heights and comfortable breathing room.",
      settings: {
        density: "spacious",
        width: "contained",
      },
      sections: [
        {
          id: "primary_details_spacious",
          title: "Corporate Identity",
          layout: {
            type: "card",
            variant: "outlined",
            gap: "lg",
            elevation: "sm",
          },
          fields: [
            {
              id: "org_name_spacious",
              name: "orgName",
              type: "text",
              label: "Organization Name",
              required: true,
              layout: { columnSpan: 8 },
              properties: {
                placeholder: "Enter legal entity name...",
                intent: "primary",
              },
              meta: { ui: { icon: "building-2" } },
            },
            {
              id: "org_code_spacious",
              name: "orgCode",
              type: "text",
              label: "Global Code",
              layout: { columnSpan: 4 },
              properties: { placeholder: "ORG-000" },
              meta: { ui: { icon: "hash" } },
            },
            {
              id: "sector_spacious",
              name: "sector",
              type: "select",
              label: "Industry Sector",
              required: true,
              layout: { columnSpan: 12 },
              properties: { intent: "info" },
              options: [
                { label: "Technology & Software", value: "tech" },
                { label: "Financial Services", value: "finance" },
                { label: "Healthcare & Life Sciences", value: "health" },
                { label: "Energy & Manufacturing", value: "energy" },
              ],
            },
          ],
        },
      ],
      submitLabel: "Update Global Profile",
      cancelLabel: "Discard Changes",
    },
    debug: true,
  },
};

export const ValidationShowcase: Story = {
  args: {
    ...HighDensityEnterprise.args,
    initialData: {
      orgName: "A",
      sector: "",
    },
  },
};

// ─── Story 2: Structural Orchestration (nested container with Box Model) ────

export const StructuralOrchestration: Story = {
  args: {
    definition: {
      id: "structural-orchestration",
      title: "Hierarchical Layout Control",
      description:
        "Demonstrating ContainerField Box Model & CSS Auto-Flow Grid.",
      settings: {
        layoutMode: "dashboard",
        width: "full",
        density: "comfortable",
      },
      sections: [
        {
          id: "dashboard",
          title: "System Insights",
          layout: { type: "grid", columns: 12, gap: "md" },
          fields: [
            {
              id: "quad_main",
              name: "quadMain",
              type: "container",
              label: "High Priority Node",
              // Visual chrome only — SectionContent handles the inner layout grid
              layout: { columnSpan: 8 },
              properties: {
                padding: "p-4",
                border: "border border-border/40 rounded-xl",
                background: "bg-subtle/20",
              },
              fields: [
                {
                  id: "nested_inner_1",
                  name: "inner1",
                  type: "text",
                  label: "Sub-Topic Alpha",
                  layout: { columnSpan: 6 },
                  properties: { intent: "primary" },
                },
                {
                  id: "nested_inner_2",
                  name: "inner2",
                  type: "text",
                  label: "Sub-Topic Beta",
                  layout: { columnSpan: 6 },
                },
                {
                  id: "nested_inner_3",
                  name: "inner3",
                  type: "textarea",
                  label: "Detailed Observation",
                  layout: { columnSpan: 12 },
                },
              ],
            },
            {
              id: "side_stats",
              name: "sideStats",
              type: "text",
              label: "Meta Index",
              layout: { columnSpan: 4 },
              properties: { intent: "info", placeholder: "e.g. alpha-7" },
            },
            {
              id: "side_alert",
              name: "sideAlert",
              type: "select",
              label: "Priority Filter",
              layout: { columnSpan: 4 },
              properties: { intent: "warning" },
              options: [
                { label: "Critical", value: "crit" },
                { label: "Normal", value: "norm" },
              ],
            },
          ],
        },
      ],
    },
  },
};

// ─── Story 3: Advanced Fields Showcase ──────────────────────────────────────

export const AdvancedFieldsShowcase: Story = {
  args: {
    definition: {
      id: "advanced-fields",
      title: "Advanced Input Types",
      description:
        "Demonstrating the new switch, range, file, and multiselect field types.",
      settings: {
        density: "comfortable",
      },
      sections: [
        {
          id: "advanced-section",
          title: "Controls",
          layout: { type: "grid", columns: 12, gap: "md" },
          fields: [
            {
              id: "notifications",
              name: "notifications",
              type: "switch",
              label: "Enable Notifications",
              layout: { columnSpan: 6 },
              properties: { placeholder: "Receive real-time alerts" },
            },
            {
              id: "maintenance_mode",
              name: "maintenanceMode",
              type: "switch",
              label: "Maintenance Mode",
              layout: { columnSpan: 6 },
              properties: { placeholder: "Pause all active workflows" },
            },
            {
              id: "priority_level",
              name: "priorityLevel",
              type: "range",
              label: "Priority Level",
              layout: { columnSpan: 12 },
              properties: { min: 0, max: 10, step: 1 },
            },
            {
              id: "upload_doc",
              name: "uploadDoc",
              type: "file",
              label: "Attach Document",
              layout: { columnSpan: 12 },
              properties: { accept: ".pdf,.docx,.xlsx" },
            },
            {
              id: "departments",
              name: "departments",
              type: "multiselect",
              label: "Access Departments",
              layout: { columnSpan: 12 },
              // ✅ options top-level
              options: [
                { label: "Engineering", value: "eng" },
                { label: "Operations", value: "ops" },
                { label: "Finance", value: "fin" },
                { label: "Human Resources", value: "hr" },
                { label: "Legal & Compliance", value: "legal" },
              ],
            },
          ],
        },
      ],
      submitLabel: "Save Configuration",
    },
  },
};

// ─── Story 4: Pro Dashboard ──────────────────────────────────────────────────

export const ProDashboard: Story = {
  args: {
    definition: {
      id: "pro-dashboard",
      title: "System Control Panel",
      description: "Enterprise high-density mode with fixed surfaces.",
      settings: {
        layoutMode: "dashboard",
        width: "full",
        density: "compact",
        stickyHeader: true,
        stickyFooter: true,
        maxHeight: "500px",
      },
      sections: [
        {
          id: "main_stats",
          title: "Live Metrics",
          layout: { type: "grid", columns: 12, gap: "sm" },
          fields: [
            {
              id: "status",
              name: "status",
              type: "select",
              label: "Node Status",
              layout: { columnSpan: 4 },
              properties: { intent: "success" },
              // ✅ options top-level
              options: [
                { label: "Healthy", value: "ok" },
                { label: "Warning", value: "warn" },
              ],
            },
            {
              id: "load",
              name: "load",
              type: "text",
              label: "CPU Load (%)",
              layout: { columnSpan: 4 },
              properties: { placeholder: "0.00" },
            },
            {
              id: "memory",
              name: "memory",
              type: "text",
              label: "Memory (GB)",
              layout: { columnSpan: 4 },
              properties: { placeholder: "16" },
            },
          ],
        },
        {
          id: "config_area",
          title: "Advanced Configuration",
          layout: { type: "grid", columns: 12, gap: "sm" },
          fields: [
            {
              id: "log_level",
              name: "logLevel",
              type: "select",
              label: "Log Detail",
              layout: { columnSpan: 12 },
              // ✅ options top-level
              options: [
                { label: "Debug", value: "debug" },
                { label: "Trace", value: "trace" },
              ],
            },
            {
              id: "notes_long",
              name: "notesLarge",
              type: "textarea",
              label: "Deployment Notes",
              layout: { columnSpan: 12 },
              properties: {
                placeholder:
                  "Enter long configuration history here to test scrolling...",
              },
            },
            {
              id: "notes_overflow",
              name: "notesOverflow",
              type: "textarea",
              label: "Overflow Test Block",
              layout: { columnSpan: 12 },
              properties: {
                placeholder: "This field ensures the scrollbar is active.",
              },
            },
          ],
        },
      ],
      submitLabel: "Push Updates",
      cancelLabel: "Rollback",
    },
  },
};
// ─── Story 5: Customized Shell Design ──────────────────────────────────────

export const CustomizedShellDesign: Story = {
  args: {
    definition: {
      id: "shell-custom-demo",
      title: "Premium Branded Interface",
      description:
        "Demonstrating deep shell theme overrides for loyalty-first UIs.",
      settings: {
        layoutMode: "portal",
        density: "spacious",
      },
      style: {
        classNames: {
          atmosphere: "bg-indigo-950/20",
          title:
            "text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 mb-4",
          description: "text-lg text-indigo-200/60 mb-12",
        },
      },
      sections: [
        {
          id: "branding_node",
          title: "Visual Attributes",
          layout: { type: "grid", columns: 12, gap: "xl" },
          fields: [
            {
              id: "brand_color",
              name: "brandColor",
              type: "text",
              label: "Primary Hex",
              layout: { columnSpan: 6 },
              properties: { placeholder: "#6366f1" },
            },
            {
              id: "brand_logo",
              name: "brandLogo",
              type: "file",
              label: "Organization Mark",
              layout: { columnSpan: 6 },
            },
          ],
        },
      ],
      submitLabel: "Apply Brand",
    },
    // We can inject theme overrides directly in stories (assuming Form handles a theme prop)
    // For now, these effects are visible via the DEFAULT_FORM_THEME updates I made.
  },
};

// ─── Story 6: High Loyalty Dashboard ────────────────────────────────────────

export const HighLoyaltyDashboard: Story = {
  args: {
    definition: {
      id: "premium-dashboard",
      title: "Global Command Center",
      description:
        "A mixed-density layout with recursive containers and advanced controls.",
      settings: {
        layoutMode: "dashboard",
        width: "full",
        density: "comfortable",
        stickyHeader: true,
      },
      style: {
        classNames: {
          shell: "bg-slate-950",
          header: "mb-8 pb-8 border-b border-white/10",
        },
      },
      sections: [
        {
          id: "ops_view",
          title: "Operations Hub",
          layout: { type: "grid", columns: 12, gap: "lg" },
          fields: [
            {
              id: "metrics_grid",
              type: "container",
              label: "System Health",
              layout: { columnSpan: 12 },
              properties: {
                padding: "p-6",
                background: "bg-surface-elevated/50",
                border: "border border-border/60",
                borderRadius: "large",
                shadow: "shadow-lg",
              },
              fields: [
                {
                  id: "power_state",
                  name: "power",
                  type: "switch",
                  label: "System Power",
                  layout: { columnSpan: 4 },
                },
                {
                  id: "load_slider",
                  name: "load",
                  type: "range",
                  label: "Throttle %",
                  layout: { columnSpan: 8 },
                  properties: { min: 0, max: 100 },
                },
              ],
            },
            {
              id: "data_card",
              type: "card",
              label: "Log Stream",
              layout: { columnSpan: 8 },
              fields: [
                {
                  id: "log_entry",
                  name: "logEntry",
                  type: "textarea",
                  label: "Update Status",
                  layout: { columnSpan: 12 },
                  properties: { placeholder: "Write to console..." },
                },
              ],
            },
            {
              id: "side_actions",
              type: "container",
              label: "Quick Actions",
              layout: { columnSpan: 4 },
              properties: { direction: "col", gap: "md" },
              fields: [
                {
                  id: "quick_tag",
                  name: "tag",
                  type: "select",
                  label: "Tag Node",
                  options: [
                    { label: "Alpha", value: "a" },
                    { label: "Beta", value: "b" },
                  ],
                },
                {
                  id: "export_btn",
                  type: "file",
                  label: "Cloud Sync",
                },
              ],
            },
          ],
        },
      ],
      submitLabel: "Push to Production",
    },
  },
};

// ─── Story 7: Performance Stress Test ───────────────────────────────────────

export const PerformanceStressTest: Story = {
  args: {
    definition: {
      id: "stress-test",
      title: "100-Field Engine Audit",
      description:
        "Demonstrating zero-latency rendering with standard auto-flow grids.",
      sections: [
        {
          id: "mass_grid",
          title: "Node Farm",
          layout: { type: "grid", columns: 12, gap: "xs" },
          fields: Array.from({ length: 120 }).map((_, i) => ({
            id: `field_${i}`,
            name: `field_${i}`,
            type: "text",
            label: `Node #${i + 1}`,
            layout: { columnSpan: 2 }, // 6 fields per row
            properties: { placeholder: "0.00" },
          })),
        },
      ],
    },
  },
};
