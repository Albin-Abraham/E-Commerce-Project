import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, fn, within } from "storybook/test";

import { FormRuntimeDecorator } from "../../stories/storybook-decorators";
import { FormRangeField } from "../wrapped-fields";

const meta: Meta<typeof FormRangeField> = {
  title: "Form/Fields/RangeField",
  component: FormRangeField,
  tags: ["autodocs"],
  decorators: [FormRuntimeDecorator],
  args: {
    onChange: fn(),
    field: {
      id: "volume_slider",
      name: "volume",
      type: "range",
      label: "Audio Level",
      properties: {
        min: 0,
        max: 100,
        step: 5,
      },
    },
    layout: {
      min: 0,
      max: 100,
      step: 5,
    },
    value: 50,
  },
};

export default meta;
type Story = StoryObj<typeof FormRangeField>;

export const Default: Story = {};

export const WithCustomRange: Story = {
  args: {
    field: {
      id: "temperature_slider",
      name: "temperature",
      type: "range",
      label: "LLM Sampling Temperature",
      properties: {
        min: 0,
        max: 2,
        step: 0.1,
      },
    },
    layout: {
      min: 0,
      max: 2,
      step: 0.1,
    },
    value: 0.7,
  },
};

export const WithError: Story = {
  args: {
    field: {
      id: "bandwidth_limit",
      name: "bandwidth",
      type: "range",
      label: "Allocated Bandwidth (Mbps)",
      required: true,
    },
    error: true,
    errorMessage: "Bandwidth must be at least 10 Mbps.",
    value: 5,
  },
};

export const InteractiveSlider: Story = {
  args: {
    value: 50,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const slider = canvas.getByRole("slider");

    await step("Change slider value to 75", async () => {
      fireEvent.change(slider, { target: { value: "75" } });
      expect(slider).toHaveValue("75");
    });
  },
};

export const CanonicalFlatProps: Story = {
  args: {
    name: "cpuAllocation",
    type: "range",
    component: "RangeField",
    id: "cpuAllocation",
    label: "CPU Core Quota (%)",
    min: 0,
    max: 100,
    step: 5,
    value: 40,
    required: true,
  } as any,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const slider = canvas.getByRole("slider");
    await expect(slider).toBeInTheDocument();
    await expect(slider).toHaveAttribute("name", "cpuAllocation");
    await expect(slider).toHaveAttribute("data-field-type", "range");
    await expect(slider).toHaveAttribute("data-field-component", "RangeField");
    await expect(slider).toHaveValue("40");
  },
};

export const WithUnitAndBadge: Story = {
  args: {
    field: {
      id: "ram_allocation",
      name: "ramAllocation",
      type: "range",
      label: "Dedicated Memory Allocation",
      properties: {
        min: 2,
        max: 64,
        step: 2,
        unit: "GB",
      },
    },
    value: 16,
  },
};


