import type { FieldQueryOptions } from "../types";
import {
  getFieldWrapper,
  getFieldSurface,
  getFieldInput,
  getFieldError,
  getFieldHint,
  querySelectorAll,
} from "./dom-queries";

export { getFieldError } from "./dom-queries";

export interface FormFieldQueryResult {
  wrapper: HTMLElement | null;
  surface: HTMLElement | null;
  input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
  error: HTMLElement | null;
  hint: HTMLElement | null;
}

export function queryFormField(
  container: HTMLElement | undefined,
  options: FieldQueryOptions
): FormFieldQueryResult {
  return {
    wrapper: getFieldWrapper(container, options),
    surface: getFieldSurface(container, options),
    input: getFieldInput(container, options),
    error: getFieldError(container, options),
    hint: getFieldHint(container, options),
  };
}

export function queryFormFields(
  container: HTMLElement | undefined,
  selector: string = "[data-field-id]"
): HTMLElement[] {
  return querySelectorAll(container, selector);
}

export function getFormFieldByName(
  container: HTMLElement | undefined,
  name: string
): FormFieldQueryResult {
  return queryFormField(container, { byName: name });
}

export function getFormFieldById(
  container: HTMLElement | undefined,
  id: string
): FormFieldQueryResult {
  return queryFormField(container, { byId: id });
}

export function getFormFieldByRole(
  container: HTMLElement | undefined,
  role: string
): FormFieldQueryResult {
  return queryFormField(container, { byRole: role });
}

export function getFormFieldByLabel(
  container: HTMLElement | undefined,
  label: string
): FormFieldQueryResult {
  return queryFormField(container, { byLabel: label });
}

export function isFieldVisible(
  container: HTMLElement | undefined,
  options: FieldQueryOptions
): boolean {
  const wrapper = getFieldWrapper(container, options);
  if (!wrapper) return false;
  const style = window.getComputedStyle(wrapper);
  return style.display !== "none" && style.visibility !== "hidden" && wrapper.offsetParent !== null;
}

export function isFieldDisabled(
  container: HTMLElement | undefined,
  options: FieldQueryOptions
): boolean {
  const input = getFieldInput(container, options);
  return input?.disabled ?? false;
}

export function isFieldRequired(
  container: HTMLElement | undefined,
  options: FieldQueryOptions
): boolean {
  const input = getFieldInput(container, options);
  return input?.required ?? false;
}

export function getFieldValue(
  container: HTMLElement | undefined,
  options: FieldQueryOptions
): string | undefined {
  const input = getFieldInput(container, options);
  if (!input) return undefined;
  if (input.type === "checkbox") {
    return (input as HTMLInputElement).checked ? "on" : "off";
  }
  if (input.type === "radio") {
    const radio = input as HTMLInputElement;
    return radio.checked ? radio.value : undefined;
  }
  return input.value;
}

export function getFieldAttribute(
  container: HTMLElement | undefined,
  options: FieldQueryOptions,
  attribute: string
): string | null {
  const input = getFieldInput(container, options);
  return input?.getAttribute(attribute) ?? null;
}

export function getFieldValidationState(
  container: HTMLElement | undefined,
  options: FieldQueryOptions
): "valid" | "invalid" | "pending" | "none" {
  const wrapper = getFieldWrapper(container, options);
  if (!wrapper) return "none";
  
  if (wrapper.getAttribute("aria-invalid") === "true") return "invalid";
  if (wrapper.querySelector('[role="alert"], .text-danger, .form-field__error')) return "invalid";
  if (wrapper.querySelector(".animate-pulse, [data-loading]")) return "pending";
  if (wrapper.getAttribute("aria-invalid") === "false") return "valid";
  return "none";
}