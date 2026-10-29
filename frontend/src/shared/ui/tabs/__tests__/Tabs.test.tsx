import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "vitest-axe";
import * as matchers from "vitest-axe/matchers";
import "vitest-axe/extend-expect";

expect.extend(matchers);

import { Tabs, TabList, Tab, TabPanel } from "../index";

const TestTabs: React.FC<{
  defaultValue?: string;
  orientation?: "horizontal" | "vertical";
  activation?: "automatic" | "manual";
  onValueChange?: (val: string) => void;
}> = ({
  defaultValue = "account",
  orientation = "horizontal",
  activation = "automatic",
  onValueChange,
}) => (
  <Tabs
    defaultValue={defaultValue}
    orientation={orientation}
    activation={activation}
    onValueChange={onValueChange}
  >
    <TabList aria-label="Settings navigation">
      <Tab value="account">Account</Tab>
      <Tab value="password">Password</Tab>
      <Tab value="billing" disabled>Billing (Disabled)</Tab>
      <Tab value="notifications">Notifications</Tab>
    </TabList>
    <TabPanel value="account">
      <h2>Account Settings</h2>
      <p>Manage your profile details.</p>
    </TabPanel>
    <TabPanel value="password">
      <h2>Password Settings</h2>
      <p>Change your secure password.</p>
    </TabPanel>
    <TabPanel value="billing">
      <h2>Billing Information</h2>
      <p>Billing plans and invoices.</p>
    </TabPanel>
    <TabPanel value="notifications">
      <h2>Notification Preferences</h2>
      <p>Configure alerts and emails.</p>
    </TabPanel>
  </Tabs>
);

describe("Composite Tabs Component", () => {
  it("renders with correct WAI-ARIA roles, relationship IDs, and initial state", () => {
    render(<TestTabs />);

    const tabList = screen.getByRole("tablist", { name: "Settings navigation" });
    expect(tabList).toHaveAttribute("aria-orientation", "horizontal");

    const accountTab = screen.getByRole("tab", { name: "Account" });
    const passwordTab = screen.getByRole("tab", { name: "Password" });

    expect(accountTab).toHaveAttribute("aria-selected", "true");
    expect(accountTab).toHaveAttribute("tabindex", "0");
    expect(passwordTab).toHaveAttribute("aria-selected", "false");
    expect(passwordTab).toHaveAttribute("tabindex", "-1");

    const accountPanel = screen.getByRole("tabpanel", { name: "Account" });
    expect(accountPanel).toBeVisible();
    expect(accountTab.getAttribute("aria-controls")).toBe(accountPanel.id);
  });

  it("navigates tabs automatically using ArrowRight and ArrowLeft, skipping disabled tab", () => {
    const onValueChange = vi.fn();
    render(<TestTabs onValueChange={onValueChange} />);

    const accountTab = screen.getByRole("tab", { name: "Account" });
    const passwordTab = screen.getByRole("tab", { name: "Password" });
    const notificationsTab = screen.getByRole("tab", { name: "Notifications" });

    accountTab.focus();
    fireEvent.keyDown(accountTab, { key: "ArrowRight" });

    expect(passwordTab).toHaveAttribute("aria-selected", "true");
    expect(onValueChange).toHaveBeenCalledWith("password");
    expect(screen.getByRole("tabpanel", { name: "Password" })).toBeVisible();

    // ArrowRight again should skip disabled "billing" and jump straight to "notifications"
    fireEvent.keyDown(passwordTab, { key: "ArrowRight" });
    expect(notificationsTab).toHaveAttribute("aria-selected", "true");
    expect(onValueChange).toHaveBeenCalledWith("notifications");
    expect(screen.getByRole("tabpanel", { name: "Notifications" })).toBeVisible();
  });

  it("navigates in vertical orientation using ArrowDown and ArrowUp", () => {
    render(<TestTabs orientation="vertical" />);

    const tabList = screen.getByRole("tablist");
    expect(tabList).toHaveAttribute("aria-orientation", "vertical");

    const accountTab = screen.getByRole("tab", { name: "Account" });
    const passwordTab = screen.getByRole("tab", { name: "Password" });

    accountTab.focus();
    fireEvent.keyDown(accountTab, { key: "ArrowDown" });
    expect(passwordTab).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(passwordTab, { key: "ArrowUp" });
    expect(accountTab).toHaveAttribute("aria-selected", "true");
  });

  it("supports manual activation mode where arrow moves focus but Enter/Space selects tab", () => {
    const onValueChange = vi.fn();
    render(<TestTabs activation="manual" onValueChange={onValueChange} />);

    const accountTab = screen.getByRole("tab", { name: "Account" });
    const passwordTab = screen.getByRole("tab", { name: "Password" });

    accountTab.focus();
    fireEvent.keyDown(accountTab, { key: "ArrowRight" });

    // Focus has moved to passwordTab (tabindex 0), but it is not yet selected
    expect(passwordTab).toHaveAttribute("tabindex", "0");
    expect(accountTab).toHaveAttribute("aria-selected", "true");
    expect(onValueChange).not.toHaveBeenCalled();

    // Press Enter to activate
    fireEvent.keyDown(passwordTab, { key: "Enter" });
    expect(passwordTab).toHaveAttribute("aria-selected", "true");
    expect(onValueChange).toHaveBeenCalledWith("password");
  });

  it("jumps to first tab with Home and last tab with End", () => {
    render(<TestTabs />);

    const accountTab = screen.getByRole("tab", { name: "Account" });
    const notificationsTab = screen.getByRole("tab", { name: "Notifications" });

    accountTab.focus();
    fireEvent.keyDown(accountTab, { key: "End" });
    expect(notificationsTab).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(notificationsTab, { key: "Home" });
    expect(accountTab).toHaveAttribute("aria-selected", "true");
  });

  it("passes axe accessibility scan with zero violations", async () => {
    const { container } = render(<TestTabs />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
