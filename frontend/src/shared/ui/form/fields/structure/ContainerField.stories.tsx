import type { Meta, StoryObj } from "@storybook/react-vite";
import { FormThemeProvider } from "@ui/form/context/FormThemeContext";

import { CardField, ContainerField } from "./LayoutFields";

// ─────────────────────────────────────────────────────────────────────────────
//  MOCK CHILDREN
// ─────────────────────────────────────────────────────────────────────────────

const MockInputField = ({
  label,
  placeholder = "Enter value…",
  accent = false,
}: {
  label: string;
  placeholder?: string;
  accent?: boolean;
}) => (
  <div className="flex flex-col gap-1">
    <label className="text-[var(--text-sm)] font-bold text-foreground/80">
      {label}
    </label>
    <div
      className={[
        "flex items-center px-4 py-2.5 gap-3 rounded-[var(--radius-md)] border transition-all",
        "bg-[var(--glass-bg)] focus-within:ring-2 focus-within:border-primary focus-within:ring-primary/20",
        accent ? "border-primary/40" : "border-border shadow-sm",
      ].join(" ")}
    >
      <input
        className="w-full bg-transparent border-none outline-none text-foreground text-[var(--text-base)] placeholder:text-foreground/30"
        placeholder={placeholder}
      />
    </div>
  </div>
);

const MockBadge = ({
  label,
  variant = "default",
}: {
  label: string;
  variant?: "default" | "success" | "warning" | "danger";
}) => {
  const colors: Record<string, string> = {
    default: "bg-subtle text-foreground/60 border-border",
    success: "bg-success/10 text-success border-success/30",
    warning: "bg-warning/10 text-warning border-warning/30",
    danger: "bg-danger/10 text-danger border-danger/30",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[var(--text-xs)] font-semibold ${colors[variant]}`}
    >
      {label}
    </span>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
//  ContainerField Meta
// ─────────────────────────────────────────────────────────────────────────────

const meta: Meta<typeof ContainerField> = {
  title: "Form/Structure/ContainerField",
  component: ContainerField,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <FormThemeProvider>
        <div className="min-h-screen bg-subtle p-10 max-w-3xl mx-auto">
          <Story />
        </div>
      </FormThemeProvider>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "**ContainerField** is a transparent structural wrapper with no visual chrome (no border/shadow/header). It groups fields logically for layout purposes — typically used inside a `CardField` or a `grid` section to create flexible sub-layouts.",
      },
    },
  },
  args: {
    field: {
      id: "container-demo",
      name: "container_demo",
      label: "Container Demo",
      type: "container",
      properties: {},
    },
  },
  argTypes: {
    field: { control: "object" },
  },
};

export default meta;
type ContainerStory = StoryObj<typeof ContainerField>;

// ─── Stories ─────────────────────────────────────────────────────────────────

/** Default — transparent container, just groups children */
export const Default: ContainerStory = {
  render: (args) => (
    <ContainerField {...args}>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-6">
          <MockInputField label="First Name" placeholder="e.g. John" />
        </div>
        <div className="col-span-12 md:col-span-6">
          <MockInputField label="Last Name" placeholder="e.g. Doe" />
        </div>
        <div className="col-span-12">
          <MockInputField
            label="Email Address"
            placeholder="john@example.com"
          />
        </div>
      </div>
    </ContainerField>
  ),
};

/**
 * Horizontal strip — `ContainerField` with flex-row layout via `properties.margin`
 * to group badge-style metadata side-by-side.
 */
export const StatusStrip: ContainerStory = {
  render: () => (
    <ContainerField
      field={{
        id: "status-strip",
        name: "status",
        label: "Status Strip",
        type: "container",
        properties: { padding: "0", margin: "0" },
      }}
    >
      <div className="flex items-center gap-3 flex-wrap">
        <MockBadge label="Verified" variant="success" />
        <MockBadge label="Pending Approval" variant="warning" />
        <MockBadge label="2 Errors" variant="danger" />
        <MockBadge label="Draft" />
      </div>
    </ContainerField>
  ),
};

/**
 * Sidebar layout — a container used as the right-rail column inside a 12-col grid.
 * Demonstrates `col-span` via parent grid on the container itself.
 */
export const SidebarLayout: ContainerStory = {
  render: () => (
    <div className="grid grid-cols-12 gap-6">
      {/* Main content — 8 cols */}
      <div className="col-span-12 md:col-span-8 space-y-4">
        <MockInputField label="Patient Name" />
        <MockInputField label="Date of Birth" placeholder="DD/MM/YYYY" />
        <MockInputField label="National ID" />
      </div>

      {/* Sidebar container — 4 cols */}
      <div className="col-span-12 md:col-span-4">
        <ContainerField
          field={{
            id: "sidebar-container",
            name: "sidebar",
            label: "Sidebar",
            type: "container",
            properties: {},
          }}
        >
          <div className="app-card border border-border p-4 space-y-3">
            <p className="text-[var(--text-xs)] font-bold uppercase tracking-widest text-foreground/40">
              Quick Reference
            </p>
            <MockBadge label="Active Patient" variant="success" />
            <p className="text-[var(--text-sm)] text-foreground/60 leading-relaxed">
              Registration ID:{" "}
              <strong className="text-foreground">PT-00024</strong>
            </p>
            <p className="text-[var(--text-sm)] text-foreground/60">
              Ward: <strong className="text-foreground">General — B4</strong>
            </p>
          </div>
        </ContainerField>
      </div>
    </div>
  ),
};

/** Nested containers — demonstrates recursive nesting for complex layouts */
export const NestedContainers: ContainerStory = {
  render: () => (
    <ContainerField
      field={{
        id: "outer",
        name: "outer",
        label: "Outer Container",
        type: "container",
        properties: {},
      }}
    >
      <div className="space-y-4">
        {/* Row A */}
        <ContainerField
          field={{
            id: "row-a",
            name: "row_a",
            label: "Row A",
            type: "container",
            properties: {},
          }}
        >
          <p className="text-[var(--text-xs)] font-bold uppercase tracking-widest text-foreground/40 mb-2">
            Row A — Identity
          </p>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-4">
              <MockInputField label="Title" placeholder="Dr." />
            </div>
            <div className="col-span-12 md:col-span-8">
              <MockInputField label="Full Name" />
            </div>
          </div>
        </ContainerField>

        {/* Row B */}
        <ContainerField
          field={{
            id: "row-b",
            name: "row_b",
            label: "Row B",
            type: "container",
            properties: {},
          }}
        >
          <p className="text-[var(--text-xs)] font-bold uppercase tracking-widest text-foreground/40 mb-2">
            Row B — Contact
          </p>
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 md:col-span-6">
              <MockInputField label="Phone" placeholder="+91 98765 43210" />
            </div>
            <div className="col-span-12 md:col-span-6">
              <MockInputField
                label="Email"
                placeholder="dr@hospital.com"
                accent
              />
            </div>
          </div>
        </ContainerField>
      </div>
    </ContainerField>
  ),
};

/** Inside a Card — demonstrates the typical Card > Container composition */
export const InsideCard: ContainerStory = {
  render: () => {
    return (
      <FormThemeProvider>
        <div className="min-h-screen bg-subtle p-10 max-w-2xl mx-auto">
          <CardField
            field={{
              id: "card-wrapper",
              name: "card_wrapper",
              type: "card",
              label: "Emergency Contact",
              description:
                "Provide details of a person to contact in case of emergency.",
              properties: { elevation: "md" },
            }}
          >
            <ContainerField
              field={{
                id: "ct-inside",
                name: "ct_inside",
                label: "Interior Container",
                type: "container",
                properties: {},
              }}
            >
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-8">
                  <MockInputField label="Contact Name" />
                </div>
                <div className="col-span-12 md:col-span-4">
                  <MockInputField
                    label="Relationship"
                    placeholder="e.g. Spouse"
                  />
                </div>
                <div className="col-span-12">
                  <MockInputField
                    label="Phone Number"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </ContainerField>
          </CardField>
        </div>
      </FormThemeProvider>
    );
  },
};
