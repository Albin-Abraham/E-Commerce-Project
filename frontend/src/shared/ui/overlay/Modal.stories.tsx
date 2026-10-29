import type { Meta, StoryObj } from "@storybook/react-vite";
import React, { useState } from "react";

import { Modal } from "./Modal";
import { Flex } from "@ui/layout/Flex";
import { Box } from "@ui/layout/Box";
import { Button } from "@ui/button";

const meta: Meta<typeof Modal> = {
  title: "Primitives/Overlay/Modal",
  component: Modal,
  subcomponents: { Header: Modal.Header, Body: Modal.Body, Footer: Modal.Footer, Close: Modal.Close, Nav: Modal.Nav },
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <Modal
              close={() => setIsOpen(false)}
              className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh]"
            >
              <Modal.Header title="Basic Modal" description="This is a simple modal dialog." />
              <Modal.Body>
                <p className="text-gray-600">Modal content goes here. You can put any content in the body.</p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button onClick={() => setIsOpen(false)}>Confirm</Button>
              </Modal.Footer>
            </Modal>
          </div>
        )}
      </>
    );
  },
};

export const WithNav: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Wizard Modal</Button>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <Modal
              close={() => setIsOpen(false)}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh]"
            >
              <Modal.Nav
                items={[
                  { id: "account", label: "Account" },
                  { id: "profile", label: "Profile" },
                  { id: "settings", label: "Settings" },
                  { id: "confirm", label: "Confirm" },
                ]}
              />
              <Modal.Body className="pt-0">
                <div className="space-y-6">
                  <div data-field-id="account">
                    <h3 className="font-semibold text-gray-900 mb-4">Account Information</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" defaultValue="user@example.com" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                        <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" defaultValue="johndoe" />
                      </div>
                    </div>
                  </div>
                  <div data-field-id="profile">
                    <h3 className="font-semibold text-gray-900 mb-4">Profile Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" defaultValue="John Doe" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        <textarea className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" rows={3} defaultValue="Software developer..." />
                      </div>
                    </div>
                  </div>
                  <div data-field-id="settings">
                    <h3 className="font-semibold text-gray-900 mb-4">Preferences</h3>
                    <div className="space-y-4">
                      <label className="flex items-center gap-3">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                        <span className="text-sm text-gray-700">Email notifications</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm text-gray-700">Push notifications</span>
                      </label>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" defaultChecked />
                        <span className="text-sm text-gray-700">Dark mode</span>
                      </label>
                    </div>
                  </div>
                  <div data-field-id="confirm">
                    <h3 className="font-semibold text-gray-900 mb-4">Confirm Changes</h3>
                    <p className="text-gray-600">Review your changes before saving.</p>
                    <div className="bg-gray-50 rounded-lg p-4 mt-4 space-y-2">
                      <p><span className="font-medium">Email:</span> user@example.com</p>
                      <p><span className="font-medium">Name:</span> John Doe</p>
                      <p><span className="font-medium">Notifications:</span> Email ✓, Push ✗</p>
                    </div>
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button onClick={() => setIsOpen(false)}>Save Changes</Button>
              </Modal.Footer>
            </Modal>
          </div>
        )}
      </>
    );
  },
};

export const WithStatus: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal with Status</Button>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <Modal
              close={() => setIsOpen(false)}
              className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh]"
            >
              <Modal.Header title="Setup Progress" description="Complete each step to finish setup." />
              <Modal.Nav
                items={[
                  { id: "step1", label: "Welcome", status: "complete" },
                  { id: "step2", label: "Profile", status: "current" },
                  { id: "step3", label: "Team", status: "idle" },
                  { id: "step4", label: "Complete", status: "idle" },
                ]}
              />
              <Modal.Body className="pt-0">
                <div className="space-y-6">
                  <div data-field-id="step1">
                    <p className="text-gray-600">Welcome step completed!</p>
                  </div>
                  <div data-field-id="step2">
                    <h4 className="font-medium text-gray-900 mb-4">Profile Setup</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Enter your name" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                          <option>Select role</option>
                          <option>Developer</option>
                          <option>Designer</option>
                          <option>Manager</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div data-field-id="step3">
                    <p className="text-gray-600">Team setup will appear here.</p>
                  </div>
                  <div data-field-id="step4">
                    <p className="text-gray-600">Final confirmation step.</p>
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" onClick={() => setIsOpen(false)}>Back</Button>
                <Button onClick={() => setIsOpen(false)}>Continue</Button>
              </Modal.Footer>
            </Modal>
          </div>
        )}
      </>
    );
  },
};

export const ConfirmationDialog: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button variant="danger" onClick={() => setIsOpen(true)}>Delete Item</Button>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <Modal
              close={() => setIsOpen(false)}
              className="bg-white rounded-xl shadow-xl max-w-md w-full"
            >
              <Modal.Header title="Delete Confirmation" description="This action cannot be undone." />
              <Modal.Body>
                <div className="flex flex-col items-center text-center py-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  </div>
                  <p className="text-gray-600">Are you sure you want to delete "Project Alpha"? This will permanently remove all associated data.</p>
                  <input className="mt-4 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Type 'DELETE' to confirm" />
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button variant="danger" onClick={() => setIsOpen(false)}>Delete</Button>
              </Modal.Footer>
            </Modal>
          </div>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <Modal
              close={() => setIsOpen(false)}
              className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh]"
            >
              <Modal.Header title="Create New Project" description="Fill in the details to create a new project." />
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input type="radio" name="visibility" className="w-4 h-4 text-blue-600 focus:ring-blue-500" defaultChecked />
                        <span className="text-sm text-gray-700">Private</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" name="visibility" className="w-4 h-4 text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm text-gray-700">Public</span>
                      </label>
                    </div>
                  </div>
                </form>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button onClick={() => setIsOpen(false)}>Create Project</Button>
              </Modal.Footer>
            </Modal>
          </div>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <Modal
              close={() => setIsOpen(false)}
              className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh]"
            >
              <Modal.Header title="Large Modal" description="This modal has more width for complex content." />
              <Modal.Nav
                items={[
                  { id: "overview", label: "Overview" },
                  { id: "details", label: "Details" },
                  { id: "settings", label: "Settings" },
                ]}
              />
              <Modal.Body className="pt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div data-field-id="overview" className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Overview</h4>
                    <p className="text-gray-600">This is a larger modal that can accommodate more complex layouts with multiple columns.</p>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
                    </div>
                  </div>
                  <div data-field-id="details" className="space-y-4">
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
                  <div data-field-id="settings" className="lg:col-span-2 space-y-4">
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
              <Modal.Footer>
                <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button onClick={() => setIsOpen(false)}>Save Changes</Button>
              </Modal.Footer>
            </Modal>
          </div>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <Modal
              close={() => setIsOpen(false)}
              className="bg-white rounded-xl shadow-xl max-w-md w-full"
            >
              <Modal.Body className="pt-6">
                <div className="text-center py-8 px-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Success!</h3>
                  <p className="text-gray-600">Your changes have been saved successfully.</p>
                </div>
              </Modal.Body>
              <Modal.Footer align="center">
                <Button onClick={() => setIsOpen(false)}>Done</Button>
              </Modal.Footer>
            </Modal>
          </div>
        )}
      </>
    );
  },
};

export const CustomClose: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open with Custom Close</Button>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <Modal
              close={() => setIsOpen(false)}
              className="bg-white rounded-xl shadow-xl max-w-md w-full"
            >
              <Modal.Header
                title="Custom Close Button"
                description="Using a custom close button in the header."
                hideClose={true}
              >
                <Modal.Close
                  className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                  aria-label="Close dialog"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </Modal.Close>
              </Modal.Header>
              <Modal.Body>
                <p className="text-gray-600">This modal uses a custom red close button instead of the default one.</p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button onClick={() => setIsOpen(false)}>Save</Button>
              </Modal.Footer>
            </Modal>
          </div>
        )}
      </>
    );
  },
};