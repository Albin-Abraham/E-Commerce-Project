import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { LayoutProvider } from "../context/LayoutContext";
import { FormStepper } from "./FormStepper";

const wizardDefinition = {
  id: "wizard-stepper-demo",
  title: "Multi-Step Onboarding",
  settings: {
    wizard: {
      enabled: true,
      linear: true,
    },
  },
  sections: [
    {
      id: "step-account",
      title: "Account Details",
      description: "Setup your email and master credentials",
    },
    {
      id: "step-organization",
      title: "Organization Profile",
      description: "Company domain and billing preferences",
    },
    {
      id: "step-compliance",
      title: "Security & Compliance",
      description: "Select audit standards (SOC2, HIPAA)",
    },
    {
      id: "step-review",
      title: "Review & Provision",
      description: "Confirm parameters and initialize instance",
    },
  ],
};

const meta: Meta<typeof FormStepper> = {
  title: "Form/Shell & Feedback/FormStepper",
  component: FormStepper,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <LayoutProvider mode="wizard">
        <div className="w-full max-w-2xl bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <Story />
        </div>
      </LayoutProvider>
    ),
  ],
  args: {
    definition: wizardDefinition as any,
    type: "top",
  },
};

export default meta;
type Story = StoryObj<typeof FormStepper>;

export const TopBarStepper: Story = {
  args: {
    type: "top",
  },
};

export const SidebarStepper: Story = {
  args: {
    type: "sidebar",
  },
  decorators: [
    (Story) => (
      <LayoutProvider mode="wizard">
        <div className="w-72 bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <Story />
        </div>
      </LayoutProvider>
    ),
  ],
};
