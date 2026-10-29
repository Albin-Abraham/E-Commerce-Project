import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { FormRuntimeDecorator } from "../../stories/storybook-decorators";
import { FormNumberInputField } from "../wrapped-fields";

const meta: Meta<typeof FormNumberInputField> = {
  title: "Form/Fields/NumberInputField",
  component: FormNumberInputField,
  tags: ["autodocs"],
  decorators: [FormRuntimeDecorator],
  args: {
    onChange: fn(),
    field: {
      id: "pod_replicas",
      name: "podReplicas",
      type: "number",
      label: "Cluster Pod Replicas",
      required: true,
      properties: {
        min: 1,
        max: 50,
        step: 1,
      },
    },
    layout: {
      min: 1,
      max: 50,
      step: 1,
      placeholder: "e.g. 3",
    },
    value: 3,
  },
};

export default meta;
type Story = StoryObj<typeof FormNumberInputField>;

export const Default: Story = {};

export const CurrencyQuantity: Story = {
  args: {
    field: {
      id: "unit_price",
      name: "unitPrice",
      type: "number",
      label: "Target Unit Price (USD)",
      required: true,
      properties: {
        min: 0,
        step: 0.5,
        startContent: "$",
      },
    },
    layout: {
      min: 0,
      step: 0.5,
      placeholder: "0.00",
    },
    value: 49.5,
  },
};

export const WithErrorFeedback: Story = {
  args: {
    field: {
      id: "memory_limit",
      name: "memoryLimit",
      type: "number",
      label: "Pod Memory Allocation (GB)",
      required: true,
      properties: {
        min: 2,
        max: 64,
        step: 2,
      },
    },
    value: 1,
    error: true,
    errorMessage: "Memory allocation must be at least 2 GB for this workload profile.",
  },
};

export const DisabledStepper: Story = {
  args: {
    field: {
      id: "fixed_cores",
      name: "fixedCores",
      type: "number",
      label: "Guaranteed CPU Cores (Tier Fixed)",
    },
    layout: {
      disabled: true,
    },
    value: 8,
  },
};

export const InteractiveStepper: Story = {
  args: {
    field: {
      id: "interactive_instances",
      name: "instanceCount",
      type: "number",
      label: "Configured Server Instances",
      properties: {
        min: 1,
        max: 20,
        step: 1,
      },
    },
    layout: {
      min: 1,
      max: 20,
      step: 1,
    },
    value: 5,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("spinbutton");
    await expect(input).toHaveValue(5);

    const incrementBtn = canvas.getByRole("button", { name: /increment/i });
    await userEvent.click(incrementBtn);
    await expect(input).toHaveValue(6);

    const decrementBtn = canvas.getByRole("button", { name: /decrement/i });
    await userEvent.click(decrementBtn);
    await expect(input).toHaveValue(5);
  },
};

export const CanonicalFlatProps: Story = {
  args: {
    name: "maxConnections",
    type: "number",
    component: "NumberInputField",
    id: "maxConnections",
    label: "Maximum Concurrent Connections",
    placeholder: "e.g. 100",
    min: 10,
    max: 1000,
    step: 10,
    value: 50,
    required: true,
  } as any,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("spinbutton");
    await expect(input).toBeInTheDocument();
    await expect(input).toHaveAttribute("name", "maxConnections");
    await expect(input).toHaveAttribute("data-field-type", "number");
    await expect(input).toHaveAttribute("data-field-component", "NumberInputField");
    await expect(input).toHaveValue(50);

    const incrementBtn = canvas.getByRole("button", { name: /increment/i });
    await userEvent.click(incrementBtn);
    await expect(input).toHaveValue(60);
  },
};

