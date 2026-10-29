import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { cn } from "@libs/utils";
import { Text } from "../atoms/Text";
import { Flex } from "./Flex";

const meta: Meta<typeof Flex> = {
  title: "Primitives/Layout/Flex",
  component: Flex,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-4xl mx-auto">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    direction: {
      control: "select",
      options: ["row", "col", "rowReverse", "colReverse"],
    },
    align: {
      control: "select",
      options: ["start", "center", "end", "stretch", "baseline"],
    },
    justify: {
      control: "select",
      options: ["start", "center", "end", "between", "around", "evenly"],
    },
    wrap: {
      control: "select",
      options: ["nowrap", "wrap", "wrapReverse"],
    },
    gap: {
      control: "select",
      options: ["none", "xs", "sm", "md", "lg", "xl", "2xl"],
    },
    fill: { control: "boolean" },
    asChild: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Flex>;

const CardItem = ({
  title,
  subtitle,
  className = "",
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "px-4 py-3 bg-surface border border-border rounded-lg shadow-xs flex flex-col justify-center",
      className
    )}
  >
    <Text variant="body" bold color="foreground">
      {title}
    </Text>
    {subtitle && (
      <Text variant="caption" color="muted">
        {subtitle}
      </Text>
    )}
  </div>
);

const ChipItem = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-md font-mono text-xs flex items-center justify-center",
      className
    )}
  >
    {children}
  </div>
);

export const Default: Story = {
  args: {
    gap: "md",
    className: "w-full",
    children: (
      <>
        <CardItem title="Personal Info" subtitle="Step 1" className="flex-1" />
        <CardItem title="Billing Details" subtitle="Step 2" className="flex-1" />
        <CardItem title="Review & Sign" subtitle="Step 3" className="flex-1" />
      </>
    ),
  },
};

export const Centered: Story = {
  args: {
    align: "center",
    justify: "center",
    className:
      "w-full h-48 bg-subtle rounded-xl border border-dashed border-border",
    children: (
      <div className="text-center space-y-1">
        <Text variant="body" bold color="foreground">
          Centered Content
        </Text>
        <Text variant="caption" color="muted">
          Horizontally and vertically centered inside flex container
        </Text>
      </div>
    ),
  },
};

export const DirectionColumn: Story = {
  args: {
    direction: "col",
    gap: "md",
    className: "w-full",
    children: (
      <>
        <CardItem title="Field 1: First Name" subtitle="Text input block" className="w-full" />
        <CardItem title="Field 2: Email Address" subtitle="Required contact field" className="w-full" />
        <CardItem title="Field 3: Country / Region" subtitle="Select dropdown" className="w-full" />
      </>
    ),
  },
};

export const DirectionRowReverse: Story = {
  args: {
    direction: "rowReverse",
    gap: "md",
    className: "w-full",
    children: (
      <>
        <ChipItem className="bg-success/10 border-success/20 text-success">
          Step 1: First
        </ChipItem>
        <ChipItem>Step 2: Middle</ChipItem>
        <ChipItem className="bg-secondary/10 border-secondary/20 text-secondary">
          Step 3: Last
        </ChipItem>
      </>
    ),
  },
};

export const JustifyBetween: Story = {
  args: {
    justify: "between",
    align: "center",
    className:
      "w-full bg-surface rounded-xl p-4 border border-border shadow-xs",
    children: (
      <>
        <div className="flex flex-col">
          <Text variant="h3" color="foreground">
            Form Section
          </Text>
          <Text variant="caption" color="muted">
            Configure applicant details
          </Text>
        </div>
        <Flex gap="sm" align="center">
          <button className="px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground rounded-md border border-border">
            Cancel
          </button>
          <button className="px-3 py-1.5 text-xs font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md">
            Save Draft
          </button>
        </Flex>
      </>
    ),
  },
};

export const JustifyAround: Story = {
  args: {
    justify: "around",
    align: "center",
    className: "w-full",
    children: (
      <>
        <CardItem title="Stat A" subtitle="3,420 users" className="min-w-[140px] text-center" />
        <CardItem title="Stat B" subtitle="98.5% uptime" className="min-w-[140px] text-center" />
        <CardItem title="Stat C" subtitle="$12,500 MRR" className="min-w-[140px] text-center" />
      </>
    ),
  },
};

export const AlignEnd: Story = {
  args: {
    align: "end",
    gap: "md",
    className:
      "w-full h-48 bg-subtle rounded-xl p-4 border border-dashed border-border",
    children: (
      <>
        <div className="flex-1 h-14 bg-surface rounded-lg border border-border p-2 flex items-center justify-center">
          <Text variant="caption" color="muted">Short (h-14)</Text>
        </div>
        <div className="flex-1 h-24 bg-surface rounded-lg border border-border p-2 flex items-center justify-center">
          <Text variant="caption" color="muted">Medium (h-24)</Text>
        </div>
        <div className="flex-1 h-36 bg-surface rounded-lg border border-border p-2 flex items-center justify-center">
          <Text variant="caption" color="muted">Tall (h-36)</Text>
        </div>
      </>
    ),
  },
};

export const Wrap: Story = {
  args: {
    wrap: "wrap",
    gap: "sm",
    className: "w-full",
    children: [
      "React",
      "TypeScript",
      "TailwindCSS",
      "Storybook",
      "Vite",
      "Zod",
      "Jotai",
      "Radix UI",
      "Lucide Icons",
      "Framer Motion",
    ].map((tag, i) => (
      <ChipItem key={i}>{tag}</ChipItem>
    )),
  },
};

export const WithGap: Story = {
  args: {
    gap: "xl",
    className: "w-full",
    children: (
      <>
        <CardItem title="Gap XL" subtitle="Col 1" className="flex-1 text-center" />
        <CardItem title="Between" subtitle="Col 2" className="flex-1 text-center" />
        <CardItem title="Elements" subtitle="Col 3" className="flex-1 text-center" />
      </>
    ),
  },
};

export const FillContainer: Story = {
  args: {
    fill: true,
    direction: "col",
    className:
      "w-full h-64 bg-subtle rounded-xl border border-border overflow-hidden",
    children: (
      <>
        <Flex
          className="bg-primary text-primary-foreground px-4 py-2"
          align="center"
          justify="between"
        >
          <Text variant="body" bold className="text-primary-foreground">
            Header (Fixed)
          </Text>
          <ChipItem className="bg-primary-foreground/20 text-primary-foreground border-transparent">
            v2.0
          </ChipItem>
        </Flex>
        <Flex
          className="bg-surface flex-1 p-4"
          align="center"
          justify="center"
        >
          <Text variant="body" color="muted">
            Scrollable Content Body (flex-1)
          </Text>
        </Flex>
        <Flex
          className="bg-subtle px-4 py-2 border-t border-border"
          align="center"
          justify="end"
          gap="sm"
        >
          <button className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded">
            Submit
          </button>
        </Flex>
      </>
    ),
  },
};

export const NavbarPattern: Story = {
  args: {
    justify: "between",
    align: "center",
    className:
      "w-full bg-surface border border-border rounded-xl px-6 py-4 shadow-xs",
    children: (
      <>
        <Flex gap="lg" align="center">
          <Text variant="h3" color="foreground">
            AppBrand
          </Text>
          <Flex gap="md" className="hidden sm:flex">
            <Text variant="body" color="muted" className="hover:text-foreground cursor-pointer">
              Forms
            </Text>
            <Text variant="body" color="muted" className="hover:text-foreground cursor-pointer">
              Workflows
            </Text>
            <Text variant="body" color="muted" className="hover:text-foreground cursor-pointer">
              Settings
            </Text>
          </Flex>
        </Flex>
        <Flex gap="sm" align="center">
          <button className="text-sm text-muted hover:text-foreground px-3 py-1.5">
            Sign In
          </button>
          <button className="bg-primary text-primary-foreground text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-primary/90">
            Get Started
          </button>
        </Flex>
      </>
    ),
  },
};

export const CardGrid: Story = {
  args: {
    wrap: "wrap",
    gap: "md",
    justify: "start",
    className: "w-full",
    children: Array.from({ length: 4 }, (_, i) => (
      <Flex
        key={i}
        direction="col"
        className="flex-1 min-w-[180px] bg-surface border border-border rounded-xl p-4 shadow-xs"
        gap="xs"
      >
        <div className="w-full h-20 bg-subtle rounded-lg flex items-center justify-center">
          <Text variant="caption" color="muted">Preview {i + 1}</Text>
        </div>
        <Text variant="body" bold color="foreground" className="mt-1">
          Form Step {i + 1}
        </Text>
        <Text variant="caption" color="muted">
          Configurable step parameters
        </Text>
      </Flex>
    )),
  },
};

export const FormLayout: Story = {
  args: {
    direction: "col",
    gap: "md",
    className:
      "w-full max-w-md mx-auto bg-surface p-6 rounded-xl border border-border shadow-xs",
    children: (
      <>
        <Text variant="h3" color="foreground">
          Account Login
        </Text>
        <Flex direction="col" gap="xs">
          <Text variant="caption" color="foreground" bold>
            Email Address
          </Text>
          <input
            className="px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
            placeholder="name@example.com"
          />
        </Flex>
        <Flex direction="col" gap="xs">
          <Text variant="caption" color="foreground" bold>
            Password
          </Text>
          <input
            type="password"
            className="px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
            placeholder="••••••••"
          />
        </Flex>
        <Flex justify="end" className="pt-2">
          <button className="bg-primary text-primary-foreground text-sm font-medium px-5 py-2 rounded-lg hover:bg-primary/90">
            Sign In
          </button>
        </Flex>
      </>
    ),
  },
};