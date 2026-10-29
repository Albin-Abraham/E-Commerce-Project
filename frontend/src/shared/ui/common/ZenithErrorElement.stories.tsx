import type { Meta, StoryObj } from "@storybook/react-vite";

import { ZenithErrorElement } from "./ZenithErrorElement";

const meta: Meta<typeof ZenithErrorElement> = {
  title: "Primitives/Common/ZenithErrorElement",
  component: ZenithErrorElement,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ZenithErrorElement>;

export const Default: Story = {
  render: () => {
    const errorContainer = document.getElementById("error");
    if (!errorContainer) {
      const div = document.createElement("div");
      div.id = "error";
      document.body.appendChild(div);
    }
    return <ZenithErrorElement />;
  },
};

export const NetworkError: Story = {
  render: () => {
    const errorContainer = document.getElementById("error");
    if (!errorContainer) {
      const div = document.createElement("div");
      div.id = "error";
      document.body.appendChild(div);
    }
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <ZenithErrorElement />
      </div>
    );
  },
  decorators: [
    (Story) => {
      const errorContainer = document.getElementById("error");
      if (!errorContainer) {
        const div = document.createElement("div");
        div.id = "error";
        document.body.appendChild(div);
      }
      return <Story />;
    },
  ],
};

export const WithPortalTarget: Story = {
  render: () => (
    <div className="relative h-screen w-full">
      <div id="error" className="absolute inset-0" />
      <div className="p-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Page Content</h2>
        <p className="text-gray-600 mb-6">The error element will render into the #error portal target above.</p>
        <ZenithErrorElement />
      </div>
    </div>
  ),
};

export const InLayout: Story = {
  render: () => (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">Application Header</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Widget 1</h3>
            <p className="text-gray-600">Normal content</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Widget 2</h3>
            <p className="text-gray-600">Normal content</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Widget 3</h3>
            <p className="text-gray-600">Normal content</p>
          </div>
        </div>
      </main>
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 text-center text-gray-500">
          Footer content
        </div>
      </footer>
      <div id="error" className="fixed inset-0" />
      <ZenithErrorElement />
    </div>
  ),
};

export const Documentation: Story = {
  render: () => (
    <div className="max-w-3xl space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">ZenithErrorElement</h3>
        <p className="text-gray-600 mb-4">
          Industrial-grade error orchestrator with portal injection support.
          Handles multiple error types automatically:
        </p>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li><strong>Network errors</strong> - Shows connectivity icon, amber styling, retry action</li>
          <li><strong>Chunk load errors</strong> - Detects lazy loading failures, offers page reload</li>
          <li><strong>Sync/HTTP errors</strong> - Shows status codes, shield icon, red styling</li>
          <li><strong>Runtime exceptions</strong> - Shows stack trace, copy to clipboard</li>
        </ul>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Features</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>Portal injection into #error DOM node</li>
          <li>Framer Motion animations (enter/exit)</li>
          <li>Expandable technical diagnostics</li>
          <li>Stack trace copy to clipboard</li>
          <li>Automatic error classification</li>
          <li>Recovery actions (reload, navigate home)</li>
        </ul>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Usage</h4>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{`// In your router error boundary
import { ZenithErrorElement } from '@/shared/ui/common';

export function ErrorBoundary() {
  return <ZenithErrorElement />;
}

// Ensure #error element exists in your HTML
<div id="error" />`}</code></pre>
      </div>
    </div>
  ),
};