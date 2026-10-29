import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { FormRuntimeDecorator } from "../../stories/storybook-decorators";
import { FormPhoneField } from "../wrapped-fields";

const meta: Meta<typeof FormPhoneField> = {
  title: "Form/Fields/PhoneField",
  component: FormPhoneField,
  tags: ["autodocs"],
  decorators: [FormRuntimeDecorator],
  args: {
    onChange: fn(),
    field: {
      id: "emergency_phone",
      name: "emergencyPhone",
      type: "phone",
      label: "Direct Contact Phone",
      required: true,
      meta: { ui: { icon: "phone" } },
    },
    layout: {
      placeholder: "415 555 2671",
    },
    value: "+1 415 555 2671",
  },
};

export default meta;
type Story = StoryObj<typeof FormPhoneField>;

export const Default: Story = {};

export const InternationalFormat: Story = {
  args: {
    field: {
      id: "intl_support",
      name: "intlSupport",
      type: "phone",
      label: "EMEA Regional Support Line",
      required: true,
    },
    value: "+44 20 7946 0991",
  },
};

export const WithErrorFeedback: Story = {
  args: {
    field: {
      id: "security_sms",
      name: "securitySms",
      type: "phone",
      label: "2FA SMS Phone Number",
      required: true,
    },
    value: "+1 123",
    error: true,
    errorMessage: "Please enter a complete 10-digit phone number for two-factor authentication.",
  },
};

export const ReadOnlyState: Story = {
  args: {
    field: {
      id: "verified_mobile",
      name: "verifiedMobile",
      type: "phone",
      label: "Verified Recovery Phone",
    },
    value: "+1 650 555 0199",
    layout: {
      readOnly: true,
    },
  },
};

export const InteractivePhoneInput: Story = {
  args: {
    value: "",
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const telInput = canvas.getByRole("textbox");
    const countrySelect = canvas.getByRole("combobox");

    await step("Enter phone number", async () => {
      await userEvent.type(telInput, "4155552671");
      expect(telInput).toHaveValue("4155552671");
    });

    await step("Change country code to UK (+44)", async () => {
      await userEvent.selectOptions(countrySelect, "+44");
      expect(countrySelect).toHaveValue("+44");
    });
  },
};

export const CanonicalFlatProps: Story = {
  args: {
    name: "contactPhone",
    type: "phone",
    component: "PhoneField",
    id: "contactPhone",
    label: "Primary Contact Phone",
    placeholder: "555 123 4567",
    value: "+1 555 123 4567",
    required: true,
  } as any,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const telInput = canvas.getByRole("textbox");
    await expect(telInput).toBeInTheDocument();
    await expect(telInput).toHaveAttribute("name", "contactPhone");
    await expect(telInput).toHaveAttribute("data-field-type", "phone");
    await expect(telInput).toHaveAttribute("data-field-component", "PhoneField");
  },
};


