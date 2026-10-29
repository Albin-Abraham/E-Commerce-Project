import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { Text } from "../atoms/Text";
import { Box } from "./Box";

const meta: Meta<typeof Box> = {
  title: "Primitives/Layout/Box",
  component: Box,
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
    variant: {
      control: "select",
      options: ["default", "surface", "card", "glass", "subtle", "elevated"],
    },
    asChild: { control: "boolean" },
    p: {
      control: "select",
      options: ["none", "xs", "sm", "md", "lg", "xl", "2xl", "auto"],
    },
    m: {
      control: "select",
      options: ["none", "xs", "sm", "md", "lg", "xl", "2xl", "auto"],
    },
    px: {
      control: "select",
      options: ["none", "xs", "sm", "md", "lg", "xl", "2xl", "auto"],
    },
    py: {
      control: "select",
      options: ["none", "xs", "sm", "md", "lg", "xl", "2xl", "auto"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Box>;

export const Default: Story = {
  args: {
    p: "md",
    className: "w-full",
    children: (
      <div className="space-y-1">
        <Text variant="body" bold color="foreground">
          Default Box Container
        </Text>
        <Text variant="caption" color="muted">
          Acts as the universal layout canvas with tokenized padding and margins.
        </Text>
      </div>
    ),
  },
};

export const CardVariant: Story = {
  args: {
    variant: "card",
    p: "lg",
    className: "w-full space-y-3",
    children: (
      <>
        <div className="space-y-1">
          <Text variant="h3" color="foreground">
            Applicant Information Card
          </Text>
          <Text variant="caption" color="muted">
            Uses variant="card" mapped to tokens.css surface, border, and elevation.
          </Text>
        </div>
        <Box variant="subtle" p="sm" className="rounded-lg">
          <Text variant="caption" color="muted" className="font-mono">
            Form Field Container Payload &bull; variant="subtle"
          </Text>
        </Box>
        <div className="pt-2 flex justify-end">
          <button className="text-xs font-medium text-primary hover:underline">
            Edit Section &rarr;
          </button>
        </div>
      </>
    ),
  },
};

export const GlassVariant: Story = {
  args: {
    variant: "glass",
    p: "lg",
    className: "w-full space-y-2 rounded-xl",
    children: (
      <>
        <Text variant="body" bold color="foreground">
          Glassmorphic Box (variant="glass")
        </Text>
        <Text variant="caption" color="muted">
          Utilizes backdrop-blur and subtle translucent surface tokens from elevation.css.
        </Text>
      </>
    ),
  },
};

export const ElevatedVariant: Story = {
  args: {
    variant: "elevated",
    p: "lg",
    className: "w-full space-y-2 rounded-xl",
    children: (
      <>
        <Text variant="body" bold color="foreground">
          Elevated Box (variant="elevated")
        </Text>
        <Text variant="caption" color="muted">
          Uses surface-elevated tokens with higher z-plane shadow definition.
        </Text>
      </>
    ),
  },
};

export const WithPadding: Story = {
  args: {
    variant: "surface",
    p: "lg",
    className: "w-full rounded-xl",
    children: (
      <div className="space-y-1">
        <Text variant="body" bold color="success">
          Box with Large Padding (p=lg)
        </Text>
        <Text variant="caption" color="muted">
          Generous breathing room suitable for prominent callouts and form section cards.
        </Text>
      </div>
    ),
  },
};

export const WithMargin: Story = {
  args: {
    variant: "surface",
    p: "md",
    m: "md",
    className: "rounded-xl",
    children: (
      <div className="space-y-1">
        <Text variant="body" bold color="warning">
          Box with Margin Spacing (m=md)
        </Text>
        <Text variant="caption" color="muted">
          Applies external margins to isolate content from surrounding layout blocks.
        </Text>
      </div>
    ),
  },
};

export const AsChild: Story = {
  args: {
    asChild: true,
    variant: "subtle",
    p: "md",
    className:
      "w-full text-left rounded-xl transition-colors cursor-pointer hover:border-primary",
    children: (
      <button type="button">
        <Text variant="body" bold color="primary">
          Interactive Box as Button (Radix Slot)
        </Text>
        <Text variant="caption" color="muted">
          Delegates rendering to the child button tag while applying Box styling.
        </Text>
      </button>
    ),
  },
};

export const NestedBoxes: Story = {
  args: {
    variant: "surface",
    p: "lg",
    className: "w-full rounded-xl space-y-3",
    children: (
      <>
        <Text variant="body" bold color="foreground">
          Parent Box (Form Section &bull; variant="surface")
        </Text>
        <Box variant="card" p="md" className="space-y-2">
          <Text variant="caption" bold color="foreground">
            Child Box (Fieldset Container &bull; variant="card")
          </Text>
          <Box variant="subtle" p="sm" className="rounded border-dashed">
            <Text variant="caption" color="muted" className="font-mono">
              Grandchild Box (Individual Input Slot &bull; variant="subtle")
            </Text>
          </Box>
        </Box>
      </>
    ),
  },
};

export const ResponsiveSpacing: Story = {
  args: {
    variant: "surface",
    px: "lg",
    py: "md",
    className: "w-full rounded-xl",
    children: (
      <div className="space-y-1">
        <Text variant="body" bold color="primary">
          Directional Spacing (px=lg, py=md)
        </Text>
        <Text variant="caption" color="muted">
          Provides asymmetric horizontal and vertical padding for refined visual balance.
        </Text>
      </div>
    ),
  },
};