import type { Meta, StoryObj } from "@storybook/react-vite";

import { SocialButton } from "./SocialButton";

const meta: Meta<typeof SocialButton> = {
  title: "Primitives/Core/SocialButton",
  component: SocialButton,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    provider: { control: "select", options: ["google", "github"] },
    label: { control: "text" },
    asChild: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof SocialButton>;

export const Google: Story = {
  args: {
    provider: "google",
  },
};

export const GitHub: Story = {
  args: {
    provider: "github",
  },
};

export const GoogleWithLabel: Story = {
  args: {
    provider: "google",
    label: "Continue with Google",
  },
};

export const GitHubWithLabel: Story = {
  args: {
    provider: "github",
    label: "Sign in with GitHub",
  },
};

export const BothProviders: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-3">
      <SocialButton provider="google" label="Continue with Google" />
      <SocialButton provider="github" label="Continue with GitHub" />
    </div>
  ),
};

export const AsChild: Story = {
  args: {
    provider: "google",
    asChild: true,
    label: "Custom Google Button",
  },
};

export const InAuthForm: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Welcome Back</h2>
        <p className="text-gray-600 mt-1">Sign in to your account</p>
      </div>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="email@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input type="password" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium">Sign In</button>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SocialButton provider="google" />
        <SocialButton provider="github" />
      </div>
      <p className="text-center text-sm text-gray-600">
        Don't have an account? <a href="#" className="text-blue-600 hover:underline">Sign up</a>
      </p>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    provider: "google",
    disabled: true,
  },
};

export const Loading: Story = {
  args: {
    provider: "github",
    disabled: true,
    children: (
      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    ),
  },
};

export const WithCustomClass: Story = {
  args: {
    provider: "google",
    label: "Custom Styled",
    className: "w-64",
  },
};