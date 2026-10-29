import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sparkles } from "lucide-react";

import { Form } from "../../Form";
import type { FormDefinition } from "../../types";

const CustomBannerSlot = () => (
  <div className="w-full p-4 rounded-xl bg-gradient-to-r from-primary/10 via-accent/10 to-transparent border border-primary/20 flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-primary/20 rounded-lg text-primary">
        <Sparkles size={20} />
      </div>
      <div>
        <h4 className="text-sm font-bold text-foreground">Custom Injected Slot</h4>
        <p className="text-xs text-muted">This React component is injected directly via SlotField.</p>
      </div>
    </div>
    <button
      type="button"
      className="px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg shadow-sm hover:bg-primary/90 transition-colors"
      onClick={() => alert("Slot CTA clicked!")}
    >
      Action
    </button>
  </div>
);

const slotDemoForm: FormDefinition = {
  id: "slot-demo",
  title: "Slot Field Injection",
  description: "Demonstrates custom React component injection into the form layout pipeline.",
  sections: [
    {
      id: "main-section",
      title: "Content",
      fields: [
        {
          id: "custom-banner-slot",
          name: "bannerSlot",
          type: "slot",
          label: "Injected Slot",
          meta: {
            ui: {
              component: CustomBannerSlot,
            },
          },
        },
        {
          id: "user-note",
          name: "note",
          type: "text",
          label: "Associated Form Input",
          initialValue: "Standard form input alongside custom slot",
        },
      ],
    },
  ],
};

const meta: Meta<typeof Form> = {
  title: "Form/Structure/SlotField",
  component: Form,
  tags: ["autodocs"],
  args: {
    definition: slotDemoForm,
  },
};

export default meta;
type Story = StoryObj<typeof Form>;

export const Default: Story = {};
