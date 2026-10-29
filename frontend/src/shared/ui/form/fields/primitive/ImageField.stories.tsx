import type { Meta, StoryObj } from "@storybook/react-vite";

import { ImageField } from "./ImageField";

const meta: Meta<typeof ImageField> = {
  title: "Form/Primitives/ImageField",
  component: ImageField,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ImageField>;

export const Default: Story = {
  args: {
    field: {
      id: "image-field",
      name: "image",
      type: "image",
      label: "Upload Image",
    },
    layout: {
      placeholder: { en: "Select image..." },
    },
    styles: {
      inputWrapper: "border border-gray-200 rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500/20",
    },
  },
};

export const WithPreview: Story = {
  args: {
    ...Default.args,
    value: "https://via.placeholder.com/300x200",
  },
};

export const WithAspectRatio: Story = {
  args: {
    field: {
      id: "image-ratio",
      name: "imageRatio",
      type: "image",
      label: "Profile Photo",
      aspectRatio: "1:1",
    },
    layout: { placeholder: { en: "Upload square image" } },
  },
};

export const CoverImage: Story = {
  args: {
    field: {
      id: "image-cover",
      name: "cover",
      type: "image",
      label: "Cover Image",
      aspectRatio: "16:9",
    },
    layout: { placeholder: { en: "Upload cover image (16:9)" } },
  },
};

export const Disabled: Story = {
  args: {
    ...Default.args,
    disabled: true,
  },
};

export const WithError: Story = {
  args: {
    ...Default.args,
    error: "Invalid image format. Please use JPG, PNG, or WebP.",
    styles: { inputWrapper: "border border-red-500 rounded-md" },
  },
};

export const InForm: Story = {
  render: () => (
    <div className="space-y-4 w-full max-w-md bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Profile Images</h3>
      <ImageField
        field={{ id: "avatar", name: "avatar", type: "image", label: "Avatar", aspectRatio: "1:1" }}
        layout={{ placeholder: { en: "Upload avatar" } }}
      />
      <ImageField
        field={{ id: "banner", name: "banner", type: "image", label: "Banner", aspectRatio: "16:9" }}
        layout={{ placeholder: { en: "Upload banner" } }}
      />
    </div>
  ),
};

export const Gallery: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 max-w-2xl">
      <ImageField
        field={{ id: "img1", name: "image1", type: "image", label: "Image 1", aspectRatio: "1:1" }}
        layout={{ placeholder: { en: "Upload" } }}
      />
      <ImageField
        field={{ id: "img2", name: "image2", type: "image", label: "Image 2", aspectRatio: "1:1" }}
        layout={{ placeholder: { en: "Upload" } }}
      />
      <ImageField
        field={{ id: "img3", name: "image3", type: "image", label: "Image 3", aspectRatio: "1:1" }}
        layout={{ placeholder: { en: "Upload" } }}
      />
    </div>
  ),
};