import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { within } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";

import { Form } from "../../Form";
import type { FormDefinition } from "../../types";

const tabsDemoForm: FormDefinition = {
  id: "tabs-demo",
  title: "Account Settings",
  description: "Manage your account, security, and notification preferences.",
  sections: [
    {
      id: "settings-section",
      title: "Settings",
      fields: [
        {
          id: "settings-tabs",
          name: "settingsTabs",
          type: "tab",
          label: "Configuration Tabs",
          fields: [
            {
              id: "tab-general",
              name: "general",
              type: "container",
              label: "General Profile",
              customData: { badge: 2 },
              fields: [
                {
                  id: "display-name",
                  name: "displayName",
                  type: "text",
                  label: "Display Name",
                  initialValue: "Alex Mercer",
                  layout: { columnSpan: 12 },
                },
                {
                  id: "contact-email",
                  name: "email",
                  type: "email",
                  label: "Contact Email",
                  initialValue: "alex.mercer@zenos.io",
                  layout: { columnSpan: 12 },
                },
              ],
            },
            {
              id: "tab-security",
              name: "security",
              type: "container",
              label: "Security & MFA",
              fields: [
                {
                  id: "two-factor",
                  name: "mfaEnabled",
                  type: "switch",
                  label: "Two-Factor Authentication",
                  description: "Enforce biometric or TOTP authentication on login.",
                  initialValue: true,
                  layout: { columnSpan: 12 },
                },
                {
                  id: "session-timeout",
                  name: "sessionTimeout",
                  type: "select",
                  label: "Session Timeout (Minutes)",
                  options: [
                    { label: "15 Minutes", value: "15" },
                    { label: "30 Minutes", value: "30" },
                    { label: "60 Minutes", value: "60" },
                  ],
                  initialValue: "30",
                  layout: { columnSpan: 12 },
                },
              ],
            },
            {
              id: "tab-notifications",
              name: "notifications",
              type: "container",
              label: "Notifications",
              fields: [
                {
                  id: "email-digest",
                  name: "emailDigest",
                  type: "checkbox",
                  label: "Weekly Activity Digest",
                  initialValue: true,
                  layout: { columnSpan: 12 },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const meta: Meta<typeof Form> = {
  title: "Form/Structure/TabsField",
  component: Form,
  tags: ["autodocs"],
  args: {
    definition: tabsDemoForm,
  },
};

export default meta;
type Story = StoryObj<typeof Form>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const user = userEvent.setup();
    const canvas = within(canvasElement);

    // Verify tabs are rendered
    const securityTab = canvas.getByRole("tab", { name: /Security & MFA/i });
    await user.click(securityTab);

    // Verify tab panel switched
    const mfaSwitch = await canvas.findByRole("switch");
    if (mfaSwitch) {
      await user.click(mfaSwitch);
    }
  },
};

export const CompactDensity: Story = {
  args: {
    definition: {
      ...tabsDemoForm,
      settings: {
        density: "compact",
      },
    },
  },
};
