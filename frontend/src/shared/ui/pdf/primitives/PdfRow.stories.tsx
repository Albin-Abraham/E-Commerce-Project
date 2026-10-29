import type { Meta, StoryObj } from "@storybook/react-vite";

import { PdfRow, PdfCol } from "./PdfRow";
import { PdfBox } from "./PdfBox";
import { PdfText } from "./PdfText";

const meta: Meta<typeof PdfRow> = {
  title: "Primitives/PDF/PdfRow & PdfCol",
  component: PdfRow,
  subcomponents: { PdfCol },
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof PdfRow>;

export const BasicRow: Story = {
  args: {
    gap: "md",
    children: (
      <>
        <PdfCol>
          <PdfBox bg="surface" padding="md" align="center">Column 1</PdfBox>
        </PdfCol>
        <PdfCol>
          <PdfBox bg="surface" padding="md" align="center">Column 2</PdfBox>
        </PdfCol>
      </>
    ),
  },
};

export const RowWithAlign: Story = {
  args: {
    align: "center",
    gap: "md",
    children: (
      <>
        <PdfCol>
          <PdfBox bg="primary" padding="sm" align="center">Top</PdfBox>
        </PdfCol>
        <PdfCol>
          <PdfBox bg="surface" padding="md" align="center">Middle</PdfBox>
        </PdfCol>
        <PdfCol>
          <PdfBox bg="success" padding="lg" align="center">Bottom</PdfBox>
        </PdfCol>
      </>
    ),
  },
};

export const RowWithJustifyBetween: Story = {
  args: {
    justify: "between",
    children: (
      <>
        <PdfCol>
          <PdfText variant="h3" bold>Title</PdfText>
        </PdfCol>
        <PdfCol>
          <PdfText variant="body" color="primary">Action</PdfText>
        </PdfCol>
      </>
    ),
  },
};

export const RowWithJustifyAround: Story = {
  args: {
    justify: "around",
    gap: "md",
    children: (
      <>
        <PdfCol>
          <PdfBox bg="surface" padding="sm" align="center">1</PdfBox>
        </PdfCol>
        <PdfCol>
          <PdfBox bg="surface" padding="sm" align="center">2</PdfBox>
        </PdfCol>
        <PdfCol>
          <PdfBox bg="surface" padding="sm" align="center">3</PdfBox>
        </PdfCol>
      </>
    ),
  },
};

export const WrappedRow: Story = {
  args: {
    wrap: true,
    gap: "sm",
    children: Array.from({ length: 8 }, (_, i) => (
      <PdfCol key={i} style={{ width: 80 }}>
        <PdfBox bg="surface" padding="sm" align="center">Item {i + 1}</PdfBox>
      </PdfCol>
    )),
  },
};

export const BasicCol: Story = {
  args: {
    gap: "md",
    children: (
      <>
        <PdfCol gap="sm">
          <PdfText variant="h3" bold>Title</PdfText>
          <PdfText variant="body">Description text goes here</PdfText>
          <PdfText variant="caption" color="textMuted">Metadata</PdfText>
        </PdfCol>
      </>
    ),
  },
};

export const ColWithAlign: Story = {
  args: {
    align: "center",
    gap: "sm",
    children: (
      <>
        <PdfCol>
          <PdfText variant="h3" bold>Centered</PdfText>
          <PdfText variant="body">Content</PdfText>
        </PdfCol>
      </>
    ),
  },
};

export const ColWithFlex: Story = {
  render: () => (
    <PdfRow layout="horizontal" gap="md">
      <PdfCol flex={1}>
        <PdfBox bg="primary" padding="lg" align="center">Flex 1</PdfBox>
      </PdfCol>
      <PdfCol flex={2}>
        <PdfBox bg="surface" padding="lg" align="center">Flex 2</PdfBox>
      </PdfCol>
      <PdfCol flex={1}>
        <PdfBox bg="primary" padding="lg" align="center">Flex 1</PdfBox>
      </PdfCol>
    </PdfRow>
  ),
};

export const ColWithWidth: Story = {
  render: () => (
    <PdfRow layout="horizontal" gap="md">
      <PdfCol width={150}>
        <PdfBox bg="surface" padding="md" align="center">150pt</PdfBox>
      </PdfCol>
      <PdfCol flex={1}>
        <PdfBox bg="primary" padding="md" align="center">Flex</PdfBox>
      </PdfCol>
      <PdfCol width={100}>
        <PdfBox bg="surface" padding="md" align="center">100pt</PdfBox>
      </PdfCol>
    </PdfRow>
  ),
};

export const CardLayout: Story = {
  render: () => (
    <PdfRow gap="lg">
      <PdfCol span={4}>
        <PdfBox variant="card" padding="md">
          <PdfText variant="h3" bold>Card 1</PdfText>
          <PdfText variant="body">Content for card 1</PdfText>
        </PdfBox>
      </PdfCol>
      <PdfCol span={4}>
        <PdfBox variant="card" padding="md">
          <PdfText variant="h3" bold>Card 2</PdfText>
          <PdfText variant="body">Content for card 2</PdfText>
        </PdfBox>
      </PdfCol>
      <PdfCol span={4}>
        <PdfBox variant="card" padding="md">
          <PdfText variant="h3" bold>Card 3</PdfText>
          <PdfText variant="body">Content for card 3</PdfText>
        </PdfBox>
      </PdfCol>
    </PdfRow>
  ),
};

export const FormLayout: Story = {
  render: () => (
    <PdfCol gap="md" style={{ width: 400 }}>
      <PdfText variant="h2" bold>Contact Form</PdfText>
      <PdfRow gap="md">
        <PdfCol flex={1}>
          <PdfText variant="label" bold>First Name</PdfText>
          <PdfBox variant="bordered" padding="sm">John</PdfBox>
        </PdfCol>
        <PdfCol flex={1}>
          <PdfText variant="label" bold>Last Name</PdfText>
          <PdfBox variant="bordered" padding="sm">Doe</PdfBox>
        </PdfCol>
      </PdfRow>
      <PdfCol>
        <PdfText variant="label" bold>Email</PdfText>
        <PdfBox variant="bordered" padding="sm">john@example.com</PdfBox>
      </PdfCol>
      <PdfCol>
        <PdfText variant="label" bold>Message</PdfText>
        <PdfBox variant="bordered" padding="md" style={{ height: 100 }}>Message content...</PdfBox>
      </PdfCol>
    </PdfCol>
  ),
};

export const HeaderLayout: Story = {
  render: () => (
    <PdfRow justify="between" align="center" style={{ paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "#E5E7EB" }}>
      <PdfCol>
        <PdfText variant="h1" bold>Company Name</PdfText>
      </PdfCol>
      <PdfCol align="end">
        <PdfRow gap="lg">
          <PdfCol>
            <PdfText variant="body">Home</PdfText>
          </PdfCol>
          <PdfCol>
            <PdfText variant="body">About</PdfText>
          </PdfCol>
          <PdfCol>
            <PdfText variant="body">Contact</PdfText>
          </PdfCol>
        </PdfRow>
      </PdfCol>
    </PdfRow>
  ),
};

export const FooterLayout: Story = {
  render: () => (
    <PdfRow justify="between" align="center" style={{ paddingTop: 16, borderTopWidth: 1, borderTopColor: "#E5E7EB" }}>
      <PdfCol>
        <PdfText variant="caption" color="textMuted">© 2024 Company. All rights reserved.</PdfText>
      </PdfCol>
      <PdfCol align="end">
        <PdfRow gap="md">
          <PdfCol>
            <PdfText variant="caption" color="textMuted">Privacy</PdfText>
          </PdfCol>
          <PdfCol>
            <PdfText variant="caption" color="textMuted">Terms</PdfText>
          </PdfCol>
        </PdfRow>
      </PdfCol>
    </PdfRow>
  ),
};