import type { Meta, StoryObj } from "@storybook/react-vite";

import { ContextSkeleton } from "./ContextSkeleton";
import { LoadingService } from "@core/services/helpers/loading-service";
import { UIScope } from "@core/services/helpers/loading-ui.enum";

const meta: Meta<typeof ContextSkeleton> = {
  title: "Primitives/Common/ContextSkeleton",
  component: ContextSkeleton,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    loadingKey: { control: "text" },
    scope: {
      control: "select",
      options: Object.values(UIScope),
    },
  },
};

export default meta;
type Story = StoryObj<typeof ContextSkeleton>;

const Content = () => (
  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Loaded Content</h3>
    <p className="text-gray-600">This content appears after the loading state completes.</p>
    <div className="mt-4 space-y-2">
      <div className="h-4 bg-gray-100 rounded w-3/4" />
      <div className="h-4 bg-gray-100 rounded w-1/2" />
      <div className="h-4 bg-gray-100 rounded w-5/6" />
    </div>
  </div>
);

export const WithLoadingKey: Story = {
  args: {
    loadingKey: "sample-data",
    children: <Content />,
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md">
        <Flex gap="md" mb-4>
          <button
            onClick={() => LoadingService.instance().startKey("sample-data")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Start Loading
          </button>
          <button
            onClick={() => LoadingService.instance().stopKey("sample-data")}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Stop Loading
          </button>
        </Flex>
        <Story />
      </div>
    ),
  ],
};

export const WithScope: Story = {
  args: {
    scope: UIScope.PAGE,
    children: <Content />,
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md">
        <Flex gap="md" mb-4>
          <button
            onClick={() => LoadingService.instance().startScope(UIScope.PAGE, "page-load")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Start Page Loading
          </button>
          <button
            onClick={() => LoadingService.instance().stopScope(UIScope.PAGE, "page-load")}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Stop Page Loading
          </button>
        </Flex>
        <Story />
      </div>
    ),
  ],
};

export const CustomFallback: Story = {
  args: {
    loadingKey: "custom-fallback",
    fallback: (
      <div className="space-y-4 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
      </div>
    ),
    children: <Content />,
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md">
        <Flex gap="md" mb-4>
          <button
            onClick={() => LoadingService.instance().startKey("custom-fallback")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Show Custom Skeleton
          </button>
          <button
            onClick={() => LoadingService.instance().stopKey("custom-fallback")}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Hide
          </button>
        </Flex>
        <Story />
      </div>
    ),
  ],
};

export const CardGrid: Story = {
  args: {
    loadingKey: "card-grid",
    children: (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h4 className="font-medium text-gray-900 mb-1">Card {i + 1}</h4>
            <p className="text-sm text-gray-600">Content for card {i + 1}</p>
          </div>
        ))}
      </div>
    ),
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-4xl">
        <Flex gap="md" mb-4>
          <button
            onClick={() => LoadingService.instance().startKey("card-grid")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Load Cards
          </button>
          <button
            onClick={() => LoadingService.instance().stopKey("card-grid")}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Show Skeleton
          </button>
        </Flex>
        <Story />
      </div>
    ),
  ],
};

export const TableSkeleton: Story = {
  args: {
    loadingKey: "table-data",
    fallback: (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="h-5 bg-gray-200 rounded w-1/4 animate-pulse" />
        </div>
        <div className="divide-y divide-gray-200">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
                  <div className="h-3 bg-gray-200 rounded w-1/4 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    children: (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-900">User Table</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium">
                  U{i + 1}
                </div>
                <div>
                  <p className="font-medium text-gray-900">User {i + 1}</p>
                  <p className="text-sm text-gray-500">user{i + 1}@example.com</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-2xl">
        <Flex gap="md" mb-4>
          <button
            onClick={() => LoadingService.instance().startKey("table-data")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Load Table
          </button>
          <button
            onClick={() => LoadingService.instance().stopKey("table-data")}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Show Skeleton
          </button>
        </Flex>
        <Story />
      </div>
    ),
  ],
};

export const FormSkeleton: Story = {
  args: {
    loadingKey: "form-data",
    fallback: (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
              <div className="h-10 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="h-10 bg-gray-200 rounded w-1/4 animate-pulse" />
      </div>
    ),
    children: (
      <form className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">User Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" defaultValue="John Doe" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" defaultValue="john@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="tel" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" defaultValue="+1 (555) 123-4567" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" rows={3} defaultValue="Software engineer..." />
          </div>
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 font-medium">Save Changes</button>
      </form>
    ),
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md">
        <Flex gap="md" mb-4>
          <button
            onClick={() => LoadingService.instance().startKey("form-data")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Load Form
          </button>
          <button
            onClick={() => LoadingService.instance().stopKey("form-data")}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Show Skeleton
          </button>
        </Flex>
        <Story />
      </div>
    ),
  ],
};

export const DefaultFallback: Story = {
  args: {
    loadingKey: "default-fallback",
    children: <Content />,
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md">
        <Flex gap="md" mb-4>
          <button
            onClick={() => LoadingService.instance().startKey("default-fallback")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Show Default Skeleton
          </button>
          <button
            onClick={() => LoadingService.instance().stopKey("default-fallback")}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Show Content
          </button>
        </Flex>
        <Story />
      </div>
    ),
  ],
};