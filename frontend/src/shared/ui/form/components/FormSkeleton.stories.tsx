import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  FormSkeleton,
  FormErrorState,
  FormEmptyState,
} from "./FormSkeleton";
import { FieldSkeleton, CardSkeleton } from "./FieldSkeleton";

const meta: Meta<typeof FormSkeleton> = {
  title: "Form/Shell & Feedback/FormSkeleton",
  component: FormSkeleton,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof FormSkeleton>;

export const DefaultLoadingSkeleton: Story = {
  args: {
    fieldCount: 6,
    columns: 2,
  },
};

export const SingleColumnSkeleton: Story = {
  args: {
    fieldCount: 4,
    columns: 1,
  },
};

export const ErrorStateFallback: Story = {
  render: () => (
    <FormErrorState
      message="Unable to load remote form definition from the schema service (HTTP 503)."
      onRetry={() => alert("Retrying schema fetch...")}
    />
  ),
};

export const EmptyStateFallback: Story = {
  render: () => (
    <FormEmptyState message="No schema or field definition is registered for this entity." />
  ),
};

export const IndividualFieldSkeleton: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-4">
      <FieldSkeleton type="text" />
      <FieldSkeleton type="select" />
      <FieldSkeleton type="textarea" />
    </div>
  ),
};

export const IndividualCardSkeleton: Story = {
  render: () => (
    <div className="w-full max-w-lg">
      <CardSkeleton />
    </div>
  ),
};
