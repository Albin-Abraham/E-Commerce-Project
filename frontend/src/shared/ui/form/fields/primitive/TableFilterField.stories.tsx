import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { FormRuntimeDecorator } from "../../stories/storybook-decorators";
import { FormTableFilterField } from "../wrapped-fields";

const meta: Meta<typeof FormTableFilterField> = {
  title: "Form/Fields/TableFilterField",
  component: FormTableFilterField,
  tags: ["autodocs"],
  decorators: [FormRuntimeDecorator],
  args: {
    onChange: fn(),
    field: {
      id: "table_filter",
      name: "tableFilter",
      type: "table-filter",
      label: "Filter Table Columns",
    },
    layout: {
      placeholder: "Quick filter records...",
    },
    value: "active",
  },
};

export default meta;
type Story = StoryObj<typeof FormTableFilterField>;

export const Default: Story = {};

export const EmptyFilter: Story = {
  args: {
    value: "",
    layout: {
      placeholder: "Type to filter by SKU, product name, or status...",
    },
  },
};

export const InteractiveFilterClear: Story = {
  args: {
    value: "pending",
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const filterInput = canvas.getByRole("textbox");
    const clearBtn = canvas.getByRole("button", { name: /clear filter/i });

    await step("Verify populated filter and clear it", async () => {
      expect(filterInput).toHaveValue("pending");
      await userEvent.click(clearBtn);
      expect(filterInput).toHaveValue("");
    });

    await step("Type new filter term", async () => {
      await userEvent.type(filterInput, "completed");
      expect(filterInput).toHaveValue("completed");
    });
  },
};

export const CanonicalFlatProps: Story = {
  args: {
    name: "gridSearch",
    type: "table-filter",
    component: "TableFilterField",
    id: "gridSearch",
    label: "Filter Data Grid",
    placeholder: "Filter users...",
    value: "",
  } as any,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const filterInput = canvas.getByPlaceholderText("Filter users...");
    await expect(filterInput).toBeInTheDocument();
    await userEvent.type(filterInput, "admin");
    await expect(filterInput).toHaveValue("admin");
  },
};


