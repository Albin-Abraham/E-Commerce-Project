import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Mail, Search } from "lucide-react";

import { FormThemeProvider } from "../context/FormThemeContext";
import { FieldShell } from "./FieldShell";

const meta: Meta<typeof FieldShell> = {
  title: "Form/Structure/FieldShell",
  component: FieldShell,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <FormThemeProvider>
        <div className="max-w-xl mx-auto p-8 bg-background text-foreground space-y-6">
          <Story />
        </div>
      </FormThemeProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FieldShell>;

export const TopLabelDefault: Story = {
  args: {
    name: "username",
    label: "Username",
    required: true,
    labelPlacement: "top",
    placeholder: "Enter username...",
    children: (
      <input
        className="w-full bg-transparent outline-none border-none py-1.5 px-2 text-foreground"
        placeholder="Enter username..."
      />
    ),
  },
};

export const SideLabelLayout: Story = {
  args: {
    name: "organization",
    label: "Organization Name",
    required: true,
    labelPlacement: "side",
    children: (
      <input
        className="w-full bg-transparent outline-none border-none py-1.5 px-2 text-foreground"
        placeholder="Acme Health Inc."
      />
    ),
  },
};

export const InlineLabelLayout: Story = {
  args: {
    name: "notifications",
    label: "Enable Email Alerts",
    labelPlacement: "inline",
    wrapOuter: false,
    children: (
      <input
        type="checkbox"
        className="h-5 w-5 rounded border-border accent-primary cursor-pointer"
      />
    ),
  },
};

export const HiddenLabelAccessibility: Story = {
  args: {
    name: "search",
    label: "Quick Search",
    labelPlacement: "hidden",
    startContent: <Search size={16} className="text-muted-foreground ml-2" />,
    children: (
      <input
        className="w-full bg-transparent outline-none border-none py-1.5 px-2 text-foreground"
        placeholder="Search documents or patients..."
      />
    ),
  },
};

export const ErrorStateWithReservation: Story = {
  args: {
    name: "email",
    label: "Work Email",
    required: true,
    error: true,
    errorMessage: "A valid corporate email address is required (e.g. user@zenith.com)",
    reserveErrorSpace: true,
    startContent: <Mail size={16} className="text-muted-foreground ml-2" />,
    children: (
      <input
        className="w-full bg-transparent outline-none border-none py-1.5 px-2 text-foreground"
        defaultValue="invalid-email"
      />
    ),
  },
};

export const DensityPermutations: Story = {
  render: () => (
    <div className="space-y-6">
      <FieldShell
        name="compactField"
        label="Compact Density"
        density="compact"
      >
        <input
          className="w-full bg-transparent outline-none border-none py-1 px-2 text-xs text-foreground"
          placeholder="Compact density input..."
        />
      </FieldShell>

      <FieldShell
        name="comfortableField"
        label="Comfortable Density (Default)"
        density="comfortable"
      >
        <input
          className="w-full bg-transparent outline-none border-none py-2 px-3 text-sm text-foreground"
          placeholder="Comfortable density input..."
        />
      </FieldShell>

      <FieldShell
        name="spaciousField"
        label="Spacious Density"
        density="spacious"
      >
        <input
          className="w-full bg-transparent outline-none border-none py-3 px-4 text-base text-foreground"
          placeholder="Spacious density input..."
        />
      </FieldShell>
    </div>
  ),
};
