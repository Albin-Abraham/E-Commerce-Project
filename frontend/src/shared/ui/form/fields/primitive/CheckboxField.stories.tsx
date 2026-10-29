import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { FormRuntimeDecorator } from "../../stories/storybook-decorators";
import { FormCheckboxField } from "../wrapped-fields";

const meta: Meta<typeof FormCheckboxField> = {
  title: "Form/Fields/CheckboxField",
  component: FormCheckboxField,
  tags: ["autodocs"],
  decorators: [FormRuntimeDecorator],
  args: {
    onChange: fn(),
    field: {
      id: "remember_me",
      name: "rememberMe",
      type: "checkbox",
      label: "Remember this device for 30 days",
    },
    value: true,
  },
};

export default meta;
type Story = StoryObj<typeof FormCheckboxField>;

export const Default: Story = {};

export const Unchecked: Story = {
  args: {
    value: false,
  },
};

export const RequiredConsentWithError: Story = {
  args: {
    field: {
      id: "gdpr_consent",
      name: "gdprConsent",
      type: "checkbox",
      label: "I consent to data processing under GDPR regulations",
      required: true,
    },
    value: false,
    error: true,
    errorMessage: "Explicit consent is required to create your account.",
  },
};

export const InteractiveCheckbox: Story = {
  args: {
    field: {
      id: "newsletter_consent",
      name: "newsletterConsent",
      type: "checkbox",
      label: "Subscribe to our developer release newsletter",
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
    name: "termsConsent",
    type: "checkbox",
    component: "CheckboxField",
    id: "termsConsent",
    label: "I agree to the Terms of Service & Privacy Policy",
    value: false,
    required: true,
  } as any,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const checkbox = canvas.getByRole("checkbox");
    await expect(checkbox).toBeInTheDocument();
    await expect(checkbox).toHaveAttribute("name", "termsConsent");
    await expect(checkbox).toHaveAttribute("data-field-type", "checkbox");
    await expect(checkbox).toHaveAttribute("data-field-component", "CheckboxField");
    await expect(checkbox).not.toBeChecked();

    await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();
  },
};

export const WithDescription: Story = {
  args: {
    field: {
      id: "analytics_telemetry",
      name: "analyticsTelemetry",
      type: "checkbox",
      label: "Allow Automated Performance Telemetry",
      properties: {
        description: "Sends anonymized latency logs and crash traces to help us continuously optimize cluster responsiveness.",
      },
    },
    value: true,
  },
};

export const IndeterminateState: Story = {
  args: {
    field: {
      id: "select_all_instances",
      name: "selectAllInstances",
      type: "checkbox",
      label: "Select All Kubernetes Pods",
      properties: {
        description: "12 of 24 pods currently selected across us-east and eu-central regions.",
        indeterminate: true,
      },
    },
    value: false,
  },
};

export const CardVariantShowcase: Story = {
  args: {
    field: {
      id: "premium_addon",
      name: "premiumAddon",
      type: "checkbox",
      label: "Enable Enterprise Zero-Trust Mesh",
      properties: {
        variant: "card",
        description: "Installs mTLS sidecars on every container service with automated 24-hour certificate rotation.",
      },
    },
    value: true,
  },
};

