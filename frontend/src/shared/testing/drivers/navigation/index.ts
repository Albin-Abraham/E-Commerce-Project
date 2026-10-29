/**
 * Navigation Driver - Semantic Layer for Navigation Testing
 * 
 * Provides semantic operations for testing navigation, routing, and page transitions.
 */

import { screen } from '@testing-library/react';
import { expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { BaseDriver } from '../base';

export class NavigationDriver extends BaseDriver {
  protected user: ReturnType<typeof userEvent.setup>;

  constructor(
    container: HTMLElement = document.body,
    user: ReturnType<typeof userEvent.setup> = userEvent.setup()
  ) {
    super(container);
    this.user = user;
  }

  // --- Navigation ---

  public async navigateTo(path: string) {
    if (typeof window !== 'undefined' && window.history) {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    await this.waitForPageLoad();
    return this;
  }

  public async goBack() {
    if (typeof window !== 'undefined' && window.history) {
      window.history.back();
    }
    await this.waitForPageLoad();
    return this;
  }

  public async goForward() {
    if (typeof window !== 'undefined' && window.history) {
      window.history.forward();
    }
    await this.waitForPageLoad();
    return this;
  }

  public async reload() {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
    await this.waitForPageLoad();
    return this;
  }

  public async expectUrl(path: string | RegExp) {
    await this.waitFor(() => {
      if (typeof path === 'string') {
        expect(window.location.href).toContain(path);
      } else {
        expect(window.location.href).toMatch(path);
      }
    });
    return this;
  }

  public async expectPath(path: string | RegExp) {
    await this.waitFor(() => {
      const pathname = window.location.pathname;
      if (typeof path === 'string') {
        expect(pathname).toBe(path);
      } else {
        expect(pathname).toMatch(path);
      }
    });
    return this;
  }

  // --- Link & Button Interactions ---

  public async clickLink(text: string | RegExp) {
    const link = await screen.findByRole('link', { name: text });
    await this.user.click(link);
    await this.waitForPageLoad();
    return this;
  }

  public async clickButton(text: string | RegExp) {
    const button = await screen.findByRole('button', { name: text });
    await this.user.click(button);
    return this;
  }

  // --- Menu & Dropdown ---

  public async openMenu(triggerText: string | RegExp) {
    const trigger = await screen.findByRole('button', { name: triggerText });
    await this.user.click(trigger);
    return this;
  }

  public async selectMenuItem(itemText: string | RegExp) {
    const item = await screen.findByRole('menuitem', { name: itemText });
    await this.user.click(item);
    return this;
  }

  public async openDropdown(triggerText: string | RegExp) {
    const trigger = await screen.findByRole('combobox', { name: triggerText });
    await this.user.click(trigger);
    return this;
  }

  public async selectDropdownOption(optionText: string | RegExp) {
    const option = await screen.findByRole('option', { name: optionText });
    await this.user.click(option);
    return this;
  }

  // --- Tabs & Dialogs ---

  public async openTab(tabName: string | RegExp) {
    const tab = await screen.findByRole('tab', { name: tabName });
    await this.user.click(tab);
    return this;
  }

  public async openDialog(triggerText: string | RegExp) {
    const trigger = await screen.findByRole('button', { name: triggerText });
    await this.user.click(trigger);
    await this.waitForElement({ role: 'dialog' });
    return this;
  }

  public async closeDialog() {
    const closeButton =
      (await screen.findByRole('button', { name: /close|dismiss|cancel/i })) ||
      (await screen.findByLabelText(/close|dismiss|cancel/i));
    await this.user.click(closeButton);
    await this.waitForElementToDisappear({ role: 'dialog' });
    return this;
  }

  public async confirmDialog(confirm = true, options?: { text?: string | RegExp }) {
    const buttonText = confirm ? /confirm|yes|ok|save/i : /cancel|no|discard/i;
    const button = await screen.findByRole('button', { name: buttonText });
    await this.user.click(button);
    if (options?.text) {
      await this.waitForElement({ text: options.text });
    }
    return this;
  }

  // --- Waiting ---

  public async waitForNavigation(timeout = 3000) {
    await this.waitFor(() => {
      // Wait for URL to change or navigation to complete
    }, timeout);
  }

  public async waitForPageLoad(timeout = 5000) {
    if (document.readyState === 'complete') return;

    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Page load timeout')), timeout);
      if (document.readyState === 'complete') {
        clearTimeout(timer);
        resolve();
      } else {
        window.addEventListener(
          'load',
          () => {
            clearTimeout(timer);
            resolve();
          },
          { once: true }
        );
      }
    });
  }

  public async waitForElement(options: { role?: string; text?: string | RegExp; testId?: string }, timeout = 5000) {
    await this.waitFor(async () => {
      if (options.role) {
        await screen.findByRole(options.role, { name: options.text });
      } else if (options.text) {
        await screen.findByText(options.text);
      } else if (options.testId) {
        await screen.findByTestId(options.testId);
      }
    }, { timeout });
  }

  public async waitForElementToDisappear(options: { role?: string; text?: string | RegExp; testId?: string }, timeout = 5000) {
    await this.waitFor(async () => {
      if (options.role) {
        const elements = screen.queryByRole(options.role, { name: options.text });
        if (elements) throw new Error('Element still present');
      } else if (options.text) {
        const elements = screen.queryByText(options.text);
        if (elements) throw new Error('Element still present');
      } else if (options.testId) {
        const elements = screen.queryByTestId(options.testId);
        if (elements) throw new Error('Element still present');
      }
    }, { timeout });
  }

  // --- Scrolling ---

  public async scrollToElement(element: HTMLElement, options?: ScrollIntoViewOptions) {
    element.scrollIntoView(options ?? { behavior: 'smooth', block: 'center' });
    await this.waitFor(() => {}, 300);
  }

  public async scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await this.waitFor(() => {}, 300);
  }

  public async scrollToBottom() {
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    await this.waitFor(() => {}, 300);
  }

  // --- Helpers ---

  public createNavigationHelpers() {
    return {
      navigateTo: this.navigateTo.bind(this),
      goBack: this.goBack.bind(this),
      goForward: this.goForward.bind(this),
      reload: this.reload.bind(this),
      clickLink: this.clickLink.bind(this),
      clickButton: this.clickButton.bind(this),
      openMenu: this.openMenu.bind(this),
      selectMenuItem: this.selectMenuItem.bind(this),
      openDropdown: this.openDropdown.bind(this),
      selectDropdownOption: this.selectDropdownOption.bind(this),
      openTab: this.openTab.bind(this),
      openDialog: this.openDialog.bind(this),
      closeDialog: this.closeDialog.bind(this),
      confirmDialog: this.confirmDialog.bind(this),
      waitForPageLoad: this.waitForPageLoad.bind(this),
      waitForElement: this.waitForElement.bind(this),
      waitForElementToDisappear: this.waitForElementToDisappear.bind(this),
    };
  }
}