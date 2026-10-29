import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { Text } from "../atoms/Text";
import { Box } from "./Box";
import { Flex } from "./Flex";
import { Layer } from "./Layer";

const meta: Meta<typeof Layer> = {
  title: "Primitives/Layout/Layer",
  component: Layer,
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
    level: {
      control: "select",
      options: [
        "base",
        "raised",
        "overlay",
        "modal",
        "popover",
        "tooltip",
        "toast",
        "overlap",
      ],
    },
    position: {
      control: "select",
      options: ["static", "relative", "absolute", "fixed", "sticky"],
    },
    inset: { control: "boolean" },
    isolate: { control: "boolean" },
    asChild: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Layer>;

export const Default: Story = {
  args: {
    className: "w-full",
    children: (
      <Box variant="card" p="md">
        <Text variant="body" bold color="foreground">
          Base Layer (tokens.zIndices.base)
        </Text>
        <Text variant="caption" color="muted">
          Standard z-index ground level for default canvas elements.
        </Text>
      </Box>
    ),
  },
};

export const RaisedLevel: Story = {
  args: {
    level: "raised",
    className: "w-full",
    children: (
      <Box variant="elevated" p="md">
        <Text variant="body" bold color="foreground">
          Raised Layer Level
        </Text>
        <Text variant="caption" color="muted">
          Elevated surface with elevated shadow and z-index priority.
        </Text>
      </Box>
    ),
  },
};

export const ModalLevel: Story = {
  render: () => (
    <div className="relative h-64 bg-subtle rounded-xl overflow-hidden border border-border p-4">
      <div className="space-y-2 opacity-40">
        <Text variant="h3" color="foreground">Background Form Context</Text>
        <Text variant="caption" color="muted">Underlying content obscured when modal layer activates.</Text>
      </div>

      <Layer
        level="modal"
        position="absolute"
        inset
        className="bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      >
        <Box variant="card" p="md" className="max-w-sm w-full space-y-3">
          <Text variant="body" bold color="foreground">
            Confirmation Dialog
          </Text>
          <Text variant="caption" color="muted">
            Are you sure you want to discard unsaved form changes?
          </Text>
          <Flex gap="sm" justify="end" className="pt-2">
            <button className="px-3 py-1.5 text-xs text-muted border border-border rounded hover:text-foreground">
              Cancel
            </button>
            <button className="px-3 py-1.5 text-xs bg-danger text-white rounded hover:bg-danger/90">
              Discard
            </button>
          </Flex>
        </Box>
      </Layer>
    </div>
  ),
};

export const ToastLevel: Story = {
  render: () => (
    <div className="relative h-48 bg-subtle rounded-xl p-4 border border-border">
      <Text variant="body" color="muted">
        Form submission in progress...
      </Text>
      <Layer
        level="toast"
        position="absolute"
        className="bottom-4 right-4 max-w-sm"
      >
        <div className="px-4 py-3 bg-success text-white rounded-lg shadow-lg flex items-center gap-3">
          <Text variant="caption" bold className="text-white">
            Form draft successfully autosaved!
          </Text>
        </div>
      </Layer>
    </div>
  ),
};

export const WithIsolate: Story = {
  args: {
    level: "modal",
    position: "relative",
    isolate: true,
    className:
      "w-full bg-primary/10 border border-primary/20 rounded-xl p-4 space-y-2",
    children: (
      <>
        <Text variant="body" bold color="primary">
          Isolated Stacking Context (`isolate: true`)
        </Text>
        <Text variant="caption" color="primary">
          Prevents internal z-indexes from clashing with surrounding layout elements.
        </Text>
      </>
    ),
  },
};