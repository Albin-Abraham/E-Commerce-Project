import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { FormRuntimeDecorator } from "../../stories/storybook-decorators";
import { FormFileField } from "../wrapped-fields";

const meta: Meta<typeof FormFileField> = {
  title: "Form/Fields/FileField",
  component: FormFileField,
  tags: ["autodocs"],
  decorators: [FormRuntimeDecorator],
  args: {
    onChange: fn(),
    field: {
      id: "resume_upload",
      name: "resume",
      type: "file",
      label: "Upload Resume / CV",
      required: true,
      properties: {
        accept: ".pdf,.docx",
      },
    },
    layout: {},
  },
};

export default meta;
type Story = StoryObj<typeof FormFileField>;

export const Default: Story = {};

export const MultipleFiles: Story = {
  args: {
    field: {
      id: "attachments",
      name: "attachments",
      type: "file",
      label: "Project Attachments",
      properties: {
        multiple: true,
        accept: "image/*,.pdf",
      },
    },
  },
};

export const WithErrorFeedback: Story = {
  args: {
    field: {
      id: "certificate",
      name: "certificate",
      type: "file",
      label: "Tax Clearance Certificate",
      required: true,
    },
    error: true,
    errorMessage: "Document upload is mandatory before submitting this form.",
  },
};

export const InteractiveFileUpload: Story = {
  play: async ({ canvasElement, step }) => {
    const fileInput = canvasElement.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    await step("Upload a document file", async () => {
      const file = new File(["dummy resume text"], "resume.pdf", {
        type: "application/pdf",
      });
      await userEvent.upload(fileInput, file);
      expect(fileInput.files?.[0]).toBe(file);
      expect(fileInput.files).toHaveLength(1);
    });
  },
};

export const CanonicalFlatProps: Story = {
  args: {
    name: "profileAvatar",
    type: "file",
    component: "FileField",
    id: "profileAvatar",
    label: "Profile Avatar Image",
    accept: "image/png,image/jpeg",
    required: true,
  } as any,
  play: async ({ canvasElement, step }) => {
    const fileInput = canvasElement.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute("name", "profileAvatar");
    expect(fileInput).toHaveAttribute("data-field-type", "file");
    expect(fileInput).toHaveAttribute("data-field-component", "FileField");

    await step("Upload avatar PNG", async () => {
      const file = new File(["fake image content"], "avatar.png", {
        type: "image/png",
      });
      await userEvent.upload(fileInput, file);
      expect(fileInput.files?.[0]).toBe(file);
    });
  },
};

export const CompactVariantShowcase: Story = {
  args: {
    field: {
      id: "quick_attachment",
      name: "quickAttachment",
      type: "file",
      label: "Receipt or Invoice Scan",
      properties: {
        variant: "compact",
        accept: ".pdf,image/*",
      },
    },
  },
};


