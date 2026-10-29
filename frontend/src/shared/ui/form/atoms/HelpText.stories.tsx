import type { Meta, StoryObj } from "@storybook/react-vite";

import { HelpText } from "./HelpText";

const meta: Meta<typeof HelpText> = {
  title: "Form/Atoms/HelpText",
  component: HelpText,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="p-12 flex items-center gap-2">
        <span className="text-sm font-medium">Field Label</span>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof HelpText>;

export const SingleLine: Story = {
  args: {
    text: "This is a single line of help text.",
  },
};

export const MultiLine: Story = {
  args: {
    text: [
      "First line of hint.",
      "Second line explaining more details.",
      "Third line for final guidance.",
    ],
  },
};

export const AlwaysOpenHelp: Story = {
  render: () => (
    <div className="relative inline-flex items-center">
      <div className="relative">
        <span className="text-xs font-semibold text-muted-foreground">Always Open Multi-Line Tooltip:</span>
        <div
          role="tooltip"
          className="absolute bottom-full left-0 mb-2 w-64 rounded-lg border border-border/80 dark:border-border-strong bg-surface-elevated/98 dark:bg-surface-elevated/98 backdrop-blur-xl text-foreground shadow-xl p-2.5 text-xs font-medium leading-relaxed"
        >
          <ul className="list-disc pl-4 space-y-1">
            <li>Light mode: clean white elevated surface with subtle border.</li>
            <li>Dark mode: deep charcoal elevated surface with crisp border.</li>
            <li>Zero blinding white popup in dark mode.</li>
          </ul>
          <div
            aria-hidden="true"
            className="absolute top-full left-6 -mt-1 border-4 border-transparent border-t-surface-elevated dark:border-t-surface-elevated"
          />
        </div>
      </div>
    </div>
  ),
};

