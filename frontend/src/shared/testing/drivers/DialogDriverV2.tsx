import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { createQueryCapability } from "../capabilities/queries";
import { createInteractionCapability } from "../capabilities/interactions";
import { createAssertionCapability } from "../capabilities/assertions";
import { createAsyncCapability } from "../capabilities/async";
import { createDiagnosticsCapability } from "../capabilities/diagnostics";
import { createIsolationCapability } from "../infrastructure/isolation";

export interface DialogDriverOptions {
  container?: HTMLElement;
  user?: ReturnType<typeof userEvent.setup>;
  testId?: string;
  testName?: string;
}

export interface DialogDriver {
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
  
  open: (triggerText?: string | RegExp) => Promise<DialogDriver>;
  close: () => Promise<DialogDriver>;
  confirm: () => Promise<DialogDriver>;
  dismiss: () => Promise<DialogDriver>;
  expectOpen: () => Promise<DialogDriver>;
  expectClosed: () => Promise<DialogDriver>;
  expectTitle: (title: string | RegExp) => Promise<DialogDriver>;
  expectContent: (content: string | RegExp) => Promise<DialogDriver>;
  fillForm: (fields: Record<string, any>) => Promise<DialogDriver>;
  submit: () => Promise<DialogDriver>;
}

export function createDialogDriver(options: DialogDriverOptions = {}): DialogDriver {
  const { container = document.body, user = userEvent.setup(), testId = "dialog-test", testName = "Dialog Test" } = options;
  
  const query = createQueryCapability(container);
  const interact = createInteractionCapability(container);
  const expect = createAssertionCapability(container);
  const wait = createAsyncCapability(container);
  const diagnose = createDiagnosticsCapability(container);
  const isolate = createIsolationCapability();
  
  const driver: DialogDriver = {
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
    
    async open(triggerText) {
      if (triggerText) {
        const trigger = await screen.findByRole("button", { name: triggerText });
        await interact.click(trigger);
      }
      await wait.waitForElement({ role: "dialog" });
      return driver;
    },
    
    async close() {
      const closeButton = 
        (await screen.findByRole("button", { name: /close|dismiss|cancel/i })) ||
        (await screen.findByLabelText(/close|dismiss|cancel/i));
      await interact.click(closeButton);
      await wait.waitForElementToDisappear({ role: "dialog" });
      return driver;
    },
    
    async confirm() {
      const confirmButton = await screen.findByRole("button", { name: /confirm|yes|ok|accept/i });
      await interact.click(confirmButton);
      return driver;
    },
    
    async dismiss() {
      const dismissButton = await screen.findByRole("button", { name: /cancel|no|dismiss|reject/i });
      await interact.click(dismissButton);
      return driver;
    },
    
    async expectOpen() {
      const dialog = await screen.findByRole("dialog");
      expect.toBeVisible(dialog);
      return driver;
    },
    
    async expectClosed() {
      await wait.waitForElementToDisappear({ role: "dialog" });
      return driver;
    },
    
    async expectTitle(title: string | RegExp) {
      const dialog = await screen.findByRole("dialog");
      const titleElement = within(dialog).getByRole("heading");
      expect.toHaveTextContent(titleElement, title);
      return driver;
    },
    
    async expectContent(content: string | RegExp) {
      const dialog = await screen.findByRole("dialog");
      expect.toHaveTextContent(dialog, content);
      return driver;
    },
    
    async fillForm(fields: Record<string, any>) {
      for (const [name, value] of Object.entries(fields)) {
        await interact.fillFieldByName(name, String(value));
      }
      return driver;
    },
    
    async submit() {
      const submitButton = await screen.findByRole("button", { name: /submit|save|confirm|ok/i });
      await interact.click(submitButton);
      return driver;
    },
  };
  
  return driver;
}

export interface RenderDialogOptions {
  component: React.ComponentType<any>;
  props?: any;
  triggerText?: string | RegExp;
  testId?: string;
  testName?: string;
}

export async function renderDialog(options: RenderDialogOptions): Promise<{ driver: DialogDriver; container: HTMLElement; user: ReturnType<typeof userEvent.setup> }> {
  const user = userEvent.setup();
  const { component: Component, props = {}, triggerText } = options;
  
  const { renderWithProviders } = await import("../test-utils");
  
  const { container } = renderWithProviders(<Component {...props} />);
  
  const driver = createDialogDriver({
    container,
    user,
    testId: options.testId,
    testName: options.testName,
  });
  
  if (triggerText) {
    await driver.open(triggerText);
  }
  
  return { driver, container, user };
}

export function createDialogDriverFactory() {
  return {
    create: createDialogDriver,
    renderDialog,
  };
}

export const dialogDriverFactory = createDialogDriverFactory();