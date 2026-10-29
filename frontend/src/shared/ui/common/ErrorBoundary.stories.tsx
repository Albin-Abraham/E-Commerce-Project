import type { Meta, StoryObj } from "@storybook/react-vite";

import { ErrorBoundary } from "./ErrorBoundary";

const meta: Meta<typeof ErrorBoundary> = {
  title: "Primitives/Common/ErrorBoundary",
  component: ErrorBoundary,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ErrorBoundary>;

const ThrowError = ({ errorType = "generic" }: { errorType?: "generic" | "chunk" }) => {
  if (errorType === "chunk") {
    const err = new Error("Loading chunk 5 failed") as Error & { name?: string };
    err.name = "ChunkLoadError";
    throw err;
  }
  throw new Error("Something went wrong!");
};

export const Default: Story = {
  render: () => (
    <ErrorBoundary>
      <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Normal Content</h3>
        <p className="text-gray-600">This content renders normally without errors.</p>
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Action Button</button>
      </div>
    </ErrorBoundary>
  ),
};

export const WithGenericError: Story = {
  render: () => (
    <ErrorBoundary>
      <ThrowError errorType="generic" />
    </ErrorBoundary>
  ),
};

export const WithChunkLoadError: Story = {
  render: () => (
    <ErrorBoundary>
      <ThrowError errorType="chunk" />
    </ErrorBoundary>
  ),
};

export const WithCustomFallback: Story = {
  render: () => (
    <ErrorBoundary
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[300px] p-6 text-center bg-amber-50 border border-amber-200 rounded-lg">
          <div className="w-16 h-16 mb-4 text-amber-600">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2 text-amber-800">Custom Error UI</h2>
          <p className="text-amber-700 mb-6 max-w-md">This is a custom fallback provided via the fallback prop.</p>
          <button className="px-6 py-2 bg-amber-600 text-white rounded-md hover:opacity-90 transition-opacity font-medium">Retry</button>
        </div>
      }
    >
      <ThrowError />
    </ErrorBoundary>
  ),
};

export const NestedBoundaries: Story = {
  render: () => (
    <ErrorBoundary
      fallback={
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
          <h3 className="font-semibold text-red-800 mb-2">Outer Boundary Caught Error</h3>
          <p className="text-red-700">The inner boundary didn't catch this one.</p>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Outer Content (Always Visible)</h4>
          <ErrorBoundary
            fallback={
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center">
                <h4 className="font-semibold text-amber-800 mb-1">Inner Boundary Caught Error</h4>
                <p className="text-amber-700 text-sm">This error was caught by the inner boundary.</p>
              </div>
            }
          >
            <ThrowError />
          </ErrorBoundary>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Another Outer Section</h4>
          <p className="text-gray-600">This section is unaffected by the inner error.</p>
        </div>
      </div>
    </ErrorBoundary>
  ),
};

export const InCard: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <h4 className="font-medium text-gray-900 mb-2">Card 1 (Normal)</h4>
        <p className="text-gray-600 text-sm">This card renders normally.</p>
      </div>
      <ErrorBoundary>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h4 className="font-medium text-gray-900 mb-2">Card 2 (Throws Error)</h4>
          <ThrowError />
        </div>
      </ErrorBoundary>
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <h4 className="font-medium text-gray-900 mb-2">Card 3 (Normal)</h4>
        <p className="text-gray-600 text-sm">This card renders normally.</p>
      </div>
    </div>
  ),
};

export const InList: Story = {
  render: () => (
    <div className="w-full max-w-md space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <ErrorBoundary key={i}>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            {i === 2 ? (
              <ThrowError />
            ) : (
              <>
                <h4 className="font-medium text-gray-900">List Item {i + 1}</h4>
                <p className="text-gray-600 text-sm">This item renders normally.</p>
              </>
            )}
          </div>
        </ErrorBoundary>
      ))}
    </div>
  ),
};