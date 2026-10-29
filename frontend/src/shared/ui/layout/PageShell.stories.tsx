import type { Meta, StoryObj } from "@storybook/react-vite";

import { PageShell } from "./PageShell";

const meta: Meta<typeof PageShell> = {
  title: "Primitives/Layout/PageShell",
  component: PageShell,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    className: { control: "text" },
    slots: { control: "object" },
  },
};

export default meta;
type Story = StoryObj<typeof PageShell>;

export const Default: Story = {
  args: {
    children: (
      <div className="flex flex-col h-full">
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">PageShell Dashboard</h1>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Welcome to PageShell</h2>
              <p className="text-gray-600">This is the default PageShell layout with a header and main content area.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-medium text-gray-900 mb-2">Card 1</h3>
                <p className="text-gray-600 text-sm">Content for card 1</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-medium text-gray-900 mb-2">Card 2</h3>
                <p className="text-gray-600 text-sm">Content for card 2</p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-medium text-gray-900 mb-2">Card 3</h3>
                <p className="text-gray-600 text-sm">Content for card 3</p>
              </div>
            </div>
          </div>
        </main>
        <footer className="bg-gray-50 border-t border-gray-200 px-6 py-4">
          <p className="text-sm text-gray-500 text-center">Footer content</p>
        </footer>
      </div>
    ),
  },
};

export const WithCustomSlots: Story = {
  args: {
    slots: {
      shell: "page-shell--dashboard w-full h-full flex flex-col relative",
      atmosphere: "bg-gradient-to-br from-blue-50 via-white to-indigo-50",
    },
    children: (
      <div className="flex flex-col h-full">
        <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-6 py-4">
          <Flex justify="between" align="center">
            <h1 className="text-2xl font-bold text-gray-900">Custom Shell</h1>
            <Flex gap="md">
              <button className="px-4 py-2 text-gray-600 hover:text-gray-900">Action</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Primary</button>
            </Flex>
          </Flex>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">With Custom Atmosphere</h2>
              <p className="text-gray-600">This PageShell uses custom slots for atmosphere and shell styling.</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-medium text-gray-900 mb-2">Widget A</h3>
                <p className="text-gray-600 text-sm">Custom shell styling applied</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-medium text-gray-900 mb-2">Widget B</h3>
                <p className="text-gray-600 text-sm">With backdrop blur effect</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    ),
  },
};

export const PortalLayout: Story = {
  args: {
    slots: {
      shell: "page-shell--portal min-h-screen flex flex-col",
      atmosphere: "bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900",
    },
    children: (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl text-white">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h1 className="text-3xl font-bold">Welcome Back</h1>
                <p className="text-white/60 mt-2">Sign in to your account</p>
              </div>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Email</label>
                  <input type="email" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50" placeholder="name@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">Password</label>
                  <input type="password" className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50" placeholder="••••••••" />
                </div>
                <button type="submit" className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-3 rounded-xl transition-colors">Sign In</button>
              </form>
              <p className="text-center text-white/50 text-sm mt-6">Or continue with</p>
              <div className="flex justify-center gap-4 mt-4">
                <button className="w-12 h-12 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                </button>
                <button className="w-12 h-12 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        <footer className="px-4 py-6 text-center text-white/50 text-sm">Need help? Contact support</footer>
      </div>
    ),
  },
};

export const DashboardWithSidebar: Story = {
  args: {
    slots: {
      shell: "page-shell--dashboard w-full h-full flex flex-col relative",
    },
    children: (
      <div className="flex h-full">
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden lg:flex">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 font-medium">Overview</a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-600 rounded-lg hover:bg-gray-100">Analytics</a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-600 rounded-lg hover:bg-gray-100">Reports</a>
            <a href="#" className="flex items-center gap-3 px-3 py-2 text-gray-600 rounded-lg hover:bg-gray-100">Settings</a>
          </nav>
          <div className="p-4 border-t border-gray-200">
            <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-gray-600 rounded-lg hover:bg-gray-100">Sign Out</button>
          </div>
        </aside>
        <div className="flex-1 flex flex-col min-w-0">
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          </header>
          <main className="flex-1 p-6 overflow-auto bg-gray-50">
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <p className="text-sm text-gray-500">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">12,345</p>
                  <p className="text-sm text-green-600 mt-2">+12% from last month</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <p className="text-sm text-gray-500">Revenue</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">$98,765</p>
                  <p className="text-sm text-green-600 mt-2">+8% from last month</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <p className="text-sm text-gray-500">Orders</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">1,234</p>
                  <p className="text-sm text-red-600 mt-2">-3% from last month</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <p className="text-sm text-gray-500">Conversion</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">3.2%</p>
                  <p className="text-sm text-green-600 mt-2">+0.5% from last month</p>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                <div className="space-y-4">
                  {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">New order #{1000 + i}</p>
                          <p className="text-sm text-gray-500">2 minutes ago</p>
                        </div>
                      </div>
                      <span className="text-green-600 font-medium">+$49.99</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    ),
  },
};

export const MinimalShell: Story = {
  args: {
    slots: {
      shell: "w-full h-full",
    },
    className: "bg-gray-100",
    children: (
      <div className="flex items-center justify-center h-full">
        <div className="bg-white rounded-xl p-8 shadow-sm max-w-md w-full mx-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Minimal PageShell</h1>
          <p className="text-gray-600">Just a simple container with custom className</p>
        </div>
      </div>
    ),
  },
};