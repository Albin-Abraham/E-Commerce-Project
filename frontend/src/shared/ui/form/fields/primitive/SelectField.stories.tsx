import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Globe } from "lucide-react";

import { FormRuntimeDecorator } from "../../stories/storybook-decorators";
import { FormSelectField } from "../wrapped-fields";

const meta: Meta<typeof FormSelectField> = {
  title: "Form/Fields/SelectField",
  component: FormSelectField,
  tags: ["autodocs"],
  decorators: [FormRuntimeDecorator],
  args: {
    onChange: fn(),
    field: {
      id: "select-demo",
      name: "category",
      type: "select",
      label: "Select Industry Category",
      required: true,
      options: [
        { value: "it", label: "Information Technology" },
        { value: "hr", label: "Human Resources" },
        { value: "finance", label: "Finance & Banking" },
        { value: "healthcare", label: "Healthcare & Life Sciences" },
      ],
    },
    layout: {
      placeholder: "Choose a category...",
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormSelectField>;

export const Default: Story = {};

export const WithSelectedValue: Story = {
  args: {
    value: "finance",
  },
};

export const WithIconAdornment: Story = {
  args: {
    field: {
      id: "region-select",
      name: "region",
      type: "select",
      label: "Operating Region",
      options: [
        { value: "na", label: "North America" },
        { value: "emea", label: "Europe, Middle East & Africa" },
        { value: "apac", label: "Asia Pacific" },
      ],
    },
    startContent: <Globe size={16} className="text-muted-foreground" />,
  },
};

export const WithValidationError: Story = {
  args: {
    field: {
      id: "department",
      name: "department",
      type: "select",
      label: "Assigned Department",
      required: true,
      options: [
        { value: "eng", label: "Engineering" },
        { value: "design", label: "Product Design" },
      ],
    },
    error: true,
    errorMessage: "Selecting a department is required to proceed.",
  },
};

export const InteractiveSelection: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox");

    await step("Open dropdown", async () => {
      await userEvent.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "true");
    });

    await step("Select Finance option from portal", async () => {
      const option = await within(document.body).findByRole("option", {
        name: /Finance & Banking/i,
      });
      await userEvent.click(option);
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(canvas.getByText("Finance & Banking")).toBeInTheDocument();
    });
  },
};

export const CanonicalFlatProps: Story = {
  args: {
    name: "cloudProvider",
    type: "select",
    component: "SelectField",
    id: "cloudProvider",
    label: "Cloud Infrastructure Provider",
    placeholder: "Select your cloud...",
    required: true,
    options: [
      { value: "gcp", label: "Google Cloud Platform" },
      { value: "aws", label: "Amazon Web Services" },
      { value: "azure", label: "Microsoft Azure" },
    ],
  } as any,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox");
    await expect(trigger).toBeInTheDocument();

    await step("Open dropdown and select GCP", async () => {
      await userEvent.click(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      const option = await within(document.body).findByRole("option", {
        name: /Google Cloud Platform/i,
      });
      await userEvent.click(option);
      expect(canvas.getByText("Google Cloud Platform")).toBeInTheDocument();
    });
  },
};


