import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Building2, Sparkles } from "lucide-react";

import { LayoutProvider } from "../context/LayoutContext";
import { FormHeader } from "./FormHeader";

const demoDefinition = {
  id: "header-demo-form",
  title: "Organization Profile Setup",
  description: "Configure core entity identifiers, global tax nexus, and regulatory contact points.",
  version: "1.0.0",
};

const meta: Meta<typeof FormHeader> = {
  title: "Form/Shell & Feedback/FormHeader",
  component: FormHeader,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <LayoutProvider>
        <div className="w-full max-w-2xl bg-surface border border-border rounded-2xl p-6 shadow-sm">
          <Story />
        </div>
      </LayoutProvider>
    ),
  ],
  args: {
    definition: demoDefinition,
  },
};

export default meta;
type Story = StoryObj<typeof FormHeader>;

export const Default: Story = {};

export const WithPrefixIcon: Story = {
  args: {
    prefix: (
      <div className="p-3 bg-primary/10 rounded-xl text-primary flex items-center justify-center">
        <Building2 size={24} />
      </div>
    ),
  },
};

export const WithCustomActionSlots: Story = {
  args: {
    children: (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/10 text-success">
          <Sparkles size={12} /> Verified Tenant
        </span>
      </div>
    ),
  },
};
