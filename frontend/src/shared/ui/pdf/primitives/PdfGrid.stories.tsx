import type { Meta, StoryObj } from "@storybook/react-vite";

import { PdfGrid } from "./PdfGrid";
import { PdfCol } from "./PdfRow";
import { PdfBox } from "./PdfBox";
import { PdfText } from "./PdfText";

const meta: Meta<typeof PdfGrid> = {
  title: "Primitives/PDF/PdfGrid",
  component: PdfGrid,
  subcomponents: { PdfCol },
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof PdfGrid>;

export const TwoColumns: Story = {
  args: {
    columns: 2,
    gap: "md",
    children: (
      <>
        <PdfCol span={1}>
          <PdfBox bg="surface" padding="md" align="center">Column 1</PdfBox>
        </PdfCol>
        <PdfCol span={1}>
          <PdfBox bg="surface" padding="md" align="center">Column 2</PdfBox>
        </PdfCol>
      </>
    ),
  },
};

export const ThreeColumns: Story = {
  args: {
    columns: 3,
    gap: "md",
    children: (
      <>
        <PdfCol span={1}>
          <PdfBox bg="surface" padding="md" align="center">Col 1</PdfBox>
        </PdfCol>
        <PdfCol span={1}>
          <PdfBox bg="surface" padding="md" align="center">Col 2</PdfBox>
        </PdfCol>
        <PdfCol span={1}>
          <PdfBox bg="surface" padding="md" align="center">Col 3</PdfBox>
        </PdfCol>
      </>
    ),
  },
};

export const FourColumns: Story = {
  args: {
    columns: 4,
    gap: "sm",
    children: (
      <>
        <PdfCol span={1}>
          <PdfBox bg="surface" padding="sm" align="center">1</PdfBox>
        </PdfCol>
        <PdfCol span={1}>
          <PdfBox bg="surface" padding="sm" align="center">2</PdfBox>
        </PdfCol>
        <PdfCol span={1}>
          <PdfBox bg="surface" padding="sm" align="center">3</PdfBox>
        </PdfCol>
        <PdfCol span={1}>
          <PdfBox bg="surface" padding="sm" align="center">4</PdfBox>
        </PdfCol>
      </>
    ),
  },
};

export const SixColumns: Story = {
  args: {
    columns: 6,
    gap: "sm",
    children: Array.from({ length: 6 }, (_, i) => (
      <PdfCol key={i} span={1}>
        <PdfBox bg="surface" padding="sm" align="center">Col {i + 1}</PdfBox>
      </PdfCol>
    )),
  },
};

export const TwelveColumns: Story = {
  args: {
    columns: 12,
    gap: "xs",
    children: Array.from({ length: 12 }, (_, i) => (
      <PdfCol key={i} span={1}>
        <PdfBox bg="surface" padding="xs" align="center">{i + 1}</PdfBox>
      </PdfCol>
    )),
  },
};

export const UnevenSpans: Story = {
  args: {
    columns: 12,
    gap: "md",
    children: (
      <>
        <PdfCol span={8}>
          <PdfBox bg="primary" padding="lg" align="center">Main Content (8/12)</PdfBox>
        </PdfCol>
        <PdfCol span={4}>
          <PdfBox bg="surface" padding="lg" align="center">Sidebar (4/12)</PdfBox>
        </PdfCol>
      </>
    ),
  },
};

export const ComplexLayout: Story = {
  args: {
    columns: 12,
    gap: "lg",
    children: (
      <>
        <PdfCol span={12}>
          <PdfBox variant="card" padding="md">
            <PdfText variant="h2" bold>Dashboard Header</PdfText>
          </PdfBox>
        </PdfCol>
        <PdfCol span={8}>
          <PdfBox variant="card" padding="md">
            <PdfText variant="h3" bold>Main Content Area</PdfText>
            <PdfText variant="body">This is the main content area spanning 8 columns.</PdfText>
          </PdfBox>
        </PdfCol>
        <PdfCol span={4}>
          <PdfBox variant="card" padding="md">
            <PdfText variant="h3" bold>Sidebar</PdfText>
            <PdfText variant="body">Sidebar content spanning 4 columns.</PdfText>
          </PdfBox>
        </PdfCol>
      </>
    ),
  },
};

export const NestedGrids: Story = {
  args: {
    columns: 12,
    gap: "md",
    children: (
      <>
        <PdfCol span={6}>
          <PdfBox variant="card" padding="md">
            <PdfText variant="h3" bold>Left Section</PdfText>
            <PdfGrid columns={6} gap="sm">
              <PdfCol span={3}>
                <PdfBox bg="surface" padding="sm" align="center">A</PdfBox>
              </PdfCol>
              <PdfCol span={3}>
                <PdfBox bg="surface" padding="sm" align="center">B</PdfBox>
              </PdfCol>
            </PdfGrid>
          </PdfBox>
        </PdfCol>
        <PdfCol span={6}>
          <PdfBox variant="card" padding="md">
            <PdfText variant="h3" bold>Right Section</PdfText>
            <PdfGrid columns={6} gap="sm">
              <PdfCol span={2}>
                <PdfBox bg="surface" padding="sm" align="center">1</PdfBox>
              </PdfCol>
              <PdfCol span={2}>
                <PdfBox bg="surface" padding="sm" align="center">2</PdfBox>
              </PdfCol>
              <PdfCol span={2}>
                <PdfBox bg="surface" padding="sm" align="center">3</PdfBox>
              </PdfCol>
            </PdfGrid>
          </PdfBox>
        </PdfCol>
      </>
    ),
  },
};

export const WithGapVariations: Story = {
  render: () => (
    <div className="space-y-6 max-w-3xl">
      <div>
        <PdfText variant="h4" bold>Gap: none</PdfText>
        <PdfGrid columns={4} gap="none">
          {Array.from({ length: 4 }, (_, i) => (
            <PdfCol key={i} span={1}>
              <PdfBox bg="surface" padding="sm" align="center">{i + 1}</PdfBox>
            </PdfCol>
          ))}
        </PdfGrid>
      </div>
      <div>
        <PdfText variant="h4" bold>Gap: xs</PdfText>
        <PdfGrid columns={4} gap="xs">
          {Array.from({ length: 4 }, (_, i) => (
            <PdfCol key={i} span={1}>
              <PdfBox bg="surface" padding="sm" align="center">{i + 1}</PdfBox>
            </PdfCol>
          ))}
        </PdfGrid>
      </div>
      <div>
        <PdfText variant="h4" bold>Gap: md</PdfText>
        <PdfGrid columns={4} gap="md">
          {Array.from({ length: 4 }, (_, i) => (
            <PdfCol key={i} span={1}>
              <PdfBox bg="surface" padding="sm" align="center">{i + 1}</PdfBox>
            </PdfCol>
          ))}
        </PdfGrid>
      </div>
      <div>
        <PdfText variant="h4" bold>Gap: lg</PdfText>
        <PdfGrid columns={4} gap="lg">
          {Array.from({ length: 4 }, (_, i) => (
            <PdfCol key={i} span={1}>
              <PdfBox bg="surface" padding="sm" align="center">{i + 1}</PdfBox>
            </PdfCol>
          ))}
        </PdfGrid>
      </div>
    </div>
  ),
};

export const ResponsiveSpans: Story = {
  args: {
    columns: 12,
    gap: "md",
    children: (
      <>
        <PdfCol span={12}>
          <PdfBox variant="card" padding="md" align="center">Full Width (12)</PdfBox>
        </PdfCol>
        <PdfCol span={6}>
          <PdfBox variant="card" padding="md" align="center">Half (6)</PdfBox>
        </PdfCol>
        <PdfCol span={6}>
          <PdfBox variant="card" padding="md" align="center">Half (6)</PdfBox>
        </PdfCol>
        <PdfCol span={4}>
          <PdfBox variant="card" padding="md" align="center">Third (4)</PdfBox>
        </PdfCol>
        <PdfCol span={4}>
          <PdfBox variant="card" padding="md" align="center">Third (4)</PdfBox>
        </PdfCol>
        <PdfCol span={4}>
          <PdfBox variant="card" padding="md" align="center">Third (4)</PdfBox>
        </PdfCol>
        <PdfCol span={3}>
          <PdfBox variant="card" padding="md" align="center">Quarter (3)</PdfBox>
        </PdfCol>
        <PdfCol span={3}>
          <PdfBox variant="card" padding="md" align="center">Quarter (3)</PdfBox>
        </PdfCol>
        <PdfCol span={3}>
          <PdfBox variant="card" padding="md" align="center">Quarter (3)</PdfBox>
        </PdfCol>
        <PdfCol span={3}>
          <PdfBox variant="card" padding="md" align="center">Quarter (3)</PdfBox>
        </PdfCol>
      </>
    ),
  },
};