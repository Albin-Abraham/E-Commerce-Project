import { expect } from "vitest";
import type { BusinessAssertionOptions } from "../types";

export interface EntityAssertionOptions extends BusinessAssertionOptions {
  entityType?: string;
  entityId?: string;
}

export interface WorkflowAssertionOptions extends BusinessAssertionOptions {
  workflowName?: string;
  stepName?: string;
}

export interface ValidationAssertionOptions extends BusinessAssertionOptions {
  fieldName?: string;
  ruleName?: string;
}

export function expectEntityExists(
  entities: any[],
  entityId: string,
  _options: EntityAssertionOptions = {}
): void {
  const entity = entities.find(e => e.id === entityId || e._id === entityId);
  expect(entity).toBeDefined();
}

export function expectEntityNotExists(
  entities: any[],
  entityId: string,
  _options: EntityAssertionOptions = {}
): void {
  const entity = entities.find(e => e.id === entityId || e._id === entityId);
  expect(entity).toBeUndefined();
}

export function expectEntityProperty(
  entity: any,
  property: string,
  expectedValue: any,
  _options: EntityAssertionOptions = {}
): void {
  expect(entity).toBeDefined();
  expect(entity[property]).toEqual(expectedValue);
}

export function expectEntityProperties(
  entity: any,
  expectedProperties: Record<string, any>,
  _options: EntityAssertionOptions = {}
): void {
  expect(entity).toBeDefined();
  for (const [property, expectedValue] of Object.entries(expectedProperties)) {
    expect(entity[property]).toEqual(expectedValue);
  }
}

export function expectEntityCount(
  entities: any[],
  expectedCount: number,
  _options: BusinessAssertionOptions = {}
): void {
  expect(entities).toHaveLength(expectedCount);
}

export function expectEntityHasRelation(
  entity: any,
  relationName: string,
  relatedEntityId: string,
  _options: EntityAssertionOptions = {}
): void {
  expect(entity).toBeDefined();
  const relation = entity[relationName];
  if (Array.isArray(relation)) {
    expect(relation.some((r: any) => r.id === relatedEntityId || r._id === relatedEntityId)).toBe(true);
  } else {
    expect(relation?.id === relatedEntityId || relation?._id === relatedEntityId).toBe(true);
  }
}

export function expectWorkflowStep(
  workflowState: any,
  expectedStep: string,
  _options: WorkflowAssertionOptions = {}
): void {
  expect(workflowState.currentStep).toBe(expectedStep);
}

export function expectWorkflowCompleted(
  workflowState: any,
  _options: WorkflowAssertionOptions = {}
): void {
  expect(workflowState.status).toBe("completed");
}

export function expectWorkflowFailed(
  workflowState: any,
  _options: WorkflowAssertionOptions = {}
): void {
  expect(workflowState.status).toBe("failed");
}

export function expectWorkflowInProgress(
  workflowState: any,
  _options: WorkflowAssertionOptions = {}
): void {
  expect(workflowState.status).toBe("in_progress");
}

export function expectValidationPassed(
  validationResult: any,
  fieldName: string,
  _options: ValidationAssertionOptions = {}
): void {
  const fieldValidation = validationResult.fields?.[fieldName];
  expect(fieldValidation?.valid).toBe(true);
}

export function expectValidationFailed(
  validationResult: any,
  fieldName: string,
  expectedMessage?: string | RegExp,
  _options: ValidationAssertionOptions = {}
): void {
  const fieldValidation = validationResult.fields?.[fieldName];
  expect(fieldValidation?.valid).toBe(false);
  if (expectedMessage) {
    if (expectedMessage instanceof RegExp) {
      expect(fieldValidation?.message).toMatch(expectedMessage);
    } else {
      expect(fieldValidation?.message).toContain(expectedMessage);
    }
  }
}

export function expectValidationError(
  validationResult: any,
  fieldName: string,
  ruleName: string,
  _options: ValidationAssertionOptions = {}
): void {
  const fieldValidation = validationResult.fields?.[fieldName];
  expect(fieldValidation?.valid).toBe(false);
  expect(fieldValidation?.rule).toBe(ruleName);
}

export function expectPermissions(
  userPermissions: string[],
  requiredPermissions: string[],
  _options: BusinessAssertionOptions = {}
): void {
  for (const perm of requiredPermissions) {
    expect(userPermissions).toContain(perm);
  }
}

export function expectRoleHasPermission(
  rolePermissions: Record<string, string[]>,
  role: string,
  permission: string,
  _options: BusinessAssertionOptions = {}
): void {
  expect(rolePermissions[role]).toContain(permission);
}

export function expectApiResponseSuccess(
  response: any,
  _options: BusinessAssertionOptions = {}
): void {
  expect(response.status).toBeGreaterThanOrEqual(200);
  expect(response.status).toBeLessThan(300);
  expect(response.data).toBeDefined();
}

export function expectApiResponseError(
  response: any,
  expectedStatus: number,
  _options: BusinessAssertionOptions = {}
): void {
  expect(response.status).toBe(expectedStatus);
  expect(response.error).toBeDefined();
}

export function expectPagination(
  response: any,
  expectedPage: number,
  expectedPageSize: number,
  expectedTotal: number,
  _options: BusinessAssertionOptions = {}
): void {
  expect(response.pagination?.page).toBe(expectedPage);
  expect(response.pagination?.pageSize).toBe(expectedPageSize);
  expect(response.pagination?.total).toBe(expectedTotal);
}

export function expectSortOrder(
  items: any[],
  sortBy: string,
  direction: "asc" | "desc",
  _options: BusinessAssertionOptions = {}
): void {
  if (items.length < 2) return;
  
  for (let i = 1; i < items.length; i++) {
    const prev = items[i - 1][sortBy];
    const curr = items[i][sortBy];
    
    if (direction === "asc") {
      expect(prev <= curr).toBe(true);
    } else {
      expect(prev >= curr).toBe(true);
    }
  }
}

export function expectFilterApplied(
  items: any[],
  filter: Record<string, any>,
  _options: BusinessAssertionOptions = {}
): void {
  for (const item of items) {
    for (const [key, value] of Object.entries(filter)) {
      if (value instanceof RegExp) {
        expect(item[key]).toMatch(value);
      } else {
        expect(item[key]).toEqual(value);
      }
    }
  }
}

export function expectBusinessRule(
  result: any,
  ruleName: string,
  expectedOutcome: boolean,
  _options: BusinessAssertionOptions = {}
): void {
  expect(result.rules?.[ruleName]?.passed).toBe(expectedOutcome);
}

export function expectAuditTrail(
  auditEntries: any[],
  expectedAction: string,
  expectedEntityId: string,
  _options: BusinessAssertionOptions = {}
): void {
  const entry = auditEntries.find(
    e => e.action === expectedAction && e.entityId === expectedEntityId
  );
  expect(entry).toBeDefined();
}

export function expectNotificationSent(
  notifications: any[],
  type: string,
  recipientId: string,
  _options: BusinessAssertionOptions = {}
): void {
  const notification = notifications.find(
    n => n.type === type && n.recipientId === recipientId
  );
  expect(notification).toBeDefined();
}

export function expectDataIntegrity(
  beforeState: any,
  afterState: any,
  immutableFields: string[],
  _options: BusinessAssertionOptions = {}
): void {
  for (const field of immutableFields) {
    expect(beforeState[field]).toEqual(afterState[field]);
  }
}

export function expectStateTransition(
  fromState: string,
  toState: string,
  allowedTransitions: Record<string, string[]>,
  _options: BusinessAssertionOptions = {}
): void {
  const allowed = allowedTransitions[fromState] || [];
  expect(allowed).toContain(toState);
}

export function expectCalculatedValue(
  actual: number,
  expected: number,
  tolerance: number = 0.01,
  _options: BusinessAssertionOptions = {}
): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}

export function expectDateRange(
  date: Date | string,
  startDate: Date | string,
  endDate: Date | string,
  _options: BusinessAssertionOptions = {}
): void {
  const d = new Date(date).getTime();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  expect(d).toBeGreaterThanOrEqual(start);
  expect(d).toBeLessThanOrEqual(end);
}

export function expectCurrencyAmount(
  actual: number,
  expected: number,
  _currency: string = "USD",
  _options: BusinessAssertionOptions = {}
): void {
  expect(actual).toBeCloseTo(expected, 2);
}

export function expectPercentage(
  actual: number,
  expected: number,
  tolerance: number = 0.01,
  _options: BusinessAssertionOptions = {}
): void {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
}