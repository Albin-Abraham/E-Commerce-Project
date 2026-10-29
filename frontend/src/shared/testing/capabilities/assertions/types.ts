export interface AssertionOptions {
  container?: HTMLElement;
  timeout?: number;
  message?: string;
}

export interface FieldAssertionOptions extends AssertionOptions {
  name?: string;
  id?: string;
  role?: string;
  label?: string;
}

export interface TableAssertionOptions extends AssertionOptions {
  rowIndex?: number;
  columnName?: string;
  columnIndex?: number;
}

export interface AccessibilityAssertionOptions extends AssertionOptions {
  rules?: Record<string, { enabled: boolean }>;
  tags?: string[];
}

export interface BusinessAssertionOptions extends AssertionOptions {
  domain?: string;
  entity?: string;
}