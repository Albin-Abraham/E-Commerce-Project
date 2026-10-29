import type { Meta, StoryObj } from "@storybook/react-vite";
import { FormThemeProvider } from "@ui/form/context/FormThemeContext";

import { DividerField, ParagraphField } from "./StaticFields";

const withTheme = (Story: React.ComponentType) => (
  <FormThemeProvider>
    <div className="max-w-2xl p-8 bg-background space-y-4">
      <Story />
    </div>
  </FormThemeProvider>
);

// ─────────────────────────────────────────────────────────────────────────────
//  ParagraphField
// ─────────────────────────────────────────────────────────────────────────────

const paragraphMeta: Meta<typeof ParagraphField> = {
  title: "Form/Static & Identity/ParagraphField",
  component: ParagraphField,
  tags: ["autodocs"],
  decorators: [withTheme],
  args: {
    field: {
      id: "para-demo",
      name: "para",
      type: "paragraph",
      label:
        "All personal information is collected in accordance with our Privacy Policy and will not be shared with third parties without explicit consent.",
    },
  },
};

export default paragraphMeta;
type ParaStory = StoryObj<typeof ParagraphField>;

/** Default — plain text paragraph */
export const Default: ParaStory = {};

/** Long text — wrapping and line height */
export const LongText: ParaStory = {
  args: {
    field: {
      id: "para-long",
      name: "para_long",
      type: "paragraph",
      label:
        "This multi-step form will guide you through registering your organization's clinical trial data. Each section must be completed before proceeding to the next. Incomplete records cannot be submitted and will be saved as drafts. Please ensure all required fields (*) are filled out accurately as submitted data is used for regulatory reporting.",
    },
  },
};

/** HTML mode — renders rich content safely via dangerouslySetInnerHTML */
export const HTMLContent: ParaStory = {
  args: {
    field: {
      id: "para-html",
      name: "para_html",
      type: "paragraph",
      label:
        "By submitting, you agree to our <strong>Terms of Service</strong> and confirm that all information provided is <em>accurate and complete</em>. Visit <a href='#' class='text-primary underline'>our policy page</a> for details.",
      customData: { html: true },
    },
  },
};

/** Custom text color override via styles */
export const WarningText: ParaStory = {
  args: {
    field: {
      id: "para-warn",
      name: "para_warn",
      type: "paragraph",
      label:
        "⚠ This action cannot be undone. All associated records will be permanently deleted from the system.",
    },
    styles: {
      wrapper: "text-warning",
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
//  DividerField
// ─────────────────────────────────────────────────────────────────────────────

// DividerField stories are co-located here but use paragraphMeta properties
// or inline overrides. The individual dividerMeta is unused as a default export.

// Separate export block for DividerField stories — Storybook requires a single default export per file
// These are co-located in ParagraphField.stories.tsx for organizational convenience.
// You can split them out if preferred.
export const PlainDivider: ParaStory = {
  render: () => (
    <FormThemeProvider>
      <div className="max-w-2xl p-8 bg-background">
        <p className="text-foreground/70 mb-2">Content above the divider</p>
        <DividerField
          field={{ id: "div-plain", name: "div", type: "divider", label: "" }}
          layout={{}}
        />
        <p className="text-foreground/70 mt-2">Content below the divider</p>
      </div>
    </FormThemeProvider>
  ),
};

export const LabelledDivider: ParaStory = {
  render: () => (
    <FormThemeProvider>
      <div className="max-w-2xl p-8 bg-background">
        <p className="text-foreground/70 mb-2">Personal Details</p>
        <DividerField
          field={{
            id: "div-label",
            name: "div_label",
            type: "divider",
            label: "OR continue with",
          }}
          layout={{}}
        />
        <p className="text-foreground/70 mt-2">Alternative login methods</p>
      </div>
    </FormThemeProvider>
  ),
};

export const SequentialDividers: ParaStory = {
  render: () => (
    <FormThemeProvider>
      <div className="max-w-2xl p-8 bg-background space-y-0">
        <p className="text-foreground/80 font-semibold py-2">
          Section A — Primary Fields
        </p>
        <DividerField
          field={{ id: "d1", name: "d1", type: "divider", label: "" }}
          layout={{}}
        />
        <p className="text-foreground/80 font-semibold py-2">
          Section B — Secondary Fields
        </p>
        <DividerField
          field={{ id: "d2", name: "d2", type: "divider", label: "Advanced" }}
          layout={{}}
        />
        <p className="text-foreground/80 font-semibold py-2">
          Section C — Advanced Configuration
        </p>
      </div>
    </FormThemeProvider>
  ),
};
