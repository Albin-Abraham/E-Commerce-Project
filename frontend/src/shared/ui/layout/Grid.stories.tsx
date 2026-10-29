import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { cn } from "@libs/utils";
import { Text } from "../atoms/Text";
import { Grid, GridItem } from "./Grid";

const meta: Meta<typeof Grid> = {
  title: "Primitives/Layout/Grid",
  component: Grid,
  subcomponents: { GridItem },
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-5xl mx-auto">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    columns: {
      control: "select",
      options: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    },
    gap: {
      control: "select",
      options: ["none", "xs", "sm", "md", "lg", "xl", "2xl"],
    },
    align: {
      control: "select",
      options: ["start", "center", "end", "stretch", "baseline"],
    },
    justify: {
      control: "select",
      options: ["start", "center", "end", "between", "around", "evenly"],
    },
    asChild: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Grid>;

const Cell = ({
  children,
  className = "",
  span = 1,
}: {
  children: React.ReactNode;
  className?: string;
  span?: number;
}) => (
  <GridItem
    colSpan={span}
    className={cn(
      "p-4 bg-surface border border-border rounded-xl flex flex-col justify-center shadow-xs",
      className
    )}
  >
    <Text variant="caption" color="muted" className="font-mono">
      {children}
    </Text>
  </GridItem>
);

export const Default: Story = {
  args: {
    columns: 12,
    gap: "md",
    className: "w-full",
    children: (
      <>
        <Cell span={4}>colSpan=4 (One Third)</Cell>
        <Cell span={4}>colSpan=4 (One Third)</Cell>
        <Cell span={4}>colSpan=4 (One Third)</Cell>
      </>
    ),
  },
};

export const AutoColumns: Story = {
  args: {
    columns: 3,
    gap: "md",
    className: "w-full",
    children: (
      <>
        <Cell>Column 1</Cell>
        <Cell>Column 2</Cell>
        <Cell>Column 3</Cell>
        <Cell>Row 2 Col 1</Cell>
        <Cell>Row 2 Col 2</Cell>
        <Cell>Row 2 Col 3</Cell>
      </>
    ),
  },
};

export const ResponsiveSpans: Story = {
  args: {
    columns: 12,
    gap: "md",
    className: "w-full",
    children: (
      <>
        {[1, 2, 3, 4].map((idx) => (
          <GridItem
            key={idx}
            colSpan={{ base: 12, sm: 6, lg: 3 }}
            className="p-4 bg-success/10 border border-success/20 rounded-xl flex flex-col justify-center"
          >
            <Text variant="caption" bold color="success" className="font-mono">
              Card {idx}
            </Text>
            <Text variant="caption" color="muted">
              colSpan: base 12 &bull; sm 6 &bull; lg 3
            </Text>
          </GridItem>
        ))}
      </>
    ),
  },
};

export const DashboardLayout: Story = {
  args: {
    columns: 12,
    gap: "md",
    className: "w-full",
    children: (
      <>
        <GridItem
          colSpan={12}
          className="p-5 bg-primary text-primary-foreground rounded-xl shadow-xs flex items-center justify-between"
        >
          <div>
            <Text variant="h3" bold className="text-primary-foreground">
              Application Overview
            </Text>
            <Text variant="caption" className="text-primary-foreground/80">
              colSpan=12 &bull; Master Header Row
            </Text>
          </div>
          <button className="px-3 py-1.5 text-xs font-medium bg-primary-foreground/20 text-primary-foreground rounded-lg hover:bg-primary-foreground/30">
            Export
          </button>
        </GridItem>

        <GridItem
          colSpan={{ base: 12, lg: 8 }}
          className="p-6 bg-surface border border-border rounded-xl shadow-xs space-y-3"
        >
          <Text variant="h3" color="foreground">
            Primary Form Stream
          </Text>
          <Text variant="caption" color="muted">
            colSpan=8 (Desktop) / colSpan=12 (Mobile). Houses the main active step or complex fields.
          </Text>
          <div className="h-32 bg-subtle border border-dashed border-border rounded-lg flex items-center justify-center">
            <Text variant="caption" color="muted" className="font-mono">
              Form Work Area
            </Text>
          </div>
        </GridItem>

        <GridItem
          colSpan={{ base: 12, lg: 4 }}
          className="p-6 bg-surface border border-border rounded-xl shadow-xs space-y-3"
        >
          <Text variant="body" bold color="foreground">
            Context Sidebar
          </Text>
          <Text variant="caption" color="muted">
            colSpan=4 &bull; Summary & validation cues.
          </Text>
          <div className="p-3 bg-subtle rounded-lg space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted">Progress</span>
              <span className="font-semibold text-primary">65%</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted">Fields Validated</span>
              <span className="font-semibold text-success">12 / 18</span>
            </div>
          </div>
        </GridItem>

        <GridItem
          colSpan={12}
          className="p-4 bg-subtle border border-border rounded-xl flex items-center justify-between"
        >
          <Text variant="caption" color="muted">
            colSpan=12 &bull; Footer Control Bar
          </Text>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-xs text-muted border border-border rounded hover:text-foreground">
              Back
            </button>
            <button className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90">
              Continue
            </button>
          </div>
        </GridItem>
      </>
    ),
  },
};

export const FormGrid: Story = {
  args: {
    columns: 12,
    gap: "md",
    className:
      "w-full bg-surface p-6 rounded-xl border border-border shadow-xs",
    children: (
      <>
        <GridItem colSpan={12}>
          <Text variant="h3" color="foreground">
            Shipping & Billing Address
          </Text>
          <Text variant="caption" color="muted">
            12-column grid composing individual input fields into responsive rows.
          </Text>
        </GridItem>

        <GridItem colSpan={{ base: 12, md: 6 }} className="space-y-1">
          <Text variant="caption" bold color="foreground">
            First Name *
          </Text>
          <input
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
            placeholder="Jane"
          />
        </GridItem>

        <GridItem colSpan={{ base: 12, md: 6 }} className="space-y-1">
          <Text variant="caption" bold color="foreground">
            Last Name *
          </Text>
          <input
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
            placeholder="Doe"
          />
        </GridItem>

        <GridItem colSpan={12} className="space-y-1">
          <Text variant="caption" bold color="foreground">
            Street Address *
          </Text>
          <input
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
            placeholder="123 Market Street, Suite 400"
          />
        </GridItem>

        <GridItem colSpan={{ base: 12, md: 5 }} className="space-y-1">
          <Text variant="caption" bold color="foreground">
            City *
          </Text>
          <input
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
            placeholder="San Francisco"
          />
        </GridItem>

        <GridItem colSpan={{ base: 12, md: 4 }} className="space-y-1">
          <Text variant="caption" bold color="foreground">
            State / Province *
          </Text>
          <input
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
            placeholder="California"
          />
        </GridItem>

        <GridItem colSpan={{ base: 12, md: 3 }} className="space-y-1">
          <Text variant="caption" bold color="foreground">
            Postal Code *
          </Text>
          <input
            className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground"
            placeholder="94105"
          />
        </GridItem>

        <GridItem colSpan={12} className="flex justify-end pt-3">
          <button className="bg-primary text-primary-foreground text-sm font-medium px-5 py-2 rounded-lg hover:bg-primary/90">
            Save Address
          </button>
        </GridItem>
      </>
    ),
  },
};