export * from "./types";
export * from "./impl/semantic";
export * from "./impl/accessibility";
export * from "./impl/business";

import type { AssertionOptions, FieldAssertionOptions, TableAssertionOptions, AccessibilityAssertionOptions, BusinessAssertionOptions } from "./types";
import * as semantic from "./impl/semantic";
import * as accessibility from "./impl/accessibility";
import * as business from "./impl/business";

export function createAssertionCapability(container: HTMLElement) {
  const ctx = { container };

  return {
    // Core Assertions
    toBeInTheDocument: (element: HTMLElement | null, options?: AssertionOptions) =>
      semantic.toBeInTheDocument(element, options),
    notToBeInTheDocument: (element: HTMLElement | null, options?: AssertionOptions) =>
      semantic.notToBeInTheDocument(element, options),
    toBeVisible: (element: HTMLElement | null, options?: AssertionOptions) =>
      semantic.toBeVisible(element, options),
    notToBeVisible: (element: HTMLElement | null, options?: AssertionOptions) =>
      semantic.notToBeVisible(element, options),
    toBeDisabled: (element: HTMLElement | null, options?: AssertionOptions) =>
      semantic.toBeDisabled(element, options),
    notToBeDisabled: (element: HTMLElement | null, options?: AssertionOptions) =>
      semantic.notToBeDisabled(element, options),
    toBeEnabled: (element: HTMLElement | null, options?: AssertionOptions) =>
      semantic.toBeEnabled(element, options),
    toBeChecked: (element: HTMLElement | null, options?: AssertionOptions) =>
      semantic.toBeChecked(element, options),
    notToBeChecked: (element: HTMLElement | null, options?: AssertionOptions) =>
      semantic.notToBeChecked(element, options),
    toHaveValue: (element: HTMLElement | null, value: string | number | string[], options?: AssertionOptions) =>
      semantic.toHaveValue(element, value, options),
    toHaveTextContent: (element: HTMLElement | null, text: string | RegExp, options?: AssertionOptions) =>
      semantic.toHaveTextContent(element, text, options),
    toHaveAttribute: (element: HTMLElement | null, name: string, value?: string, options?: AssertionOptions) =>
      semantic.toHaveAttribute(element, name, value, options),
    toHaveClass: (element: HTMLElement | null, className: string, options?: AssertionOptions) =>
      semantic.toHaveClass(element, className, options),
    toHaveFocus: (element: HTMLElement | null, options?: AssertionOptions) =>
      semantic.toHaveFocus(element, options),
    toHaveStyle: (element: HTMLElement | null, style: Record<string, any>, options?: AssertionOptions) =>
      semantic.toHaveStyle(element, style, options),
    toContainElement: (container: HTMLElement | null, element: HTMLElement | null, options?: AssertionOptions) =>
      semantic.toContainElement(container, element, options),
    toEqual: (expected: any, actual: any, options?: AssertionOptions) =>
      semantic.toEqual(expected, actual, options),
    toBe: (expected: any, actual: any, options?: AssertionOptions) =>
      semantic.toBe(expected, actual, options),
    toBeTruthy: (value: any, options?: AssertionOptions) =>
      semantic.toBeTruthy(value, options),
    toBeFalsy: (value: any, options?: AssertionOptions) =>
      semantic.toBeFalsy(value, options),
    toBeNull: (value: any, options?: AssertionOptions) =>
      semantic.toBeNull(value, options),
    toBeUndefined: (value: any, options?: AssertionOptions) =>
      semantic.toBeUndefined(value, options),
    toBeDefined: (value: any, options?: AssertionOptions) =>
      semantic.toBeDefined(value, options),
    toContain: (item: any, array: any[], options?: AssertionOptions) =>
      semantic.toContain(item, array, options),
    toHaveLength: (length: number, array: any[], options?: AssertionOptions) =>
      semantic.toHaveLength(length, array, options),
    toMatch: (pattern: RegExp | string, value: string, options?: AssertionOptions) =>
      semantic.toMatch(pattern, value, options),
    toThrow: (fn: () => any, error?: Error | RegExp | string, options?: AssertionOptions) =>
      semantic.toThrow(fn, error, options),
    toReject: (fn: () => Promise<any>, error?: Error | RegExp | string, options?: AssertionOptions) =>
      semantic.toReject(fn, error, options),
    toResolve: (fn: () => Promise<any>, options?: AssertionOptions) =>
      semantic.toResolve(fn, options),
    
    // Form Assertions
    expectFieldVisible: (options: FieldAssertionOptions) =>
      semantic.expectFieldVisible(ctx.container, options),
    expectFieldNotVisible: (options: FieldAssertionOptions) =>
      semantic.expectFieldNotVisible(ctx.container, options),
    expectFieldValue: (options: FieldAssertionOptions, expectedValue: string | number) =>
      semantic.expectFieldValue(ctx.container, options, expectedValue),
    expectFieldError: (options: FieldAssertionOptions, expectedMessage: string | RegExp) =>
      semantic.expectFieldError(ctx.container, options, expectedMessage),
    expectFieldNoError: (options: FieldAssertionOptions) =>
      semantic.expectFieldNoError(ctx.container, options),
    expectFieldDisabled: (options: FieldAssertionOptions) =>
      semantic.expectFieldDisabled(ctx.container, options),
    expectFieldEnabled: (options: FieldAssertionOptions) =>
      semantic.expectFieldEnabled(ctx.container, options),
    expectFieldRequired: (options: FieldAssertionOptions) =>
      semantic.expectFieldRequired(ctx.container, options),
    expectFieldOptional: (options: FieldAssertionOptions) =>
      semantic.expectFieldOptional(ctx.container, options),
    expectFormValid: (options?: AssertionOptions) =>
      semantic.expectFormValid(ctx.container, options),
    expectFormInvalid: (options?: AssertionOptions) =>
      semantic.expectFormInvalid(ctx.container, options),
    
    // Table Assertions
    expectTableRowCount: (expectedCount: number, options?: TableAssertionOptions) =>
      semantic.expectTableRowCount(ctx.container, expectedCount, options),
    expectTableCellValue: (options: TableAssertionOptions, expectedValue: string) =>
      semantic.expectTableCellValue(ctx.container, options, expectedValue),
    expectTableRowSelected: (rowIndex: number, options?: TableAssertionOptions) =>
      semantic.expectTableRowSelected(ctx.container, rowIndex, options),
    expectTableRowNotSelected: (rowIndex: number, options?: TableAssertionOptions) =>
      semantic.expectTableRowNotSelected(ctx.container, rowIndex, options),
    expectTableSorted: (columnName: string, direction: "asc" | "desc", options?: TableAssertionOptions) =>
      semantic.expectTableSorted(ctx.container, columnName, direction, options),
    
    // Accessibility Assertions
    expectAccessible: (options?: AccessibilityAssertionOptions) =>
      accessibility.expectAccessible(ctx.container, options),
    expectNoViolations: (options?: AccessibilityAssertionOptions) =>
      accessibility.expectNoViolations(ctx.container, options),
    expectNoCriticalViolations: (options?: AccessibilityAssertionOptions) =>
      accessibility.expectNoCriticalViolations(ctx.container, options),
    expectNoSeriousViolations: (options?: AccessibilityAssertionOptions) =>
      accessibility.expectNoSeriousViolations(ctx.container, options),
    getViolations: (options?: AccessibilityAssertionOptions) =>
      accessibility.getViolations(ctx.container, options),
    getViolationsByImpact: (impact: "minor" | "moderate" | "serious" | "critical", options?: AccessibilityAssertionOptions) =>
      accessibility.getViolationsByImpact(ctx.container, impact, options),
    getViolationsByTag: (tag: string, options?: AccessibilityAssertionOptions) =>
      accessibility.getViolationsByTag(ctx.container, tag, options),
    expectKeyboardNavigable: (options?: AccessibilityAssertionOptions) =>
      accessibility.expectKeyboardNavigable(ctx.container, options),
    expectScreenReaderCompatible: (options?: AccessibilityAssertionOptions) =>
      accessibility.expectScreenReaderCompatible(ctx.container, options),
    expectColorContrast: (options?: AccessibilityAssertionOptions) =>
      accessibility.expectColorContrast(ctx.container, options),
    expectFocusManagement: (options?: AccessibilityAssertionOptions) =>
      accessibility.expectFocusManagement(ctx.container, options),
    expectAriaAttributes: (options?: AccessibilityAssertionOptions) =>
      accessibility.expectAriaAttributes(ctx.container, options),
    expectFormLabels: (options?: AccessibilityAssertionOptions) =>
      accessibility.expectFormLabels(ctx.container, options),
    expectTableAccessibility: (options?: AccessibilityAssertionOptions) =>
      accessibility.expectTableAccessibility(ctx.container, options),
    expectHeadingStructure: (options?: AccessibilityAssertionOptions) =>
      accessibility.expectHeadingStructure(ctx.container, options),
    createAccessibilityReport: accessibility.createAccessibilityReport,
    auditAndReport: (options?: AccessibilityAssertionOptions) =>
      accessibility.auditAndReport(ctx.container, options),
    
    // Business Assertions
    expectEntityExists: (entities: any[], entityId: string, options?: BusinessAssertionOptions & { entityType: string }) =>
      business.expectEntityExists(entities, entityId, options),
    expectEntityNotExists: (entities: any[], entityId: string, options?: BusinessAssertionOptions & { entityType: string }) =>
      business.expectEntityNotExists(entities, entityId, options),
    expectEntityProperty: (entity: any, property: string, expectedValue: any, options?: BusinessAssertionOptions & { entityType: string }) =>
      business.expectEntityProperty(entity, property, expectedValue, options),
    expectEntityProperties: (entity: any, expectedProperties: Record<string, any>, options?: BusinessAssertionOptions & { entityType: string }) =>
      business.expectEntityProperties(entity, expectedProperties, options),
    expectEntityCount: (entities: any[], expectedCount: number, options?: BusinessAssertionOptions) =>
      business.expectEntityCount(entities, expectedCount, options),
    expectEntityHasRelation: (entity: any, relationName: string, relatedEntityId: string, options?: BusinessAssertionOptions & { entityType: string }) =>
      business.expectEntityHasRelation(entity, relationName, relatedEntityId, options),
    expectWorkflowStep: (workflowState: any, expectedStep: string, options?: BusinessAssertionOptions & { workflowName: string }) =>
      business.expectWorkflowStep(workflowState, expectedStep, options),
    expectWorkflowCompleted: (workflowState: any, options?: BusinessAssertionOptions & { workflowName: string }) =>
      business.expectWorkflowCompleted(workflowState, options),
    expectWorkflowFailed: (workflowState: any, options?: BusinessAssertionOptions & { workflowName: string }) =>
      business.expectWorkflowFailed(workflowState, options),
    expectWorkflowInProgress: (workflowState: any, options?: BusinessAssertionOptions & { workflowName: string }) =>
      business.expectWorkflowInProgress(workflowState, options),
    expectValidationPassed: (validationResult: any, fieldName: string, options?: BusinessAssertionOptions & { ruleName?: string }) =>
      business.expectValidationPassed(validationResult, fieldName, options),
    expectValidationFailed: (validationResult: any, fieldName: string, expectedMessage?: string | RegExp, options?: BusinessAssertionOptions & { ruleName?: string }) =>
      business.expectValidationFailed(validationResult, fieldName, expectedMessage, options),
    expectValidationError: (validationResult: any, fieldName: string, ruleName: string, options?: BusinessAssertionOptions) =>
      business.expectValidationError(validationResult, fieldName, ruleName, options),
    expectPermissions: (userPermissions: string[], requiredPermissions: string[], options?: BusinessAssertionOptions) =>
      business.expectPermissions(userPermissions, requiredPermissions, options),
    expectRoleHasPermission: (rolePermissions: Record<string, string[]>, role: string, permission: string, options?: BusinessAssertionOptions) =>
      business.expectRoleHasPermission(rolePermissions, role, permission, options),
    expectApiResponseSuccess: (response: any, options?: BusinessAssertionOptions) =>
      business.expectApiResponseSuccess(response, options),
    expectApiResponseError: (response: any, expectedStatus: number, options?: BusinessAssertionOptions) =>
      business.expectApiResponseError(response, expectedStatus, options),
    expectPagination: (response: any, expectedPage: number, expectedPageSize: number, expectedTotal: number, options?: BusinessAssertionOptions) =>
      business.expectPagination(response, expectedPage, expectedPageSize, expectedTotal, options),
    expectSortOrder: (items: any[], sortBy: string, direction: "asc" | "desc", options?: BusinessAssertionOptions) =>
      business.expectSortOrder(items, sortBy, direction, options),
    expectFilterApplied: (items: any[], filter: Record<string, any>, options?: BusinessAssertionOptions) =>
      business.expectFilterApplied(items, filter, options),
    expectBusinessRule: (result: any, ruleName: string, expectedOutcome: boolean, options?: BusinessAssertionOptions) =>
      business.expectBusinessRule(result, ruleName, expectedOutcome, options),
    expectAuditTrail: (auditEntries: any[], expectedAction: string, expectedEntityId: string, options?: BusinessAssertionOptions) =>
      business.expectAuditTrail(auditEntries, expectedAction, expectedEntityId, options),
    expectNotificationSent: (notifications: any[], type: string, recipientId: string, options?: BusinessAssertionOptions) =>
      business.expectNotificationSent(notifications, type, recipientId, options),
    expectDataIntegrity: (beforeState: any, afterState: any, immutableFields: string[], options?: BusinessAssertionOptions) =>
      business.expectDataIntegrity(beforeState, afterState, immutableFields, options),
    expectStateTransition: (fromState: string, toState: string, allowedTransitions: Record<string, string[]>, options?: BusinessAssertionOptions) =>
      business.expectStateTransition(fromState, toState, allowedTransitions, options),
    expectCalculatedValue: (actual: number, expected: number, tolerance?: number, options?: BusinessAssertionOptions) =>
      business.expectCalculatedValue(actual, expected, tolerance, options),
    expectDateRange: (date: Date | string, startDate: Date | string, endDate: Date | string, options?: BusinessAssertionOptions) =>
      business.expectDateRange(date, startDate, endDate, options),
    expectCurrencyAmount: (actual: number, expected: number, currency?: string, options?: BusinessAssertionOptions) =>
      business.expectCurrencyAmount(actual, expected, currency, options),
    expectPercentage: (actual: number, expected: number, tolerance?: number, options?: BusinessAssertionOptions) =>
      business.expectPercentage(actual, expected, tolerance, options),
  };
}

export type AssertionCapability = ReturnType<typeof createAssertionCapability>;