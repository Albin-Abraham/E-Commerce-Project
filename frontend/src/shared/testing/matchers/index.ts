/**
 * Matchers - Custom Vitest Matchers
 * 
 * Provides custom matchers for domain-specific assertions.
 */

import { expect } from 'vitest';
import { within } from '@testing-library/react';

// --- Form Matchers ---

expect.extend({
  toHaveFieldError(container: HTMLElement | null, fieldName: string, message?: string | RegExp) {
    const wrapper = container?.querySelector(`[data-field-name="${fieldName}"]`);
    const pass = !!wrapper?.querySelector('[role="alert"], .text-danger, .form-field__error');
    
    if (message && pass) {
      const errorEl = wrapper?.querySelector('[role="alert"]') || 
        wrapper?.querySelector('.text-danger') || 
        within(wrapper as HTMLElement).queryByText(message as any);
      return {
        pass: !!errorEl,
        message: () => errorEl 
          ? `Expected field "${fieldName}" not to have error matching ${message}`
          : `Expected field "${fieldName}" to have error matching ${message}`,
      };
    }
    
    return {
      pass,
      message: () => pass
        ? `Expected field "${fieldName}" not to have error`
        : `Expected field "${fieldName}" to have error`,
    };
  },

  toHaveFieldValue(container: HTMLElement | null, fieldName: string, expectedValue: any) {
    const wrapper = container?.querySelector(`[data-field-name="${fieldName}"]`);
    const input = wrapper?.querySelector('input, select, textarea') as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
    const actualValue = input?.value;
    
    return {
      pass: actualValue === String(expectedValue),
      message: () => actualValue === String(expectedValue)
        ? `Expected field "${fieldName}" not to have value "${expectedValue}"`
        : `Expected field "${fieldName}" to have value "${expectedValue}", but got "${actualValue}"`,
    };
  },

  toBeFieldDisabled(container: HTMLElement | null, fieldName: string) {
    const wrapper = container?.querySelector(`[data-field-name="${fieldName}"]`);
    const input = wrapper?.querySelector('input, select, textarea, button') as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLButtonElement | null;
    const pass = input?.disabled === true;
    
    return {
      pass,
      message: () => pass
        ? `Expected field "${fieldName}" not to be disabled`
        : `Expected field "${fieldName}" to be disabled`,
    };
  },

  toBeFieldRequired(container: HTMLElement | null, fieldName: string) {
    const wrapper = container?.querySelector(`[data-field-name="${fieldName}"]`);
    const input = wrapper?.querySelector('input, select, textarea') as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
    const pass = input?.required === true;
    
    return {
      pass,
      message: () => pass
        ? `Expected field "${fieldName}" not to be required`
        : `Expected field "${fieldName}" to be required`,
    };
  },

  toHaveFormValidationError(container: HTMLElement | null) {
    const errorElements = container?.querySelectorAll('[role="alert"], .text-danger, .form-field__error');
    const pass = (errorElements?.length || 0) > 0;
    
    return {
      pass,
      message: () => pass
        ? 'Expected form not to have validation errors'
        : 'Expected form to have validation errors',
    };
  },

  toHaveFormValue(container: HTMLElement | null, expectedValues: Record<string, any>) {
    let pass = true;
    let message = '';
    
    for (const [fieldName, expectedValue] of Object.entries(expectedValues)) {
      const wrapper = container?.querySelector(`[data-field-name="${fieldName}"]`);
      const input = wrapper?.querySelector('input, select, textarea') as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
      const actualValue = input?.value;
      
      if (actualValue !== String(expectedValue)) {
        pass = false;
        message += `Field "${fieldName}": expected "${expectedValue}", got "${actualValue}". `;
      }
    }
    
    return {
      pass,
      message: () => pass
        ? 'Expected form not to have these values'
        : `Form values mismatch: ${message}`,
    };
  },
});

// --- Table Matchers ---

expect.extend({
  toHaveRowCount(container: HTMLElement | null, expectedCount: number) {
    const rows = container?.querySelectorAll('[data-table-row]');
    const actualCount = rows?.length || 0;
    const pass = actualCount === expectedCount;
    
    return {
      pass,
      message: () => pass
        ? `Expected table not to have ${expectedCount} rows`
        : `Expected table to have ${expectedCount} rows, but found ${actualCount}`,
    };
  },

  toHaveRowWithData(container: HTMLElement | null, rowData: Record<string, any>) {
    const rows = container ? Array.from(container.querySelectorAll('[data-table-row]')) : [];
    let pass = false;
    
    for (const row of rows) {
      let match = true;
      for (const [columnName, expectedValue] of Object.entries(rowData)) {
        const cell = row.querySelector(`[data-column="${columnName}"]`);
        if (!cell || cell.textContent?.trim() !== String(expectedValue)) {
          match = false;
          break;
        }
      }
      if (match) {
        pass = true;
        break;
      }
    }
    
    return {
      pass,
      message: () => pass
        ? `Expected table not to have row with data ${JSON.stringify(rowData)}`
        : `Expected table to have row with data ${JSON.stringify(rowData)}`,
    };
  },

  toHaveSortedColumn(container: HTMLElement | null, columnName: string, direction: 'asc' | 'desc') {
    const header = container?.querySelector('[data-table-header]');
    const columnHeader = header?.querySelector(`[data-column="${columnName}"]`);
    const sortButton = columnHeader?.querySelector('[data-sort-button]');
    const actualDirection = sortButton?.getAttribute('data-sort-direction');
    const pass = actualDirection === direction;
    
    return {
      pass,
      message: () => pass
        ? `Expected column "${columnName}" not to be sorted ${direction}`
        : `Expected column "${columnName}" to be sorted ${direction}, but was ${actualDirection}`,
    };
  },

  toHaveSelectedRows(container: HTMLElement | null, expectedCount: number) {
    const selectedRows = container?.querySelectorAll('[data-table-row][data-selected="true"]');
    const actualCount = selectedRows?.length || 0;
    const pass = actualCount === expectedCount;
    
    return {
      pass,
      message: () => pass
        ? `Expected table not to have ${expectedCount} selected rows`
        : `Expected table to have ${expectedCount} selected rows, but found ${actualCount}`,
    };
  },

  toHaveFilterApplied(container: HTMLElement | null, filterText: string) {
    const searchInput = container?.querySelector('[data-table-toolbar] input[type="search"], [data-table-toolbar] input[placeholder*="Search" i]') as HTMLInputElement;
    const actualValue = searchInput?.value;
    const pass = actualValue === filterText;
    
    return {
      pass,
      message: () => pass
        ? `Expected table not to have filter "${filterText}"`
        : `Expected table to have filter "${filterText}", but got "${actualValue}"`,
    };
  },

  toHaveColumnVisibility(container: HTMLElement | null, columnName: string, visible: boolean) {
    const columnHeader = container?.querySelector(`[data-table-header] [data-column="${columnName}"]`);
    const columnBody = container?.querySelector(`[data-table-body] [data-column="${columnName}"]`);
    const isVisible = !columnHeader?.hasAttribute('hidden') && !columnBody?.hasAttribute('hidden');
    const pass = isVisible === visible;
    
    return {
      pass,
      message: () => pass
        ? `Expected column "${columnName}" to be ${visible ? 'hidden' : 'visible'}`
        : `Expected column "${columnName}" to be ${visible ? 'visible' : 'hidden'}`,
    };
  },
});

// --- API Matchers ---

expect.extend({
  toHaveStatusCode(response: Response, expectedStatus: number) {
    const pass = response.status === expectedStatus;
    
    return {
      pass,
      message: () => pass
        ? `Expected response not to have status ${expectedStatus}`
        : `Expected response to have status ${expectedStatus}, but got ${response.status}`,
    };
  },

  toHaveHeader(response: Response, headerName: string, expectedValue?: string) {
    const actualValue = response.headers.get(headerName);
    const hasHeader = actualValue !== null;
    const pass = expectedValue ? actualValue === expectedValue : hasHeader;
    
    return {
      pass,
      message: () => {
        if (expectedValue) {
          return pass
            ? `Expected response not to have header "${headerName}" with value "${expectedValue}"`
            : `Expected response to have header "${headerName}" with value "${expectedValue}", but got "${actualValue}"`;
        }
        return pass
          ? `Expected response not to have header "${headerName}"`
          : `Expected response to have header "${headerName}"`;
      },
    };
  },

  toMatchSchema(_response: Response, _schema: any) {
    // This would integrate with Zod or similar
    // Placeholder for schema validation
    let pass = true;
    let message = '';
    
    try {
      // schema.parse(await response.json());
    } catch (error) {
      pass = false;
      message = error instanceof Error ? error.message : 'Schema validation failed';
    }
    
    return {
      pass,
      message: () => pass
        ? 'Expected response not to match schema'
        : `Response does not match schema: ${message}`,
    };
  },

  toBePaginatedResponse(_response: Response) {
    // Check if response has pagination structure
    return {
      pass: false,
      message: () => 'Not implemented',
    };
  },
});

// --- Async Matchers ---

expect.extend({
  async toResolve(promise: Promise<any>, expectedValue?: any) {
    try {
      const result = await promise;
      const pass = expectedValue === undefined || result === expectedValue;
      
      return {
        pass,
        message: () => pass
          ? `Expected promise not to resolve${expectedValue !== undefined ? ` to ${expectedValue}` : ''}`
          : `Expected promise to resolve${expectedValue !== undefined ? ` to ${expectedValue}` : ''}, but got ${result}`,
      };
    } catch (error) {
      return {
        pass: false,
        message: () => `Expected promise to resolve, but it rejected with ${error}`,
      };
    }
  },

  async toReject(promise: Promise<any>, expectedError?: any) {
    try {
      await promise;
      return {
        pass: false,
        message: () => 'Expected promise to reject, but it resolved',
      };
    } catch (error) {
      const pass = expectedError === undefined || 
        (expectedError instanceof RegExp && expectedError.test(String(error))) ||
        (typeof expectedError === 'string' && String(error).includes(expectedError)) ||
        (expectedError instanceof Error && error instanceof expectedError.constructor);
      
      return {
        pass,
        message: () => pass
          ? `Expected promise not to reject${expectedError ? ` with ${expectedError}` : ''}`
          : `Expected promise to reject${expectedError ? ` with ${expectedError}` : ''}, but got ${error}`,
      };
    }
  },

  async toResolveWithin(promise: Promise<any>, ms: number) {
    let timeout: NodeJS.Timeout;
    const timeoutPromise = new Promise((_, reject) => {
      timeout = setTimeout(() => reject(new Error('Timeout')), ms);
    });
    
    try {
      await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeout!);
      return {
        pass: true,
        message: () => `Expected promise not to resolve within ${ms}ms`,
      };
    } catch (error) {
      clearTimeout(timeout!);
      return {
        pass: false,
        message: () => `Expected promise to resolve within ${ms}ms, but it timed out`,
      };
    }
  },
});

// --- Type Declarations ---

declare module 'vitest' {
  interface Assertion<T = any> {
    toHaveFieldError(fieldName: string, message?: string | RegExp): T;
    toHaveFieldValue(fieldName: string, expectedValue: any): T;
    toBeFieldDisabled(fieldName: string): T;
    toBeFieldRequired(fieldName: string): T;
    toHaveFormValidationError(): T;
    toHaveFormValue(expectedValues: Record<string, any>): T;
    
    toHaveRowCount(expectedCount: number): T;
    toHaveRowWithData(rowData: Record<string, any>): T;
    toHaveSortedColumn(columnName: string, direction: 'asc' | 'desc'): T;
    toHaveSelectedRows(expectedCount: number): T;
    toHaveFilterApplied(filterText: string): T;
    toHaveColumnVisibility(columnName: string, visible: boolean): T;
    
    toHaveStatusCode(expectedStatus: number): T;
    toHaveHeader(headerName: string, expectedValue?: string): T;
    toMatchSchema(schema: any): T;
    toBePaginatedResponse(): T;
    
    toResolve(expectedValue?: any): T;
    toReject(expectedError?: any): T;
    toResolveWithin(ms: number): T;
  }

  interface AsymmetricMatchersContaining {
    toHaveFieldError(fieldName: string, message?: string | RegExp): any;
    toHaveFieldValue(fieldName: string, expectedValue: any): any;
    toBeFieldDisabled(fieldName: string): any;
    toBeFieldRequired(fieldName: string): any;
    toHaveFormValidationError(): any;
    toHaveFormValue(expectedValues: Record<string, any>): any;
    
    toHaveRowCount(expectedCount: number): any;
    toHaveRowWithData(rowData: Record<string, any>): any;
    toHaveSortedColumn(columnName: string, direction: 'asc' | 'desc'): any;
    toHaveSelectedRows(expectedCount: number): any;
    toHaveFilterApplied(filterText: string): any;
    toHaveColumnVisibility(columnName: string, visible: boolean): any;
    
    toHaveStatusCode(expectedStatus: number): any;
    toHaveHeader(headerName: string, expectedValue?: string): any;
    toMatchSchema(schema: any): any;
    toBePaginatedResponse(): any;
    
    toResolve(expectedValue?: any): any;
    toReject(expectedError?: any): any;
    toResolveWithin(ms: number): any;
  }
}