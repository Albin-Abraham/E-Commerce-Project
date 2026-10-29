import type { Meta, StoryObj } from "@storybook/react-vite";

import { Form } from "./Form";
import type { FormDefinition } from "@form-core/domain";

const meta: Meta<typeof Form> = {
  title: "Form/Layouts/Identity Center",
  component: Form,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof Form>;

const loginDefinition: FormDefinition = {
  id: "login-identity",
  title: "Welcome Back",
  description: "Enter your credentials to access your dashboard.",
  submitLabel: "Sign In",
  settings: {
    density: "spacious",
    layoutMode: "portal",
  },
  style: {
    classNames: {
      atmosphere: "opacity-60", // Subtle dimming of the background glow
    },
  },
  sections: [
    {
      id: "auth-social",
      title: "",
      fields: [
        {
          id: "social-auth",
          type: "social",
          label: "Social Authentication",
          layout: { columnSpan: 12 },
        },
        {
          id: "sep-login",
          type: "divider",
          label: "Or continue with email",
          layout: { columnSpan: 12 },
        },
      ],
    },
    {
      id: "auth-fields",
      title: "",
      fields: [
        {
          id: "email",
          name: "email",
          type: "email",
          label: "Email Address",
          properties: {
            placeholder: "name@company.com",
          },
          meta: {
            ui: { icon: "mail" },
          },
          layout: { columnSpan: 12 },
        },
        {
          id: "password",
          name: "password",
          type: "password",
          label: "Password",
          properties: {
            placeholder: "••••••••",
          },
          meta: {
            ui: {
              icon: "lock",
              labelAction: { label: "Forgot password?", href: "#" },
            },
          },
          layout: { columnSpan: 12 },
        },
      ],
    },
  ],
};

export const PortalLogin: Story = {
  args: {
    definition: loginDefinition,
    onSubmit: async (data) => {
      console.log("Login submitted:", data);
      await new Promise((r) => setTimeout(r, 1000));
    },
  },
};

const registrationDefinition: FormDefinition = {
  id: "register-identity",
  title: "Create Account",
  description: "Join the enterprise orchestration platform.",
  submitLabel: "Register Now",
  cancelLabel: "Sign In",
  settings: {
    density: "spacious",
    layoutMode: "portal",
  },
  style: {
    classNames: {
      atmosphere: "opacity-40",
    },
  },
  sections: [
    {
      id: "social-reg",
      title: "",
      fields: [
        {
          id: "social-auth-reg",
          type: "social",
          label: "Enterprise Auth",
          layout: { columnSpan: 12 },
        },
        {
          id: "sep-reg",
          type: "divider",
          label: "Or register with email",
          layout: { columnSpan: 12 },
        },
      ],
    },
    {
      id: "reg-fields",
      title: "Account Details",
      layout: { type: "grid", columns: 12, gap: "md" },
      fields: [
        {
          id: "first_name",
          name: "firstName",
          type: "text",
          label: "First Name",
          properties: {
            placeholder: "Jane",
            borderRadius: "large",
          },
          meta: { ui: { icon: "user" } },
          layout: { columnSpan: 6 },
        },
        {
          id: "last_name",
          name: "lastName",
          type: "text",
          label: "Last Name",
          properties: {
            placeholder: "Doe",
            borderRadius: "large",
          },
          meta: { ui: { icon: "user" } },
          layout: { columnSpan: 6 },
        },
        {
          id: "email",
          name: "email",
          type: "email",
          label: "Email Address",
          properties: {
            placeholder: "jane@example.com",
            borderRadius: "large",
          },
          meta: { ui: { icon: "mail" } },
          layout: { columnSpan: 12 },
        },
        {
          id: "password",
          name: "password",
          type: "password",
          label: "Create Password",
          properties: {
            placeholder: "••••••••",
            borderRadius: "large",
          },
          meta: { ui: { icon: "lock" } },
          layout: { columnSpan: 12 },
        },
      ],
    },
  ],
};

export const PortalRegistration: Story = {
  args: {
    definition: registrationDefinition,
  },
};

/**
 * Dashboard Enrollment Showcase:
 * Demonstrates the "Smart Shell" logic where the Form detects its hosted context
 * and "Yields" its header to the Page Shell.
 */
export const DashboardEnrollment: Story = {
  render: (args) => (
    <div className="bg-subtle min-h-screen p-8">
      <div className="mb-6 pb-6 border-b border-border flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black">Enterprise Dashboard</h2>
          <p className="text-sm text-foreground/50">
            Managed Orchestration Context
          </p>
        </div>
        <button className="app-button--primary px-4 py-2 rounded-lg text-sm font-bold">
          Actions
        </button>
      </div>

      <Form {...args} />
    </div>
  ),
  args: {
    definition: {
      ...loginDefinition,
      title: "Contextual Login",
      settings: {
        ...loginDefinition.settings,
        layoutMode: "dashboard",
        width: "full",
        density: "comfortable",
      },
      style: {
        classNames: {
          root: "form-root flex flex-col gap-6",
        },
      },
    },
  },
};
