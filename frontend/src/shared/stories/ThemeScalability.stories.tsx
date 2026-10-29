import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { Box } from "@ui/layout/Box";
import { Flex } from "@ui/layout/Flex";
import { Grid, GridItem } from "@ui/layout/Grid";
import { VStack } from "@ui/layout/VStack";
import { Text } from "@ui/atoms/Text";

const meta: Meta = {
  title: "Showcase/Theme Scalability & Extensibility",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj;

const SampleCard = ({
  themeTitle,
  themeClass = "",
  styleOverrides = {},
}: {
  themeTitle: string;
  themeClass?: string;
  styleOverrides?: React.CSSProperties;
}) => (
  <div
    className={`p-6 rounded-2xl border border-border shadow-sm transition-all duration-300 ${themeClass}`}
    style={styleOverrides}
  >
    <VStack gap="md">
      <Flex justify="between" align="center">
        <VStack gap="none">
          <Text variant="caption" color="muted" bold>THEME SCOPE</Text>
          <Text variant="h2" bold color="foreground">{themeTitle}</Text>
        </VStack>
        <span className="px-3 py-1 text-xs font-bold rounded-full bg-primary/10 text-primary border border-primary/20">
          Token Active
        </span>
      </Flex>

      <Box variant="card" p="md" className="space-y-3">
        <Text variant="body" bold color="foreground">
          Dynamic User Profile Form
        </Text>
        <VStack gap="xs">
          <Text variant="caption" color="muted" bold>
            Account Identifier
          </Text>
          <input
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary outline-none"
            defaultValue="zenith-enterprise-admin"
          />
        </VStack>
        <Flex justify="between" align="center" className="pt-2">
          <Text variant="caption" color="muted">
            Status: <span className="text-success font-semibold">Active Tier</span>
          </Text>
          <button className="px-4 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
            Save Preferences
          </button>
        </Flex>
      </Box>
    </VStack>
  </div>
);

export const MultiThemeSideBySide: Story = {
  render: () => (
    <VStack gap="lg" className="w-full max-w-6xl mx-auto">
      <VStack gap="xs" className="mb-2">
        <Text variant="h1" bold color="foreground">
          Zero-Code Token Extensibility Showcase
        </Text>
        <Text variant="body" color="muted">
          All 3 panels render identical component JSX. Colors, borders, surfaces, and focus rings
          adapt dynamically via CSS variable scoping mapped to tokens.css.
        </Text>
      </VStack>

      <Grid columns={{ base: 1, lg: 3 }} gap="lg">
        {/* Scope 1: Zenith Default */}
        <GridItem colSpan={1}>
          <SampleCard
            themeTitle="1. Zenith Default"
          />
        </GridItem>

        {/* Scope 2: Emerald Corporate Theme */}
        <GridItem colSpan={1}>
          <SampleCard
            themeTitle="2. Emerald Corporate"
            styleOverrides={{
              "--color-primary": "#059669",
              "--color-primary-rgb": "5, 150, 105",
              "--color-surface": "#f0fdf4",
              "--color-background": "#ecfdf5",
              "--color-border": "#a7f3d0",
            } as any}
          />
        </GridItem>

        {/* Scope 3: Obsidian Violet Dark Theme */}
        <GridItem colSpan={1}>
          <SampleCard
            themeTitle="3. Obsidian Violet"
            styleOverrides={{
              "--color-primary": "#a855f7",
              "--color-primary-rgb": "168, 85, 247",
              "--color-surface": "#161320",
              "--color-background": "#0b0910",
              "--color-border": "#2e2842",
              "--color-foreground": "#f5f3ff",
              "--color-muted": "#9d93b8",
            } as any}
          />
        </GridItem>
      </Grid>
    </VStack>
  ),
};
