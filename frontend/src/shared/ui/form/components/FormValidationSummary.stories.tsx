import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { FormValidationSummary } from "./FormValidationSummary";

const meta: Meta<typeof FormValidationSummary> = {
  title: "Form/Shell & Feedback/FormValidationSummary",
  component: FormValidationSummary,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof FormValidationSummary>;

export const ActiveValidationErrors: Story = {
  args: {
    valid: false,
    touched: true,
  },
};

export const PristineUntouched: Story = {
  args: {
    valid: false,
    touched: false,
  },
};

export const AllFieldsValid: Story = {
  args: {
    valid: true,
    touched: true,
  },
};
