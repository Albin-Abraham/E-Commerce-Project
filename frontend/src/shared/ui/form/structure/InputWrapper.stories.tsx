import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { FormThemeProvider } from "../context/FormThemeContext";
import { InputWrapper } from "./InputWrapper";

const meta: Meta<typeof InputWrapper> = {
  title: "Form/Structure/InputWrapper",
  component: InputWrapper,
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
type Story = StoryObj<typeof InputWrapper>;

export const TopPlacement: Story = {
  args: {
    label: <span className="font-semibold text-sm">Top Placed Label</span>,
    labelPlacement: "top",
    children: (
      <div className="p-2 rounded border border-border bg-surface text-sm">
        Input control zone
      </div>
    ),
    feedback: (
      <span className="text-xs text-muted-foreground">Helper text below input</span>
    ),
  },
};

export const SidePlacement: Story = {
  args: {
    label: <span className="font-semibold text-sm">Side Placed Label</span>,
    labelPlacement: "side",
    children: (
      <div className="p-2 rounded border border-border bg-surface text-sm">
        Input control zone
      </div>
    ),
    feedback: (
      <span className="text-xs text-muted-foreground">Helper text aligned with control zone</span>
    ),
  },
};

export const InlinePlacement: Story = {
  args: {
    label: <span className="font-semibold text-sm">Inline Setting Label</span>,
    labelPlacement: "inline",
    children: (
      <input
        type="checkbox"
        className="h-4 w-4 rounded accent-primary cursor-pointer"
      />
    ),
  },
};

export const ErrorReservationToggle: Story = {
  render: () => {
    const ErrorToggleDemo = () => {
      const [hasError, setHasError] = useState(false);
      const [reserveSpace, setReserveSpace] = useState(true);

      return (
        <div className="space-y-4">
          <div className="flex gap-4 p-3 bg-muted/20 border border-border rounded-lg text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={hasError}
                onChange={(e) => setHasError(e.target.checked)}
              />
              Toggle Error
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={reserveSpace}
                onChange={(e) => setReserveSpace(e.target.checked)}
              />
              Reserve Error Space
            </label>
          </div>

          <div className="border border-dashed border-border p-4 rounded-xl">
            <InputWrapper
              label={<span className="font-semibold text-sm">Target Field</span>}
              reserveErrorSpace={reserveSpace}
              feedback={
                hasError ? (
                  <span className="text-xs text-danger font-medium">
                    ⚠ Validation failure: Value must be at least 8 characters
                  </span>
                ) : null
              }
            >
              <div className="p-2 rounded border border-border bg-surface text-sm">
                Typing zone
              </div>
            </InputWrapper>
            <div className="mt-2 p-2 bg-muted/30 rounded text-xs text-muted-foreground text-center">
              Next Form Field / Section Element (Watch layout shift when error toggles!)
            </div>
          </div>
        </div>
      );
    };

    return <ErrorToggleDemo />;
  },
};
