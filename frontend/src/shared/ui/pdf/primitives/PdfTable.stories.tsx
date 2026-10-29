import type { Meta, StoryObj } from "@storybook/react-vite";

import { PdfTable } from "./PdfTable";

const meta: Meta<typeof PdfTable> = {
  title: "Primitives/PDF/PdfTable",
  component: PdfTable,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof PdfTable>;

const sampleColumns = [
  { key: "name", label: "Name", width: 150 },
  { key: "email", label: "Email", flex: 2 },
  { key: "role", label: "Role", width: 100 },
  { key: "status", label: "Status", width: 80 },
];

const sampleRows = [
  { name: "John Doe", email: "john@example.com", role: "Admin", status: "Active" },
  { name: "Jane Smith", email: "jane@example.com", role: "Editor", status: "Active" },
  { name: "Bob Wilson", email: "bob@example.com", role: "Viewer", status: "Inactive" },
  { name: "Alice Brown", email: "alice@example.com", role: "Admin", status: "Active" },
  { name: "Charlie Davis", email: "charlie@example.com", role: "Editor", status: "Pending" },
];

const currencyColumns = [
  { key: "item", label: "Item", width: 150 },
  { key: "price", label: "Price", format: "currency" as const, align: "right" as const, width: 100 },
  { key: "quantity", label: "Qty", format: "number" as const, align: "center" as const, width: 60 },
  { key: "total", label: "Total", format: "currency" as const, align: "right" as const, width: 100 },
];

const currencyRows = [
  { item: "Widget A", price: 29.99, quantity: 5, total: 149.95 },
  { item: "Gadget B", price: 49.99, quantity: 3, total: 149.97 },
  { item: "Tool C", price: 19.99, quantity: 10, total: 199.90 },
];

const percentColumns = [
  { key: "metric", label: "Metric", width: 200 },
  { key: "value", label: "Value", format: "percent" as const, align: "right" as const, width: 100 },
  { key: "change", label: "Change", format: "percent" as const, align: "right" as const, width: 100 },
];

const percentRows = [
  { metric: "Conversion Rate", value: 0.032, change: 0.005 },
  { metric: "Click Through Rate", value: 0.021, change: -0.002 },
  { metric: "Bounce Rate", value: 0.45, change: -0.03 },
  { metric: "Retention Rate", value: 0.78, change: 0.012 },
];

const dateColumns = [
  { key: "date", label: "Date", format: "date" as const, width: 120 },
  { key: "event", label: "Event", flex: 2 },
  { key: "attendees", label: "Attendees", format: "number" as const, align: "right" as const, width: 80 },
];

const dateRows = [
  { date: "2024-01-15", event: "Quarterly Review", attendees: 25 },
  { date: "2024-02-01", event: "Team Building", attendees: 50 },
  { date: "2024-03-10", event: "Product Launch", attendees: 200 },
];

export const Default: Story = {
  args: {
    columns: sampleColumns,
    rows: sampleRows,
  },
};

export const Striped: Story = {
  args: {
    columns: sampleColumns,
    rows: sampleRows,
    striped: true,
  },
};

export const Bordered: Story = {
  args: {
    columns: sampleColumns,
    rows: sampleRows,
    bordered: true,
  },
};

export const StripedAndBordered: Story = {
  args: {
    columns: sampleColumns,
    rows: sampleRows,
    striped: true,
    bordered: true,
  },
};

export const CurrencyTable: Story = {
  args: {
    columns: currencyColumns,
    rows: currencyRows,
    striped: true,
    bordered: true,
  },
};

export const PercentTable: Story = {
  args: {
    columns: percentColumns,
    rows: percentRows,
    striped: true,
    bordered: true,
  },
};

export const DateTable: Story = {
  args: {
    columns: dateColumns,
    rows: dateRows,
    striped: true,
    bordered: true,
  },
};

export const WithAlignment: Story = {
  args: {
    columns: [
      { key: "left", label: "Left Aligned", align: "left" as const },
      { key: "center", label: "Center Aligned", align: "center" as const },
      { key: "right", label: "Right Aligned", align: "right" as const },
    ],
    rows: [
      { left: "Left", center: "Center", right: "Right" },
      { left: "Left", center: "Center", right: "Right" },
    ],
    striped: true,
  },
};

export const WithBoldColumn: Story = {
  args: {
    columns: [
      { key: "name", label: "Name", bold: true, width: 150 },
      { key: "value", label: "Value", width: 100 },
      { key: "note", label: "Note", flex: 1 },
    ],
    rows: [
      { name: "Item 1", value: "100", note: "First item" },
      { name: "Item 2", value: "200", note: "Second item" },
      { name: "Item 3", value: "300", note: "Third item" },
    ],
    striped: true,
  },
};

export const WithLinks: Story = {
  args: {
    columns: [
      { key: "name", label: "Name", width: 150 },
      { key: "url", label: "Website", format: "link" as const, flex: 2 },
    ],
    rows: [
      { name: "Google", url: "https://google.com" },
      { name: "GitHub", url: "https://github.com" },
      { name: "React", url: "https://react.dev" },
    ],
    striped: true,
  },
};

export const EmptyTable: Story = {
  args: {
    columns: sampleColumns,
    rows: [],
    striped: true,
    bordered: true,
  },
};

export const LargeTable: Story = {
  args: {
    columns: sampleColumns,
    rows: Array.from({ length: 50 }, (_, i) => ({
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      role: ["Admin", "Editor", "Viewer"][i % 3],
      status: ["Active", "Inactive", "Pending"][i % 3],
    })),
    striped: true,
    bordered: true,
  },
};

export const FinancialReport: Story = {
  render: () => (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h3 className="font-semibold text-gray-900 mb-2">Q1 Financial Report</h3>
        <p className="text-gray-600 text-sm">January - March 2024</p>
      </div>
      <PdfTable
        columns={currencyColumns}
        rows={[
          { item: "Revenue", price: 125000, quantity: 1, total: 125000 },
          { item: "Expenses", price: 87500, quantity: 1, total: 87500 },
          { item: "Net Profit", price: 37500, quantity: 1, total: 37500 },
        ]}
        striped
        bordered
      />
    </div>
  ),
};

export const UserManagement: Story = {
  render: () => (
    <div className="space-y-4 max-w-3xl">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">User Management</h3>
        <span className="text-sm text-gray-500">5 users</span>
      </div>
      <PdfTable
        columns={[
          { key: "name", label: "Name", width: 150 },
          { key: "email", label: "Email", flex: 2 },
          { key: "role", label: "Role", width: 100 },
          { key: "status", label: "Status", width: 80 },
          { key: "lastLogin", label: "Last Login", format: "date" as const, width: 100 },
        ]}
        rows={[
          { name: "John Doe", email: "john@example.com", role: "Admin", status: "Active", lastLogin: "2024-01-15" },
          { name: "Jane Smith", email: "jane@example.com", role: "Editor", status: "Active", lastLogin: "2024-01-14" },
          { name: "Bob Wilson", email: "bob@example.com", role: "Viewer", status: "Inactive", lastLogin: "2024-01-10" },
          { name: "Alice Brown", email: "alice@example.com", role: "Admin", status: "Active", lastLogin: "2024-01-15" },
          { name: "Charlie Davis", email: "charlie@example.com", role: "Editor", status: "Pending", lastLogin: "2024-01-12" },
        ]}
        striped
        bordered
      />
    </div>
  ),
};

export const Documentation: Story = {
  render: () => (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">PdfTable</h2>
        <p className="text-gray-600">
          Data table primitive for PDF generation with column formatting, alignment,
          and responsive column widths.
        </p>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Column Formats</h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{`type PdfTableColumn = {
  key: string;
  label: string;
  width?: number;        // Fixed width in points
  flex?: number;         // Flex grow factor
  format?: "currency" | "number" | "percent" | "date" | "boolean" | "link";
  align?: "left" | "center" | "right";
  bold?: boolean;
  color?: keyof PdfColorScale;
};`}</code></pre>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Usage</h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{`import { PdfTable } from '@/shared/ui/pdf/primitives';

<PdfTable
  columns={[
    { key: "name", label: "Name", width: 150 },
    { key: "price", label: "Price", format: "currency", align: "right", width: 100 },
  ]}
  rows={[
    { name: "Product A", price: 29.99 },
    { name: "Product B", price: 49.99 },
  ]}
  striped={true}
  bordered={true}
/>`}</code></pre>
      </div>
    </div>
  ),
};