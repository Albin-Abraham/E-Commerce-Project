import type { Meta, StoryObj } from "@storybook/react-vite";

import { ValidationHints } from "./ValidationHints";

const meta: Meta<typeof ValidationHints> = {
  title: "Form/Atoms/ValidationHints",
  component: ValidationHints,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ValidationHints>;

export const SingleHint: Story = {
  args: {
    hints: ["Must be at least 8 characters"],
  },
};

export const MultipleHints: Story = {
  args: {
    hints: [
      "UpperCase letter required",
      "One special character (!@#$)",
      "Minimum 8 characters",
    ],
  },
};
