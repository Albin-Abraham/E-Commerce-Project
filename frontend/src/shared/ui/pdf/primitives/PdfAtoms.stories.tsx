import type { Meta, StoryObj } from "@storybook/react-vite";

import { PdfDivider, PdfBadge, PdfSpacer } from "./PdfAtoms";

const meta: Meta<typeof PdfDivider> = {
  title: "Primitives/PDF/PdfAtoms",
  component: PdfDivider,
  subcomponents: { PdfBadge, PdfSpacer },
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof PdfDivider>;

export const DividerDefault: Story = {
  args: {
    children: <PdfDivider />,
  },
};

export const DividerWithColor: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <PdfDivider color="primary" />
      <PdfDivider color="success" />
      <PdfDivider color="warning" />
      <PdfDivider color="danger" />
      <PdfDivider color="border" />
    </div>
  ),
};

export const DividerWithThickness: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <PdfDivider thickness={0.5} />
      <PdfDivider thickness={1} />
      <PdfDivider thickness={2} />
      <PdfDivider thickness={3} />
    </div>
  ),
};

export const DividerWithMargin: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <PdfDivider my="none" />
      <PdfDivider my="xs" />
      <PdfDivider my="sm" />
      <PdfDivider my="md" />
      <PdfDivider my="lg" />
    </div>
  ),
};

export const BadgeDefault: Story = {
  render: () => (
    <PdfBadge label="Default Badge" />
  ),
};

export const BadgeWithColors: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 max-w-md">
      <PdfBadge label="Primary" color="primary" bg="surface" />
      <PdfBadge label="Success" color="success" bg="surface" />
      <PdfBadge label="Warning" color="warning" bg="surface" />
      <PdfBadge label="Danger" color="danger" bg="surface" />
      <PdfBadge label="Info" color="primary" bg="surface" />
    </div>
  ),
};

export const BadgeWithBackgrounds: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 max-w-md">
      <PdfBadge label="Primary" color="white" bg="primary" />
      <PdfBadge label="Success" color="white" bg="success" />
      <PdfBadge label="Warning" color="black" bg="warning" />
      <PdfBadge label="Danger" color="white" bg="danger" />
    </div>
  ),
};

export const BadgeVariations: Story = {
  render: () => (
    <div className="space-y-3 max-w-md">
      <div className="flex flex-wrap gap-2">
        <PdfBadge label="New" color="primary" bg="primary" />
        <PdfBadge label="Beta" color="warning" bg="warning" />
        <PdfBadge label="Hot" color="danger" bg="danger" />
      </div>
      <div className="flex flex-wrap gap-2">
        <PdfBadge label="Active" color="success" bg="success" />
        <PdfBadge label="Pending" color="warning" bg="warning" />
        <PdfBadge label="Archived" color="textMuted" bg="surface" />
      </div>
    </div>
  ),
};

export const SpacerDefault: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <div className="bg-gray-100 p-4 rounded">Before spacer</div>
      <PdfSpacer height={20} />
      <div className="bg-gray-100 p-4 rounded">After 20pt spacer</div>
      <PdfSpacer height={40} />
      <div className="bg-gray-100 p-4 rounded">After 40pt spacer</div>
    </div>
  ),
};

export const SpacerWithFlex: Story = {
  render: () => (
    <div className="h-64 bg-gray-100 p-4 rounded">
      <div className="bg-white p-4 rounded">Top</div>
      <PdfSpacer flex={1} />
      <div className="bg-white p-4 rounded">Middle (flexible)</div>
      <PdfSpacer flex={1} />
      <div className="bg-white p-4 rounded">Bottom</div>
    </div>
  ),
};

export const CombinedAtoms: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Report Section</h3>
          <PdfBadge label="Q1 2024" color="primary" bg="surface" />
        </div>
        <PdfDivider my="sm" />
        <p className="text-gray-600">Content for the report section goes here.</p>
        <PdfSpacer height={16} />
        <PdfDivider color="primary" thickness={2} my="sm" />
        <p className="text-gray-600">Another section with different divider style.</p>
      </div>
    </div>
  ),
};

export const InTable: Story = {
  render: () => (
    <div className="space-y-4 max-w-md">
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Status Overview</h3>
          <PdfBadge label="Live" color="success" bg="surface" />
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 font-medium text-gray-700">Metric</th>
              <th className="text-right py-2 px-3 font-medium text-gray-700">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-2 px-3 text-gray-600">Uptime</td>
              <td className="py-2 px-3 text-right font-mono text-green-600">99.9%</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2 px-3 text-gray-600">Response Time</td>
              <td className="py-2 px-3 text-right font-mono text-blue-600">120ms</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="py-2 px-3 text-gray-600">Error Rate</td>
              <td className="py-2 px-3 text-right font-mono text-red-600">0.01%</td>
            </tr>
          </tbody>
        </table>
        <PdfDivider my="sm" />
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Last updated: Jan 15, 2024</span>
          <PdfBadge label="Refresh" color="primary" bg="surface" />
        </div>
      </div>
    </div>
  ),
};

export const Documentation: Story = {
  render: () => (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">PDF Atoms (Divider, Badge, Spacer)</h2>
        <p className="text-gray-600">
          Small, reusable PDF primitives for common layout needs.
        </p>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">PdfDivider</h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{`<PdfDivider
  color="border"        // Theme color key
  thickness={1}         // Line thickness in points
  my="sm"              // Vertical margin (spacing scale)
/>`}</code></pre>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">PdfBadge</h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{`<PdfBadge
  label="Status"        // Badge text
  color="primary"       // Text color (theme key)
  bg="surface"          // Background color (theme key)
/>`}</code></pre>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">PdfSpacer</h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{`<PdfSpacer
  height={20}           // Fixed height in points
  flex={1}              // Flexible space (mutually exclusive with height)
/>`}</code></pre>
      </div>
    </div>
  ),
};