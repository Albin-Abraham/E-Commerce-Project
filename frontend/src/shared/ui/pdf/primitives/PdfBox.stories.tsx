import type { Meta, StoryObj } from "@storybook/react-vite";

import { PdfBox } from "./PdfBox";

const meta: Meta<typeof PdfBox> = {
  title: "Primitives/PDF/PdfBox",
  component: PdfBox,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof PdfBox>;

export const Default: Story = {
  args: {
    children: "PdfBox Content",
  },
};

export const HorizontalLayout: Story = {
  args: {
    layout: "horizontal",
    gap: "md",
    children: (
      <>
        <PdfBox width={100} bg="surface" padding="sm" align="center">
          Box 1
        </PdfBox>
        <PdfBox width={100} bg="surface" padding="sm" align="center">
          Box 2
        </PdfBox>
        <PdfBox width={100} bg="surface" padding="sm" align="center">
          Box 3
        </PdfBox>
      </>
    ),
  },
};

export const VerticalLayout: Story = {
  args: {
    layout: "vertical",
    gap: "md",
    children: (
      <>
        <PdfBox bg="surface" padding="sm">Box 1</PdfBox>
        <PdfBox bg="surface" padding="sm">Box 2</PdfBox>
        <PdfBox bg="surface" padding="sm">Box 3</PdfBox>
      </>
    ),
  },
};

export const CardVariant: Story = {
  args: {
    variant: "card",
    padding: "md",
    children: "Card variant with border and background",
  },
};

export const BorderedVariant: Story = {
  args: {
    variant: "bordered",
    padding: "md",
    children: "Bordered variant",
  },
};

export const SummaryPanelVariant: Story = {
  args: {
    variant: "summary-panel",
    padding: "md",
    children: "Summary panel with left border accent",
  },
};

export const DocumentHeaderVariant: Story = {
  args: {
    variant: "document-header",
    padding: "md",
    children: "Document header with bottom border",
  },
};

export const WithBackground: Story = {
  args: {
    bg: "primary",
    padding: "lg",
    radius: "lg",
    children: "Box with primary background",
  },
};

export const WithBorder: Story = {
  args: {
    border_color: "border",
    padding: "md",
    radius: "md",
    children: "Box with border",
  },
};

export const Centered: Story = {
  args: {
    align: "center",
    justify: "center",
    children: "Centered content",
  },
};

export const JustifyBetween: Story = {
  args: {
    layout: "horizontal",
    justify: "between",
    children: (
      <>
        <PdfBox>Left</PdfBox>
        <PdfBox>Center</PdfBox>
        <PdfBox>Right</PdfBox>
      </>
    ),
  },
};

export const WithGap: Story = {
  args: {
    layout: "horizontal",
    gap: "xl",
    children: (
      <>
        <PdfBox bg="surface" padding="sm">Gap XL</PdfBox>
        <PdfBox bg="surface" padding="sm">Between</PdfBox>
        <PdfBox bg="surface" padding="sm">Items</PdfBox>
      </>
    ),
  },
};

export const KeepTogether: Story = {
  args: {
    keep_together: true,
    children: "This box will not break across pages",
  },
};

export const BreakBefore: Story = {
  args: {
    break_before: true,
    children: "This box will start on a new page",
  },
};

export const WithFlex: Story = {
  args: {
    layout: "horizontal",
    children: (
      <>
        <PdfBox flex={1} bg="surface" padding="sm" align="center">Flex 1</PdfBox>
        <PdfBox flex={2} bg="primary" padding="sm" align="center">Flex 2</PdfBox>
        <PdfBox flex={1} bg="surface" padding="sm" align="center">Flex 1</PdfBox>
      </>
    ),
  },
};

export const NestedBoxes: Story = {
  args: {
    layout: "vertical",
    gap: "md",
    padding: "lg",
    bg: "surface",
    children: (
      <>
        <PdfBox layout="horizontal" gap="sm" variant="card">
          <PdfBox flex={1} align="center">Left</PdfBox>
          <PdfBox flex={1} align="center">Right</PdfBox>
        </PdfBox>
        <PdfBox variant="card">
          <PdfBox layout="vertical" gap="xs">
            <PdfBox>Item 1</PdfBox>
            <PdfBox>Item 2</PdfBox>
            <PdfBox>Item 3</PdfBox>
          </PdfBox>
        </PdfBox>
      </>
    ),
  },
};