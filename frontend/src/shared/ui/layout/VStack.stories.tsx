import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { cn } from "@libs/utils";
import { Text } from "../atoms/Text";
import { Flex } from "./Flex";
import { VStack } from "./VStack";

const meta: Meta<typeof VStack> = {
  title: "Primitives/Layout/VStack",
  component: VStack,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl mx-auto">
        <Story />
      </div>
    ),
  ],
  argTypes: {
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
type Story = StoryObj<typeof VStack>;

const StackCard = ({
  title,
  desc,
  className = "",
}: {
  title: React.ReactNode;
  desc?: React.ReactNode;
  className?: string;
}) => (
  <div
    className={cn(
      "w-full px-4 py-3 bg-surface border border-border rounded-lg shadow-xs flex flex-col justify-center",
      className
    )}
  >
    <Text variant="body" bold color="foreground">
      {title}
    </Text>
    {desc && (
      <Text variant="caption" color="muted">
        {desc}
      </Text>
    )}
  </div>
);

export const Default: Story = {
  args: {
    gap: "md",
    className: "w-full",
    children: (
      <>
        <StackCard title="1. Account Setup" desc="Define organization profile and billing tier" />
        <StackCard title="2. Team Members" desc="Invite collaborators and assign RBAC roles" />
        <StackCard title="3. Security Policy" desc="Configure SSO, 2FA, and IP allowlisting" />
      </>
    ),
  },
};

export const WithGap: Story = {
  args: {
    gap: "xl",
    className: "w-full",
    children: (
      <>
        <StackCard title="Major Section A" desc="Separated by gap=xl (32px)" />
        <StackCard title="Major Section B" desc="Clear visual separation between distinct blocks" />
        <StackCard title="Major Section C" desc="Eliminates crowded forms" />
      </>
    ),
  },
};

export const AlignStart: Story = {
  args: {
    align: "start",
    gap: "md",
    className: "w-full",
    children: (
      <>
        <div className="w-48 px-3 py-2 bg-primary text-primary-foreground rounded-lg shadow-xs">
          <Text variant="caption" bold className="text-primary-foreground">
            Align Start (w-48)
          </Text>
        </div>
        <div className="w-72 px-3 py-2 bg-primary/90 text-primary-foreground rounded-lg shadow-xs">
          <Text variant="caption" bold className="text-primary-foreground">
            Wider Item (w-72)
          </Text>
        </div>
        <div className="w-36 px-3 py-2 bg-primary/80 text-primary-foreground rounded-lg shadow-xs">
          <Text variant="caption" bold className="text-primary-foreground">
            Compact (w-36)
          </Text>
        </div>
      </>
    ),
  },
};

export const AlignCenter: Story = {
  args: {
    align: "center",
    gap: "md",
    className: "w-full",
    children: (
      <>
        <div className="w-48 px-3 py-2 bg-secondary text-white rounded-lg shadow-xs text-center">
          <Text variant="caption" bold className="text-white">
            Center Aligned (w-48)
          </Text>
        </div>
        <div className="w-72 px-3 py-2 bg-secondary/90 text-white rounded-lg shadow-xs text-center">
          <Text variant="caption" bold className="text-white">
            Wider Centered (w-72)
          </Text>
        </div>
        <div className="w-36 px-3 py-2 bg-secondary/80 text-white rounded-lg shadow-xs text-center">
          <Text variant="caption" bold className="text-white">
            Compact (w-36)
          </Text>
        </div>
      </>
    ),
  },
};

export const AlignEnd: Story = {
  args: {
    align: "end",
    gap: "md",
    className: "w-full",
    children: (
      <>
        <div className="w-48 px-3 py-2 bg-accent text-white rounded-lg shadow-xs text-right">
          <Text variant="caption" bold className="text-white">
            Align End (w-48)
          </Text>
        </div>
        <div className="w-72 px-3 py-2 bg-accent/90 text-white rounded-lg shadow-xs text-right">
          <Text variant="caption" bold className="text-white">
            Wider Item (w-72)
          </Text>
        </div>
        <div className="w-36 px-3 py-2 bg-accent/80 text-white rounded-lg shadow-xs text-right">
          <Text variant="caption" bold className="text-white">
            Compact (w-36)
          </Text>
        </div>
      </>
    ),
  },
};

export const StretchAlign: Story = {
  args: {
    align: "stretch",
    gap: "md",
    className: "w-full",
    children: (
      <>
        <StackCard title="Default Stretch (Full Width)" desc="Automatically spans full horizontal width" />
        <StackCard title="Consistent Edge Alignment" desc="No hardcoded widths required" />
      </>
    ),
  },
};

export const FormStack: Story = {
  args: {
    gap: "md",
    className:
      "w-full max-w-md mx-auto bg-surface p-6 rounded-xl border border-border shadow-xs",
    children: (
      <>
        <VStack gap="xs">
          <Text variant="h3" color="foreground">
            Create User Profile
          </Text>
          <Text variant="caption" color="muted">
            All fields marked with an asterisk are required.
          </Text>
        </VStack>

        <VStack gap="xs">
          <Text variant="caption" bold color="foreground">
            Username *
          </Text>
          <input
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
            placeholder="johndoe"
          />
        </VStack>

        <VStack gap="xs">
          <Text variant="caption" bold color="foreground">
            Email Address *
          </Text>
          <input
            type="email"
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
            placeholder="john@example.com"
          />
        </VStack>

        <VStack gap="xs">
          <Text variant="caption" bold color="foreground">
            Password *
          </Text>
          <input
            type="password"
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
            placeholder="••••••••"
          />
        </VStack>

        <button className="w-full mt-2 bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 font-medium text-sm transition-colors">
          Create Account
        </button>
      </>
    ),
  },
};

export const CardStack: Story = {
  args: {
    gap: "md",
    className: "w-full max-w-lg mx-auto",
    children: (
      <>
        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-2">
          <Text variant="body" bold color="foreground">
            Primary Plan & Subscription
          </Text>
          <Text variant="caption" color="muted">
            Pro Plan billed annually. Renews on November 15, 2026.
          </Text>
          <Flex gap="sm" justify="end" className="pt-2">
            <button className="text-xs text-muted hover:text-foreground px-3 py-1.5">
              Change Plan
            </button>
            <button className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/90">
              Manage
            </button>
          </Flex>
        </div>

        <div className="bg-surface border border-border rounded-xl p-5 shadow-xs space-y-2">
          <Text variant="body" bold color="foreground">
            Payment Method
          </Text>
          <Text variant="caption" color="muted">
            Visa ending in 4242 &bull; Expires 08/28
          </Text>
          <Flex gap="sm" justify="end" className="pt-2">
            <button className="text-xs text-muted hover:text-foreground px-3 py-1.5">
              Remove
            </button>
            <button className="text-xs bg-secondary text-white px-3 py-1.5 rounded-lg hover:bg-secondary/90">
              Update
            </button>
          </Flex>
        </div>
      </>
    ),
  },
};

export const FillHeight: Story = {
  args: {
    fill: true,
    gap: "sm",
    className: "w-full h-64",
    children: (
      <>
        <div className="bg-primary text-primary-foreground rounded-lg flex items-center justify-center flex-1">
          <Text variant="caption" bold className="text-primary-foreground">
            Header (flex-1)
          </Text>
        </div>
        <div className="bg-success text-white rounded-lg flex items-center justify-center flex-1">
          <Text variant="caption" bold className="text-white">
            Main Body (flex-1)
          </Text>
        </div>
        <div className="bg-surface border border-border text-foreground rounded-lg flex items-center justify-center flex-1">
          <Text variant="caption" color="muted">
            Footer (flex-1)
          </Text>
        </div>
      </>
    ),
  },
};