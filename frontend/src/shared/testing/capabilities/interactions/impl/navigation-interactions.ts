import { screen } from "@testing-library/react";
import { click } from "./user-event";

export interface NavigationOptions {
  container?: HTMLElement;
  waitForNavigation?: boolean;
  navigationTimeout?: number;
}

export async function navigateTo(
  path: string,
  options: NavigationOptions = {}
): Promise<void> {
  if (typeof window !== "undefined" && window.history) {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
  
  if (options.waitForNavigation) {
    await waitForUrlChange(options.navigationTimeout ?? 3000);
  }
}

export async function navigateBack(options: NavigationOptions = {}): Promise<void> {
  if (typeof window !== "undefined" && window.history) {
    window.history.back();
  }
  if (options.waitForNavigation) {
    await waitForUrlChange(options.navigationTimeout ?? 3000);
  }
}

export async function navigateForward(options: NavigationOptions = {}): Promise<void> {
  if (typeof window !== "undefined" && window.history) {
    window.history.forward();
  }
  if (options.waitForNavigation) {
    await waitForUrlChange(options.navigationTimeout ?? 3000);
  }
}

export async function reloadPage(options: NavigationOptions = {}): Promise<void> {
  if (typeof window !== "undefined") {
    window.location.reload();
  }
  if (options.waitForNavigation) {
    await waitForUrlChange(options.navigationTimeout ?? 5000);
  }
}

async function waitForUrlChange(timeout: number): Promise<void> {
  const start = Date.now();
  let lastUrl = window.location.href;
  
  while (Date.now() - start < timeout) {
    if (window.location.href !== lastUrl) {
      return;
    }
    await new Promise(r => setTimeout(r, 50));
  }
}

export async function clickLink(
  text: string | RegExp,
  options: NavigationOptions = {}
): Promise<void> {
  const link = await screen.findByRole("link", { name: text });
  await click(link, options);
  if (options.waitForNavigation) {
    await waitForUrlChange(options.navigationTimeout ?? 3000);
  }
}

export async function clickButton(
  text: string | RegExp,
  options: NavigationOptions = {}
): Promise<void> {
  const button = await screen.findByRole("button", { name: text });
  await click(button, options);
}

export async function openMenu(
  triggerText: string | RegExp,
  options: NavigationOptions = {}
): Promise<void> {
  const trigger = await screen.findByRole("button", { name: triggerText });
  await click(trigger, options);
}

export async function selectMenuItem(
  itemText: string | RegExp,
  options: NavigationOptions = {}
): Promise<void> {
  const item = await screen.findByRole("menuitem", { name: itemText });
  await click(item, options);
}

export async function openDropdown(
  triggerText: string | RegExp,
  options: NavigationOptions = {}
): Promise<void> {
  const trigger = await screen.findByRole("combobox", { name: triggerText });
  await click(trigger, options);
}

export async function selectDropdownOption(
  optionText: string | RegExp,
  options: NavigationOptions = {}
): Promise<void> {
  const option = await screen.findByRole("option", { name: optionText });
  await click(option, options);
}

export async function openTab(
  tabName: string | RegExp,
  options: NavigationOptions = {}
): Promise<void> {
  const tab = await screen.findByRole("tab", { name: tabName });
  await click(tab, options);
}

export async function openDialog(
  triggerText: string | RegExp,
  options: NavigationOptions = {}
): Promise<void> {
  const trigger = await screen.findByRole("button", { name: triggerText });
  await click(trigger, options);
  await waitForDialog(options.navigationTimeout ?? 2000);
}

export async function closeDialog(
  options: NavigationOptions = {}
): Promise<void> {
  const closeButton = 
    (await screen.findByRole("button", { name: /close|dismiss|cancel/i })) ||
    (await screen.findByLabelText(/close|dismiss|cancel/i));
  await click(closeButton, options);
  await waitForDialogToClose(options.navigationTimeout ?? 2000);
}

export async function confirmDialog(
  confirm: boolean = true,
  options: NavigationOptions = {}
): Promise<void> {
  const buttonText = confirm ? /confirm|yes|ok|accept/i : /cancel|no|reject|dismiss/i;
  const button = await screen.findByRole("button", { name: buttonText });
  await click(button, options);
}

async function waitForDialog(timeout: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const dialog = document.querySelector('[role="dialog"], [data-dialog], .modal');
    if (dialog) return;
    await new Promise(r => setTimeout(r, 50));
  }
}

async function waitForDialogToClose(timeout: number): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const dialog = document.querySelector('[role="dialog"], [data-dialog], .modal');
    if (!dialog) return;
    await new Promise(r => setTimeout(r, 50));
  }
}

export async function waitForPageLoad(
  timeout: number = 5000
): Promise<void> {
  if (document.readyState === "complete") return;
  
  return new Promise((resolve, reject) => {
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
}

export async function waitForNetworkIdle(
  timeout: number = 5000
): Promise<void> {
  const start = Date.now();
  let pendingRequests = 0;
  
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    pendingRequests++;
    try {
      return await originalFetch(...args);
    } finally {
      pendingRequests--;
    }
  };
  
  try {
    while (Date.now() - start < timeout) {
      if (pendingRequests === 0) {
        await new Promise(r => setTimeout(r, 100));
        if (pendingRequests === 0) return;
      }
      await new Promise(r => setTimeout(r, 50));
    }
    throw new Error("Network idle timeout");
  } finally {
    window.fetch = originalFetch;
  }
}

export async function scrollToElement(
  element: HTMLElement,
  _options: NavigationOptions = {}
): Promise<void> {
  element.scrollIntoView({ behavior: "smooth", block: "center" });
  await new Promise(r => setTimeout(r, 300));
}

export async function scrollToTop(_options: NavigationOptions = {}): Promise<void> {
  window.scrollTo({ top: 0, behavior: "smooth" });
  await new Promise(r => setTimeout(r, 300));
}

export async function scrollToBottom(_options: NavigationOptions = {}): Promise<void> {
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  await new Promise(r => setTimeout(r, 300));
}

export function createNavigationHelpers(container: HTMLElement) {
  return {
    clickLink: (text: string | RegExp, opts?: NavigationOptions) => 
      clickLink(text, { ...opts, container }),
    clickButton: (text: string | RegExp, opts?: NavigationOptions) => 
      clickButton(text, { ...opts, container }),
    openMenu: (text: string | RegExp, opts?: NavigationOptions) => 
      openMenu(text, { ...opts, container }),
    selectMenuItem: (text: string | RegExp, opts?: NavigationOptions) => 
      selectMenuItem(text, { ...opts, container }),
    openDropdown: (text: string | RegExp, opts?: NavigationOptions) => 
      openDropdown(text, { ...opts, container }),
    selectDropdownOption: (text: string | RegExp, opts?: NavigationOptions) => 
      selectDropdownOption(text, { ...opts, container }),
    openTab: (text: string | RegExp, opts?: NavigationOptions) => 
      openTab(text, { ...opts, container }),
    openDialog: (text: string | RegExp, opts?: NavigationOptions) => 
      openDialog(text, { ...opts, container }),
    closeDialog: (opts?: NavigationOptions) => 
      closeDialog({ ...opts, container }),
    confirmDialog: (confirm?: boolean, opts?: NavigationOptions) => 
      confirmDialog(confirm, { ...opts, container }),
  };
}