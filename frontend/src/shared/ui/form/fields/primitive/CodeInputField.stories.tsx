import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { FormRuntimeDecorator } from "../../stories/storybook-decorators";
import { FormCodeInputField } from "../wrapped-fields";
import { CodeInputField } from "./CodeInputField";

const meta: Meta<typeof FormCodeInputField> = {
  title: "Form/Fields/CodeInputField",
  component: FormCodeInputField,
  tags: ["autodocs"],
  decorators: [FormRuntimeDecorator],
  args: {
    onChange: fn(),
    field: {
      id: "two_factor_code",
      name: "otpCode",
      type: "code-input",
      label: "Two-Factor Verification Code",
      required: true,
      properties: {
        length: 6,
      },
    },
    value: "482910",
  },
};

export default meta;
type Story = StoryObj<typeof FormCodeInputField>;

export const SixDigitOTP: Story = {};

export const FourDigitPIN: Story = {
  args: {
    field: {
      id: "quick_pin",
      name: "pinCode",
      type: "code-input",
      label: "Master Vault PIN",
      required: true,
      properties: {
        length: 4,
      },
    },
    value: "7193",
  },
};

export const EmptyState: Story = {
  args: {
    field: {
      id: "fresh_code",
      name: "freshCode",
      type: "code-input",
      label: "Enter Verification Code Sent to Email",
      required: true,
      properties: {
        length: 6,
      },
    },
    value: "",
  },
};

export const WithErrorFeedback: Story = {
  args: {
    field: {
      id: "expired_code",
      name: "expiredCode",
      type: "code-input",
      label: "Authenticator Code",
      required: true,
      properties: {
        length: 6,
      },
    },
    value: "000000",
    error: true,
    errorMessage: "The verification code entered has expired or is invalid. Please request a new code.",
  },
};

export const InteractiveOTP: Story = {
  args: {
    value: "",
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const inputs = canvas.getAllByRole("textbox");
    expect(inputs).toHaveLength(6);

    await step("Enter first 3 digits of OTP", async () => {
      await userEvent.type(inputs[0], "1");
      expect(inputs[0]).toHaveValue("1");
      await userEvent.type(inputs[1], "2");
      expect(inputs[1]).toHaveValue("2");
      await userEvent.type(inputs[2], "3");
      expect(inputs[2]).toHaveValue("3");
    });
  },
};

export const CanonicalFlatProps: Story = {
  args: {
    name: "securityPin",
    type: "code",
    component: "CodeInputField",
    id: "securityPin",
    label: "Security PIN Code",
    length: 4,
    value: "1234",
    required: true,
  } as any,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const inputs = canvas.getAllByRole("textbox");
    expect(inputs).toHaveLength(4);
    expect(inputs[0]).toHaveValue("1");
    expect(inputs[1]).toHaveValue("2");
    expect(inputs[2]).toHaveValue("3");
    expect(inputs[3]).toHaveValue("4");
  },
};

export const ReadOnlyViewMode: Story = {
  args: {
    field: {
      id: "verified_otp",
      name: "verifiedOtp",
      type: "code-input",
      label: "Confirmed Session Code",
    },
    value: "849201",
    mode: "view",
  } as any,
};

export const StandaloneAtomIsolated: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold mb-1 text-foreground text-center">
          Standalone 6-Digit OTP Atom (3+3 Cluster)
        </label>
        <p className="text-xs text-muted-foreground text-center mb-3">
          Rendered standalone without FieldShell. Insulated borders with distinct light and dark backgrounds.
        </p>
        <CodeInputField
          name="standaloneOtp"
          length={6}
          defaultValue="482910"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1 text-foreground text-center">
          Standalone 4-Digit PIN Atom
        </label>
        <CodeInputField
          name="standalonePin"
          length={4}
          defaultValue="1234"
        />
      </div>
    </div>
  ),
};



