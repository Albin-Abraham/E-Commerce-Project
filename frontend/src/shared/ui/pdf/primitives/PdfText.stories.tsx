import type { Meta, StoryObj } from "@storybook/react-vite";

import { PdfText } from "./PdfText";

const meta: Meta<typeof PdfText> = {
  title: "Primitives/PDF/PdfText",
  component: PdfText,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof PdfText>;

export const Default: Story = {
  args: {
    children: "Default body text",
  },
};

export const Heading1: Story = {
  args: {
    variant: "h1",
    children: "Heading 1",
  },
};

export const Heading2: Story = {
  args: {
    variant: "h2",
    children: "Heading 2",
  },
};

export const Heading3: Story = {
  args: {
    variant: "h3",
    children: "Heading 3",
  },
};

export const Heading4: Story = {
  args: {
    variant: "h4",
    children: "Heading 4",
  },
};

export const Overline: Story = {
  args: {
    variant: "overline",
    children: "OVERLINE TEXT",
  },
};

export const Label: Story = {
  args: {
    variant: "label",
    children: "Label Text",
  },
};

export const Caption: Story = {
  args: {
    variant: "caption",
    children: "Caption text",
  },
};

export const Body: Story = {
  args: {
    variant: "body",
    children: "Body text with normal size",
  },
};

export const Bold: Story = {
  args: {
    bold: true,
    children: "Bold text",
  },
};

export const Italic: Story = {
  args: {
    italic: true,
    children: "Italic text",
  },
};

export const BoldItalic: Story = {
  args: {
    bold: true,
    italic: true,
    children: "Bold and Italic",
  },
};

export const PrimaryColor: Story = {
  args: {
    color: "primary",
    children: "Primary color text",
  },
};

export const MutedColor: Story = {
  args: {
    color: "textMuted",
    children: "Muted color text",
  },
};

export const SuccessColor: Story = {
  args: {
    color: "success",
    children: "Success color text",
  },
};

export const DangerColor: Story = {
  args: {
    color: "danger",
    children: "Danger color text",
  },
};

export const CenterAlign: Story = {
  args: {
    align: "center",
    children: "Center aligned text",
  },
};

export const RightAlign: Story = {
  args: {
    align: "right",
    children: "Right aligned text",
  },
};

export const JustifyAlign: Story = {
  args: {
    align: "justify",
    children: "Justified text that fills the width",
  },
};

export const TightLineHeight: Story = {
  args: {
    lineHeight: "tight",
    children: "Tight line height for compact text",
  },
};

export const RelaxedLineHeight: Story = {
  args: {
    lineHeight: "relaxed",
    children: "Relaxed line height for readability",
  },
};

export const Uppercase: Story = {
  args: {
    transform: "uppercase",
    children: "Uppercase text",
  },
};

export const Lowercase: Story = {
  args: {
    transform: "lowercase",
    children: "LOWERCASE TEXT",
  },
};

export const Capitalize: Story = {
  args: {
    transform: "capitalize",
    children: "capitalize each word",
  },
};

export const WithLetterSpacing: Story = {
  args: {
    variant: "overline",
    letterSpacing: 3,
    children: "Wide letter spacing",
  },
};

export const NumericText: Story = {
  args: {
    children: 1234567.89,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <PdfText variant="h1">Heading 1</PdfText>
      <PdfText variant="h2">Heading 2</PdfText>
      <PdfText variant="h3">Heading 3</PdfText>
      <PdfText variant="h4">Heading 4</PdfText>
      <PdfText variant="overline">OVERLINE</PdfText>
      <PdfText variant="label">Label</PdfText>
      <PdfText variant="caption">Caption</PdfText>
      <PdfText variant="body">Body text</PdfText>
    </div>
  ),
};

export const MixedStyles: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <PdfText variant="h1" bold color="primary">Report Title</PdfText>
      <PdfText variant="overline" color="textMuted">CONFIDENTIAL</PdfText>
      <PdfText variant="body" color="textMuted">Generated on January 15, 2024</PdfText>
      <PdfText variant="h2" bold>Executive Summary</PdfText>
      <PdfText variant="body">
        This report provides an overview of the quarterly performance metrics.
        Key findings indicate a 15% increase in revenue compared to the previous quarter.
      </PdfText>
      <PdfText variant="h3" bold>Key Metrics</PdfText>
      <PdfText variant="body" bold>Revenue:</PdfText>
      <PdfText variant="body" color="success">$1,250,000</PdfText>
      <PdfText variant="body" bold>Growth:</PdfText>
      <PdfText variant="body" color="primary">+15%</PdfText>
    </div>
  ),
};