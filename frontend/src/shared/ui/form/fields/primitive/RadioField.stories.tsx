import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { FormRuntimeDecorator } from "../../stories/storybook-decorators";
import { FormRadioField } from "../wrapped-fields";

const meta: Meta<typeof FormRadioField> = {
  title: "Form/Fields/RadioField",
  component: FormRadioField,
  tags: ["autodocs"],
  decorators: [FormRuntimeDecorator],
  args: {
    onChange: fn(),
    field: {
      id: "subscription_tier",
      name: "subscriptionTier",
      type: "radio",
      label: "Subscription Plan",
      required: true,
      options: [
        { value: "starter", label: "Starter Tier", description: "Best for individuals and small prototypes" },
        { value: "professional", label: "Professional Tier", description: "Full features for scaling teams" },
        { value: "enterprise", label: "Enterprise Tier", description: "Custom security and dedicated SLA" },
      ],
    },
    value: "professional",
  },
};

export default meta;
type Story = StoryObj<typeof FormRadioField>;

export const Default: Story = {};

export const HorizontalLayout: Story = {
  args: {
    field: {
      id: "billing_cycle",
      name: "billingCycle",
      type: "radio",
      label: "Billing Frequency",
      properties: {
        direction: "row",
      },
      options: [
        { value: "monthly", label: "Monthly" },
        { value: "annual", label: "Annual (Save 20%)" },
      ],
    },
    value: "annual",
  },
};

export const WithErrorFeedback: Story = {
  args: {
    field: {
      id: "deployment_target",
      name: "deploymentTarget",
      type: "radio",
      label: "Primary Cloud Region",
      required: true,
      options: [
        { value: "us-east-1", label: "US East (N. Virginia)" },
        { value: "eu-central-1", label: "EU Central (Frankfurt)" },
        { value: "ap-southeast-1", label: "AP South (Mumbai)" },
      ],
    },
    value: undefined,
    error: true,
    errorMessage: "Selecting a deployment region is required to provision cluster resources.",
  },
};

export const DisabledOptions: Story = {
  args: {
    field: {
      id: "database_engine",
      name: "databaseEngine",
      type: "radio",
      label: "Managed Database Engine",
      options: [
        { value: "postgres", label: "PostgreSQL 16 (Available)" },
        { value: "mysql", label: "MySQL 8.0 (Available)" },
        { value: "oracle", label: "Oracle Enterprise (Maintenance)", disabled: true },
      ],
    },
    value: "postgres",
  },
};

export const InteractiveSelection: Story = {
  args: {
    field: {
      id: "interactive_tier",
      name: "interactiveTier",
      type: "radio",
      label: "Choose Deployment Scale",
      options: [
        { value: "free", label: "Free Hobbyist" },
        { value: "pro", label: "Pro Production" },
        { value: "custom", label: "Custom Enterprise" },
      ],
    },
    value: "free",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const freeRadio = canvas.getByRole("radio", { name: /Free Hobbyist/i });
    const proRadio = canvas.getByRole("radio", { name: /Pro Production/i });

    await expect(freeRadio).toBeChecked();
    await expect(proRadio).not.toBeChecked();

    await userEvent.click(proRadio);
    await expect(proRadio).toBeChecked();
    await expect(freeRadio).not.toBeChecked();
  },
};

export const CanonicalFlatProps: Story = {
  args: {
    name: "releaseChannel",
    type: "radio",
    component: "RadioField",
    id: "releaseChannel",
    label: "Software Release Channel",
    value: "stable",
    required: true,
    options: [
      { value: "stable", label: "Stable (Recommended)" },
      { value: "beta", label: "Beta Channel" },
      { value: "nightly", label: "Nightly Bleeding Edge" },
    ],
  } as any,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const stableRadio = canvas.getByRole("radio", { name: /Stable/i });
    const betaRadio = canvas.getByRole("radio", { name: /Beta/i });

    await expect(stableRadio).toBeInTheDocument();
    await expect(stableRadio).toHaveAttribute("name", "releaseChannel");
    await expect(stableRadio).toBeChecked();

    await userEvent.click(betaRadio);
    await expect(betaRadio).toBeChecked();
    await expect(stableRadio).not.toBeChecked();
  },
};

export const CardVariantShowcase: Story = {
  args: {
    field: {
      id: "cloud_provider",
      name: "cloudProvider",
      type: "radio",
      label: "Select Target Infrastructure",
      properties: {
        variant: "card",
      },
      options: [
        {
          value: "aws",
          label: "Amazon Web Services",
          description: "Production workloads with multi-AZ redundancy and global edge cache",
          icon: "Building2",
        },
        {
          value: "gcp",
          label: "Google Cloud Platform",
          description: "Optimized for machine learning models and high-throughput analytics",
          icon: "Network",
        },
        {
          value: "azure",
          label: "Microsoft Azure",
          description: "Enterprise compliance with dedicated private endpoints and hybrid cloud",
          icon: "Briefcase",
        },
      ],
    },
    value: "aws",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const awsRadio = canvas.getByRole("radio", { name: /Amazon Web Services/i });
    const gcpRadio = canvas.getByRole("radio", { name: /Google Cloud Platform/i });

    await expect(awsRadio).toBeChecked();
    await expect(gcpRadio).not.toBeChecked();

    await userEvent.click(gcpRadio);
    await expect(gcpRadio).toBeChecked();
    await expect(awsRadio).not.toBeChecked();
  },
};

export const SegmentedControlShowcase: Story = {
  args: {
    field: {
      id: "view_density",
      name: "viewDensity",
      type: "radio",
      label: "Grid Density Mode",
      properties: {
        variant: "segmented",
      },
      options: [
        { value: "compact", label: "Compact" },
        { value: "comfortable", label: "Comfortable" },
        { value: "spacious", label: "Spacious" },
      ],
    },
    value: "comfortable",
  },
};

