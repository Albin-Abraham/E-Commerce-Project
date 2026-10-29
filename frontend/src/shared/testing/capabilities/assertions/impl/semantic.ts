import { expect } from "vitest";
import type { AssertionOptions, FieldAssertionOptions, TableAssertionOptions } from "../types";
import { getFieldInput, getFieldWrapper, getFieldError, getContainer } from "../../queries/impl/dom-queries";
import { getTableRow, getTableCell, getTableStructure } from "../../queries/impl/table-queries";

export function toBeInTheDocument(element: HTMLElement | null, options: AssertionOptions = {}): void {
  if (!element) {
    throw new Error(options.message || "Expected element to be in the document");
  }
  expect(element).toBeInTheDocument();
}

export function notToBeInTheDocument(element: HTMLElement | null, options: AssertionOptions = {}): void {
  if (element) {
    throw new Error(options.message || "Expected element not to be in the document");
  }
  expect(element).not.toBeInTheDocument();
}

export function toBeVisible(element: HTMLElement | null, options: AssertionOptions = {}): void {
  if (!element) {
    throw new Error(options.message || "Expected element to be visible");
  }
  expect(element).toBeVisible();
}

export function notToBeVisible(element: HTMLElement | null, _options: AssertionOptions = {}): void {
  if (element) {
    expect(element).not.toBeVisible();
  }
}

export function toBeDisabled(element: HTMLElement | null, options: AssertionOptions = {}): void {
  if (!element) {
    throw new Error(options.message || "Expected element to be disabled");
  }
  expect(element).toBeDisabled();
}

export function notToBeDisabled(element: HTMLElement | null, _options: AssertionOptions = {}): void {
  if (element) {
    expect(element).not.toBeDisabled();
  }
}

export function toBeEnabled(element: HTMLElement | null, options: AssertionOptions = {}): void {
  if (!element) {
    throw new Error(options.message || "Expected element to be enabled");
  }
  expect(element).not.toBeDisabled();
}

export function toBeChecked(element: HTMLElement | null, options: AssertionOptions = {}): void {
  if (!element) {
    throw new Error(options.message || "Expected element to be checked");
  }
  expect(element).toBeChecked();
}

export function notToBeChecked(element: HTMLElement | null, _options: AssertionOptions = {}): void {
  if (element) {
    expect(element).not.toBeChecked();
  }
}

export function toHaveValue(element: HTMLElement | null, value: string | number | string[], options: AssertionOptions = {}): void {
  if (!element) {
    throw new Error(options.message || "Expected element to have value");
  }
  expect(element).toHaveValue(value);
}

export function toHaveTextContent(element: HTMLElement | null, text: string | RegExp, options: AssertionOptions = {}): void {
  if (!element) {
    throw new Error(options.message || "Expected element to have text content");
  }
  expect(element).toHaveTextContent(text);
}

export function toHaveAttribute(element: HTMLElement | null, name: string, value?: string, options: AssertionOptions = {}): void {
  if (!element) {
    throw new Error(options.message || "Expected element to have attribute");
  }
  if (value !== undefined) {
    expect(element).toHaveAttribute(name, value);
  } else {
    expect(element).toHaveAttribute(name);
  }
}

export function toHaveClass(element: HTMLElement | null, className: string, options: AssertionOptions = {}): void {
  if (!element) {
    throw new Error(options.message || "Expected element to have class");
  }
  expect(element).toHaveClass(className);
}

export function toHaveFocus(element: HTMLElement | null, options: AssertionOptions = {}): void {
  if (!element) {
    throw new Error(options.message || "Expected element to have focus");
  }
  expect(element).toHaveFocus();
}

export function toHaveStyle(element: HTMLElement | null, style: Record<string, any>, options: AssertionOptions = {}): void {
  if (!element) {
    throw new Error(options.message || "Expected element to have style");
  }
  expect(element).toHaveStyle(style);
}

export function toContainElement(container: HTMLElement | null, element: HTMLElement | null, options: AssertionOptions = {}): void {
  if (!container || !element) {
    throw new Error(options.message || "Expected container to contain element");
  }
  expect(container).toContainElement(element);
}

export function toEqual(expected: any, actual: any, _options: AssertionOptions = {}): void {
  expect(actual).toEqual(expected);
}

export function toBe(expected: any, actual: any, _options: AssertionOptions = {}): void {
  expect(actual).toBe(expected);
}

export function toBeTruthy(value: any, _options: AssertionOptions = {}): void {
  expect(value).toBeTruthy();
}

export function toBeFalsy(value: any, _options: AssertionOptions = {}): void {
  expect(value).toBeFalsy();
}

export function toBeNull(value: any, _options: AssertionOptions = {}): void {
  expect(value).toBeNull();
}

export function toBeUndefined(value: any, _options: AssertionOptions = {}): void {
  expect(value).toBeUndefined();
}

export function toBeDefined(value: any, _options: AssertionOptions = {}): void {
  expect(value).toBeDefined();
}

export function toContain(item: any, array: any[], _options: AssertionOptions = {}): void {
  expect(array).toContain(item);
}

export function toHaveLength(length: number, array: any[], _options: AssertionOptions = {}): void {
  expect(array).toHaveLength(length);
}

export function toMatch(pattern: RegExp | string, value: string, _options: AssertionOptions = {}): void {
  expect(value).toMatch(pattern);
}

export function toThrow(fn: () => any, error?: Error | RegExp | string, _options: AssertionOptions = {}): void {
  if (error instanceof RegExp) {
    expect(fn).toThrow(error);
  } else if (error instanceof Error) {
    expect(fn).toThrow(error);
  } else if (typeof error === "string") {
    expect(fn).toThrow(error);
  } else {
    expect(fn).toThrow();
  }
}

export function toReject(fn: () => Promise<any>, error?: Error | RegExp | string, _options: AssertionOptions = {}): Promise<void> {
  if (error instanceof RegExp) {
    return expect(fn).rejects.toThrow(error);
  } else if (error instanceof Error) {
    return expect(fn).rejects.toThrow(error);
  } else if (typeof error === "string") {
    return expect(fn).rejects.toThrow(error);
  } else {
    return expect(fn).rejects.toThrow();
  }
}

export function toResolve(fn: () => Promise<any>, _options: AssertionOptions = {}): Promise<void> {
  return expect(fn).resolves.not.toThrow();
}

export async function expectFieldVisible(
  container: HTMLElement | undefined,
  options: FieldAssertionOptions
): Promise<void> {
  const wrapper = getFieldWrapper(container, options);
  toBeInTheDocument(wrapper, { message: `Field not found: ${JSON.stringify(options)}` });
  toBeVisible(wrapper, { message: `Field not visible: ${JSON.stringify(options)}` });
}

export async function expectFieldNotVisible(
  container: HTMLElement | undefined,
  options: FieldAssertionOptions
): Promise<void> {
  const wrapper = getFieldWrapper(container, options);
  if (wrapper) {
    notToBeVisible(wrapper, { message: `Field should not be visible: ${JSON.stringify(options)}` });
  }
}

export async function expectFieldValue(
  container: HTMLElement | undefined,
  options: FieldAssertionOptions,
  expectedValue: string | number
): Promise<void> {
  const input = getFieldInput(container, options);
  toBeInTheDocument(input, { message: `Field input not found: ${JSON.stringify(options)}` });
  toHaveValue(input, expectedValue, { message: `Field value mismatch: ${JSON.stringify(options)}` });
}

export async function expectFieldError(
  container: HTMLElement | undefined,
  options: FieldAssertionOptions,
  expectedMessage: string | RegExp
): Promise<void> {
  const error = getFieldError(container, options);
  toBeInTheDocument(error, { message: `Field error not found: ${JSON.stringify(options)}` });
  toHaveTextContent(error, expectedMessage, { message: `Field error message mismatch: ${JSON.stringify(options)}` });
}

export async function expectFieldNoError(
  container: HTMLElement | undefined,
  options: FieldAssertionOptions
): Promise<void> {
  const error = getFieldError(container, options);
  notToBeInTheDocument(error, { message: `Field should not have error: ${JSON.stringify(options)}` });
}

export async function expectFieldDisabled(
  container: HTMLElement | undefined,
  options: FieldAssertionOptions
): Promise<void> {
  const input = getFieldInput(container, options);
  toBeInTheDocument(input, { message: `Field input not found: ${JSON.stringify(options)}` });
  toBeDisabled(input, { message: `Field should be disabled: ${JSON.stringify(options)}` });
}

export async function expectFieldEnabled(
  container: HTMLElement | undefined,
  options: FieldAssertionOptions
): Promise<void> {
  const input = getFieldInput(container, options);
  toBeInTheDocument(input, { message: `Field input not found: ${JSON.stringify(options)}` });
  notToBeDisabled(input, { message: `Field should be enabled: ${JSON.stringify(options)}` });
}

export async function expectFieldRequired(
  container: HTMLElement | undefined,
  options: FieldAssertionOptions
): Promise<void> {
  const input = getFieldInput(container, options);
  toBeInTheDocument(input, { message: `Field input not found: ${JSON.stringify(options)}` });
  toHaveAttribute(input, "required", undefined, { message: `Field should be required: ${JSON.stringify(options)}` });
}

export async function expectFieldOptional(
  container: HTMLElement | undefined,
  options: FieldAssertionOptions
): Promise<void> {
  const input = getFieldInput(container, options);
  toBeInTheDocument(input, { message: `Field input not found: ${JSON.stringify(options)}` });
  // Check that required attribute is not present
  expect(input?.hasAttribute("required")).toBe(false);
}

export async function expectFormValid(
  container: HTMLElement | undefined,
  _options: AssertionOptions = {}
): Promise<void> {
  const root = getContainer(container);
  const errors = root.querySelectorAll('[role="alert"], .text-danger, .form-field__error, [data-field-error]');
  expect(errors.length).toBe(0);
}

export async function expectFormInvalid(
  container: HTMLElement | undefined,
  _options: AssertionOptions = {}
): Promise<void> {
  const root = getContainer(container);
  const errors = root.querySelectorAll('[role="alert"], .text-danger, .form-field__error, [data-field-error]');
  expect(errors.length).toBeGreaterThan(0);
}

export async function expectTableRowCount(
  container: HTMLElement | undefined,
  expectedCount: number,
  _options: TableAssertionOptions = {}
): Promise<void> {
  const { rows } = getTableStructure(container);
  toEqual(expectedCount, rows.length, { message: `Table row count mismatch: expected ${expectedCount}, got ${rows.length}` });
}

export async function expectTableCellValue(
  container: HTMLElement | undefined,
  options: TableAssertionOptions,
  expectedValue: string
): Promise<void> {
  const cellResult = getTableCell(container, options);
  toBeInTheDocument(cellResult.cell, { message: `Table cell not found: ${JSON.stringify(options)}` });
  toHaveTextContent(cellResult.cell, expectedValue, { message: `Table cell value mismatch: ${JSON.stringify(options)}` });
}

export async function expectTableRowSelected(
  container: HTMLElement | undefined,
  rowIndex: number,
  options: TableAssertionOptions = {}
): Promise<void> {
  const rowResult = getTableRow(container, { ...options, rowIndex });
  toBeInTheDocument(rowResult.row, { message: `Table row not found at index ${rowIndex}` });
  expect(rowResult.isSelected).toBe(true);
}

export async function expectTableRowNotSelected(
  container: HTMLElement | undefined,
  rowIndex: number,
  options: TableAssertionOptions = {}
): Promise<void> {
  const rowResult = getTableRow(container, { ...options, rowIndex });
  toBeInTheDocument(rowResult.row, { message: `Table row not found at index ${rowIndex}` });
  expect(rowResult.isSelected).toBe(false);
}

export async function expectTableSorted(
  container: HTMLElement | undefined,
  columnName: string,
  direction: "asc" | "desc",
  _options: TableAssertionOptions = {}
): Promise<void> {
  const { getTableSortState } = await import("../../queries/impl/table-queries");
  const sortState = getTableSortState(container, columnName);
  toEqual(direction, sortState, { message: `Table sort state mismatch for column ${columnName}: expected ${direction}, got ${sortState}` });
}