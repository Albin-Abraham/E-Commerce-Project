import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs, TabList, Tab, TabPanel } from "../../ui/tabs";
import { User, Shield, Bell, CreditCard, Laptop } from "lucide-react";

const meta: Meta<typeof Tabs> = {
  title: "Components/Navigation/Tabs",
  component: Tabs,
  parameters: {
    docs: {
      description: {
        component:
          "Composite WAI-ARIA 1.2 Tabs implementation with keyboard roving focus, automatic or manual activation, and full screen reader relationship semantics.",
      },
    },
  },
};

export default meta;

export const AutomaticActivation: StoryObj = {
  name: "01. Automatic Activation (Standard)",
  render: () => {
    return (
      <div className="max-w-xl p-6 border border-border rounded-xl bg-card space-y-4">
        <div>
          <h3 className="font-semibold text-foreground">Account Settings</h3>
          <p className="text-sm text-muted-foreground">
            Navigate with <kbd className="px-1 py-0.5 bg-muted rounded border text-xs">ArrowLeft</kbd> and{" "}
            <kbd className="px-1 py-0.5 bg-muted rounded border text-xs">ArrowRight</kbd>. Active tab updates immediately on focus.
          </p>
        </div>

        <Tabs defaultValue="profile" activation="automatic">
          <TabList aria-label="Account Settings Tabs">
            <Tab value="profile">
              <User className="w-4 h-4" />
              <span>Profile</span>
            </Tab>
            <Tab value="security">
              <Shield className="w-4 h-4" />
              <span>Security</span>
            </Tab>
            <Tab value="billing" disabled>
              <CreditCard className="w-4 h-4" />
              <span>Billing (Disabled)</span>
            </Tab>
            <Tab value="notifications">
              <Bell className="w-4 h-4" />
              <span>Notifications</span>
            </Tab>
          </TabList>

          <TabPanel value="profile" className="p-4 bg-muted/20 rounded-lg">
            <h4 className="font-medium text-foreground">Personal Information</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Update your photo, email address, and personal bio.
            </p>
          </TabPanel>

          <TabPanel value="security" className="p-4 bg-muted/20 rounded-lg">
            <h4 className="font-medium text-foreground">Security & Credentials</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Manage multi-factor authentication (MFA) and rotate API access keys.
            </p>
          </TabPanel>

          <TabPanel value="billing" className="p-4 bg-muted/20 rounded-lg">
            <h4 className="font-medium text-foreground">Billing Overview</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Invoices and enterprise subscription plans.
            </p>
          </TabPanel>

          <TabPanel value="notifications" className="p-4 bg-muted/20 rounded-lg">
            <h4 className="font-medium text-foreground">Notification Preferences</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Configure real-time webhooks, emails, and mobile push notifications.
            </p>
          </TabPanel>
        </Tabs>
      </div>
    );
  },
};

export const ManualActivation: StoryObj = {
  name: "02. Manual Activation (Explicit Selection)",
  render: () => {
    return (
      <div className="max-w-xl p-6 border border-border rounded-xl bg-card space-y-4">
        <div>
          <h3 className="font-semibold text-foreground">Heavy Content Panels (Manual)</h3>
          <p className="text-sm text-muted-foreground">
            Arrow keys move roving focus (<kbd className="px-1 py-0.5 bg-muted rounded border text-xs">tabindex="0"</kbd>).
            Press <kbd className="px-1 py-0.5 bg-muted rounded border text-xs">Enter</kbd> or{" "}
            <kbd className="px-1 py-0.5 bg-muted rounded border text-xs">Space</kbd> to activate the panel.
          </p>
        </div>

        <Tabs defaultValue="server-logs" activation="manual">
          <TabList aria-label="System Diagnostics Tabs">
            <Tab value="server-logs">Server Logs</Tab>
            <Tab value="metrics">Performance Metrics</Tab>
            <Tab value="traces">Distributed Traces</Tab>
          </TabList>

          <TabPanel value="server-logs" className="p-4 bg-muted/20 rounded-lg">
            <pre className="text-xs font-mono text-muted-foreground p-3 bg-black/5 rounded">
              [2026-10-17 21:00:00] INFO: Kernel booted successfully.
              [2026-10-17 21:01:23] INFO: Ingress routing table reconciled.
            </pre>
          </TabPanel>

          <TabPanel value="metrics" className="p-4 bg-muted/20 rounded-lg">
            <div className="text-sm text-muted-foreground">
              CPU: 14% | Memory: 420MB / 2048MB | RPS: 1,840 req/s
            </div>
          </TabPanel>

          <TabPanel value="traces" className="p-4 bg-muted/20 rounded-lg">
            <div className="text-sm text-muted-foreground">
              Trace latency P99: 14.2ms across 12 microservices.
            </div>
          </TabPanel>
        </Tabs>
      </div>
    );
  },
};

export const VerticalTabs: StoryObj = {
  name: "03. Vertical Orientation",
  render: () => {
    return (
      <div className="max-w-2xl p-6 border border-border rounded-xl bg-card space-y-4">
        <div>
          <h3 className="font-semibold text-foreground">Vertical Sidebar Navigation</h3>
          <p className="text-sm text-muted-foreground">
            Navigate with <kbd className="px-1 py-0.5 bg-muted rounded border text-xs">ArrowDown</kbd> and{" "}
            <kbd className="px-1 py-0.5 bg-muted rounded border text-xs">ArrowUp</kbd>.
          </p>
        </div>

        <Tabs defaultValue="general" orientation="vertical">
          <TabList aria-label="Configuration categories" className="w-48 shrink-0">
            <Tab value="general">General</Tab>
            <Tab value="workspace">Workspace</Tab>
            <Tab value="integrations">Integrations</Tab>
            <Tab value="advanced">Advanced</Tab>
          </TabList>

          <div className="flex-1">
            <TabPanel value="general" className="p-4 bg-muted/20 rounded-lg">
              <h4 className="font-medium text-foreground">General Configuration</h4>
              <p className="text-sm text-muted-foreground mt-1">Default language, timezone, and date format.</p>
            </TabPanel>
            <TabPanel value="workspace" className="p-4 bg-muted/20 rounded-lg">
              <h4 className="font-medium text-foreground">Workspace Preferences</h4>
              <p className="text-sm text-muted-foreground mt-1">Project team members and RBAC role assignments.</p>
            </TabPanel>
            <TabPanel value="integrations" className="p-4 bg-muted/20 rounded-lg">
              <h4 className="font-medium text-foreground">Third-Party Integrations</h4>
              <p className="text-sm text-muted-foreground mt-1">GitHub, Slack, Jira, and PagerDuty endpoints.</p>
            </TabPanel>
            <TabPanel value="advanced" className="p-4 bg-muted/20 rounded-lg">
              <h4 className="font-medium text-foreground">Advanced Flags</h4>
              <p className="text-sm text-muted-foreground mt-1">Feature switches, edge cache TTL, and proxy bypass.</p>
            </TabPanel>
          </div>
        </Tabs>
      </div>
    );
  },
};
