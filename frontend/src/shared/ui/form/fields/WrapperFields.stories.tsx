import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Form } from "../Form";
import { FormThemeProvider } from "../context/FormThemeContext";
import { FieldShell } from "../structure/FieldShell";
import { ControlledField, Field, UncontrolledField } from "./WrapperFields";
import { FormTextField } from "./wrapped-fields";
import type { FormDefinition } from "../types";

const demoDefinition: FormDefinition = {
  id: "integration-demo",
  title: "Integration Demo",
  sections: [
    {
      id: "general-sec",
      title: "General Information",
      fields: [
        {
          id: "email",
          name: "email",
          type: "text",
          label: "Email Address",
          validation: { rules: [{ type: "required" }] },
        },
        {
          id: "rating",
          name: "rating",
          type: "number",
          label: "Performance Rating (1-10)",
        },
        {
          id: "notes",
          name: "notes",
          type: "text",
          label: "Operational Notes",
        },
      ],
    },
  ],
};

const meta: Meta = {
  title: "Form/Integration/WrapperFieldsSuite",
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
type Story = StoryObj;

/**
 * ControlledFieldFocusStability:
 * Live verification that typing in an inline render prop maintains continuous
 * input focus and cursor position without remounting the DOM tree (P0 fix verification).
 */
export const ControlledFieldFocusStability: Story = {
  render: () => {
    const InteractiveDemo = () => {
      const [keystrokeCount, setKeystrokeCount] = useState(0);

      return (
        <div className="space-y-4">
          <div className="p-3 bg-muted/20 border border-border rounded-lg text-xs flex justify-between items-center">
            <span className="font-semibold text-primary">Live Focus Stability Monitor</span>
            <span className="font-mono text-muted-foreground">Keystrokes: {keystrokeCount}</span>
          </div>

          <Form definition={demoDefinition}>
            <ControlledField
              name="notes"
              label="Live Monitored Controlled Input"
              render={({ value, onChange }) => (
                <input
                  className="w-full bg-transparent outline-none border-none py-1.5 px-2 text-foreground font-medium"
                  placeholder="Type continuously here — watch cursor & focus stay locked!"
                  value={value || ""}
                  onChange={(e) => {
                    setKeystrokeCount((c) => c + 1);
                    onChange(e.target.value);
                  }}
                />
              )}
            />
          </Form>
        </div>
      );
    };

    return <InteractiveDemo />;
  },
};

/**
 * UncontrolledFieldBinding:
 * Micro-subscription schema-driven uncontrolled field updating form state.
 */
export const UncontrolledFieldBinding: Story = {
  render: () => (
    <Form definition={demoDefinition}>
      <UncontrolledField
        name="email"
        placeholder="developer@zenos.io"
      />
    </Form>
  ),
};

/**
 * NestedCompositionAntiDoubleWrap:
 * Visually confirms that composing a pre-wrapped field (FormTextField) inside
 * a FieldShell respects the FieldCompositionMode contract and renders exactly
 * ONE etched surface and ONE label.
 */
export const NestedCompositionAntiDoubleWrap: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg text-xs text-primary font-medium">
        Contract Verification: FieldShell + FormTextField inside produces exactly 1 label and 1 surface border.
      </div>

      <FieldShell name="nestedUser" label="Canonical Outer Label">
        <FormTextField
          name="nestedUser"
          placeholder="Inner wrapped field automatically honors managed mode"
        />
      </FieldShell>
    </div>
  ),
};

/**
 * UnifiedFieldSmartSwitching:
 * Demonstrating seamless delegation between controlled and uncontrolled modes.
 */
export const UnifiedFieldSmartSwitching: Story = {
  render: () => (
    <Form definition={demoDefinition}>
      <div className="space-y-6">
        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
          Mode A: Uncontrolled Schema Mode
        </p>
        <Field name="email" />

        <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold pt-4">
          Mode B: Controlled Custom Slider Mode
        </p>
        <Field
          name="rating"
          label="Interactive Custom Rating"
          render={({ value, onChange }) => (
            <div className="flex items-center gap-4 py-1">
              <input
                type="range"
                min="1"
                max="10"
                value={value || 5}
                onChange={(e) => onChange(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
              <span className="font-mono text-sm font-bold text-primary min-w-[2rem] text-right">
                {value || 5} / 10
              </span>
            </div>
          )}
        />
      </div>
    </Form>
  ),
};
