import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { FormRuntimeDecorator } from "../../stories/storybook-decorators";
import { FormAutocompleteField } from "../wrapped-fields";

const meta: Meta<typeof FormAutocompleteField> = {
  title: "Form/Fields/AutocompleteField",
  component: FormAutocompleteField,
  tags: ["autodocs"],
  decorators: [FormRuntimeDecorator],
  args: {
    onChange: fn(),
    field: {
      id: "country_autocomplete",
      name: "country",
      type: "autocomplete",
      label: "Origin Country / Jurisdiction",
      required: true,
      options: [
        { value: "us", label: "United States" },
        { value: "ca", label: "Canada" },
        { value: "gb", label: "United Kingdom" },
        { value: "de", label: "Germany" },
        { value: "fr", label: "France" },
        { value: "in", label: "India" },
        { value: "jp", label: "Japan" },
        { value: "au", label: "Australia" },
        { value: "br", label: "Brazil" },
        { value: "sg", label: "Singapore" },
      ],
    },
    layout: {
      placeholder: "Search or select country...",
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormAutocompleteField>;

export const Default: Story = {};

export const PreselectedChoice: Story = {
  args: {
    value: "de",
  },
};

export const AsyncLoadingState: Story = {
  args: {
    field: {
      id: "remote_repositories",
      name: "repository",
      type: "autocomplete",
      label: "GitHub Enterprise Repository",
      options: [],
    },
    layout: {
      placeholder: "Fetching repositories...",
    },
    isLoading: true,
  },
};

export const WithErrorFeedback: Story = {
  args: {
    field: {
      id: "required_timezone",
      name: "timezone",
      type: "autocomplete",
      label: "Operational Timezone",
      required: true,
      options: [
        { value: "utc", label: "UTC (Coordinated Universal Time)" },
        { value: "est", label: "America/New_York (EST/EDT)" },
        { value: "pst", label: "America/Los_Angeles (PST/PDT)" },
      ],
    },
    value: undefined,
    error: true,
    errorMessage: "Selecting a primary timezone is required for automated cron reporting.",
  },
};

export const InteractiveAutocomplete: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const combobox = canvas.getByRole("combobox");

    await step("Open autocomplete and type country name", async () => {
      await userEvent.type(combobox, "Canada");
      expect(combobox).toHaveValue("Canada");
    });
  },
};

export const CanonicalFlatProps: Story = {
  args: {
    name: "cloudRegion",
    type: "autocomplete",
    component: "AutocompleteField",
    id: "cloudRegion",
    label: "Target Cloud Region",
    placeholder: "Search regions...",
    required: true,
    options: [
      { value: "us-central1", label: "US Central (Iowa)" },
      { value: "europe-west1", label: "Europe West (Belgium)" },
      { value: "asia-east1", label: "Asia East (Taiwan)" },
    ],
  } as any,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const combobox = canvas.getByRole("combobox");
    await expect(combobox).toBeInTheDocument();
    await userEvent.type(combobox, "Europe");
    await expect(combobox).toHaveValue("Europe");
  },
};


