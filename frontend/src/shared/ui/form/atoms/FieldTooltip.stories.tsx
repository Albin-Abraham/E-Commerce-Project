import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { FieldTooltip } from "./FieldTooltip";

const meta: Meta<typeof FieldTooltip> = {
  title: "Form/Atoms/FieldTooltip",
  component: FieldTooltip,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="p-16 relative border border-dashed border-border rounded-xl bg-background text-foreground min-h-[140px] flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">Field Label with Contextual Tooltip</span>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FieldTooltip>;

export const Default: Story = {
  args: {
    text: "This is an accessible contextual tooltip.",
  },
};

export const LongText: Story = {
  args: {
    text: "Validation guidance: Must follow enterprise naming conventions and contain at least 8 characters.",
  },
};

export const AlwaysOpenPreview: Story = {
  render: () => (
    <div className="relative inline-flex items-center">
      <div className="relative group">
        <button
          type="button"
          aria-label="More information"
          className="inline-flex items-center justify-center p-0.5 rounded-full text-muted-foreground hover:text-primary transition-colors cursor-help"
        >
          <span className="text-xs font-semibold underline">Hover or inspect open state:</span>
        </button>
        <div
          role="tooltip"
          className="absolute bottom-full left-0 mb-2 w-56 rounded-lg border border-border/80 dark:border-border-strong bg-surface-elevated/98 dark:bg-surface-elevated/98 backdrop-blur-xl text-foreground shadow-xl p-2.5 text-xs font-medium leading-relaxed"
        >
          <span>Contextual tooltip with elevated surface, dark & light theme borders, and high-contrast typography.</span>
          <div
            aria-hidden="true"
            className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-surface-elevated dark:border-t-surface-elevated"
          />
        </div>
      </div>
    </div>
  ),
};

