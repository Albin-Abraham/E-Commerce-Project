import type { Meta, StoryObj } from "@storybook/react-vite";

import { Divider } from "./Divider";

const meta: Meta<typeof Divider> = {
  title: "Primitives/Core/Divider",
  component: Divider,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    label: { control: "text" },
    asChild: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Divider>;

export const Default: Story = {
  args: {
    children: (
      <div className="space-y-4 max-w-md">
        <p className="text-gray-600">Content before the divider</p>
        <Divider />
        <p className="text-gray-600">Content after the divider</p>
      </div>
    ),
  },
};

export const WithCustomLabel: Story = {
  args: {
    label: "OR",
    children: (
      <div className="space-y-4 max-w-md">
        <p className="text-gray-600">Sign in with email</p>
        <Divider label="OR" />
        <p className="text-gray-600">Continue with social</p>
      </div>
    ),
  },
};

export const SectionDivider: Story = {
  args: {
    label: "Section Title",
    children: (
      <div className="space-y-6 max-w-md">
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Section 1</h3>
          <p className="text-gray-600">Content for the first section</p>
        </div>
        <Divider label="Section 2" />
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Section 2</h3>
          <p className="text-gray-600">Content for the second section</p>
        </div>
        <Divider label="Section 3" />
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Section 3</h3>
          <p className="text-gray-600">Content for the third section</p>
        </div>
      </div>
    ),
  },
};

export const FormSections: Story = {
  args: {
    children: (
      <div className="space-y-6 max-w-md">
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Account Information</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="email@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
            </div>
          </div>
        </div>
        <Divider label="Profile Details" />
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Personal Information</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="+1 (555) 000-0000" />
            </div>
          </div>
        </div>
        <Divider label="Preferences" />
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Notification Settings</h3>
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
              <span className="text-sm text-gray-700">Email notifications</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-gray-700">Push notifications</span>
            </label>
          </div>
        </div>
      </div>
    ),
  },
};

export const SocialAuthDivider: Story = {
  args: {
    label: "OR CONTINUE WITH",
    children: (
      <div className="space-y-4 max-w-md">
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="email@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
          </div>
          <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium">Sign In</button>
        </form>
        <Divider label="OR CONTINUE WITH" />
        <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Google
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.011-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
            GitHub
          </button>
        </div>
      </div>
    ),
  },
};

export const CardDivider: Story = {
  args: {
    label: "Payment Method",
    children: (
      <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md space-y-6">
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Billing Address</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="123 Main St" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="San Francisco" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zip</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="94102" />
              </div>
            </div>
          </div>
        </div>
        <Divider label="Payment Method" />
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Card Details</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
              <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="4242 4242 4242 4242" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="MM/YY" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="123" />
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
};

export const MultipleDividers: Story = {
  args: {
    children: (
      <div className="space-y-6 max-w-md">
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Step 1: Basic Info</h3>
          <p className="text-gray-600">Enter your basic information to get started.</p>
        </div>
        <Divider label="Step 2" />
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Step 2: Preferences</h3>
          <p className="text-gray-600">Customize your experience.</p>
        </div>
        <Divider label="Step 3" />
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Step 3: Confirmation</h3>
          <p className="text-gray-600">Review and confirm your details.</p>
        </div>
        <Divider label="Complete" />
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h3 className="font-semibold text-gray-900">All Done!</h3>
          <p className="text-gray-600 mt-1">Your setup is complete.</p>
        </div>
      </div>
    ),
  },
};

export const AsChild: Story = {
  args: {
    asChild: true,
    label: "AS CHILD",
    children: (
      <div className="space-y-4 max-w-md">
        <p className="text-gray-600">Divider rendered as child</p>
        <hr className="border-t-2 border-dashed border-gray-300 my-4" />
        <p className="text-gray-600">Custom HR element</p>
      </div>
    ),
  },
};