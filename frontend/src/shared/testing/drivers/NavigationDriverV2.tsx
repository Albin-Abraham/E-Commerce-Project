import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect as vitestExpect } from "vitest";

import { createQueryCapability } from "../capabilities/queries";
import { createInteractionCapability } from "../capabilities/interactions";
import { createAssertionCapability } from "../capabilities/assertions";
import { createAsyncCapability } from "../capabilities/async";
import { createDiagnosticsCapability } from "../capabilities/diagnostics";
import { createIsolationCapability } from "../infrastructure/isolation";

export interface NavigationDriverOptions {
  container?: HTMLElement;
  user?: ReturnType<typeof userEvent.setup>;
  testId?: string;
  testName?: string;
}

export interface NavigationDriver {
  container: HTMLElement;
  user: ReturnType<typeof userEvent.setup>;
  testId: string;
  testName: string;
  
  query: ReturnType<typeof createQueryCapability>;
  interact: ReturnType<typeof createInteractionCapability>;
  expect: ReturnType<typeof createAssertionCapability>;
  wait: ReturnType<typeof createAsyncCapability>;
  diagnose: ReturnType<typeof createDiagnosticsCapability>;
  isolate: ReturnType<typeof createIsolationCapability>;
  
  navigateTo: (path: string) => Promise<NavigationDriver>;
  clickLink: (text: string | RegExp) => Promise<NavigationDriver>;
  clickButton: (text: string | RegExp) => Promise<NavigationDriver>;
  goBack: () => Promise<NavigationDriver>;
  goForward: () => Promise<NavigationDriver>;
  reload: () => Promise<NavigationDriver>;
  expectUrl: (path: string | RegExp) => Promise<NavigationDriver>;
  expectPath: (path: string | RegExp) => Promise<NavigationDriver>;
  openMenu: (triggerText: string | RegExp) => Promise<NavigationDriver>;
  selectMenuItem: (itemText: string | RegExp) => Promise<NavigationDriver>;
  openDropdown: (triggerText: string | RegExp) => Promise<NavigationDriver>;
  selectDropdownOption: (optionText: string | RegExp) => Promise<NavigationDriver>;
  openTab: (tabName: string | RegExp) => Promise<NavigationDriver>;
  openDialog: (triggerText: string | RegExp) => Promise<NavigationDriver>;
  closeDialog: () => Promise<NavigationDriver>;
  waitForNavigation: (timeout?: number) => Promise<void>;
  waitForPageLoad: (timeout?: number) => Promise<void>;
}

export function createNavigationDriver(options: NavigationDriverOptions = {}): NavigationDriver {
  const { container = document.body, user = userEvent.setup(), testId = "navigation-test", testName = "Navigation Test" } = options;
  
  const query = createQueryCapability(container);
  const interact = createInteractionCapability(container);
  const expect = createAssertionCapability(container);
  const wait = createAsyncCapability(container);
  const diagnose = createDiagnosticsCapability(container);
  const isolate = createIsolationCapability();
  
  const driver: NavigationDriver = {
    container,
    user,
    testId,
    testName,
    query,
    interact,
    expect,
    wait,
    diagnose,
    isolate,
    
    async navigateTo(path: string) {
      if (typeof window !== "undefined" && window.history) {
        window.history.pushState({}, "", path);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
      return driver;
    },
    
    async clickLink(text: string | RegExp) {
      const link = await screen.findByRole("link", { name: text });
      await interact.click(link);
      return driver;
    },
    
    async clickButton(text: string | RegExp) {
      const button = await screen.findByRole("button", { name: text });
      await interact.click(button);
      return driver;
    },
    
    async goBack() {
      if (typeof window !== "undefined" && window.history) {
        window.history.back();
      }
      return driver;
    },
    
    async goForward() {
      if (typeof window !== "undefined" && window.history) {
        window.history.forward();
      }
      return driver;
    },
    
    async reload() {
      if (typeof window !== "undefined") {
        window.location.reload();
      }
      return driver;
    },
    
    async expectUrl(path: string | RegExp) {
      await wait.waitFor(() => {
        if (typeof path === "string") {
          vitestExpect(window.location.href).toContain(path);
        } else {
          vitestExpect(window.location.href).toMatch(path);
        }
      });
      return driver;
    },
    
    async expectPath(path: string | RegExp) {
      await wait.waitFor(() => {
        const pathname = window.location.pathname;
        if (typeof path === "string") {
          vitestExpect(pathname).toBe(path);
        } else {
          vitestExpect(pathname).toMatch(path);
        }
      });
      return driver;
    },
    
    async openMenu(triggerText: string | RegExp) {
      const trigger = await screen.findByRole("button", { name: triggerText });
      await interact.click(trigger);
      return driver;
    },
    
    async selectMenuItem(itemText: string | RegExp) {
      const item = await screen.findByRole("menuitem", { name: itemText });
      await interact.click(item);
      return driver;
    },
    
    async openDropdown(triggerText: string | RegExp) {
      const trigger = await screen.findByRole("combobox", { name: triggerText });
      await interact.click(trigger);
      return driver;
    },
    
    async selectDropdownOption(optionText: string | RegExp) {
      const option = await screen.findByRole("option", { name: optionText });
      await interact.click(option);
      return driver;
    },
    
    async openTab(tabName: string | RegExp) {
      const tab = await screen.findByRole("tab", { name: tabName });
      await interact.click(tab);
      return driver;
    },
    
    async openDialog(triggerText: string | RegExp) {
      const trigger = await screen.findByRole("button", { name: triggerText });
      await interact.click(trigger);
      await wait.waitForElement({ role: "dialog" });
      return driver;
    },
    
    async closeDialog() {
      const closeButton = 
        (await screen.findByRole("button", { name: /close|dismiss|cancel/i })) ||
        (await screen.findByLabelText(/close|dismiss|cancel/i));
      await interact.click(closeButton);
      await wait.waitForElementToDisappear({ role: "dialog" });
      return driver;
    },
    
    async waitForNavigation(timeout: number = 3000) {
      await wait.waitFor(() => {
        // Wait for URL to change or navigation to complete
      }, { timeout });
    },
    
    async waitForPageLoad(timeout: number = 5000) {
      if (document.readyState === "complete") return;
      
      return new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error("Page load timeout")), timeout);
        if (document.readyState === "complete") {
          clearTimeout(timer);
          resolve();
        } else {
          window.addEventListener("load", () => {
            clearTimeout(timer);
            resolve();
          }, { once: true });
        }
      });
    },
  };
  
  return driver;
}

export interface RenderNavigationOptions {
  component: React.ComponentType<any>;
  props?: any;
  initialPath?: string;
  testId?: string;
  testName?: string;
}

export async function renderNavigation(options: RenderNavigationOptions): Promise<{ driver: NavigationDriver; container: HTMLElement; user: ReturnType<typeof userEvent.setup> }> {
  const user = userEvent.setup();
  const { component: Component, props = {}, initialPath = "/" } = options;
  
  const { renderWithProviders } = await import("../test-utils");
  const { createMemoryRouter, RouterProvider } = await import("react-router-dom");
  
  const router = createMemoryRouter(
    [{ path: "*", element: <Component {...props} /> }],
    { initialEntries: [initialPath] }
  );
  
  const { container } = renderWithProviders(
    <RouterProvider router={router} />
  );
  
  const driver = createNavigationDriver({
    container,
    user,
    testId: options.testId,
    testName: options.testName,
  });
  
  return { driver, container, user };
}

export function createNavigationDriverFactory() {
  return {
    create: createNavigationDriver,
    renderNavigation,
  };
}

export const navigationDriverFactory = createNavigationDriverFactory();