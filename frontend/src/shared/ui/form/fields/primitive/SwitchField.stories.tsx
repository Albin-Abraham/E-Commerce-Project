import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { FormRuntimeDecorator } from "../../stories/storybook-decorators";
import { FormSwitchField } from "../wrapped-fields";

const meta: Meta<typeof FormSwitchField> = {
  title: "Form/Fields/SwitchField",
  component: FormSwitchField,
  tags: ["autodocs"],
  decorators: [FormRuntimeDecorator],
  args: {
    onChange: fn(),
    field: {
      id: "notifications_toggle",
      name: "notificationsEnabled",
      type: "switch",
      label: "Enable Push Notifications",
      properties: {
        description: "Receive instant mobile and email alerts for critical system updates.",
      },
    },
    value: true,
  },
};

export default meta;
type Story = StoryObj<typeof FormSwitchField>;

export const Default: Story = {};

export const TurnedOff: Story = {
  args: {
    value: false,
  },
};

export const WithError: Story = {
  args: {
    field: {
      id: "terms_agreement",
      name: "termsAgreed",
      type: "switch",
      label: "I accept the Master Service Agreement",
      required: true,
    },
    value: false,
    error: true,
    errorMessage: "You must accept the terms before proceeding.",
  },
};

export const InteractiveToggle: Story = {
  args: {
    field: {
      id: "live_sync_toggle",
      name: "liveSync",
      type: "switch",
      label: "Real-time Database Synchronization",
      properties: {
        description: "Toggle automatic background sync with cloud storage.",
      },
    },
    value: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox");
    await expect(checkbox).not.toBeChecked();

    await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();

    await userEvent.click(checkbox);
    await expect(checkbox).not.toBeChecked();
  },
};

export const CanonicalFlatProps: Story = {
  args: {
    name: "twoFactorAuth",
    type: "switch",
    component: "SwitchField",
    id: "twoFactorAuth",
    label: "Two-Factor Authentication",
    description: "Require security key or authenticator app upon login",
    value: false,
    required: true,
  } as any,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = canvas.getByRole("checkbox");
    await expect(toggle).toBeInTheDocument();
    await expect(toggle).toHaveAttribute("name", "twoFactorAuth");
    await expect(toggle).toHaveAttribute("data-field-type", "switch");
    await expect(toggle).toHaveAttribute("data-field-component", "SwitchField");
    await expect(toggle).not.toBeChecked();

    await userEvent.click(toggle);
    await expect(toggle).toBeChecked();
  },
};

export const CardVariantShowcase: Story = {
  args: {
    field: {
      id: "auto_scaling_guard",
      name: "autoScalingGuard",
      type: "switch",
      label: "Automated Pod Autoscaling (HPA)",
      properties: {
        variant: "card",
        description: "Dynamically spins up additional worker containers when CPU threshold exceeds 75%.",
      },
    },
    value: true,
  },
};

export const SizesShowcase: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4 rounded-2xl bg-surface/40 border border-border/60 max-w-md">
      <FormSwitchField
        label="Small Switch (sm)"
        field={{ id: "sw1", name: "sw1", type: "switch", properties: { size: "sm" } }}
        value={true}
      />
      <FormSwitchField
        label="Medium Switch (md - Default)"
        field={{ id: "sw2", name: "sw2", type: "switch", properties: { size: "md" } }}
        value={true}
      />
      <FormSwitchField
        label="Large Switch (lg)"
        field={{ id: "sw3", name: "sw3", type: "switch", properties: { size: "lg" } }}
        value={true}
      />
    </div>
  ),
};

export const SingleLineNoOverlay: Story = {
  args: {
    field: {
      id: "no_overlay_toggle",
      name: "noOverlayToggle",
      type: "switch",
      label: "Short Single Line Setting",
    },
    value: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText("Short Single Line Setting");
    await expect(label).toBeInTheDocument();
    const toggle = canvas.getByRole("checkbox");
    await expect(toggle).toBeChecked();
  },
};


