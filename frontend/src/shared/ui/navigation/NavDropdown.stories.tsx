import type { Meta, StoryObj } from "@storybook/react-vite";

import { NavDropdown } from "./NavDropdown";

const meta: Meta<typeof NavDropdown> = {
  title: "Primitives/Navigation/NavDropdown",
  component: NavDropdown,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof NavDropdown>;

const defaultItems = [
  { label: "Dashboard", description: "Overview of your workspace", href: "/dashboard" },
  { label: "Analytics", description: "View detailed metrics", href: "/analytics" },
  { label: "Reports", description: "Generate and export reports", href: "/reports" },
  { label: "Settings", description: "Manage your preferences", href: "/settings" },
];

export const Default: Story = {
  args: {
    label: "Navigation",
    items: defaultItems,
  },
};

export const WithIcons: Story = {
  args: {
    label: "Menu",
    items: [
      { label: "Dashboard", description: "Overview of your workspace", href: "/dashboard", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg> },
      { label: "Analytics", description: "View detailed metrics", href: "/analytics", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
      { label: "Reports", description: "Generate and export reports", href: "/reports", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
      { label: "Settings", description: "Manage your preferences", href: "/settings", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    ],
  },
};

export const WithOnClick: Story = {
  args: {
    label: "Actions",
    items: [
      { label: "Edit", description: "Modify this item", onClick: () => console.log("Edit clicked") },
      { label: "Duplicate", description: "Create a copy", onClick: () => console.log("Duplicate clicked") },
      { label: "Archive", description: "Move to archive", onClick: () => console.log("Archive clicked") },
      { label: "Delete", description: "Remove permanently", onClick: () => console.log("Delete clicked") },
    ],
  },
};

export const MixedHrefAndOnClick: Story = {
  args: {
    label: "Mixed Actions",
    items: [
      { label: "View Profile", description: "Go to profile page", href: "/profile" },
      { label: "Edit Settings", description: "Modify settings", onClick: () => console.log("Edit settings") },
      { label: "View Reports", description: "See reports", href: "/reports" },
      { label: "Logout", description: "Sign out", onClick: () => console.log("Logout") },
    ],
  },
};

export const UserMenu: Story = {
  args: {
    label: "John Doe",
    items: [
      { label: "Profile", description: "View your profile", href: "/profile", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
      { label: "Account", description: "Manage account settings", href: "/account", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
      { label: "Billing", description: "Manage subscriptions", href: "/billing", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
      { label: "Sign Out", description: "Log out of your account", onClick: () => console.log("Sign out"), icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg> },
    ],
  },
};

export const NotificationsMenu: Story = {
  args: {
    label: "Notifications",
    items: [
      { label: "New message", description: "You have a new message from Jane", href: "/messages/1", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> },
      { label: "Task assigned", description: "New task assigned to you", href: "/tasks/5", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
      { label: "Review requested", description: "Pull request needs review", href: "/pr/42", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
      { label: "View all", description: "See all notifications", href: "/notifications", icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg> },
    ],
  },
};

export const SettingsMenu: Story = {
  args: {
    label: "Settings",
    items: [
      { label: "General", description: "Basic preferences", href: "/settings/general" },
      { label: "Appearance", description: "Theme and display", href: "/settings/appearance" },
      { label: "Notifications", description: "Alert preferences", href: "/settings/notifications" },
      { label: "Privacy", description: "Data and privacy", href: "/settings/privacy" },
      { label: "Integrations", description: "Connected services", href: "/settings/integrations" },
      { label: "Advanced", description: "Developer options", href: "/settings/advanced" },
    ],
  },
};

export const ShortMenu: Story = {
  args: {
    label: "Options",
    items: [
      { label: "Option A", description: "First option" },
      { label: "Option B", description: "Second option" },
    ],
  },
};

export const LongMenu: Story = {
  args: {
    label: "All Items",
    items: Array.from({ length: 12 }, (_, i) => ({
      label: `Item ${i + 1}`,
      description: `Description for item ${i + 1}`,
      href: `/item/${i + 1}`,
    })),
  },
};

export const EmptyDescription: Story = {
  args: {
    label: "Simple Menu",
    items: [
      { label: "Home", href: "/" },
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
};

export const DisabledState: Story = {
  args: {
    label: "Disabled",
    items: [
      { label: "Available", description: "This works", href: "/available" },
      { label: "Coming Soon", description: "Not yet implemented" },
      { label: "Maintenance", description: "Temporarily disabled" },
    ],
  },
};

export const InNavbar: Story = {
  args: {
    label: "Products",
    items: [
      { label: "Feature 1", description: "Description of feature 1", href: "/feature-1" },
      { label: "Feature 2", description: "Description of feature 2", href: "/feature-2" },
      { label: "Feature 3", description: "Description of feature 3", href: "/feature-3" },
    ],
  },
  decorators: [
    (Story) => (
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="text-xl font-bold text-gray-900">Logo</div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-600 hover:text-gray-900">Features</a>
            <a href="#" className="text-gray-600 hover:text-gray-900">Pricing</a>
            <Story />
            <a href="#" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Get Started</a>
          </div>
        </div>
      </nav>
    ),
  ],
};

export const WithActiveState: Story = {
  args: {
    label: "Current: Analytics",
    items: defaultItems,
  },
  decorators: [
    (Story) => (
      <div className="p-4">
        <p className="text-sm text-gray-500 mb-2">Current page: /analytics (Analytics item will show as active)</p>
        <Story />
      </div>
    ),
  ],
};