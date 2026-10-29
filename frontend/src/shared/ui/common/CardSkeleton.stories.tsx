import type { Meta, StoryObj } from "@storybook/react-vite";

import { CardSkeleton } from "./CardSkeleton";

const meta: Meta<typeof CardSkeleton> = {
  title: "Primitives/Common/CardSkeleton",
  component: CardSkeleton,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    count: { control: { type: "number", min: 1, max: 10 } },
    variant: { control: "select", options: ["base", "glass"] },
    density: { control: "select", options: ["compact", "comfortable", "spacious"] },
    minHeight: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof CardSkeleton>;

export const Default: Story = {
  args: {
    count: 3,
  },
};

export const Compact: Story = {
  args: {
    count: 4,
    density: "compact",
    minHeight: "120px",
  },
};

export const Comfortable: Story = {
  args: {
    count: 3,
    density: "comfortable",
    minHeight: "180px",
  },
};

export const Spacious: Story = {
  args: {
    count: 2,
    density: "spacious",
    minHeight: "240px",
  },
};

export const GlassVariant: Story = {
  args: {
    count: 3,
    variant: "glass",
    density: "comfortable",
  },
};

export const GridLayout: Story = {
  args: {
    count: 6,
    density: "comfortable",
  },
  decorators: [
    (Story) => (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
        <Story />
      </div>
    ),
  ],
};

export const SingleCard: Story = {
  args: {
    count: 1,
    density: "spacious",
    minHeight: "200px",
  },
};

export const DashboardSkeleton: Story = {
  render: () => (
    <div className="space-y-6 w-full max-w-5xl">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <CardSkeleton count={4} density="compact" minHeight="100px" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton count={2} density="comfortable" minHeight="180px" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CardSkeleton count={3} density="comfortable" minHeight="160px" />
      </div>
    </div>
  ),
};