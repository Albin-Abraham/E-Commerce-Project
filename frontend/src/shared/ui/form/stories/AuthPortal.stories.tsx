import type { Meta, StoryObj } from "@storybook/react-vite";

import { Form } from "../Form";
import type { FormDefinition } from "@form-core/domain";

const meta: Meta<typeof Form> = {
  title: "Form/Layouts/Auth Portal Showcase",
  component: Form,
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof Form>;

/**
 * 🔐 Welcome Back (Login)
 * Recreating the Dribbble Login page with Icons, Password Toggle, and Socials.
 */
const LOGIN_SCHEMA: FormDefinition = {
  id: "modern-login",
  title: "",
  submitLabel: "LOGIN",
  layout: "split",
  containers: [
    {
      id: "split-main",
      type: "split",
      config: {
        splitRatio: "40/60",
        orientation: "horizontal",
        leftContent: {
          type: "image",
          src: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
          alt: "Healthcare Facility",
          overlay: true,
          className: "h-full w-full sticky top-0",
        },
        rightContent: {
          type: "section-ref",
          sectionId: "auth-core",
          className:
            "flex items-center justify-center p-8 lg:p-12 w-full h-full",
        },
      },
    },
  ],
  settings: {
    density: "comfortable",
  },
  style: {
    classNames: {
      shell:
        "page-shell--portal min-h-screen flex items-center justify-center p-6 bg-background text-foreground",
      atmosphere: "fixed inset-0 pointer-events-none -z-10",
      root: "w-full max-w-4xl shadow-2xl bg-surface/90 backdrop-blur-xl border border-border/40 rounded-3xl mx-auto overflow-hidden",
    },
  },
  sections: [
    {
      id: "auth-core",
      title: "",
      fields: [
        {
          id: "header",
          type: "header",
          label: "Welcome Back!",
          description: "Please enter your account here",
          properties: { alignment: "center" },
          meta: { ui: { variant: "h2" } },
        },
        {
          id: "email",
          name: "email",
          type: "email",
          label: "Email",
          required: true,
          meta: { ui: { icon: "mail" } },
          properties: { placeholder: "Enter your email" },
        },
        {
          id: "password",
          name: "password",
          type: "password",
          label: "Password",
          required: true,
          meta: { ui: { icon: "lock" } },
          properties: { placeholder: "Enter your password" },
        },
        {
          id: "forgot-link",
          type: "paragraph",
          label: "", // Required field
          properties: { alignment: "right" },
          customData: { html: true },
          initialValue:
            '<a href="#" class="text-xs font-bold text-primary hover:underline">Forgot password?</a>',
        },
        {
          id: "social-split",
          type: "divider",
          label: "Or continue with",
        },
        {
          id: "social-actions",
          type: "social",
          label: "Social Authentication",
        },
        {
          id: "terms",
          type: "paragraph",
          label: "",
          properties: { alignment: "center" },
          customData: { html: true },
          initialValue:
            '<p class="text-[10px] text-foreground/40 leading-relaxed px-8">By signing up you accept the <a href="#" class="text-foreground/60 font-bold hover:underline">Terms of service</a> and <a href="#" class="text-foreground/60 font-bold hover:underline">Privacy policy</a></p>',
        },
        {
          id: "footer-link",
          type: "paragraph",
          label: "",
          properties: { alignment: "center" },
          customData: { html: true },
          initialValue:
            '<p class="text-xs text-foreground/60">Don\'t have an account? <a href="#" class="text-primary font-bold hover:underline">Register</a></p>',
        },
      ],
    },
  ],
};

export const Login: Story = {
  args: {
    definition: LOGIN_SCHEMA,
  },
};

/**
 * 📝 Registration
 * Clean signup flow with Full Name and Icon support.
 */
const REGISTER_SCHEMA: FormDefinition = {
  id: "modern-register",
  title: "",
  submitLabel: "REGISTER",
  settings: {
    density: "comfortable",
  },
  style: {
    classNames: {
      shell:
        "page-shell--portal min-h-screen flex items-center justify-center p-6 bg-background text-foreground",
      atmosphere: "fixed inset-0 pointer-events-none -z-10",
      root: "w-full max-w-lg shadow-2xl bg-surface/90 backdrop-blur-xl border border-border/40 rounded-3xl p-10",
    },
  },
  sections: [
    {
      id: "reg-core",
      title: "",
      fields: [
        {
          id: "header",
          type: "header",
          label: "Registration",
          description: "Please register down below",
          properties: { alignment: "center" },
          meta: { ui: { variant: "h2" } },
        },
        {
          id: "name",
          name: "fullName",
          type: "text",
          label: "Full Name",
          required: true,
          meta: { ui: { icon: "user" } },
          properties: { placeholder: "Enter your full name" },
        },
        {
          id: "email",
          name: "email",
          type: "email",
          label: "Email",
          required: true,
          meta: { ui: { icon: "mail" } },
          properties: { placeholder: "Enter your email" },
        },
        {
          id: "password",
          name: "password",
          type: "password",
          label: "Password",
          required: true,
          meta: { ui: { icon: "lock" } },
          properties: { placeholder: "Create a password" },
        },
        {
          id: "social-split",
          type: "divider",
          label: "Or continue with",
        },
        {
          id: "social-actions",
          type: "social",
          label: "Social Auth",
        },
        {
          id: "footer-link",
          type: "paragraph",
          label: "",
          properties: { alignment: "center" },
          customData: { html: true },
          initialValue:
            '<p class="text-xs text-foreground/60">Already have an account? <a href="#" class="text-primary font-bold hover:underline">Log in</a></p>',
        },
      ],
    },
  ],
};

export const Registration: Story = {
  args: {
    definition: REGISTER_SCHEMA,
  },
};

/**
 * 🔄 Reset Password
 * Simple, focused flow for credential recovery.
 */
const RESET_SCHEMA: FormDefinition = {
  id: "modern-reset",
  title: "",
  submitLabel: "RESET PASSWORD",
  settings: {
    density: "comfortable",
  },
  style: {
    classNames: {
      shell:
        "page-shell--portal min-h-screen flex items-center justify-center p-6 bg-background text-foreground",
      atmosphere: "fixed inset-0 pointer-events-none -z-10",
      root: "w-full max-w-md shadow-2xl bg-surface/90 backdrop-blur-xl border border-border/40 rounded-3xl p-10",
    },
  },
  sections: [
    {
      id: "reset-core",
      title: "",
      fields: [
        {
          id: "header",
          type: "header",
          label: "Reset password",
          description: "Please enter new password",
          properties: { alignment: "center" },
          meta: { ui: { variant: "h2" } },
        },
        {
          id: "password",
          name: "password",
          type: "password",
          label: "New password",
          required: true,
          meta: { ui: { icon: "lock" } },
          properties: { placeholder: "Enter new password" },
        },
        {
          id: "confirm_password",
          name: "confirmPassword",
          type: "password",
          label: "Confirm password",
          required: true,
          meta: { ui: { icon: "lock" } },
          properties: { placeholder: "Confirm new password" },
        },
        {
          id: "footer-link",
          type: "paragraph",
          label: "",
          properties: { alignment: "center" },
          customData: { html: true },
          initialValue:
            '<p class="text-xs text-foreground/60">Already have an account? <a href="#" class="text-primary font-bold hover:underline">Log in</a></p>',
        },
      ],
    },
  ],
};

export const ResetPassword: Story = {
  args: {
    definition: RESET_SCHEMA,
  },
};
