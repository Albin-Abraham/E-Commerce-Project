import type { Meta, StoryObj } from "@storybook/react-vite";

import { PageSkeleton } from "./PageSkeleton";

const meta: Meta<typeof PageSkeleton> = {
  title: "Primitives/Core/PageSkeleton",
  component: PageSkeleton,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof PageSkeleton>;

export const Default: Story = {
  render: () => (
    <div className="min-h-screen bg-white">
      <PageSkeleton />
    </div>
  ),
};

export const InCard: Story = {
  render: () => (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Dashboard with Skeleton</h2>
        <PageSkeleton />
      </div>
    </div>
  ),
};

export const WithHeader: Story = {
  render: () => (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Application</h1>
          <nav className="flex items-center gap-4">
            <a href="#" className="text-gray-600 hover:text-gray-900">Features</a>
            <a href="#" className="text-gray-600 hover:text-gray-900">Pricing</a>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Sign In</button>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <PageSkeleton />
      </main>
    </div>
  ),
};

export const WithSidebar: Story = {
  render: () => (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Menu</h2>
        </div>
        <nav className="p-4 space-y-2">
          <a href="#" className="block px-3 py-2 text-gray-600 rounded-lg hover:bg-gray-100">Dashboard</a>
          <a href="#" className="block px-3 py-2 text-gray-600 rounded-lg hover:bg-gray-100">Analytics</a>
          <a href="#" className="block px-3 py-2 text-gray-600 rounded-lg hover:bg-gray-100">Reports</a>
          <a href="#" className="block px-3 py-2 text-gray-600 rounded-lg hover:bg-gray-100">Settings</a>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <PageSkeleton />
      </main>
    </div>
  ),
};

export const DarkMode: Story = {
  render: () => (
    <div className="dark min-h-screen bg-slate-900 p-8">
      <PageSkeleton />
    </div>
  ),
};

export const Documentation: Story = {
  render: () => (
    <div className="max-w-3xl mx-auto p-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">PageSkeleton</h2>
        <p className="text-gray-600">
          A premium, glassmorphic loading skeleton for route transitions.
          Prevents layout shifts and provides professional visual feedback.
        </p>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Features</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-700">
          <li>Prevents Cumulative Layout Shift (CLS)</li>
          <li>Matches actual content structure</li>
          <li>Glassmorphic pulse animation</li>
          <li>Dark mode support</li>
          <li>Responsive grid skeleton</li>
        </ul>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Usage</h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{`import { PageSkeleton } from '@/shared/ui';

export function DashboardPage() {
  const { data, isLoading } = useQuery(...);
  
  if (isLoading) return <PageSkeleton />;
  
  return <DashboardContent data={data} />;
}`}</code></pre>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4">Live Preview</h3>
        <PageSkeleton />
      </div>
    </div>
  ),
};