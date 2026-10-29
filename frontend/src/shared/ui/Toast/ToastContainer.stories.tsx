import type { Meta, StoryObj } from "@storybook/react-vite";
import React, { useState } from "react";

import { ToastContainer } from "./ToastContainer";
import { toastBus } from "./toast-bus";
import { toastSuccess, toastError, toastWarning, toastInfo, toastPromise, toastDismiss } from "./toast";
import { Button } from "@ui/button";
import { Flex } from "@ui/layout/Flex";

const meta: Meta<typeof ToastContainer> = {
  title: "Primitives/Toast/ToastContainer",
  component: ToastContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ToastContainer>;

export const Default: Story = {
  render: () => (
    <>
      <ToastContainer />
      <Flex direction="col" gap="md" align="center">
        <h3 className="text-lg font-semibold text-gray-900">Toast Demo</h3>
        <p className="text-gray-600">Click buttons below to show toasts</p>
        <Flex gap="md" wrap>
          <Button onClick={() => toastSuccess("Success!", "Your changes have been saved.")}>Success</Button>
          <Button variant="danger" onClick={() => toastError("Error!", "Something went wrong.")}>Error</Button>
          <Button variant="secondary" onClick={() => toastWarning("Warning!", "Please review your input.")}>Warning</Button>
          <Button variant="ghost" onClick={() => toastInfo("Info", "New update available.")}>Info</Button>
        </Flex>
      </Flex>
    </>
  ),
};

export const AllVariants: Story = {
  render: () => {
    const [showAll, setShowAll] = useState(false);
    return (
      <>
        <ToastContainer />
        <Flex direction="col" gap="md" align="center">
          <Button onClick={() => {
            toastSuccess("Success", "Operation completed successfully");
            toastError("Error", "Failed to process request");
            toastWarning("Warning", "Please check your settings");
            toastInfo("Info", "New features available");
            setShowAll(true);
          }}>Show All Variants</Button>
          {showAll && (
            <Flex direction="col" gap="md" align="center" className="mt-4">
              <p className="text-sm text-gray-600">Toasts shown! Check bottom center of screen.</p>
              <Button variant="ghost" size="sm" onClick={() => setShowAll(false)}>Reset</Button>
            </Flex>
          )}
        </Flex>
      </>
    );
  },
};

export const WithDescription: Story = {
  render: () => (
    <>
      <ToastContainer />
      <Flex direction="col" gap="md" align="center">
        <Button onClick={() => toastSuccess(
          "Profile Updated",
          "Your profile information has been successfully updated. Changes will take effect immediately."
        )}>Success with Description</Button>
        <Button variant="danger" onClick={() => toastError(
          "Connection Failed",
          "Unable to connect to the server. Please check your internet connection and try again."
        )}>Error with Description</Button>
      </Flex>
    </>
  ),
};

export const LongTimeout: Story = {
  render: () => (
    <>
      <ToastContainer />
      <Flex direction="col" gap="md" align="center">
        <Button onClick={() => toastSuccess("Long Toast", "This toast will stay for 10 seconds", { timeout: 10000 })}>
          10 Second Toast
        </Button>
        <Button variant="danger" onClick={() => toastError("Persistent Error", "This error won't auto-dismiss", { timeout: Infinity })}>
          Persistent Error
        </Button>
      </Flex>
    </>
  ),
};

export const NoAutoDismiss: Story = {
  render: () => (
    <>
      <ToastContainer />
      <Flex direction="col" gap="md" align="center">
        <Button onClick={() => toastInfo("Manual Dismiss", "Click the X button to dismiss this toast", { timeout: Infinity })}>
          No Auto-Dismiss
        </Button>
      </Flex>
    </>
  ),
};

export const PromiseToast: Story = {
  render: () => (
    <>
      <ToastContainer />
      <Flex direction="col" gap="md" align="center">
        <Button onClick={async () => {
          try {
            await toastPromise(
              new Promise((resolve) => setTimeout(() => resolve("Success!"), 2000)),
              {
                loading: "Processing...",
                success: "Operation completed!",
                error: "Operation failed!",
              }
            );
          } catch (err) {
            // Error handled by toast
          }
        }}>
          Promise Success (2s)
        </Button>
        <Button variant="danger" onClick={async () => {
          try {
            await toastPromise(
              new Promise((_, reject) => setTimeout(() => reject(new Error("Failed!")), 2000)),
              {
                loading: "Processing...",
                success: "Operation completed!",
                error: (err) => `Failed: ${err.message}`,
              }
            );
          } catch (err) {
            // Error handled by toast
          }
        }}>
          Promise Error (2s)
        </Button>
      </Flex>
    </>
  ),
};

export const DismissToast: Story = {
  render: () => (
    <>
      <ToastContainer />
      <Flex direction="col" gap="md" align="center">
        <Button onClick={() => {
          const id = toastSuccess("Dismissible", "Click the button below to dismiss this toast programmatically");
          setTimeout(() => toastDismiss(id), 5000);
        }}>
          Show Toast
        </Button>
        <Button variant="secondary" onClick={() => {
          // Dismiss all toasts
          const entries = toastBus.getSnapshot();
          entries.forEach(e => toastDismiss(e.id));
        }}>
          Dismiss All
        </Button>
      </Flex>
    </>
  ),
};

export const MultipleToasts: Story = {
  render: () => (
    <>
      <ToastContainer />
      <Flex direction="col" gap="md" align="center">
        <Button onClick={() => {
          for (let i = 1; i <= 5; i++) {
            toastInfo(`Notification ${i}`, `This is toast number ${i}`, { timeout: 3000 + i * 500 });
          }
        }}>
          Show 5 Toasts
        </Button>
      </Flex>
    </>
  ),
};

export const DarkMode: Story = {
  render: () => (
    <>
      <ToastContainer />
      <div className="dark min-h-[200px] p-8 rounded-lg">
        <Flex direction="col" gap="md" align="center">
          <h3 className="text-white font-semibold">Dark Mode Toasts</h3>
          <Flex gap="md" wrap>
            <Button onClick={() => toastSuccess("Success", "Works in dark mode")}>Success</Button>
            <Button variant="danger" onClick={() => toastError("Error", "Works in dark mode")}>Error</Button>
            <Button variant="secondary" onClick={() => toastWarning("Warning", "Works in dark mode")}>Warning</Button>
            <Button variant="ghost" onClick={() => toastInfo("Info", "Works in dark mode")}>Info</Button>
          </Flex>
        </Flex>
      </div>
    </>
  ),
};

export const WithCustomZIndex: Story = {
  render: () => (
    <>
      <ToastContainer zIndex={10000} />
      <Flex direction="col" gap="md" align="center">
        <Button onClick={() => toastSuccess("High Z-Index", "This toast container uses z-index 10000")}>
          Show Toast (z-index: 10000)
        </Button>
      </Flex>
    </>
  ),
};

export const SuccessVariations: Story = {
  render: () => (
    <>
      <ToastContainer />
      <Flex direction="col" gap="md" align="center">
        <Button onClick={() => toastSuccess("Saved", "Document saved successfully")}>Saved</Button>
        <Button onClick={() => toastSuccess("Created", "New project created")}>Created</Button>
        <Button onClick={() => toastSuccess("Published", "Article published to the web")}>Published</Button>
        <Button onClick={() => toastSuccess("Sent", "Invitation sent to team members")}>Sent</Button>
      </Flex>
    </>
  ),
};

export const ErrorVariations: Story = {
  render: () => (
    <>
      <ToastContainer />
      <Flex direction="col" gap="md" align="center">
        <Button variant="danger" onClick={() => toastError("Network Error", "Check your connection")}>Network Error</Button>
        <Button variant="danger" onClick={() => toastError("Validation Failed", "Please fix the highlighted fields")}>Validation Error</Button>
        <Button variant="danger" onClick={() => toastError("Permission Denied", "You don't have access to this resource")}>Permission Error</Button>
        <Button variant="danger" onClick={() => toastError("Server Error", "Try again later")}>Server Error</Button>
      </Flex>
    </>
  ),
};