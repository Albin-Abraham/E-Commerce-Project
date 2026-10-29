import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { FormRuntimeDecorator } from "../../stories/storybook-decorators";
import { FormMultiSelectField } from "../wrapped-fields";

const meta: Meta<typeof FormMultiSelectField> = {
  title: "Form/Fields/MultiSelectField",
  component: FormMultiSelectField,
  tags: ["autodocs"],
  decorators: [FormRuntimeDecorator],
  args: {
    onChange: fn(),
    field: {
      id: "skills_selection",
      name: "skills",
      type: "multiselect",
      label: "Technical Core Competencies",
      required: true,
      options: [
        { value: "react", label: "React / Next.js" },
        { value: "ts", label: "TypeScript" },
        { value: "node", label: "Node.js / Express" },
        { value: "python", label: "Python / FastAPI" },
        { value: "docker", label: "Docker / Kubernetes" },
      ],
    },
    value: ["react", "ts"],
  },
};

export default meta;
type Story = StoryObj<typeof FormMultiSelectField>;

export const Default: Story = {};

export const EmptySelection: Story = {
  args: {
    value: [],
  },
};

export const WithErrorFeedback: Story = {
  args: {
    value: [],
    error: true,
    errorMessage: "Please select at least one core competency.",
  },
};

export const InteractiveMultiSelect: Story = {
  args: {
    value: [],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByRole("listbox");

    await step("Select multiple competency options", async () => {
      await userEvent.selectOptions(select, ["react", "ts"]);
      expect(select).toHaveValue(["react", "ts"]);
    });
  },
};

export const CanonicalFlatProps: Story = {
  args: {
    name: "toolingStack",
    type: "multiselect",
    component: "MultiSelectField",
    id: "toolingStack",
    label: "DevOps Tooling Stack",
    options: [
      { value: "terraform", label: "Terraform" },
      { value: "ansible", label: "Ansible" },
      { value: "pulumi", label: "Pulumi" },
    ],
    value: ["terraform"],
    required: true,
  } as any,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const select = canvas.getByRole("listbox");
    await expect(select).toBeInTheDocument();
    await expect(select).toHaveAttribute("name", "toolingStack");
    await expect(select).toHaveAttribute("data-field-type", "multiselect");
    await expect(select).toHaveAttribute("data-field-component", "MultiSelectField");
    await expect(select).toHaveValue(["terraform"]);
  },
};

export const WithChipsAndTags: Story = {
  args: {
    field: {
      id: "frameworks",
      name: "frameworks",
      type: "multiselect",
      label: "Selected Frontend Technologies",
      options: [
        { value: "react", label: "React 19" },
        { value: "vite", label: "Vite 6" },
        { value: "tailwind", label: "Tailwind CSS v4" },
        { value: "storybook", label: "Storybook v8" },
        { value: "vitest", label: "Vitest v3" },
      ],
    },
    value: ["react", "vite", "tailwind"],
  },
};


