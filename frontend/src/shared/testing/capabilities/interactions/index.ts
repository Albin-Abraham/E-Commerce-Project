export * from "./types";
export * from "./impl/user-event";
export * from "./impl/form-interactions";
export * from "./impl/navigation-interactions";

import type { InteractionOptions } from "./types";
import * as userEvent from "./impl/user-event";
import * as formInteractions from "./impl/form-interactions";
import * as navInteractions from "./impl/navigation-interactions";

export function createInteractionCapability(container: HTMLElement) {
  const ctx = { container };

  return {
    // User Event
    click: (element: HTMLElement, options?: InteractionOptions & { button?: 0 | 1 | 2 }) =>
      userEvent.click(element, options),
    doubleClick: (element: HTMLElement, options?: InteractionOptions) =>
      userEvent.doubleClick(element, options),
    rightClick: (element: HTMLElement, options?: InteractionOptions) =>
      userEvent.rightClick(element, options),
    hover: (element: HTMLElement, options?: InteractionOptions) =>
      userEvent.hover(element, options),
    unhover: (element: HTMLElement, options?: InteractionOptions) =>
      userEvent.unhover(element, options),
    typeText: (element: HTMLElement, text: string, options?: InteractionOptions & { clear?: boolean }) =>
      userEvent.typeText(element, text, options),
    clear: (element: HTMLElement) =>
      userEvent.clear(element),
    selectOption: (element: HTMLSelectElement, options?: InteractionOptions & { byValue?: string; byLabel?: string; byIndex?: number }) =>
      userEvent.selectOption(element, options),
    uploadFiles: (element: HTMLElement, files: File | File[], options?: InteractionOptions) =>
      userEvent.uploadFiles(element, { files, ...options }),
    keyboard: (key: string, options?: InteractionOptions & { modifiers?: ("Alt" | "Control" | "Shift" | "Meta")[] }) =>
      userEvent.keyboard(key, options),
    tab: (options?: InteractionOptions) => userEvent.tab(options),
    enter: (options?: InteractionOptions) => userEvent.enter(options),
    escape: (options?: InteractionOptions) => userEvent.escape(options),
    arrowUp: (options?: InteractionOptions) => userEvent.arrowUp(options),
    arrowDown: (options?: InteractionOptions) => userEvent.arrowDown(options),
    arrowLeft: (options?: InteractionOptions) => userEvent.arrowLeft(options),
    arrowRight: (options?: InteractionOptions) => userEvent.arrowRight(options),
    home: (options?: InteractionOptions) => userEvent.home(options),
    end: (options?: InteractionOptions) => userEvent.end(options),
    pageUp: (options?: InteractionOptions) => userEvent.pageUp(options),
    pageDown: (options?: InteractionOptions) => userEvent.pageDown(options),
    deleteKey: (options?: InteractionOptions) => userEvent.deleteKey(options),
    backspace: (options?: InteractionOptions) => userEvent.backspace(options),
    getUserEvent: userEvent.getUserEvent,
    resetUserEvent: userEvent.resetUserEvent,
    
    // Form Interactions
    fillField: (options: any) => formInteractions.fillField(ctx.container, options),
    fillFieldByName: (name: string, value: string, options?: any) => formInteractions.fillFieldByName(ctx.container, name, value, options),
    fillFieldById: (id: string, value: string, options?: any) => formInteractions.fillFieldById(ctx.container, id, value, options),
    fillFieldByLabel: (label: string, value: string, options?: any) => formInteractions.fillFieldByLabel(ctx.container, label, value, options),
    clickField: (options: any) => formInteractions.clickField(ctx.container, options),
    selectFieldOption: (options: any) => formInteractions.selectFieldOption(ctx.container, options),
    checkCheckbox: (options: any, checked?: boolean) => formInteractions.checkCheckbox(ctx.container, options, checked),
    selectRadio: (options: any) => formInteractions.selectRadio(ctx.container, options),
    clearField: (options: any) => formInteractions.clearField(ctx.container, options),
    focusField: (options: any) => formInteractions.focusField(ctx.container, options),
    blurField: (options: any) => formInteractions.blurField(ctx.container, options),
    waitForFieldValidation: (options: any, timeout?: number) => formInteractions.waitForFieldValidation(ctx.container, options, timeout),
    submitForm: (options?: any) => formInteractions.submitForm(ctx.container, options),
    clickNextStep: (options?: any) => formInteractions.clickNextStep(ctx.container, options),
    clickPrevStep: (options?: any) => formInteractions.clickPrevStep(ctx.container, options),
    fillMultipleFields: (fields: Record<string, string>, options?: any) => formInteractions.fillMultipleFields(ctx.container, fields, options),
    tabThroughFields: (count?: number, options?: any) => formInteractions.tabThroughFields(ctx.container, count, options),
    interactWithDatePicker: (options: any) => formInteractions.interactWithDatePicker(ctx.container, options),
    interactWithFileUpload: (options: any) => formInteractions.interactWithFileUpload(ctx.container, options),
    
    // Navigation Interactions
    navigateTo: (path: string, options?: any) => navInteractions.navigateTo(path, options),
    navigateBack: (options?: any) => navInteractions.navigateBack(options),
    navigateForward: (options?: any) => navInteractions.navigateForward(options),
    reloadPage: (options?: any) => navInteractions.reloadPage(options),
    clickLink: (text: string | RegExp, options?: any) => navInteractions.clickLink(text, options),
    clickButton: (text: string | RegExp, options?: any) => navInteractions.clickButton(text, options),
    openMenu: (text: string | RegExp, options?: any) => navInteractions.openMenu(text, options),
    selectMenuItem: (text: string | RegExp, options?: any) => navInteractions.selectMenuItem(text, options),
    openDropdown: (text: string | RegExp, options?: any) => navInteractions.openDropdown(text, options),
    selectDropdownOption: (text: string | RegExp, options?: any) => navInteractions.selectDropdownOption(text, options),
    openTab: (text: string | RegExp, options?: any) => navInteractions.openTab(text, options),
    openDialog: (text: string | RegExp, options?: any) => navInteractions.openDialog(text, options),
    closeDialog: (options?: any) => navInteractions.closeDialog(options),
    confirmDialog: (confirm?: boolean, options?: any) => navInteractions.confirmDialog(confirm, options),
    waitForPageLoad: (timeout?: number) => navInteractions.waitForPageLoad(timeout),
    waitForNetworkIdle: (timeout?: number) => navInteractions.waitForNetworkIdle(timeout),
    scrollToElement: (element: HTMLElement, options?: any) => navInteractions.scrollToElement(element, options),
    scrollToTop: (options?: any) => navInteractions.scrollToTop(options),
    scrollToBottom: (options?: any) => navInteractions.scrollToBottom(options),
    createNavigationHelpers: () => navInteractions.createNavigationHelpers(ctx.container),
  };
}

export type InteractionCapability = ReturnType<typeof createInteractionCapability>;