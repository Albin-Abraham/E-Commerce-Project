import type { Meta, StoryObj } from "@storybook/react-vite";
import React, { useState } from "react";

import { Modal } from "./modal";
import { Flex } from "@ui/layout/Flex";
import { Box } from "@ui/layout/Box";
import { Button } from "@ui/button";

const meta: Meta<typeof Modal> = {
  title: "Primitives/Core/Modal",
  component: Modal,
  subcomponents: { Header: Modal.Header, Body: Modal.Body, Footer: Modal.Footer, Close: Modal.Close },
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Basic: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        {isOpen && (
          <Modal isOpen={isOpen} onOpenChange={setIsOpen} size="md">
            <Modal.Header>Basic Modal</Modal.Header>
            <Modal.Body>
              <p className="text-gray-600">This is a basic modal with header, body, and footer.</p>
            </Modal.Body>
            <Modal.Footer actions={[
              { label: "Cancel", variant: "ghost", onPress: () => setIsOpen(false) },
              { label: "Confirm", variant: "primary", onPress: () => setIsOpen(false) },
            ]} />
          </Modal>
        )}
      </>
    );
  },
};

export const WithIndicator: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open with Indicator</Button>
        {isOpen && (
          <Modal isOpen={isOpen} onOpenChange={setIsOpen} size="md">
            <Modal.Header showIndicator>New Feature</Modal.Header>
            <Modal.Body>
              <p className="text-gray-600">The header shows a pulsing indicator for new content.</p>
            </Modal.Body>
            <Modal.Footer actions={[
              { label: "Got it", variant: "primary", onPress: () => setIsOpen(false) },
            ]} />
          </Modal>
        )}
      </>
    );
  },
};

export const WithoutHeader: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Without Header</Button>
        {isOpen && (
          <Modal isOpen={isOpen} onOpenChange={setIsOpen} size="md">
            <Modal.Body className="text-center py-8 px-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Success!</h3>
              <p className="text-gray-600">Your changes have been saved successfully.</p>
            </Modal.Body>
            <Modal.Footer align="center" actions={[
              { label: "Done", variant: "primary", onPress: () => setIsOpen(false) },
            ]} />
          </Modal>
        )}
      </>
    );
  },
};

export const FormModal: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Form Modal</Button>
        {isOpen && (
          <Modal isOpen={isOpen} onOpenChange={setIsOpen} size="lg">
            <Modal.Header>Create New Project</Modal.Header>
            <Modal.Body>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
                  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="My Awesome Project" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" rows={3} placeholder="Describe your project..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>Select a team</option>
                    <option>Engineering</option>
                    <option>Design</option>
                    <option>Marketing</option>
                  </select>
                </div>
              </form>
            </Modal.Body>
            <Modal.Footer actions={[
              { label: "Cancel", variant: "ghost", onPress: () => setIsOpen(false) },
              { label: "Create Project", variant: "primary", onPress: () => setIsOpen(false) },
            ]} />
          </Modal>
        )}
      </>
    );
  },
};

export const ConfirmationModal: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button variant="danger" onClick={() => setIsOpen(true)}>Delete Item</Button>
        {isOpen && (
          <Modal isOpen={isOpen} onOpenChange={setIsOpen} size="sm">
            <Modal.Header showIndicator>Delete Confirmation</Modal.Header>
            <Modal.Body>
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <p className="text-gray-600">Are you sure you want to delete "Project Alpha"? This will permanently remove all associated data.</p>
                <input className="mt-4 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Type 'DELETE' to confirm" />
              </div>
            </Modal.Body>
            <Modal.Footer actions={[
              { label: "Cancel", variant: "ghost", onPress: () => setIsOpen(false) },
              { label: "Delete", variant: "danger", onPress: () => setIsOpen(false) },
            ]} />
          </Modal>
        )}
      </>
    );
  },
};

export const LargeModal: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Large Modal</Button>
        {isOpen && (
          <Modal isOpen={isOpen} onOpenChange={setIsOpen} size="xl">
            <Modal.Header>Large Modal</Modal.Header>
            <Modal.Body>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Overview</h4>
                  <p className="text-gray-600">This is a larger modal that can accommodate more complex layouts with multiple columns.</p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Details</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Status</span>
                      <span className="font-medium text-green-600">Active</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Created</span>
                      <span className="font-medium">Jan 15, 2024</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600">Updated</span>
                      <span className="font-medium">Jan 20, 2024</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Owner</span>
                      <span className="font-medium">John Doe</span>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-2 space-y-4">
                  <h4 className="font-semibold text-gray-900">Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="text-sm text-gray-700">Enable analytics</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700">Auto-save</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                      <span className="text-sm text-gray-700">Notifications</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm text-gray-700">Dark mode</span>
                    </label>
                  </div>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer actions={[
              { label: "Cancel", variant: "ghost", onPress: () => setIsOpen(false) },
              { label: "Save Changes", variant: "primary", onPress: () => setIsOpen(false) },
            ]} />
          </Modal>
        )}
      </>
    );
  },
};

export const FullWidthModal: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Full Width</Button>
        {isOpen && (
          <Modal isOpen={isOpen} onOpenChange={setIsOpen} size="full">
            <Modal.Header>Full Width Modal</Modal.Header>
            <Modal.Body>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Metric 1</h4>
                  <p className="text-3xl font-bold text-gray-900">1,234</p>
                  <p className="text-sm text-green-600 mt-1">+12%</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Metric 2</h4>
                  <p className="text-3xl font-bold text-gray-900">$98,765</p>
                  <p className="text-sm text-green-600 mt-1">+8%</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Metric 3</h4>
                  <p className="text-3xl font-bold text-gray-900">3.2%</p>
                  <p className="text-sm text-red-600 mt-1">-3%</p>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer actions={[
              { label: "Close", variant: "primary", onPress: () => setIsOpen(false) },
            ]} />
          </Modal>
        )}
      </>
    );
  },
};

export const SmallModal: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Small Modal</Button>
        {isOpen && (
          <Modal isOpen={isOpen} onOpenChange={setIsOpen} size="sm">
            <Modal.Header>Small Modal</Modal.Header>
            <Modal.Body>
              <p className="text-gray-600">This is a small modal for simple confirmations or short messages.</p>
            </Modal.Body>
            <Modal.Footer actions={[
              { label: "Cancel", variant: "ghost", onPress: () => setIsOpen(false) },
              { label: "OK", variant: "primary", onPress: () => setIsOpen(false) },
            ]} />
          </Modal>
        )}
      </>
    );
  },
};

export const WithCustomActions: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Custom Actions</Button>
        {isOpen && (
          <Modal isOpen={isOpen} onOpenChange={setIsOpen} size="md">
            <Modal.Header>Custom Footer Actions</Modal.Header>
            <Modal.Body>
              <p className="text-gray-600">Footer with multiple custom action buttons.</p>
            </Modal.Body>
            <Modal.Footer align="between" actions={[
              { label: "Delete", variant: "danger", onPress: () => setIsOpen(false) },
              { label: "Cancel", variant: "ghost", onPress: () => setIsOpen(false) },
              { label: "Save Draft", variant: "secondary", onPress: () => setIsOpen(false) },
              { label: "Publish", variant: "primary", onPress: () => setIsOpen(false) },
            ]} />
          </Modal>
        )}
      </>
    );
  },
};

export const NestedContent: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Nested Components</Button>
        {isOpen && (
          <Modal isOpen={isOpen} onOpenChange={setIsOpen} size="lg">
            <Modal.Header>With Nested Components</Modal.Header>
            <Modal.Body>
              <Flex direction="col" gap="md">
                <Box className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Box Component</h4>
                  <p className="text-blue-700">Using Box inside Modal Body</p>
                </Box>
                <Flex gap="md" wrap>
                  <Box className="bg-green-50 border border-green-200 rounded-lg p-4 flex-1 min-w-[150px]">
                    <p className="text-green-700">Flex Item 1</p>
                  </Box>
                  <Box className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex-1 min-w-[150px]">
                    <p className="text-yellow-700">Flex Item 2</p>
                  </Box>
                </Flex>
              </Flex>
            </Modal.Body>
            <Modal.Footer actions={[
              { label: "Close", variant: "primary", onPress: () => setIsOpen(false) },
            ]} />
          </Modal>
        )}
      </>
    );
  },
};

export const Documentation: Story = {
  render: () => (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Modal</h2>
        <p className="text-gray-600">
          Industrial-grade modal with compound components (Header, Body, Footer, Close),
          multiple sizes, and React Aria Components for accessibility.
        </p>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Sizes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-white p-4 rounded border"><code>sm</code> - max-w-md</div>
          <div className="bg-white p-4 rounded border"><code>md</code> - max-w-lg (default)</div>
          <div className="bg-white p-4 rounded border"><code>lg</code> - max-w-2xl</div>
          <div className="bg-white p-4 rounded border"><code>xl</code> - max-w-5xl</div>
          <div className="bg-white p-4 rounded border"><code>full</code> - Near full viewport</div>
        </div>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Usage</h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-x-auto"><code>{`import { Modal } from '@/shared/ui';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open</Button>
      <Modal isOpen={isOpen} onOpenChange={setIsOpen} size="md">
        <Modal.Header>Title</Modal.Header>
        <Modal.Body>Content</Modal.Body>
        <Modal.Footer actions={[
          { label: "Cancel", variant: "ghost", onPress: () => setIsOpen(false) },
          { label: "Confirm", variant: "primary", onPress: () => setIsOpen(false) },
        ]} />
      </Modal>
    </>
  );
}`}</code></pre>
      </div>
    </div>
  ),
};