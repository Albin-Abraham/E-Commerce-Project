import type { Meta, StoryObj } from "@storybook/react-vite";

import { FocusTrap } from "./FocusTrap";

const meta: Meta<typeof FocusTrap> = {
  title: "Primitives/Common/FocusTrap",
  component: FocusTrap,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    active: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof FocusTrap>;

export const Default: Story = {
  args: {
    active: true,
    children: (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Focus Trap Active</h3>
        <p className="text-gray-600 mb-4">Tab through these elements - focus will be trapped inside:</p>
        <div className="space-y-3">
          <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="First input" />
          <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Second input" />
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option>Select option</option>
            <option>Option 1</option>
            <option>Option 2</option>
          </select>
          <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Submit</button>
          <a href="#" className="block text-center text-blue-600 hover:underline">Link</a>
        </div>
      </div>
    ),
  },
};

export const Inactive: Story = {
  args: {
    active: false,
    children: (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Focus Trap Inactive</h3>
        <p className="text-gray-600 mb-4">Focus can move freely outside this container:</p>
        <div className="space-y-3">
          <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="First input" />
          <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Second input" />
          <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Submit</button>
        </div>
      </div>
    ),
  },
};

export const ModalPattern: Story = {
  args: {
    active: true,
    children: (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Modal Dialog</h3>
            <button className="p-1 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="p-4 space-y-4">
            <p className="text-gray-600">Focus is trapped within this modal. Tab to navigate between elements.</p>
            <div className="space-y-3">
              <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Name" autoFocus />
              <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Email" />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button className="px-4 py-2 text-gray-600 hover:text-gray-900">Cancel</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Confirm</button>
            </div>
          </div>
        </div>
      </div>
    ),
  },
};

export const DrawerPattern: Story = {
  args: {
    active: true,
    children: (
      <div className="fixed inset-0 z-50 flex items-end">
        <div className="fixed inset-0 bg-black/50" />
        <div className="bg-white w-full max-w-sm shadow-xl flex flex-col h-full z-10">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Drawer Panel</h3>
            <button className="p-1 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            <p className="text-gray-600">Focus is trapped in this drawer. Tab cycles through focusable elements.</p>
            <div className="space-y-3">
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">Setting 1</span>
                <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Value" />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-gray-700 mb-1">Setting 2</span>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option>Option A</option>
                  <option>Option B</option>
                  <option>Option C</option>
                </select>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700">Enable feature</span>
              </label>
            </div>
          </div>
          <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
            <button className="px-4 py-2 text-gray-600 hover:text-gray-900">Cancel</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save</button>
          </div>
        </div>
      </div>
    ),
  },
};

export const NestedFocusTraps: Story = {
  args: {
    active: true,
    children: (
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Outer Focus Trap</h3>
        <p className="text-gray-600 mb-4">Focus trapped in outer container:</p>
        <div className="space-y-3 mb-6">
          <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Outer input 1" />
          <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Outer input 2" />
        </div>
        <FocusTrap active={true}>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3">Inner Focus Trap (Nested)</h4>
            <p className="text-blue-700 text-sm mb-3">Focus now trapped in inner container:</p>
            <div className="space-y-2">
              <input className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Inner input 1" />
              <input className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Inner input 2" />
              <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">Inner Action</button>
            </div>
          </div>
        </FocusTrap>
        <button className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 mt-4">Outer Action</button>
      </div>
    ),
  },
};

export const FormWithFocusTrap: Story = {
  args: {
    active: true,
    children: (
      <form className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm max-w-md space-y-4" onSubmit={(e) => e.preventDefault()}>
        <h3 className="text-lg font-semibold text-gray-900">Registration Form</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="John" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Doe" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="john@example.com" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="••••••••" required />
          </div>
        </div>
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button type="button" className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Register</button>
        </div>
      </form>
    ),
  },
};