import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FormThemeProvider } from "@ui/form/context/FormThemeContext";

import {
  DividerField,
  HeaderField,
  HtmlField,
  ParagraphField,
} from "./StaticFields";

// ─── Shared decorator ──────────────────────────────────────────────────────────
const withTheme = (Story: React.ComponentType) => (
  <FormThemeProvider>
    <div className="max-w-2xl p-8 bg-background min-h-[120px] space-y-4">
      <Story />
    </div>
  </FormThemeProvider>
);

const headerMeta: Meta<typeof HeaderField> = {
  title: "Form/Static/StaticFieldsSuite",
  component: HeaderField,
  tags: ["autodocs"],
  decorators: [withTheme],
  args: {
    field: {
      id: "header-demo",
      name: "header",
      type: "header",
      label: "Section Heading",
      description:
        "Supporting description text that clarifies the section content.",
      meta: { ui: { variant: "h3" } },
    },
  },
};

export default headerMeta;
type Story = StoryObj<typeof HeaderField>;

/** Default — h3 with description */
export const H3Default: Story = {};

/** All six heading levels rendered together */
export const AllHeadingLevels: Story = {
  render: () => (
    <div className="space-y-4">
      {(["h1", "h2", "h3", "h4", "h5", "h6"] as const).map((level) => (
        <HeaderField
          key={level}
          field={{
            id: `hdr-${level}`,
            name: `hdr_${level}`,
            type: "header",
            label: `Heading Level — ${level.toUpperCase()}`,
            description:
              level === "h1"
                ? "Primary page title. Fluid typography via --text-3xl."
                : undefined,
            meta: { ui: { variant: level } },
          }}
        />
      ))}
    </div>
  ),
};

/** Standalone Header without field prop (verifies Phase 1 crash elimination) */
export const StandaloneHeaderWithoutField: Story = {
  render: () => (
    <HeaderField
      label="Autonomous Header without Field Prop"
      description="This demonstrates runtime safety: HeaderField gracefully resolves flat label and description props without crashing."
    />
  ),
};

/** Static Paragraph and HTML Content */
export const ParagraphAndHTML: Story = {
  render: () => (
    <div className="space-y-4">
      <ParagraphField
        field={{
          id: "p1",
          name: "p1",
          type: "paragraph",
          label:
            "Clinical research protocols require rigorous patient confidentiality. All participant records stored within ZenOS are encrypted at rest and anonymized for clinical compliance.",
        }}
      />

      <ParagraphField
        field={{
          id: "p2",
          name: "p2",
          type: "paragraph",
          label:
            "By clicking Submit, you agree to the <strong>ZenOS Data Processing Agreement</strong>. For more information, review the <a href='#' class='text-primary underline'>Security Whitepaper</a>.",
          customData: { html: true },
        }}
      />
    </div>
  ),
};

/** Dividers — Plain and Labelled */
export const DividersShowcase: Story = {
  render: () => (
    <div className="space-y-6">
      <p className="text-sm text-foreground/70">Top section fields...</p>
      <DividerField
        field={{ id: "div1", name: "div1", type: "divider", label: "" }}
      />
      <p className="text-sm text-foreground/70">Middle section fields...</p>
      <DividerField
        field={{
          id: "div2",
          name: "div2",
          type: "divider",
          label: "OR ENTER DIRECT IDENTIFIER",
        }}
      />
      <p className="text-sm text-foreground/70">Bottom section fields...</p>
    </div>
  ),
};

/** HTML Field Block */
export const RawHtmlBlock: Story = {
  render: () => (
    <HtmlField
      field={{
        id: "html-block",
        name: "htmlBlock",
        type: "html",
        initialValue: `
          <div class="p-4 rounded-lg bg-primary/10 border border-primary/20 text-primary">
            <h4 class="font-bold text-sm">Automated Audit Notice</h4>
            <p class="text-xs mt-1">This form submission is subject to HIPAA/GDPR validation checks upon submission.</p>
          </div>
        `,
      }}
    />
  ),
};
