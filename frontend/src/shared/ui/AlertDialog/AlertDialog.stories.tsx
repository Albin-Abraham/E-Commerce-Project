import type { Meta, StoryObj } from "@storybook/react-vite";
import React, { useState } from "react";

import { AlertDialogProvider, useAlertDialog } from "./AlertDialogContext";

const meta: Meta<typeof AlertDialogProvider> = {
  title: "Primitives/Core/AlertDialog",
  component: AlertDialogProvider,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof AlertDialogProvider>;

const AlertDialogDemo = () => {
  const { confirm, alert, destructive } = useAlertDialog();
  
  return (
    <div className="space-y-4 max-w-md">
      <Button onClick={() => confirm({
        title: "Confirm Action",
        message: "Are you sure you want to proceed?",
        intent: "info",
      })}>Confirm (Info)</Button>
      
      <Button onClick={() => confirm({
        title: "Delete Item",
        message: "This action cannot be undone.",
        intent: "danger",
        confirmLabel: "Delete",
      })} variant="danger">Confirm (Danger)</Button>
      
      <Button onClick={() => confirm({
        title: "Save Changes",
        message: "Your changes will be saved.",
        intent: "success",
        confirmLabel: "Save",
      })}>Confirm (Success)</Button>
      
      <Button onClick={() => confirm({
        title: "Continue Anyway?",
        message: "There are unsaved changes.",
        intent: "warning",
        confirmLabel: "Continue",
      })} variant="secondary">Confirm (Warning)</Button>
      
      <Button onClick={() => alert({
        title: "Success!",
        message: "Operation completed successfully.",
        intent: "success",
      })}>Alert (Success)</Button>
      
      <Button onClick={() => alert({
        title: "Error",
        message: "Something went wrong. Please try again.",
        intent: "error",
      })} variant="danger">Alert (Error)</Button>
      
      <Button onClick={() => alert({
        title: "Information",
        message: "This is an informational message.",
        intent: "info",
      })} variant="ghost">Alert (Info)</Button>
      
      <Button onClick={() => destructive({
        title: "Delete Project",
        message: "This will permanently delete the project and all its data.",
        confirmLabel: "Delete Project",
      })} variant="danger">Destructive</Button>
    </div>
  );
};

const Button = ({ children, onClick, variant = "primary", ...props }: any) => {
  const base = "px-4 py-2 rounded-lg font-medium transition-colors";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    danger: "bg-red-600 text-white hover:bg-red-700",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
    ghost: "text-gray-600 hover:bg-gray-100",
  };
  return (
    <button onClick={onClick} className={`${base} ${variants[variant]}`} {...props}>
      {children}
    </button>
  );
};

export const Default: Story = {
  render: () => (
    <AlertDialogProvider>
      <AlertDialogDemo />
    </AlertDialogProvider>
  ),
};

export const InfoDialog: Story = {
  render: () => (
    <AlertDialogProvider>
      <div className="max-w-md">
        <AlertDialogDemo />
      </div>
    </AlertDialogProvider>
  ),
};

export const SuccessDialog: Story = {
  render: () => (
    <AlertDialogProvider>
      <div className="max-w-md">
        <AlertDialogDemo />
      </div>
    </AlertDialogProvider>
  ),
};

export const WarningDialog: Story = {
  render: () => (
    <AlertDialogProvider>
      <div className="max-w-md">
        <AlertDialogDemo />
      </div>
    </AlertDialogProvider>
  ),
};

export const ErrorDialog: Story = {
  render: () => (
    <AlertDialogProvider>
      <div className="max-w-md">
        <AlertDialogDemo />
      </div>
    </AlertDialogProvider>
  ),
};

export const DangerDialog: Story = {
  render: () => (
    <AlertDialogProvider>
      <div className="max-w-md">
        <AlertDialogDemo />
      </div>
    </AlertDialogProvider>
  ),
};

export const WithCustomLabels: Story = {
  render: () => (
    <AlertDialogProvider>
      <CustomLabelsDemo />
    </AlertDialogProvider>
  ),
};

const CustomLabelsDemo = () => {
  const { confirm, alert } = useAlertDialog();
  
  return (
    <div className="space-y-4 max-w-md">
      <Button onClick={() => confirm({
        title: "Publish Article",
        message: "Your article will be visible to everyone.",
        confirmLabel: "Publish Now",
        cancelLabel: "Save as Draft",
        intent: "info",
      })}>Custom Confirm Labels</Button>
      
      <Button onClick={() => confirm({
        title: "Upgrade Plan",
        message: "Upgrade to Pro for unlimited features.",
        confirmLabel: "Upgrade",
        cancelLabel: "Maybe Later",
        intent: "success",
      })}>Custom Success Labels</Button>
      
      <Button onClick={() => alert({
        title: "Welcome!",
        message: "Thanks for joining. Check your email for next steps.",
        confirmLabel: "Get Started",
        intent: "success",
      })}>Custom Alert Label</Button>
    </div>
  );
};

export const PromiseBased: Story = {
  render: () => (
    <AlertDialogProvider>
      <PromiseDemo />
    </AlertDialogProvider>
  ),
};

const PromiseDemo = () => {
  const { confirm, alert, destructive } = useAlertDialog();
  
  const handleConfirm = async () => {
    const result = await confirm({
      title: "Async Confirm",
      message: "This returns a promise.",
      intent: "info",
    });
    if (result) {
      await alert({
        title: "Confirmed!",
        message: "You clicked confirm.",
        intent: "success",
      });
    }
  };
  
  const handleDestructive = async () => {
    const result = await destructive({
      title: "Delete Account",
      message: "This action is irreversible.",
      confirmLabel: "Delete",
    });
    if (result) {
      await alert({
        title: "Deleted",
        message: "Account has been deleted.",
        intent: "success",
      });
    }
  };
  
return (
    <div className="space-y-4 max-w-md">
      <Button onClick={handleConfirm}>Promise Confirm</Button>
      <Button variant="danger" onClick={handleDestructive}>Promise Destructive</Button>
    </div>
  );
};

export const InContext: Story = {
  render: () => (
    <AlertDialogProvider>
      <div className="max-w-2xl">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">User Management</h2>
          <div className="space-y-3">
            <UserRow name="John Doe" email="john@example.com" role="Admin" />
            <UserRow name="Jane Smith" email="jane@example.com" role="Editor" />
            <UserRow name="Bob Wilson" email="bob@example.com" role="Viewer" />
          </div>
        </div>
        <AlertDialogDemo />
      </div>
    </AlertDialogProvider>
  ),
};

const UserRow = ({ name, email, role }: any) => {
  const { destructive } = useAlertDialog();
  
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div>
        <p className="font-medium text-gray-900">{name}</p>
        <p className="text-sm text-gray-500">{email}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">{role}</span>
        <Button variant="ghost" size="sm" onClick={() => destructive({
          title: `Delete ${name}?`,
          message: "This will permanently remove this user.",
          confirmLabel: "Delete User",
        })}>Delete</Button>
      </div>
    </div>
  );
};

export const Documentation: Story = {
  render: () => (
    <AlertDialogProvider>
      <div className="max-w-3xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">AlertDialog</h2>
          <p className="text-gray-600">
            Industrial-grade accessible dialog system with multiple intents,
            promise-based API, and React Aria Components under the hood.
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Intents</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-green-700 mb-1">success</h4>
              <p className="text-sm text-gray-600">Positive actions, completions</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-amber-700 mb-1">warning</h4>
              <p className="text-sm text-gray-600">Caution, potentially risky actions</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-red-700 mb-1">error</h4>
              <p className="text-sm text-gray-600">Error states, retry actions</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-blue-700 mb-1">info</h4>
              <p className="text-sm text-gray-600">Neutral information, acknowledgments</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="font-medium text-red-700 mb-1">danger</h4>
              <p className="text-sm text-gray-600">Destructive, irreversible actions</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">API</h3>
          <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{`const { confirm, alert, destructive } = useAlertDialog();

// Promise-based confirm
const result = await confirm({
  title: "Delete?",
  message: "Cannot be undone.",
  intent: "danger",
  confirmLabel: "Delete",
});

// Simple alert
await alert({
  title: "Saved!",
  message: "Changes saved.",
  intent: "success",
});

// Destructive shortcut
await destructive({
  title: "Remove?",
  message: "Permanent deletion.",
});`}</code></pre>
        </div>
      </div>
    </AlertDialogProvider>
  ),
};