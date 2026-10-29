import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { FormRuntimeDecorator } from "../../stories/storybook-decorators";
import { FormTextareaField } from "../wrapped-fields";

const meta: Meta<typeof FormTextareaField> = {
  title: "Form/Fields/TextareaField",
  component: FormTextareaField,
  tags: ["autodocs"],
  decorators: [FormRuntimeDecorator],
  args: {
    onChange: fn(),
    field: {
      id: "project_description",
      name: "projectDescription",
      type: "textarea",
      label: "Project Scope & Objectives",
      required: true,
    },
    layout: {
      placeholder: "Describe the key deliverables, technical architecture, and timeline...",
      rows: 4,
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormTextareaField>;

export const Default: Story = {};

export const ExpandedRows: Story = {
  args: {
    field: {
      id: "architecture_notes",
      name: "architectureNotes",
      type: "textarea",
      label: "Architectural RFC Specification",
    },
    layout: {
      placeholder: "Paste or author RFC markdown details...",
      rows: 8,
    },
  },
};

export const WithErrorFeedback: Story = {
  args: {
    field: {
      id: "justification",
      name: "justification",
      type: "textarea",
      label: "Resource Allocation Justification",
      required: true,
    },
    value: "Need more RAM",
    error: true,
    errorMessage: "Justification must be at least 50 characters outlining business justification.",
    layout: {
      rows: 3,
    },
  },
};

export const ReadOnlyState: Story = {
  args: {
    field: {
      id: "audit_summary",
      name: "auditSummary",
      type: "textarea",
      label: "Immutable Compliance Log",
    },
    value: "SOC 2 Type II audit verified on 2026-10-15. Zero non-conformities found across Access Control, Encryption at Rest, and TLS In-Transit boundaries.",
    layout: {
      readOnly: true,
      rows: 4,
    },
  },
};

export const InteractiveMultiline: Story = {
  args: {
    value: "",
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByRole("textbox");

    await step("Type multi-line content into textarea", async () => {
      await userEvent.type(textarea, "Line 1{enter}Line 2");
      expect(textarea).toHaveValue("Line 1\nLine 2");
    });
  },
};

export const CanonicalFlatProps: Story = {
  args: {
    name: "projectBio",
    type: "textarea",
    component: "TextareaField",
    id: "projectBio",
    label: "Project Biography",
    placeholder: "Provide a comprehensive project overview...",
    required: true,
  } as any,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const textarea = canvas.getByPlaceholderText("Provide a comprehensive project overview...");
    await expect(textarea).toBeInTheDocument();
    await expect(textarea).toHaveAttribute("name", "projectBio");
    await expect(textarea).toHaveAttribute("data-field-type", "textarea");
    await expect(textarea).toHaveAttribute("data-field-component", "TextareaField");
    await userEvent.type(textarea, "Enterprise Grade Multi-Tenant Form Architecture");
    await expect(textarea).toHaveValue("Enterprise Grade Multi-Tenant Form Architecture");
  },
};


