import type { Meta, StoryObj } from "@storybook/react-vite";

import { OverlayNav, type OverlayNavItem, type OverlayNavStatus } from "./OverlayNav";

const meta: Meta<typeof OverlayNav> = {
  title: "Primitives/Overlay/OverlayNav",
  component: OverlayNav,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    items: { control: "object" },
    activeId: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof OverlayNav>;

const defaultItems: OverlayNavItem[] = [
  { id: "account", label: "Account" },
  { id: "profile", label: "Profile" },
  { id: "settings", label: "Settings" },
  { id: "billing", label: "Billing" },
];

export const Default: Story = {
  args: {
    items: defaultItems,
  },
};

export const WithActiveId: Story = {
  args: {
    items: defaultItems,
    activeId: "profile",
  },
};

export const WithStatuses: Story = {
  args: {
    items: [
      { id: "step1", label: "Welcome", status: "complete" as OverlayNavStatus },
      { id: "step2", label: "Profile", status: "current" as OverlayNavStatus },
      { id: "step3", label: "Team", status: "idle" as OverlayNavStatus },
      { id: "step4", label: "Complete", status: "idle" as OverlayNavStatus },
    ],
  },
};

export const WithError: Story = {
  args: {
    items: [
      { id: "step1", label: "Connect", status: "complete" as OverlayNavStatus },
      { id: "step2", label: "Configure", status: "error" as OverlayNavStatus },
      { id: "step3", label: "Test", status: "idle" as OverlayNavStatus },
      { id: "step4", label: "Deploy", status: "idle" as OverlayNavStatus },
    ],
  },
};

export const AllComplete: Story = {
  args: {
    items: [
      { id: "step1", label: "Step 1", status: "complete" as OverlayNavStatus },
      { id: "step2", label: "Step 2", status: "complete" as OverlayNavStatus },
      { id: "step3", label: "Step 3", status: "complete" as OverlayNavStatus },
      { id: "step4", label: "Step 4", status: "current" as OverlayNavStatus },
    ],
  },
};

export const ManySteps: Story = {
  args: {
    items: Array.from({ length: 8 }, (_, i) => ({
      id: `step${i + 1}`,
      label: `Step ${i + 1}`,
      status: i < 2 ? ("complete" as OverlayNavStatus) : i === 2 ? ("current" as OverlayNavStatus) : ("idle" as OverlayNavStatus),
    })),
  },
};

export const ShortLabels: Story = {
  args: {
    items: [
      { id: "a", label: "A" },
      { id: "b", label: "B" },
      { id: "c", label: "C" },
      { id: "d", label: "D" },
      { id: "e", label: "E" },
    ],
  },
};

export const LongLabels: Story = {
  args: {
    items: [
      { id: "account-settings", label: "Account Settings" },
      { id: "profile-preferences", label: "Profile Preferences" },
      { id: "notification-rules", label: "Notification Rules" },
      { id: "security-policies", label: "Security Policies" },
      { id: "billing-history", label: "Billing History" },
    ],
  },
};

export const WithIcons: Story = {
  args: {
    items: [
      { id: "dashboard", label: "Dashboard" },
      { id: "analytics", label: "Analytics" },
      { id: "reports", label: "Reports" },
      { id: "settings", label: "Settings" },
    ],
  },
};

export const OnNavigateCallback: Story = {
  args: {
    items: defaultItems,
    onNavigate: (id) => console.log("Navigate to:", id),
  },
};

export const SingleItem: Story = {
  args: {
    items: [{ id: "only", label: "Only Item" }],
  },
};

export const TwoItems: Story = {
  args: {
    items: [
      { id: "first", label: "First" },
      { id: "second", label: "Second" },
    ],
  },
};

export const WizardIntegration: Story = {
  render: () => (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden max-w-2xl">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
        <h2 className="text-white font-semibold">Setup Wizard</h2>
        <p className="text-white/80 text-sm mt-1">Configure your workspace in 4 steps</p>
      </div>
      <OverlayNav
        items={[
          { id: "account", label: "Account", status: "complete" },
          { id: "team", label: "Team", status: "complete" },
          { id: "project", label: "Project", status: "current" },
          { id: "complete", label: "Complete", status: "idle" },
        ]}
      />
      <div className="p-6" data-field-id="project">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Project Configuration</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Enter project name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Describe your project..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option>Select template</option>
              <option>Blank</option>
              <option>React App</option>
              <option>Next.js</option>
              <option>Vue App</option>
            </select>
          </div>
        </div>
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
        <button className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50">Back</button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Next</button>
      </div>
    </div>
  ),
};

export const MobileResponsive: Story = {
  args: {
    items: [
      { id: "home", label: "Home" },
      { id: "browse", label: "Browse" },
      { id: "create", label: "Create" },
      { id: "settings", label: "Settings" },
    ],
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm mx-auto">
        <div className="bg-gray-100 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600">Resize the browser to see responsive behavior</p>
        </div>
        <Story />
      </div>
    ),
  ],
};