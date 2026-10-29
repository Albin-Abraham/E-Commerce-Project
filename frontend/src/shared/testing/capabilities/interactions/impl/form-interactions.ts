import { screen } from "@testing-library/react";
import type { FieldQueryOptions } from "../../queries/types";
import {
  click,
  typeText,
  selectOption,
  keyboard,
  tab,
} from "./user-event";
import { getFieldInput, getFieldWrapper, getFieldError, getContainer } from "../../queries/impl/dom-queries";

export interface FormInteractionOptions {
  container?: HTMLElement;
  waitForValidation?: boolean;
  validationTimeout?: number;
  delay?: number;
}

export async function fillField(
  container: HTMLElement | undefined,
  options: FieldQueryOptions & FormInteractionOptions
): Promise<void> {
  const input = getFieldInput(container, options);
  if (!input) {
    throw new Error(`Field not found: ${JSON.stringify(options)}`);
  }

  const value = options.byName || options.byId || options.byLabel || "";
  if (!value) {
    throw new Error("No value provided for fillField");
  }

  await typeText(input, String(value), { clear: true, delay: options.delay });
  
  if (options.waitForValidation) {
    await waitForFieldValidation(container, options, options.validationTimeout ?? 2000);
  }
}

export async function fillFieldByName(
  container: HTMLElement | undefined,
  name: string,
  value: string,
  options: FormInteractionOptions = {}
): Promise<void> {
  await fillField(container, { ...options, byName: name });
  const input = getFieldInput(container, { byName: name });
  if (input) {
    await typeText(input, value, { clear: true, delay: options.delay });
  }
}

export async function fillFieldById(
  container: HTMLElement | undefined,
  id: string,
  value: string,
  options: FormInteractionOptions = {}
): Promise<void> {
  const input = getFieldInput(container, { byId: id });
  if (input) {
    await typeText(input, value, { clear: true, delay: options.delay });
  }
}

export async function fillFieldByLabel(
  container: HTMLElement | undefined,
  label: string,
  value: string,
  options: FormInteractionOptions = {}
): Promise<void> {
  const input = getFieldInput(container, { byLabel: label });
  if (input) {
    await typeText(input, value, { clear: true, delay: options.delay });
  }
}

export async function clickField(
  container: HTMLElement | undefined,
  options: FieldQueryOptions
): Promise<void> {
  const wrapper = getFieldWrapper(container, options);
  if (!wrapper) {
    throw new Error(`Field wrapper not found: ${JSON.stringify(options)}`);
  }
  const input = wrapper.querySelector("input, select, textarea, button, [role='button'], [role='combobox']");
  if (!input) {
    throw new Error(`No clickable element found in field: ${JSON.stringify(options)}`);
  }
  await click(input as HTMLElement);
}

export async function selectFieldOption(
  container: HTMLElement | undefined,
  options: FieldQueryOptions & { value: string; byLabel?: boolean }
): Promise<void> {
  const input = getFieldInput(container, options);
  if (!input) {
    throw new Error(`Field not found for selection: ${JSON.stringify(options)}`);
  }

  if (input.tagName === "SELECT") {
    await selectOption(input as HTMLSelectElement, { byValue: options.value });
  } else if (input.getAttribute("role") === "combobox") {
    await click(input as HTMLElement);
    await waitForOptions(container, options);
    const optionValue = options.byLabel 
      ? `[role="option"]:has-text("${options.value}")`
      : `[role="option"][data-value="${options.value}"]`;
    const option = getContainer(container).querySelector(optionValue);
    if (option) {
      await click(option as HTMLElement);
    } else {
      throw new Error(`Option not found: ${options.value}`);
    }
  } else {
    throw new Error(`Field is not a select/combobox: ${JSON.stringify(options)}`);
  }
}

async function waitForOptions(
  container: HTMLElement | undefined,
  _options: FieldQueryOptions
): Promise<void> {
  const root = getContainer(container);
  let attempts = 0;
  while (attempts < 50) {
    const opts = root.querySelectorAll('[role="option"]');
    if (opts.length > 0) return;
    await new Promise(r => setTimeout(r, 50));
    attempts++;
  }
  throw new Error("Select options did not appear");
}

export async function checkCheckbox(
  container: HTMLElement | undefined,
  options: FieldQueryOptions,
  checked: boolean = true
): Promise<void> {
  const input = getFieldInput(container, options) as HTMLInputElement | null;
  if (!input || input.type !== "checkbox") {
    throw new Error(`Checkbox not found: ${JSON.stringify(options)}`);
  }
  if (input.checked !== checked) {
    await click(input);
  }
}

export async function selectRadio(
  container: HTMLElement | undefined,
  options: FieldQueryOptions & { value: string }
): Promise<void> {
  const wrapper = getFieldWrapper(container, options);
  if (!wrapper) {
    throw new Error(`Radio group not found: ${JSON.stringify(options)}`);
  }
  const radio = wrapper.querySelector<HTMLInputElement>(`input[type="radio"][value="${options.value}"]`);
  if (!radio) {
    throw new Error(`Radio option not found: ${options.value}`);
  }
  if (!radio.checked) {
    await click(radio);
  }
}

export async function clearField(
  container: HTMLElement | undefined,
  options: FieldQueryOptions
): Promise<void> {
  const input = getFieldInput(container, options);
  if (!input) {
    throw new Error(`Field not found for clear: ${JSON.stringify(options)}`);
  }
  await typeText(input, "", { clear: true });
}

export async function focusField(
  container: HTMLElement | undefined,
  options: FieldQueryOptions
): Promise<void> {
  const input = getFieldInput(container, options);
  if (!input) {
    throw new Error(`Field not found for focus: ${JSON.stringify(options)}`);
  }
  input.focus();
}

export async function blurField(
  container: HTMLElement | undefined,
  options: FieldQueryOptions
): Promise<void> {
  const input = getFieldInput(container, options);
  if (!input) {
    throw new Error(`Field not found for blur: ${JSON.stringify(options)}`);
  }
  input.blur();
}

export async function waitForFieldValidation(
  container: HTMLElement | undefined,
  options: FieldQueryOptions,
  timeout: number = 2000
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const error = getFieldError(container, options);
    if (error && error.textContent?.trim()) {
      return;
    }
    await new Promise(r => setTimeout(r, 50));
  }
}

export async function submitForm(
  container: HTMLElement | undefined,
  options: FormInteractionOptions = {}
): Promise<void> {
  const root = getContainer(container);
  const submitButton = 
    root.querySelector('button[type="submit"]') ||
    root.querySelector('[data-part="submit-btn"]') ||
    root.querySelector('.form-footer button:last-child') ||
    (await screen.findByRole("button", { name: /submit|save|complete|login|register|next|continue/i }));
  
  if (!submitButton) {
    throw new Error("Submit button not found");
  }
  await click(submitButton as HTMLElement, options);
}

export async function clickNextStep(
  container: HTMLElement | undefined,
  options: FormInteractionOptions = {}
): Promise<void> {
  const root = getContainer(container);
  const nextButton = 
    root.querySelector('[data-part="next-btn"]') ||
    root.querySelector('button:has-text("Next")') ||
    root.querySelector('button:has-text("Continue")') ||
    (await screen.findByRole("button", { name: /next step|continue|register|submit|complete|save/i }));
  
  if (!nextButton) {
    throw new Error("Next step button not found");
  }
  await click(nextButton as HTMLElement, options);
  await new Promise(r => setTimeout(r, 600));
}

export async function clickPrevStep(
  container: HTMLElement | undefined,
  options: FormInteractionOptions = {}
): Promise<void> {
  const root = getContainer(container);
  const prevButton = 
    root.querySelector('[data-part="prev-btn"]') ||
    root.querySelector('button:has-text("Back")') ||
    root.querySelector('button:has-text("Previous")') ||
    (await screen.findByRole("button", { name: /back|previous/i }));
  
  if (!prevButton) {
    throw new Error("Previous step button not found");
  }
  await click(prevButton as HTMLElement, options);
  await new Promise(r => setTimeout(r, 600));
}

export async function fillMultipleFields(
  container: HTMLElement | undefined,
  fields: Record<string, string>,
  options: FormInteractionOptions = {}
): Promise<void> {
  for (const [name, value] of Object.entries(fields)) {
    await fillFieldByName(container, name, value, options);
  }
}

export async function tabThroughFields(
  container: HTMLElement | undefined,
  count: number = 1,
  options: FormInteractionOptions = {}
): Promise<void> {
  for (let i = 0; i < count; i++) {
    await tab({ ...options, container });
  }
}

export async function interactWithDatePicker(
  container: HTMLElement | undefined,
  options: FieldQueryOptions & { date: Date }
): Promise<void> {
  const input = getFieldInput(container, options);
  if (!input) {
    throw new Error(`Date picker not found: ${JSON.stringify(options)}`);
  }
  
  const date = options.date;
  const formatted = date.toISOString().split("T")[0];
  await typeText(input, formatted, { clear: true });
  await keyboard("Escape");
}

export async function interactWithFileUpload(
  container: HTMLElement | undefined,
  options: FieldQueryOptions & { files: File | File[] }
): Promise<void> {
  const input = getFieldInput(container, options) as HTMLInputElement | null;
  if (!input || input.type !== "file") {
    throw new Error(`File upload not found: ${JSON.stringify(options)}`);
  }
  
  const files = Array.isArray(options.files) ? options.files : [options.files];
  const dataTransfer = new DataTransfer();
  files.forEach(file => dataTransfer.items.add(file));
  input.files = dataTransfer.files;
  
  input.dispatchEvent(new Event("change", { bubbles: true }));
}