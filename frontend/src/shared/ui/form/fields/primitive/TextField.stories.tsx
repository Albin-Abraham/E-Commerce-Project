import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { Search } from "lucide-react";

import { FormRuntimeDecorator } from "../../stories/storybook-decorators";
import { FormTextField } from "../wrapped-fields";
import { TextField } from "./TextField";

const meta: Meta<typeof FormTextField> = {
  title: "Form/Fields/TextField",
  component: FormTextField,
  tags: ["autodocs"],
  decorators: [FormRuntimeDecorator],
  args: {
    onChange: fn(),
    field: {
      id: "username",
      name: "username",
      type: "text",
      label: "Username",
      required: true,
      meta: { ui: { icon: "user" } },
    },
    layout: {
      placeholder: "Enter your username...",
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormTextField>;

export const Default: Story = {};

export const RequiredWithAsterisk: Story = {
  args: {
    field: {
      id: "company_name",
      name: "companyName",
      type: "text",
      label: "Company Legal Name",
      required: true,
    },
    layout: {
      placeholder: "Acme Corp Ltd.",
    },
  },
};

export const WithErrorFeedback: Story = {
  args: {
    field: {
      id: "email",
      name: "email",
      type: "email",
      label: "Business Email",
      required: true,
      meta: { ui: { icon: "mail" } },
    },
    error: true,
    errorMessage: "Please enter a valid work email address (e.g. name@domain.com)",
    value: "invalid-email@",
  },
};

export const WithPrefixAndSuffix: Story = {
  args: {
    field: {
      id: "search_query",
      name: "searchQuery",
      type: "text",
      label: "Global Search",
      properties: {
        placeholder: "Search repositories, files, or symbols...",
      },
    },
    startContent: <Search size={16} className="text-muted-foreground" />,
    endContent: (
      <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 border border-border/40 rounded bg-muted/20 text-muted-foreground">
        ⌘K
      </span>
    ),
  },
};

export const PasswordWithToggle: Story = {
  args: {
    field: {
      id: "user_password",
      name: "password",
      type: "password",
      label: "Account Password",
      required: true,
    },
    layout: {
      placeholder: "Enter minimum 8 characters...",
    },
    value: "SecretP@ssw0rd!",
  },
};

export const FloatingLabel: Story = {
  args: {
    field: {
      id: "floating_account",
      name: "accountNumber",
      type: "text",
      label: "Account Number",
      properties: {
        labelPlacement: "top",
      },
    },
    layout: {
      placeholder: " ",
    },
  },
};

export const CompactDensity: Story = {
  args: {
    density: "compact",
    field: {
      id: "compact_field",
      name: "compactField",
      type: "text",
      label: "Compact Data Field",
    },
  },
};

export const InteractiveBehavior: Story = {
  args: {
    field: {
      id: "interactive_username",
      name: "interactiveUsername",
      type: "text",
      label: "Interactive Username Input",
      required: true,
    },
    layout: {
      placeholder: "Type a username...",
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText("Type a username...");
    await expect(input).toBeInTheDocument();
    await userEvent.click(input);
    await userEvent.type(input, "alex_developer");
    await expect(input).toHaveValue("alex_developer");
  },
};

export const CanonicalFlatProps: Story = {
  args: {
    name: "legalEntity",
    type: "text",
    component: "TextField",
    id: "legalEntity",
    label: "Legal Entity Name",
    placeholder: "Enter company name...",
    required: true,
  } as any,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText("Enter company name...");
    await expect(input).toBeInTheDocument();
    await expect(input).toHaveAttribute("name", "legalEntity");
    await expect(input).toHaveAttribute("data-field-type", "text");
    await expect(input).toHaveAttribute("data-field-component", "TextField");
    await userEvent.type(input, "Acme International");
    await expect(input).toHaveValue("Acme International");
  },
};

export const ComponentMapping: Story = {
  args: {
    name: "mappedCodeInput",
    type: "string",
    component: "code",
    id: "mappedCodeInput",
    label: "SMS Verification Code",
    placeholder: "6-digit code",
  } as any,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const label = canvas.getByText("SMS Verification Code");
    await expect(label).toBeInTheDocument();
  },
};

export const StandaloneAtomIsolated: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-semibold mb-1 text-foreground">
          Standalone Atom (Zero-Context Fallback)
        </label>
        <p className="text-xs text-muted-foreground mb-2">
          Rendered outside FieldShell / OuterWrapper with token-based standalone borders and background.
        </p>
        <TextField
          name="standaloneUsername"
          placeholder="Enter username in standalone mode..."
          defaultValue="zenos_admin"
        />
      </div>
      <div>
        <label className="block text-sm font-semibold mb-1 text-foreground">
          Standalone Atom with Error State
        </label>
        <TextField
          name="standaloneError"
          placeholder="Error state..."
          defaultValue="invalid_entry"
          error
        />
      </div>
    </div>
  ),
};

