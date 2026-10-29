import type { Meta, StoryObj } from "@storybook/react-vite";

import { ScopeSelector, DefaultScopeSelector } from "./ScopeSelector";

const meta: Meta<typeof ScopeSelector> = {
  title: "Primitives/Table/ScopeSelector",
  component: ScopeSelector,
  subcomponents: { DefaultScopeSelector },
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ScopeSelector>;

const defaultOptions = [
  { type: "page", label: "Current Page", count: 25 },
  { type: "filtered", label: "All Filtered Data", count: 1250 },
  { type: "all", label: "All Data", count: 5000 },
];

export const Default: Story = {
  args: {
    options: defaultOptions,
    onSelect: (type) => console.log("Selected:", type),
  },
  render: (args) => (
    <DefaultScopeSelector {...args} defaultType="filtered" />
  ),
};

export const PageOnly: Story = {
  args: {
    options: [
      { type: "page", label: "Current Page", count: 25 },
    ],
    onSelect: (type) => console.log("Selected:", type),
  },
  render: (args) => (
    <DefaultScopeSelector {...args} defaultType="page" />
  ),
};

export const TwoOptions: Story = {
  args: {
    options: [
      { type: "page", label: "Current Page", count: 50 },
      { type: "all", label: "All Filtered", count: 10000 },
    ],
    onSelect: (type) => console.log("Selected:", type),
  },
  render: (args) => (
    <DefaultScopeSelector {...args} defaultType="page" />
  ),
};

export const LargeNumbers: Story = {
  args: {
    options: [
      { type: "page", label: "Current Page", count: 100 },
      { type: "filtered", label: "Filtered Results", count: 125000 },
      { type: "all", label: "All Records", count: 5000000 },
    ],
    onSelect: (type) => console.log("Selected:", type),
  },
  render: (args) => (
    <DefaultScopeSelector {...args} defaultType="filtered" />
  ),
};

export const WithCustomLabels: Story = {
  args: {
    options: [
      { type: "selection", label: "Selected Rows", count: 5 },
      { type: "page", label: "This Page", count: 25 },
      { type: "filtered", label: "All Matching", count: 1250 },
    ],
    onSelect: (type) => console.log("Selected:", type),
  },
  render: (args) => (
    <DefaultScopeSelector {...args} defaultType="selection" />
  ),
};

export const ExportContext: Story = {
  args: {
    options: [
      { type: "page", label: "Current Page (25 rows)", count: 25 },
      { type: "filtered", label: "All Filtered (1,250 rows)", count: 1250 },
      { type: "all", label: "Entire Dataset (50,000 rows)", count: 50000 },
    ],
    onSelect: (type) => console.log("Export scope:", type),
  },
  render: (args) => (
    <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md">
      <h3 className="font-semibold text-gray-900 mb-4">Export Data</h3>
      <p className="text-sm text-gray-600 mb-4">Choose the scope of data to export</p>
      <DefaultScopeSelector {...args} defaultType="filtered" />
      <div className="mt-4 flex justify-end gap-2">
        <button className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Export</button>
      </div>
    </div>
  ),
};

export const AsRenderProp: Story = {
  args: {
    options: defaultOptions,
    onSelect: (type) => console.log("Selected:", type),
  },
  render: (args) => (
    <ScopeSelector {...args}>
      {({ options, select }) => (
        <div className="bg-white border border-gray-200 rounded-xl p-4 max-w-md">
          <h4 className="font-semibold text-gray-900 mb-3">Custom Render</h4>
          <div className="space-y-2">
            {options.map((option) => (
              <button
                key={option.type}
                onClick={() => select(option.type)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ${
                  option.type === "filtered"
                    ? "border-blue-300 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <span className="text-sm font-medium">{option.label}</span>
                <span className="text-xs text-gray-500">{option.count.toLocaleString()} rows</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </ScopeSelector>
  ),
};

export const InDropdown: Story = {
  args: {
    options: defaultOptions,
    onSelect: (type) => console.log("Selected:", type),
  },
  render: (args) => (
    <div className="relative inline-block">
      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
        Export Options
      </button>
      <div className="absolute top-full left-0 mt-1 z-50 min-w-[200px]">
        <DefaultScopeSelector {...args} defaultType="filtered" />
      </div>
    </div>
  ),
};

export const InModal: Story = {
  args: {
    options: defaultOptions,
    onSelect: (type) => console.log("Selected:", type),
  },
  render: (args) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Export Scope</h3>
          <button className="p-1 text-gray-500 hover:text-gray-700">×</button>
        </div>
        <div className="p-4">
          <p className="text-sm text-gray-600 mb-4">Select the data scope for export</p>
          <DefaultScopeSelector {...args} defaultType="filtered" />
        </div>
        <div className="px-4 py-3 border-t border-gray-200 flex justify-end gap-2">
          <button className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Export</button>
        </div>
      </div>
    </div>
  ),
};

export const WithIcons: Story = {
  args: {
    options: [
      { type: "page", label: "Current Page", count: 25 },
      { type: "filtered", label: "All Filtered", count: 1250 },
    ],
    onSelect: (type) => console.log("Selected:", type),
  },
  render: (args) => (
    <DefaultScopeSelector {...args} defaultType="filtered" />
  ),
};

export const DisabledState: Story = {
  args: {
    options: [
      { type: "page", label: "Current Page", count: 25 },
      { type: "filtered", label: "All Filtered (disabled)", count: 1250 },
    ],
    onSelect: (type) => console.log("Selected:", type),
  },
  render: (args) => (
    <div className="space-y-2 p-4 max-w-md">
      {args.options.map((option) => (
        <button
          key={option.type}
          onClick={() => option.type !== "filtered" && args.onSelect(option.type)}
          disabled={option.type === "filtered"}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all ${
            option.type === "filtered"
              ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed"
              : option.type === "page"
                ? "border-primary/40 bg-primary/5"
                : "border-border/40 hover:border-primary/20 hover:bg-surface"
          }`}
        >
          <span className="text-sm font-medium">{option.label}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {option.count.toLocaleString()} rows
          </span>
        </button>
      ))}
    </div>
  ),
};