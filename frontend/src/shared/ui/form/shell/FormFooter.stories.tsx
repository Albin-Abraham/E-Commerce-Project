import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { ActionProvider } from "../context/ActionContext";
import { FormOrchestratorProvider } from "../context/FormOrchestratorContext";
import { LayoutProvider } from "../context/LayoutContext";
import { FormFooter } from "./FormFooter";

const demoDefinition = {
  id: "footer-demo-form",
  title: "Demo",
  submitLabel: "Save & Deploy",
  cancelLabel: "Discard Changes",
};

const mockForm = {
  flow: {
    getNextStep: () => null,
    isLastStep: () => true,
  },
};

const meta: Meta<typeof FormFooter> = {
  title: "Form/Shell & Feedback/FormFooter",
  component: FormFooter,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <FormOrchestratorProvider value={{ mode: "edit" } as any}>
        <ActionProvider>
          <LayoutProvider>
            <div className="w-full max-w-2xl bg-surface border border-border rounded-2xl p-6 shadow-sm">
              <Story />
            </div>
          </LayoutProvider>
        </ActionProvider>
      </FormOrchestratorProvider>
    ),
  ],
  args: {
    definition: demoDefinition,
    form: mockForm,
  },
};

export default meta;
type Story = StoryObj<typeof FormFooter>;

export const DefaultActions: Story = {};

export const SubmittingState: Story = {
  args: {
    isSubmitting: true,
  },
};

export const WithSecondaryActions: Story = {
  args: {
    secondaryActions: (
      <button
        type="button"
        className="px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground border border-border rounded-lg"
        onClick={() => alert("Save Draft clicked")}
      >
        Save as Draft
      </button>
    ),
  },
};
