import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { FieldIcon } from "./FieldIcon";

const meta: Meta<typeof FieldIcon> = {
  title: "Form/Atoms/FieldIcon",
  component: FieldIcon,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="p-8 bg-background text-foreground flex items-center gap-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FieldIcon>;

export const Default: Story = {
  args: {
    iconName: "user",
    className: "text-primary",
  },
};

export const CustomColor: Story = {
  args: {
    iconName: "mail",
    className: "text-danger",
  },
};

export const CustomScale: Story = {
  args: {
    iconName: "settings",
    className: "text-muted-foreground hover:text-foreground transition-colors",
  },
};

export const IconRegistryGallery: Story = {
  render: () => {
    const iconNames = [
      "user",
      "mail",
      "lock",
      "calendar",
      "search",
      "settings",
      "building",
      "globe",
      "activity",
      "map-pin",
      "phone",
      "link",
    ];

    return (
      <div className="grid grid-cols-4 gap-4 p-4 border border-border rounded-lg bg-surface">
        {iconNames.map((name) => (
          <div key={name} className="flex flex-col items-center gap-2 p-3 rounded bg-muted/20">
            <FieldIcon iconName={name} className="text-primary" />
            <span className="text-xs text-muted-foreground font-mono">{name}</span>
          </div>
        ))}
      </div>
    );
  },
};
