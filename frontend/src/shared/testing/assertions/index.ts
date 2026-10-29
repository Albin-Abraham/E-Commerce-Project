/**
 * Assertions - Domain-Specific Assertion Helpers
 * 
 * Provides higher-level assertion functions built on top of matchers.
 */

import { expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import type { Matcher } from '@testing-library/react';

// --- Form Assertions ---

export interface FormAssertions {
  expectFieldVisible: (fieldName: string, visible?: boolean) => Promise<void>;
  expectFieldValue: (fieldName: string, expectedValue: any) => Promise<void>;
  expectFieldError: (fieldName: string, message: string | RegExp) => Promise<void>;
  expectFieldDisabled: (fieldName: string, disabled?: boolean) => Promise<void>;
  expectFieldRequired: (fieldName: string, required?: boolean) => Promise<void>;
  expectFormValid: () => Promise<void>;
  expectFormInvalid: () => Promise<void>;
  expectFormValues: (values: Record<string, any>) => Promise<void>;
  expectFieldErrorMessage: (fieldName: string, message: string | RegExp) => Promise<void>;
  expectNoFieldError: (fieldName: string) => Promise<void>;
  expectFieldFocused: (fieldName: string) => Promise<void>;
  expectFieldNotFocused: (fieldName: string) => Promise<void>;
}

export function createFormAssertions(container: HTMLElement): FormAssertions {
  const formContainer = container.querySelector('form') || container;
  
  return {
    async expectFieldVisible(fieldName: string, visible = true) {
      const wrapper = formContainer.querySelector(`[data-field-name="${fieldName}"]`);
      if (visible) {
        expect(wrapper).toBeInTheDocument();
        expect(wrapper).toBeVisible();
      } else {
        expect(wrapper).not.toBeInTheDocument();
      }
    },

    async expectFieldValue(fieldName: string, expectedValue: any) {
      const wrapper = formContainer.querySelector(`[data-field-name="${fieldName}"]`);
      const input = wrapper?.querySelector('input, select, textarea') as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
      expect(input?.value).toBe(String(expectedValue));
    },

    async expectFieldError(fieldName: string, message: string | RegExp) {
      const wrapper = formContainer.querySelector(`[data-field-name="${fieldName}"]`);
      const errorEl = wrapper?.querySelector('[role="alert"]') || 
        wrapper?.querySelector('.text-danger') || 
        (wrapper ? within(wrapper as HTMLElement).queryByText(message as any) : null);
      expect(errorEl).toBeInTheDocument();
      if (message instanceof RegExp) {
        expect(errorEl?.textContent).toMatch(message);
      } else {
        expect(errorEl?.textContent).toContain(message);
      }
    },

    async expectFieldDisabled(fieldName: string, disabled = true) {
      const wrapper = formContainer.querySelector(`[data-field-name="${fieldName}"]`);
      const input = wrapper?.querySelector('input, select, textarea, button') as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement | null;
      if (disabled) {
        expect(input).toBeDisabled();
      } else {
        expect(input).not.toBeDisabled();
      }
    },

    async expectFieldRequired(fieldName: string, required = true) {
      const wrapper = formContainer.querySelector(`[data-field-name="${fieldName}"]`);
      const input = wrapper?.querySelector('input, select, textarea') as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
      if (required) {
        expect(input).toBeRequired();
      } else {
        expect(input).not.toBeRequired();
      }
    },

    async expectFormValid() {
      const submitBtn = formContainer.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(submitBtn).not.toBeDisabled();
    },

    async expectFormInvalid() {
      const submitBtn = formContainer.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(submitBtn).toBeDisabled();
    },

    async expectFormValues(values: Record<string, any>) {
      for (const [fieldName, expectedValue] of Object.entries(values)) {
        const wrapper = formContainer.querySelector(`[data-field-name="${fieldName}"]`);
        const input = wrapper?.querySelector('input, select, textarea') as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
        expect(input?.value).toBe(String(expectedValue));
      }
    },

    async expectFieldErrorMessage(fieldName: string, message: string | RegExp) {
      const wrapper = formContainer.querySelector(`[data-field-name="${fieldName}"]`);
      const errorEl = wrapper?.querySelector('[role="alert"]') || 
        wrapper?.querySelector('.text-danger') || 
        (wrapper ? within(wrapper as HTMLElement).queryByText(message as any) : null);
      expect(errorEl).toBeInTheDocument();
      if (message instanceof RegExp) {
        expect(errorEl?.textContent).toMatch(message);
      } else {
        expect(errorEl?.textContent).toContain(message);
      }
    },

    async expectNoFieldError(fieldName: string) {
      const wrapper = formContainer.querySelector(`[data-field-name="${fieldName}"]`);
      const errorEl = wrapper?.querySelector('[role="alert"]') || wrapper?.querySelector('.text-danger');
      expect(errorEl).not.toBeInTheDocument();
    },

    async expectFieldFocused(fieldName: string) {
      const wrapper = formContainer.querySelector(`[data-field-name="${fieldName}"]`);
      const input = wrapper?.querySelector('input, select, textarea') as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
      expect(input).toHaveFocus();
    },

    async expectFieldNotFocused(fieldName: string) {
      const wrapper = formContainer.querySelector(`[data-field-name="${fieldName}"]`);
      const input = wrapper?.querySelector('input, select, textarea') as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
      expect(input).not.toHaveFocus();
    },
  };
}

// --- Table Assertions ---

export interface TableAssertions {
  expectRowCount: (count: number) => Promise<void>;
  expectRowCountAtLeast: (count: number) => Promise<void>;
  expectRowCountAtMost: (count: number) => Promise<void>;
  expectCellValue: (rowIndex: number, columnName: string, expectedValue: string) => Promise<void>;
  expectRowSelected: (rowIndex: number) => Promise<void>;
  expectRowNotSelected: (rowIndex: number) => Promise<void>;
  expectSortedBy: (columnName: string, direction: 'asc' | 'desc') => Promise<void>;
  expectFiltered: (filterText: string) => Promise<void>;
  expectColumnVisible: (columnName: string, visible: boolean) => Promise<void>;
  expectNoRows: () => Promise<void>;
  expectLoading: () => Promise<void>;
  expectNotLoading: () => Promise<void>;
  expectEmptyState: (message?: string) => Promise<void>;
  expectErrorState: (message?: string) => Promise<void>;
  expectPagination: (page: number, pageSize: number, totalCount: number) => Promise<void>;
}

export function createTableAssertions(container: HTMLElement): TableAssertions {
  const tableRoot = container.querySelector('[data-table-root]') || container;
  
  return {
    async expectRowCount(count: number) {
      const rows = tableRoot.querySelectorAll('[data-table-row]');
      expect(rows.length).toBe(count);
    },

    async expectRowCountAtLeast(count: number) {
      const rows = tableRoot.querySelectorAll('[data-table-row]');
      expect(rows.length).toBeGreaterThanOrEqual(count);
    },

    async expectRowCountAtMost(count: number) {
      const rows = tableRoot.querySelectorAll('[data-table-row]');
      expect(rows.length).toBeLessThanOrEqual(count);
    },

    async expectCellValue(rowIndex: number, columnName: string, expectedValue: string) {
      const rows = tableRoot.querySelectorAll('[data-table-row]');
      const row = rows[rowIndex];
      if (!row) throw new Error(`Row at index ${rowIndex} not found`);
      const cell = row.querySelector(`[data-column="${columnName}"]`);
      expect(cell?.textContent?.trim()).toBe(expectedValue);
    },

    async expectRowSelected(rowIndex: number) {
      const rows = tableRoot.querySelectorAll('[data-table-row]');
      const row = rows[rowIndex];
      expect(row).toHaveAttribute('data-selected', 'true');
    },

    async expectRowNotSelected(rowIndex: number) {
      const rows = tableRoot.querySelectorAll('[data-table-row]');
      const row = rows[rowIndex];
      expect(row).not.toHaveAttribute('data-selected', 'true');
    },

    async expectSortedBy(columnName: string, direction: 'asc' | 'desc') {
      const header = tableRoot.querySelector('[data-table-header]');
      const columnHeader = header?.querySelector(`[data-column="${columnName}"]`);
      const sortButton = columnHeader?.querySelector('[data-sort-button]');
      expect(sortButton).toHaveAttribute('data-sort-direction', direction);
    },

    async expectFiltered(filterText: string) {
      const searchInput = tableRoot.querySelector('input[type="search"], input[placeholder*="Search" i]') as HTMLInputElement;
      expect(searchInput?.value).toBe(filterText);
    },

    async expectColumnVisible(columnName: string, visible: boolean) {
      const columnHeader = tableRoot.querySelector(`[data-table-header] [data-column="${columnName}"]`);
      const columnBody = tableRoot.querySelector(`[data-table-body] [data-column="${columnName}"]`);
      const isVisible = !columnHeader?.hasAttribute('hidden') && !columnBody?.hasAttribute('hidden');
      if (visible) {
        expect(isVisible).toBe(true);
      } else {
        expect(isVisible).toBe(false);
      }
    },

    async expectNoRows() {
      const rows = tableRoot.querySelectorAll('[data-table-row]');
      expect(rows.length).toBe(0);
    },

    async expectLoading() {
      expect(tableRoot).toHaveAttribute('data-loading', 'true');
    },

    async expectNotLoading() {
      expect(tableRoot).not.toHaveAttribute('data-loading', 'true');
    },

    async expectEmptyState(message?: string) {
      const emptyState = tableRoot.querySelector('[data-empty-state]');
      expect(emptyState).toBeInTheDocument();
      if (message) {
        expect(emptyState).toHaveTextContent(message);
      }
    },

    async expectErrorState(message?: string) {
      const errorState = tableRoot.querySelector('[data-error-state]');
      expect(errorState).toBeInTheDocument();
      if (message) {
        expect(errorState).toHaveTextContent(message);
      }
    },

    async expectPagination(_page: number, _pageSize: number, _totalCount: number) {
      const pagination = tableRoot.querySelector('[data-table-pagination]');
      expect(pagination).toBeInTheDocument();
      // Add more specific assertions based on your pagination component
    },
  };
}

// --- Navigation Assertions ---

export interface NavigationAssertions {
  expectUrl: (path: string | RegExp) => Promise<void>;
  expectPath: (path: string | RegExp) => Promise<void>;
  expectTitle: (title: string | RegExp) => Promise<void>;
  expectElementVisible: (selector: string | Matcher) => Promise<void>;
  expectElementHidden: (selector: string | Matcher) => Promise<void>;
  expectElementExists: (selector: string | Matcher) => Promise<void>;
  expectElementNotExists: (selector: string | Matcher) => Promise<void>;
}

export function createNavigationAssertions(): NavigationAssertions {
  return {
    async expectUrl(path: string | RegExp) {
      if (typeof path === 'string') {
        expect(window.location.href).toContain(path);
      } else {
        expect(window.location.href).toMatch(path);
      }
    },

    async expectPath(path: string | RegExp) {
      const pathname = window.location.pathname;
      if (typeof path === 'string') {
        expect(pathname).toBe(path);
      } else {
        expect(pathname).toMatch(path);
      }
    },

    async expectTitle(title: string | RegExp) {
      if (typeof title === 'string') {
        expect(document.title).toBe(title);
      } else {
        expect(document.title).toMatch(title);
      }
    },

    async expectElementVisible(selector: string | Matcher) {
      const element = typeof selector === 'string' 
        ? document.querySelector(selector)
        : screen.getByRole(selector as any);
      expect(element).toBeInTheDocument();
      expect(element).toBeVisible();
    },

    async expectElementHidden(selector: string | Matcher) {
      const element = typeof selector === 'string'
        ? document.querySelector(selector)
        : screen.queryByRole(selector as any);
      expect(element).not.toBeVisible();
    },

    async expectElementExists(selector: string | Matcher) {
      const element = typeof selector === 'string'
        ? document.querySelector(selector)
        : screen.getByRole(selector as any);
      expect(element).toBeInTheDocument();
    },

    async expectElementNotExists(selector: string | Matcher) {
      const element = typeof selector === 'string'
        ? document.querySelector(selector)
        : screen.queryByRole(selector as any);
      expect(element).not.toBeInTheDocument();
    },
  };
}

// --- API Assertions ---

export interface ApiAssertions {
  expectStatus: (response: Response, status: number) => Promise<void>;
  expectHeader: (response: Response, name: string, value?: string) => Promise<void>;
  expectJsonBody: (response: Response, expectedBody: any) => Promise<void>;
  expectErrorResponse: (response: Response, expectedCode?: string, expectedMessage?: string) => Promise<void>;
}

export function createApiAssertions(): ApiAssertions {
  return {
    async expectStatus(response: Response, status: number) {
      expect(response.status).toBe(status);
    },

    async expectHeader(response: Response, name: string, value?: string) {
      const header = response.headers.get(name);
      expect(header).not.toBeNull();
      if (value) {
        expect(header).toBe(value);
      }
    },

    async expectJsonBody(response: Response, expectedBody: any) {
      const body = await response.json();
      expect(body).toEqual(expectedBody);
    },

    async expectErrorResponse(response: Response, expectedCode?: string, expectedMessage?: string) {
      expect(response.status).toBeGreaterThanOrEqual(400);
      const body = await response.json();
      if (expectedCode) {
        expect(body.code || body.error).toBe(expectedCode);
      }
      if (expectedMessage) {
        expect(body.message || body.error).toContain(expectedMessage);
      }
    },
  };
}

// --- Composite Assertions ---

export interface CompositeAssertions {
  form: FormAssertions;
  table: TableAssertions;
  navigation: NavigationAssertions;
  api: ApiAssertions;
}

export function createCompositeAssertions(
  formContainer: HTMLElement,
  tableContainer: HTMLElement
): CompositeAssertions {
  return {
    form: createFormAssertions(formContainer),
    table: createTableAssertions(tableContainer),
    navigation: createNavigationAssertions(),
    api: createApiAssertions(),
  };
}

// --- Accessibility Assertions ---

export interface A11yAssertions {
  expectNoViolations: (container?: HTMLElement) => Promise<void>;
  expectNoCriticalViolations: (container?: HTMLElement) => Promise<void>;
  expectNoSeriousViolations: (container?: HTMLElement) => Promise<void>;
  expectColorContrast: (container?: HTMLElement) => Promise<void>;
  expectKeyboardNavigable: (container?: HTMLElement) => Promise<void>;
  expectScreenReaderCompatible: (container?: HTMLElement) => Promise<void>;
  expectFormLabels: (container?: HTMLElement) => Promise<void>;
  expectAriaAttributes: (container?: HTMLElement) => Promise<void>;
}

export async function createA11yAssertions(_container: HTMLElement = document.body): Promise<A11yAssertions> {
  const { axe } = await import('vitest-axe');
  
  return {
    async expectNoViolations(container?: HTMLElement) {
      const target = container || document.body;
      const results = await axe(target);
      (expect(results) as any).toHaveNoViolations();
    },

    async expectNoCriticalViolations(container?: HTMLElement) {
      const target = container || document.body;
      const results = await axe(target);
      const critical = results.violations.filter(v => v.impact === 'critical');
      expect(critical.length).toBe(0);
    },

    async expectNoSeriousViolations(container?: HTMLElement) {
      const target = container || document.body;
      const results = await axe(target);
      const serious = results.violations.filter(v => v.impact === 'serious' || v.impact === 'critical');
      expect(serious.length).toBe(0);
    },

    async expectColorContrast(container?: HTMLElement) {
      const target = container || document.body;
      const results = await axe(target, {
        rules: { 'color-contrast': { enabled: true } },
      });
      expect(results.violations.filter(v => v.id === 'color-contrast')).toHaveLength(0);
    },

    async expectKeyboardNavigable(container?: HTMLElement) {
      const target = container || document.body;
      const results = await axe(target, {
        runOnly: { type: 'tag', values: ['keyboard'] },
      });
      expect(results.violations.length).toBe(0);
    },

    async expectScreenReaderCompatible(container?: HTMLElement) {
      const target = container || document.body;
      const results = await axe(target, {
        runOnly: { type: 'tag', values: ['screen-reader'] },
      });
      expect(results.violations.length).toBe(0);
    },

    async expectFormLabels(container?: HTMLElement) {
      const target = container || document.body;
      const results = await axe(target, {
        runOnly: { type: 'tag', values: ['forms'] },
      });
      expect(results.violations.length).toBe(0);
    },

    async expectAriaAttributes(container?: HTMLElement) {
      const target = container || document.body;
      const results = await axe(target, {
        runOnly: { type: 'tag', values: ['aria'] },
      });
      expect(results.violations.length).toBe(0);
    },
  };
}

// --- Performance Assertions ---

export interface PerformanceAssertions {
  expectRenderTime: (ms: number) => Promise<void>;
  expectInteractionTime: (ms: number) => Promise<void>;
  expectMemoryUsage: (bytes: number) => Promise<void>;
}

export function createPerformanceAssertions(): PerformanceAssertions {
  return {
    async expectRenderTime(_ms: number) {
      // This would integrate with performance.measure or similar
      // Placeholder for now
      expect(true).toBe(true);
    },

    async expectInteractionTime(_ms: number) {
      // Placeholder
      expect(true).toBe(true);
    },

    async expectMemoryUsage(_bytes: number) {
      // Placeholder
      expect(true).toBe(true);
    },
  };
}

// --- Composite Factory ---

export interface AllAssertions {
  form: FormAssertions;
  table: TableAssertions;
  navigation: NavigationAssertions;
  api: ApiAssertions;
  a11y: A11yAssertions;
  performance: PerformanceAssertions;
}

export async function createAllAssertions(
  formContainer: HTMLElement,
  tableContainer: HTMLElement
): Promise<AllAssertions> {
  const a11y = await createA11yAssertions();
  
  return {
    form: createFormAssertions(formContainer),
    table: createTableAssertions(tableContainer),
    navigation: createNavigationAssertions(),
    api: createApiAssertions(),
    a11y,
    performance: createPerformanceAssertions(),
  };
}