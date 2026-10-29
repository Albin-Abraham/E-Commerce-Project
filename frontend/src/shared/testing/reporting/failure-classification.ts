export type FailureCategory =
  | "assertion"
  | "application"
  | "network"
  | "timeout"
  | "test-data"
  | "test-infrastructure"
  | "configuration"
  | "environment"
  | "unknown";

export interface FailureReport {
  category: FailureCategory;
  testId: string;
  testName: string;
  summary: string;
  expected?: unknown;
  actual?: unknown;
  evidence: readonly string[];
  timestamp: number;
  stack?: string;
  runner: "vitest" | "playwright";
}

export interface TestRunSummary {
  runId: string;
  timestamp: number;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  failuresByCategory: Record<FailureCategory, number>;
  duration: number;
}

export interface FailureEvidence {
  screenshots: string[];
  traces: string[];
  consoleLogs: string[];
  networkLogs: string[];
  domSnapshots: string[];
  pageStates: string[];
}

export const FAILURE_CATEGORIES: FailureCategory[] = [
  "assertion",
  "application",
  "network",
  "timeout",
  "test-data",
  "test-infrastructure",
  "configuration",
  "environment",
  "unknown",
];

export const CRITICAL_FAILURE_CATEGORIES: FailureCategory[] = [
  "test-infrastructure",
  "configuration",
];

export const WARNING_FAILURE_CATEGORIES: FailureCategory[] = [
  "timeout",
  "unknown",
];

export function isCriticalFailure(category: FailureCategory): boolean {
  return CRITICAL_FAILURE_CATEGORIES.includes(category);
}

export function isWarningFailure(category: FailureCategory): boolean {
  return WARNING_FAILURE_CATEGORIES.includes(category);
}