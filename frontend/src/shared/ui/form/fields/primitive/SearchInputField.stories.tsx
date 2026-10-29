import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";

import { FormRuntimeDecorator } from "../../stories/storybook-decorators";
import { FormSearchInputField } from "../wrapped-fields";

const meta: Meta<typeof FormSearchInputField> = {
  title: "Form/Fields/SearchInputField",
  component: FormSearchInputField,
  tags: ["autodocs"],
  decorators: [FormRuntimeDecorator],
  args: {
    onChange: fn(),
    field: {
      id: "global_search",
      name: "query",
      type: "search",
      label: "Search Knowledge Base",
    },
    layout: {
      placeholder: "Search documentation, APIs, and guides...",
    },
    value: "canonical contract",
  },
};

export default meta;
type Story = StoryObj<typeof FormSearchInputField>;

export const Default: Story = {};

export const EmptySearch: Story = {
  args: {
    value: "",
    layout: {
      placeholder: "Filter users by email or full name...",
    },
  },
};

export const DisabledSearch: Story = {
  args: {
    layout: {
      disabled: true,
      placeholder: "Search index indexing in progress...",
    },
    value: "",
  },
};

export const InteractiveSearchClear: Story = {
  args: {
    value: "initial query",
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const searchInput = canvas.getByRole("textbox");
    const clearBtn = canvas.getByRole("button", { name: /clear search/i });

    await step("Verify initial value and clear it", async () => {
      expect(searchInput).toHaveValue("initial query");
      await userEvent.click(clearBtn);
      expect(searchInput).toHaveValue("");
    });

    await step("Type new search query", async () => {
      await userEvent.type(searchInput, "react query");
      expect(searchInput).toHaveValue("react query");
    });
  },
};

export const CanonicalFlatProps: Story = {
  args: {
    name: "workspaceSearch",
    type: "search",
    component: "SearchInputField",
    id: "workspaceSearch",
    label: "Workspace Query",
    placeholder: "Quick search...",
    value: "",
  } as any,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const searchInput = canvas.getByPlaceholderText("Quick search...");
    await expect(searchInput).toBeInTheDocument();
    await userEvent.type(searchInput, "design system");
    await expect(searchInput).toHaveValue("design system");
  },
};


