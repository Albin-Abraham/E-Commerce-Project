import { within } from "@testing-library/react";
import type { QueryOptions, QueryResult, FieldQueryOptions } from "../types";

export function getContainer(container?: HTMLElement) {
  return container ?? document.body;
}

export function queryByRole<T extends HTMLElement = HTMLElement>(
  container: HTMLElement | undefined,
  role: string,
  options: QueryOptions = {}
): QueryResult<T> {
  const ctx = within(getContainer(container));
  const element = ctx.queryByRole(role as any, options as any) as T | null;
  return { element, found: element !== null };
}

export function getByRole<T extends HTMLElement = HTMLElement>(
  container: HTMLElement | undefined,
  role: string,
  options: QueryOptions = {}
): T {
  const ctx = within(getContainer(container));
  return ctx.getByRole(role as any, options as any) as T;
}

export function findByRole<T extends HTMLElement = HTMLElement>(
  container: HTMLElement | undefined,
  role: string,
  options: QueryOptions = {}
): Promise<T> {
  const ctx = within(getContainer(container));
  return ctx.findByRole(role as any, options as any) as Promise<T>;
}

export function queryByLabel<T extends HTMLElement = HTMLElement>(
  container: HTMLElement | undefined,
  label: string | RegExp,
  options: QueryOptions = {}
): QueryResult<T> {
  const ctx = within(getContainer(container));
  const element = ctx.queryByLabelText(label, options) as T | null;
  return { element, found: element !== null };
}

export function getByLabel<T extends HTMLElement = HTMLElement>(
  container: HTMLElement | undefined,
  label: string | RegExp,
  options: QueryOptions = {}
): T {
  const ctx = within(getContainer(container));
  return ctx.getByLabelText(label, options) as T;
}

export function queryByText<T extends HTMLElement = HTMLElement>(
  container: HTMLElement | undefined,
  text: string | RegExp,
  options: QueryOptions = {}
): QueryResult<T> {
  const ctx = within(getContainer(container));
  const element = ctx.queryByText(text, options) as T | null;
  return { element, found: element !== null };
}

export function getByText<T extends HTMLElement = HTMLElement>(
  container: HTMLElement | undefined,
  text: string | RegExp,
  options: QueryOptions = {}
): T {
  const ctx = within(getContainer(container));
  return ctx.getByText(text, options) as T;
}

export function queryByTestId<T extends HTMLElement = HTMLElement>(
  container: HTMLElement | undefined,
  testId: string,
  options: QueryOptions = {}
): QueryResult<T> {
  const ctx = within(getContainer(container));
  const element = ctx.queryByTestId(testId, options) as T | null;
  return { element, found: element !== null };
}

export function getByTestId<T extends HTMLElement = HTMLElement>(
  container: HTMLElement | undefined,
  testId: string
): T {
  const ctx = within(getContainer(container));
  return ctx.getByTestId(testId) as T;
}

export function queryByPlaceholder<T extends HTMLElement = HTMLElement>(
  container: HTMLElement | undefined,
  placeholder: string | RegExp,
  options: QueryOptions = {}
): QueryResult<T> {
  const ctx = within(getContainer(container));
  const element = ctx.queryByPlaceholderText(placeholder, options) as T | null;
  return { element, found: element !== null };
}

export function queryByDisplayValue<T extends HTMLElement = HTMLElement>(
  container: HTMLElement | undefined,
  value: string | RegExp,
  options: QueryOptions = {}
): QueryResult<T> {
  const ctx = within(getContainer(container));
  const element = ctx.queryByDisplayValue(value, options) as T | null;
  return { element, found: element !== null };
}

export function queryAllByRole<T extends HTMLElement = HTMLElement>(
  container: HTMLElement | undefined,
  role: string,
  options: QueryOptions = {}
): T[] {
  const ctx = within(getContainer(container));
  return ctx.queryAllByRole(role as any, options as any) as T[];
}

export function queryAllByText<T extends HTMLElement = HTMLElement>(
  container: HTMLElement | undefined,
  text: string | RegExp,
  options: QueryOptions = {}
): T[] {
  const ctx = within(getContainer(container));
  return ctx.queryAllByText(text, options) as T[];
}

export function queryAllByTestId<T extends HTMLElement = HTMLElement>(
  container: HTMLElement | undefined,
  testId: string
): T[] {
  const ctx = within(getContainer(container));
  return ctx.queryAllByTestId(testId) as T[];
}

export function querySelector<T extends HTMLElement = HTMLElement>(
  container: HTMLElement | undefined,
  selector: string
): QueryResult<T> {
  const root = getContainer(container);
  const element = root.querySelector(selector) as T | null;
  return { element, found: element !== null };
}

export function querySelectorAll<T extends HTMLElement = HTMLElement>(
  container: HTMLElement | undefined,
  selector: string
): T[] {
  const root = getContainer(container);
  return Array.from(root.querySelectorAll(selector)) as T[];
}

export function getFieldWrapper(
  container: HTMLElement | undefined,
  options: FieldQueryOptions & { name?: string; id?: string; role?: string; label?: string }
): HTMLElement | null {
  const root = getContainer(container);
  
  const id = options.byId || options.id;
  const name = options.byName || options.name;
  const role = options.byRole || options.role;
  const labelText = options.byLabel || options.label;

  if (id) {
    return root.querySelector(`[data-field-id="${id}"]`) as HTMLElement | null;
  }
  if (name) {
    return root.querySelector(`[data-field-name="${name}"]`) as HTMLElement | null;
  }
  if (role) {
    return root.querySelector(`[role="${role}"]`) as HTMLElement | null;
  }
  if (labelText) {
    const label = root.querySelector(`label:has-text("${labelText}")`) as HTMLElement | null;
    if (label) {
      const forAttr = label.getAttribute("for");
      if (forAttr) {
        return root.querySelector(`#${forAttr}`) as HTMLElement | null;
      }
    }
  }
  return null;
}

export function getFieldSurface(
  container: HTMLElement | undefined,
  options: FieldQueryOptions
): HTMLElement | null {
  const wrapper = getFieldWrapper(container, options);
  if (!wrapper) return null;
  return (wrapper.querySelector(".form-field-surface") || wrapper) as HTMLElement;
}

export function getFieldInput(
  container: HTMLElement | undefined,
  options: FieldQueryOptions
): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null {
  const wrapper = getFieldWrapper(container, options);
  if (!wrapper) return null;
  return (
    wrapper.querySelector("input, select, textarea") as
      | HTMLInputElement
      | HTMLSelectElement
      | HTMLTextAreaElement
      | null
  );
}

export function getFieldError(
  container: HTMLElement | undefined,
  options: FieldQueryOptions
): HTMLElement | null {
  const wrapper = getFieldWrapper(container, options);
  if (!wrapper) return null;
  return (
    wrapper.querySelector('[role="alert"]') ||
    wrapper.querySelector(".text-danger") ||
    wrapper.querySelector(".form-field__error") ||
    wrapper.querySelector("[data-field-error]")
  );
}

export function getFieldHint(
  container: HTMLElement | undefined,
  options: FieldQueryOptions
): HTMLElement | null {
  const wrapper = getFieldWrapper(container, options);
  if (!wrapper) return null;
  return wrapper.querySelector(".form-field__hint, [data-field-hint]");
}