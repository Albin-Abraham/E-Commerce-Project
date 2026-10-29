import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Lock, Mail } from "lucide-react";

import { FormThemeProvider } from "../context/FormThemeContext";
import { OuterWrapper } from "./OuterWrapper";

const meta: Meta<typeof OuterWrapper> = {
  title: "Form/Structure/OuterWrapper",
  component: OuterWrapper,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <FormThemeProvider>
        <div className="max-w-md mx-auto p-8 bg-background text-foreground space-y-6">
          <Story />
        </div>
      </FormThemeProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof OuterWrapper>;

export const DefaultSurface: Story = {
  args: {
    styles: {
      inputWrapper: "border border-border rounded-lg bg-surface px-3 py-2",
    },
    children: (
      <input
        className="w-full bg-transparent outline-none border-none text-sm text-foreground"
        placeholder="Type to trigger focus-within..."
      />
    ),
  },
};

export const WithStartAndEndSlots: Story = {
  args: {
    styles: {
      inputWrapper: "border border-border rounded-lg bg-surface px-3 py-2 gap-2",
    },
    startContent: <Mail size={16} className="text-muted-foreground" />,
    endContent: <Lock size={16} className="text-muted-foreground" />,
    children: (
      <input
        className="w-full bg-transparent outline-none border-none text-sm text-foreground"
        placeholder="Input with prefix and suffix..."
      />
    ),
  },
};

export const TextareaSurface: Story = {
  args: {
    type: "textarea",
    styles: {
      inputWrapper: "border border-border rounded-lg bg-surface px-3 py-2",
    },
    children: (
      <textarea
        rows={4}
        className="w-full bg-transparent outline-none border-none text-sm text-foreground resize-none"
        placeholder="Multiline text entry surface..."
      />
    ),
  },
};
