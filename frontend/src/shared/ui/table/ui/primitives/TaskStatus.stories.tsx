import type { Meta, StoryObj } from "@storybook/react-vite";

import { TaskStatus, DefaultSummary, DefaultErrorList, resolveTaskErrorMessage } from "./TaskStatus";

const meta: Meta<typeof TaskStatus> = {
  title: "Primitives/Table/TaskStatus",
  component: TaskStatus,
  subcomponents: { DefaultSummary, DefaultErrorList },
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof TaskStatus>;

const sampleSummary = { created_count: 42, updated_count: 15, error_count: 3 };
const sampleErrors = [
  { row: 5, message: "Invalid email format" },
  { row: 12, error: "Duplicate entry" },
  { row: 23, error: { email: ["Already exists"], name: ["Required"] } },
  { row: 31, message: "Row 31: Validation failed" },
];

export const Default: Story = {
  args: {
    summary: sampleSummary,
    errors: sampleErrors,
    status: "completed",
  },
  render: (args) => (
    <TaskStatus
      {...args}
      renderSummary={(s) => <DefaultSummary summary={s} />}
      renderErrors={(e) => <DefaultErrorList errors={e} />}
    />
  ),
};

export const WithCreated: Story = {
  args: {
    summary: { created_count: 100, updated_count: 0, error_count: 0 },
    errors: [],
    status: "completed",
  },
  render: (args) => (
    <TaskStatus
      {...args}
      renderSummary={(s) => <DefaultSummary summary={s} />}
    />
  ),
};

export const WithUpdated: Story = {
  args: {
    summary: { created_count: 0, updated_count: 50, error_count: 0 },
    errors: [],
    status: "completed",
  },
  render: (args) => (
    <TaskStatus
      {...args}
      renderSummary={(s) => <DefaultSummary summary={s} />}
    />
  ),
};

export const WithErrors: Story = {
  args: {
    summary: { created_count: 10, updated_count: 5, error_count: 8 },
    errors: sampleErrors,
    status: "failed",
  },
  render: (args) => (
    <TaskStatus
      {...args}
      renderSummary={(s) => <DefaultSummary summary={s} />}
      renderErrors={(e) => <DefaultErrorList errors={e} />}
    />
  ),
};

export const Processing: Story = {
  args: {
    summary: null,
    errors: [],
    status: "processing",
  },
  render: (args) => (
    <div className="flex items-center gap-3 p-4">
      <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-gray-700">Processing...</span>
    </div>
  ),
};

export const Pending: Story = {
  args: {
    summary: null,
    errors: [],
    status: "pending",
  },
  render: (args) => (
    <div className="flex items-center gap-3 p-4">
      <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-gray-700">Pending...</span>
    </div>
  ),
};

export const Uploading: Story = {
  args: {
    summary: null,
    errors: [],
    status: "uploading",
  },
  render: (args) => (
    <div className="flex items-center gap-3 p-4">
      <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-gray-700">Uploading...</span>
    </div>
  ),
};

export const Queued: Story = {
  args: {
    summary: null,
    errors: [],
    status: "queued",
  },
  render: (args) => (
    <div className="flex items-center gap-3 p-4">
      <div className="w-8 h-8 border-4 border-gray-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-gray-700">Queued...</span>
    </div>
  ),
};

export const NoErrors: Story = {
  args: {
    summary: { created_count: 25, updated_count: 10, error_count: 0 },
    errors: [],
    status: "completed",
  },
  render: (args) => (
    <TaskStatus
      {...args}
      renderSummary={(s) => <DefaultSummary summary={s} />}
    />
  ),
};

export const ManyErrors: Story = {
  args: {
    summary: { created_count: 5, updated_count: 2, error_count: 15 },
    errors: Array.from({ length: 15 }, (_, i) => ({
      row: i + 1,
      message: `Error on row ${i + 1}: Validation failed for field ${(i % 3) + 1}`,
    })),
    status: "failed",
  },
  render: (args) => (
    <TaskStatus
      {...args}
      renderSummary={(s) => <DefaultSummary summary={s} />}
      renderErrors={(e) => <DefaultErrorList errors={e} />}
    />
  ),
};

export const CustomLabels: Story = {
  args: {
    summary: { created_count: 100, updated_count: 50, error_count: 5 },
    errors: [],
    status: "completed",
  },
  render: (args) => (
    <TaskStatus
      {...args}
      renderSummary={(s) => (
        <DefaultSummary
          summary={s}
          labels={{ created: "Inserted", updated: "Modified", failed: "Rejected" }}
        />
      )}
    />
  ),
};

export const CustomErrorLabels: Story = {
  args: {
    summary: { created_count: 0, updated_count: 0, error_count: 3 },
    errors: [
      { row: 10, message: "Invalid data" },
      { row: 20, message: "Missing required field" },
    ],
    status: "failed",
  },
  render: (args) => (
    <TaskStatus
      {...args}
      renderErrors={(e) => <DefaultErrorList errors={e} labels={{ row: "Line" }} />}
    />
  ),
};

export const AsRenderProp: Story = {
  args: {
    summary: sampleSummary,
    errors: sampleErrors,
    status: "completed",
  },
  render: (args) => (
    <TaskStatus {...args}>
      {({ summary, errors, status }) => (
        <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md">
          <h3 className="font-semibold text-gray-900 mb-4">Custom Render</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium capitalize">{status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span className="font-medium text-green-600">{summary?.created_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Updated:</span>
              <span className="font-medium text-blue-600">{summary?.updated_count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Errors:</span>
              <span className="font-medium text-red-600">{summary?.error_count}</span>
            </div>
            {errors.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Error Details:</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {errors.map((err, idx) => (
                    <div key={idx} className="text-xs text-red-600">
                      Row {err.row}: {resolveTaskErrorMessage(err)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </TaskStatus>
  ),
};

export const InCard: Story = {
  args: {
    summary: sampleSummary,
    errors: sampleErrors,
    status: "completed",
  },
  render: (args) => (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden max-w-md">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Import Results</h3>
      </div>
      <div className="p-4">
        <TaskStatus
          {...args}
          renderSummary={(s) => <DefaultSummary summary={s} />}
          renderErrors={(e) => <DefaultErrorList errors={e} />}
        />
      </div>
    </div>
  ),
};

export const AllStatuses: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl">
      {[
        { status: "pending", label: "Pending" },
        { status: "queued", label: "Queued" },
        { status: "uploading", label: "Uploading" },
        { status: "processing", label: "Processing" },
        { status: "completed", label: "Completed" },
        { status: "failed", label: "Failed" },
      ].map(({ status, label }) => (
        <div key={status} className="bg-white border border-gray-200 rounded-xl p-4">
          <h4 className="font-medium text-gray-900 mb-3">{label}</h4>
          <TaskStatus
            summary={status === "completed" ? sampleSummary : null}
            errors={status === "failed" ? sampleErrors : []}
            status={status as any}
            renderSummary={(s) => <DefaultSummary summary={s} />}
            renderErrors={(e) => <DefaultErrorList errors={e} />}
          />
        </div>
      ))}
    </div>
  ),
};