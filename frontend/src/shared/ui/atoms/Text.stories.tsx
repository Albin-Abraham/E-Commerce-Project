import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { Box } from "../layout/Box";
import { Flex } from "../layout/Flex";
import { Grid, GridItem } from "../layout/Grid";
import { VStack } from "../layout/VStack";
import { Text } from "./Text";

const meta: Meta<typeof Text> = {
  title: "Primitives/Atoms/Text",
  component: Text,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-3xl mx-auto">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    variant: {
      control: "select",
      options: [
        "hero",
        "h1",
        "h2",
        "h3",
        "bodyLarge",
        "body",
        "caption",
        "dataCell",
      ],
    },
    color: {
      control: "select",
      options: [
        "foreground",
        "muted",
        "primary",
        "secondary",
        "success",
        "warning",
        "danger",
        "subtle",
        "inherit",
      ],
    },
    bold: { control: "boolean" },
    as: {
      control: "select",
      options: [
        "p",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "span",
        "div",
        "a",
        "label",
        "button",
      ],
    },
    tabular: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Text>;

export const Hero: Story = {
  args: {
    variant: "hero",
    color: "foreground",
    children: "Hero Typography",
  },
};

export const H1: Story = {
  args: {
    variant: "h1",
    color: "foreground",
    children: "Heading 1 — Section Master Title",
  },
};

export const H2: Story = {
  args: {
    variant: "h2",
    color: "foreground",
    children: "Heading 2 — Card & Sub-section Header",
  },
};

export const H3: Story = {
  args: {
    variant: "h3",
    color: "foreground",
    children: "Heading 3 — Group & Fieldset Legend",
  },
};

export const BodyLarge: Story = {
  args: {
    variant: "bodyLarge",
    color: "foreground",
    children:
      "This is bodyLarge text. It's larger than standard body text and has relaxed line height for comfortable reading in form intros and instructions.",
  },
};

export const Body: Story = {
  args: {
    variant: "body",
    color: "foreground",
    children:
      "This is the default body text. It uses the base font size with normal line height, suitable for inputs, general copy, and form field descriptions.",
  },
};

export const Caption: Story = {
  args: {
    variant: "caption",
    color: "muted",
    children: "CAPTION & METADATA TEXT (UPPERCASE OR MICRO-LABEL)",
  },
};

export const DataCell: Story = {
  args: {
    variant: "dataCell",
    color: "primary",
    tabular: true,
    children: "$1,234,567.89",
  },
};

export const ColorScaleShowcase: Story = {
  render: () => (
    <VStack gap="sm" className="w-full">
      <Text variant="caption" color="muted">
        SEMANTIC TOKEN COLORS (100% TIED TO TOKENS.CSS)
      </Text>
      <Text variant="bodyLarge" bold color="foreground">
        color="foreground" — Primary content and high-contrast titles
      </Text>
      <Text variant="body" color="muted">
        color="muted" — Helper notes, descriptions, secondary metadata
      </Text>
      <Text variant="body" bold color="primary">
        color="primary" — Interactive brand focus, links, and selected states
      </Text>
      <Text variant="body" bold color="secondary">
        color="secondary" — Secondary brand accents and badge accents
      </Text>
      <Text variant="body" bold color="success">
        color="success" — Positive affirmations, verified checks, completed steps
      </Text>
      <Text variant="body" bold color="warning">
        color="warning" — Non-blocking warnings and unsaved change notices
      </Text>
      <Text variant="body" bold color="danger">
        color="danger" — Critical errors, validation hints, destructive actions
      </Text>
      <Text variant="caption" color="subtle">
        color="subtle" — Low-contrast timestamps and watermarks
      </Text>
    </VStack>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <VStack gap="md" className="w-full">
      <div className="pb-2 border-b border-border">
        <Text variant="caption" color="muted">HERO (40px/48px)</Text>
        <Text variant="hero" color="foreground">Hero Title Banner</Text>
      </div>

      <div className="pb-2 border-b border-border">
        <Text variant="caption" color="muted">H1 (32px/40px)</Text>
        <Text variant="h1" color="foreground">Heading 1 — Master Form Title</Text>
      </div>

      <div className="pb-2 border-b border-border">
        <Text variant="caption" color="muted">H2 (24px/32px)</Text>
        <Text variant="h2" color="foreground">Heading 2 — Section Header</Text>
      </div>

      <div className="pb-2 border-b border-border">
        <Text variant="caption" color="muted">H3 (20px/28px)</Text>
        <Text variant="h3" color="foreground">Heading 3 — Grouped Controls Legend</Text>
      </div>

      <div className="pb-2 border-b border-border">
        <Text variant="caption" color="muted">BODY LARGE (18px/28px)</Text>
        <Text variant="bodyLarge" color="foreground">
          Body Large — Guidance paragraph explaining the verification criteria for applicants.
        </Text>
      </div>

      <div className="pb-2 border-b border-border">
        <Text variant="caption" color="muted">BODY (14px/20px)</Text>
        <Text variant="body" color="foreground">
          Default body text for form labels, descriptions, and standard UI controls.
        </Text>
      </div>

      <div className="pb-2 border-b border-border">
        <Text variant="caption" color="muted">CAPTION (12px/16px)</Text>
        <Text variant="caption" color="muted">
          MICRO-COPY, VALIDATION HINTS, HELPER NOTES & TIMESTAMP BADGES
        </Text>
      </div>

      <div>
        <Text variant="caption" color="muted">DATA CELL (13px/tabular)</Text>
        <Text variant="dataCell" tabular color="success">
          +4,289.50 USD &bull; TABULAR NUMERIC ALIGNMENT
        </Text>
      </div>
    </VStack>
  ),
};

export const TypographyWrappedInVStack: Story = {
  render: () => (
    <VStack gap="lg" className="w-full">
      <VStack gap="xs">
        <Text variant="h2" bold color="foreground">
          Step 2: Personal Identification
        </Text>
        <Text variant="body" color="muted">
          Please provide government-issued credentials. Your data is encrypted end-to-end.
        </Text>
      </VStack>

      <Box variant="subtle" p="md" className="rounded-xl">
        <VStack gap="xs">
          <Text variant="caption" bold color="primary">
            Important Notice
          </Text>
          <Text variant="body" color="foreground">
            Make sure your document name exactly matches your account registration details.
          </Text>
        </VStack>
      </Box>
    </VStack>
  ),
};

export const TypographyWrappedInFlex: Story = {
  render: () => (
    <VStack gap="md" className="w-full">
      <Flex justify="between" align="center" className="p-4 bg-surface rounded-xl border border-border shadow-xs">
        <VStack gap="none">
          <Text variant="body" bold color="foreground">
            Two-Factor Authentication (2FA)
          </Text>
          <Text variant="caption" color="muted">
            Secure login with authenticator app
          </Text>
        </VStack>
        <span className="px-2.5 py-1 text-xs font-semibold bg-success/10 text-success rounded-full border border-success/20">
          Enabled
        </span>
      </Flex>

      <Flex justify="between" align="center" className="p-4 bg-surface rounded-xl border border-border shadow-xs">
        <VStack gap="none">
          <Text variant="body" bold color="foreground">
            Email Notifications
          </Text>
          <Text variant="caption" color="muted">
            Receive summaries of form submissions
          </Text>
        </VStack>
        <span className="px-2.5 py-1 text-xs font-semibold bg-subtle text-muted rounded-full border border-border">
          Disabled
        </span>
      </Flex>
    </VStack>
  ),
};

export const TypographyWrappedInGrid: Story = {
  render: () => (
    <Grid columns={12} gap="md" className="w-full">
      <GridItem colSpan={{ base: 12, sm: 6, lg: 3 }} className="p-4 bg-surface rounded-xl border border-border shadow-xs">
        <Text variant="caption" color="muted" bold>
          Total Submissions
        </Text>
        <Text variant="h1" bold color="foreground" className="mt-1">
          1,482
        </Text>
        <Text variant="caption" color="success" bold>
          &uarr; 14% vs last week
        </Text>
      </GridItem>

      <GridItem colSpan={{ base: 12, sm: 6, lg: 3 }} className="p-4 bg-surface rounded-xl border border-border shadow-xs">
        <Text variant="caption" color="muted" bold>
          Completion Rate
        </Text>
        <Text variant="h1" bold color="foreground" className="mt-1">
          92.4%
        </Text>
        <Text variant="caption" color="success" bold>
          &uarr; 2.1% improvement
        </Text>
      </GridItem>

      <GridItem colSpan={{ base: 12, sm: 6, lg: 3 }} className="p-4 bg-surface rounded-xl border border-border shadow-xs">
        <Text variant="caption" color="muted" bold>
          Avg. Completion Time
        </Text>
        <Text variant="h1" bold color="foreground" className="mt-1">
          3m 12s
        </Text>
        <Text variant="caption" color="primary" bold>
          Optimized flow
        </Text>
      </GridItem>

      <GridItem colSpan={{ base: 12, sm: 6, lg: 3 }} className="p-4 bg-surface rounded-xl border border-border shadow-xs">
        <Text variant="caption" color="muted" bold>
          Pending Validation
        </Text>
        <Text variant="h1" bold color="foreground" className="mt-1">
          7
        </Text>
        <Text variant="caption" color="warning" bold>
          Requires review
        </Text>
      </GridItem>
    </Grid>
  ),
};

export const FormFieldTypographyHierarchy: Story = {
  render: () => (
    <VStack gap="lg" className="w-full max-w-lg mx-auto">
      <VStack gap="xs">
        <Text variant="h2" bold color="foreground">
          Form Field Typography Anatomy
        </Text>
        <Text variant="caption" color="muted">
          How Atomics (`Text` tokens) integrate seamlessly into form input controls.
        </Text>
      </VStack>

      <VStack gap="xs" className="w-full">
        <Flex justify="between" align="baseline">
          <Text variant="body" as="label" bold color="foreground">
            Work Email Address <span className="text-danger font-bold">*</span>
          </Text>
          <Text variant="caption" color="muted">
            Required
          </Text>
        </Flex>

        <input
          type="email"
          className="w-full px-3.5 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
          placeholder="alex@company.com"
          defaultValue="invalid-email@"
        />

        <Text variant="caption" color="danger" bold className="flex items-center gap-1">
          &bull; Please enter a valid corporate email domain (e.g. name@company.com)
        </Text>

        <Text variant="caption" color="muted">
          Verification links and invoice receipts will be sent to this address.
        </Text>
      </VStack>
    </VStack>
  ),
};