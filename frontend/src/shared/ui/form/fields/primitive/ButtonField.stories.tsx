import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { FormRuntimeDecorator } from "../../stories/storybook-decorators";
import { FormButtonField } from "../wrapped-fields";

const meta: Meta<typeof FormButtonField> = {
  title: "Form/Fields/ButtonField",
  component: FormButtonField,
  tags: ["autodocs"],
  decorators: [FormRuntimeDecorator],
  args: {
    onClick: fn(),
    field: {
      id: "action_submit",
      name: "actionSubmit",
      type: "button",
      label: "Confirm & Deploy",
      properties: {
        variant: "solid",
        color: "primary",
      },
    },
    value: "Confirm & Deploy",
  },
};

export default meta;
type Story = StoryObj<typeof FormButtonField>;

export const PrimaryAction: Story = {};

export const SecondaryVariant: Story = {
  args: {
    field: {
      id: "action_cancel",
      name: "actionCancel",
      type: "button",
      label: "Discard Draft",
      properties: {
        variant: "bordered",
        color: "default",
      },
    },
    value: "Discard Draft",
  },
};

export const DisabledButton: Story = {
  args: {
    field: {
      id: "action_disabled",
      name: "actionDisabled",
      type: "button",
      label: "Requires Admin Role",
      properties: {
        variant: "flat",
      },
    },
    layout: {
      disabled: true,
    },
    value: "Requires Admin Role",
  },
};

export const InteractiveClickAction: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: /confirm & deploy/i });

    await step("Click action button", async () => {
      await userEvent.click(button);
      expect(button).toBeEnabled();
    });
  },
};

export const CanonicalFlatProps: Story = {
  args: {
    name: "submitPayment",
    type: "button",
    component: "ButtonField",
    id: "submitPayment",
    label: "Process Secure Payment",
    disabled: false,
  } as any,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole("button", { name: /Process Secure Payment/i });
    await expect(button).toBeInTheDocument();
    await userEvent.click(button);
  },
};

export const LoadingState: Story = {
  args: {
    field: {
      id: "action_loading",
      name: "actionLoading",
      type: "button",
      label: "Provisioning Cluster...",
      properties: {
        variant: "solid",
        color: "primary",
        isLoading: true,
      },
    },
    value: "Provisioning Cluster...",
  },
};

export const AllVariantsShowcase: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center p-4 rounded-2xl bg-surface/40 border border-border/60">
      <FormButtonField
        label="Solid Primary"
        field={{ id: "b1", name: "b1", type: "button", properties: { variant: "solid", color: "primary" } }}
      />
      <FormButtonField
        label="Outline / Bordered"
        field={{ id: "b2", name: "b2", type: "button", properties: { variant: "bordered", color: "primary" } }}
      />
      <FormButtonField
        label="Soft / Flat"
        field={{ id: "b3", name: "b3", type: "button", properties: { variant: "flat", color: "primary" } }}
      />
      <FormButtonField
        label="Ghost Action"
        field={{ id: "b4", name: "b4", type: "button", properties: { variant: "ghost" } }}
      />
      <FormButtonField
        label="Destructive Danger"
        field={{ id: "b5", name: "b5", type: "button", properties: { variant: "solid", color: "danger" } }}
      />
      <FormButtonField
        label="Success Solid"
        field={{ id: "b6", name: "b6", type: "button", properties: { variant: "solid", color: "success" } }}
      />
      <FormButtonField
        label="Shadow Glow"
        field={{ id: "b7", name: "b7", type: "button", properties: { variant: "shadow", color: "primary" } }}
      />
    </div>
  ),
};

export const SizesShowcase: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4 items-center p-4 rounded-2xl bg-surface/40 border border-border/60">
      <FormButtonField
        label="Small (sm)"
        field={{ id: "sz1", name: "sz1", type: "button", properties: { size: "sm", color: "primary" } }}
      />
      <FormButtonField
        label="Medium (md)"
        field={{ id: "sz2", name: "sz2", type: "button", properties: { size: "md", color: "primary" } }}
      />
      <FormButtonField
        label="Large (lg)"
        field={{ id: "sz3", name: "sz3", type: "button", properties: { size: "lg", color: "primary" } }}
      />
    </div>
  ),
};


