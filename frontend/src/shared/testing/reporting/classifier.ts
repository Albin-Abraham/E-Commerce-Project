import type { FailureCategory, FailureReport } from "./failure-classification";

export interface ClassifierContext {
  error: Error;
  testName: string;
  testId: string;
  runner: "vitest" | "playwright";
  container?: HTMLElement;
  page?: any; // Playwright Page
  consoleLogs?: Array<{ level: string; args: any[]; timestamp: number }>;
  networkLogs?: any[];
  stack?: string;
}

const CLASSIFICATION_RULES: Array<{
  category: FailureCategory;
  patterns: RegExp[];
  check?: (context: ClassifierContext) => boolean;
}> = [
{
    category: "test-infrastructure",
    patterns: [
      /Cannot find module/,
      /Module not found/,
      /import.*failed/,
      /Failed to resolve import/,
      /ReferenceError:.*is not defined/,
      /TypeError:.*is not a function/,
      /vi\.useFakeTimers.*then is not a function/,
      /addCleanupFn is not defined/,
      /runCleanupFns is not defined/,
      /expect\.extend.*toHaveNoViolations/,
      /Invalid Chai property/,
      /globalThis\.XMLHttpRequest.*read only/,
      /is not defined/,
      /is not a function/,
    ],
    check: (ctx) => {
      const isTestError = ctx.stack?.includes("__tests__") || ctx.stack?.includes("test-");
      // Match actual function calls, not just words in error messages
      const isMissingTestUtil = /\b(addCleanupFn|runCleanupFns|expect\.extend|vi\.useFakeTimers|vi\.useRealTimers|waitFor\(|waitForElement\()/.test(ctx.error.message);
      const isTestFrameworkError = ctx.error.name === "ReferenceError" || ctx.error.name === "TypeError";
      const result = isTestError || isMissingTestUtil || isTestFrameworkError;
      console.log(`[DEBUG CHECK] test-infrastructure check result: ${result}`);
      return result;
    },
  },
  {
    category: "configuration",
    patterns: [
      /MSW.*unhandled request/,
      /onUnhandledRequest.*error/,
      /Invalid URL/,
      /Failed to parse URL/,
      /ENOENT.*config/,
      /Missing environment variable/,
      /Configuration error/,
      /Failed to load config/,
      /vite:import-analysis.*Does the file exist/,
      /intercepted a request without a matching request handler/,
    ],
  },
  {
    category: "network",
    patterns: [
      /fetch.*failed/,
      /Network request failed/,
      /ECONNREFUSED/,
      /ETIMEDOUT/,
      /ENOTFOUND/,
      /socket hang up/,
      /MSW.*intercepted a request without a matching request handler/,
      /Request failed with status/,
    ],
    check: (ctx) => {
      if (ctx.networkLogs) {
        return ctx.networkLogs.some((log) => log.error || (log.responseStatus && log.responseStatus >= 500));
      }
      return false;
    },
  },
{
    category: "timeout",
    patterns: [
      /timeout/i,
      /Timed out/,
      /async callback was not invoked/,
      /async operation.*did not complete/,
      /waitFor.*timeout/,
      /Element not found within/,
      /Condition not met within/,
      /Poll condition not met within/,
      /Action did not produce expected result within/,
    ],
    check: (ctx) => {
      const isTimeoutError = ctx.error.name === "TimeoutError";
      const hasTimeoutMessage = ctx.error.message.toLowerCase().includes("timeout");
      const hasTimedOutMessage = ctx.error.message.includes("Timed out");
      const result = isTimeoutError || hasTimeoutMessage || hasTimedOutMessage;
      console.log(`[DEBUG CHECK] timeout check result: ${result}`);
      return result;
    },
  },
  {
    category: "test-data",
    patterns: [
      /Expected.*to be/,
      /Expected.*toEqual/,
      /Expected.*toContain/,
      /Expected.*toHaveLength/,
      /Expected.*toMatch/,
      /Expected.*toBeTruthy/,
      /Expected.*toBeFalsy/,
      /Expected.*toBeNull/,
      /Expected.*toBeUndefined/,
      /Expected.*toBeDefined/,
      /toBeInTheDocument/,
      /toBeVisible/,
      /toHaveValue/,
      /toHaveTextContent/,
      /toHaveAttribute/,
      /toHaveClass/,
      /toHaveFocus/,
      /toHaveStyle/,
      /toContainElement/,
      /toHaveNoViolations/,
      /Received.*value must be an HTMLElement/,
    ],
    check: (ctx) => {
      // If it's an expect() call that failed, it's likely an assertion failure
      return ctx.error.name === "AssertionError" || ctx.error.message.includes("expect(") || ctx.error.message.includes("Expected ");
    },
  },
  {
    category: "application",
    patterns: [
      /Error:.*Application error/,
      /Unhandled rejection/,
      /React error/,
      /Something went wrong/,
      /Error boundary/,
      /Cannot read properties of undefined/,
      /Cannot read properties of null/,
      /is not a function/,
      /is not iterable/,
      /Cannot set properties of undefined/,
    ],
    check: (ctx) => {
      const stack = ctx.error.stack || ctx.stack || "";
      console.log(`[DEBUG CHECK] application check called, ctx:`, JSON.stringify({
        stack: stack.substring(0, 100),
        hasSrc: stack.includes("src/"),
        hasTests: stack.includes("__tests__"),
        hasTest: stack.includes("test-"),
      }));
      const result = stack.includes("src/") && !stack.includes("__tests__") && !stack.includes("test-");
      console.log(`[DEBUG CHECK] application check result: ${result}`);
      return result;
    },
  },
  {
    category: "environment",
    patterns: [
      /CanvasElement.*getContext/,
      /IntersectionObserver/,
      /ResizeObserver/,
      /matchMedia/,
      /scrollIntoView/,
      /WebGL/,
      /OffscreenCanvas/,
    ],
  },
];

export function classifyFailure(context: ClassifierContext): FailureCategory {
  const { error, stack } = context;
  const message = error.message || String(error);
  const fullMessage = `${message}\n${stack || ""}`;
  
  console.log(`[DEBUG CLASSIFIER] Classifying: ${context.testName}, message: ${message.substring(0, 100)}`);
  
  // Check each category's patterns
  for (const rule of CLASSIFICATION_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(fullMessage)) {
        console.log(`[DEBUG CLASSIFIER] Pattern matched for ${rule.category}: ${pattern}`);
        // If there's a custom check, run it
        if (rule.check) {
          try {
            const checkResult = rule.check(context);
            console.log(`[DEBUG CLASSIFIER] Check result for ${rule.category}: ${checkResult}`);
            if (!checkResult) {
              console.log(`[DEBUG CLASSIFIER] Check failed for ${rule.category}, skipping`);
              continue;
            }
          } catch (e) {
            console.log(`[DEBUG CLASSIFIER] Check error for ${rule.category}: ${e}`);
            continue;
          }
        }
        console.log(`[DEBUG CLASSIFIER] Classified as: ${rule.category}`);
        return rule.category;
      }
    }
    
    // Run custom check even without pattern match
    if (rule.check) {
      try {
        const checkResult = rule.check(context);
        console.log(`[DEBUG CLASSIFIER] Check-only result for ${rule.category}: ${checkResult}`);
        if (checkResult) {
          console.log(`[DEBUG CLASSIFIER] Check-only passed for ${rule.category}`);
          return rule.category;
        }
      } catch (e) {
        console.log(`[DEBUG CLASSIFIER] Check-only error for ${rule.category}: ${e}`);
      }
    }
  }
  
  console.log(`[DEBUG CLASSIFIER] No match found, returning unknown`);
  return "unknown";
}

export function createFailureReport(context: ClassifierContext): FailureReport {
  const category = classifyFailure(context);
  
  return {
    category,
    testId: context.testId,
    testName: context.testName,
    summary: context.error.message || String(context.error),
    expected: undefined, // Could be extracted from assertion errors
    actual: undefined,
    evidence: extractEvidence(context),
    timestamp: Date.now(),
    stack: context.error.stack,
    runner: context.runner,
  };
}

function extractEvidence(context: ClassifierContext): string[] {
  const evidence: string[] = [];
  
  if (context.error.stack) {
    evidence.push(context.error.stack);
  }
  
  if (context.consoleLogs && context.consoleLogs.length > 0) {
    evidence.push("Console logs available");
  }
  
  if (context.networkLogs && context.networkLogs.length > 0) {
    evidence.push("Network logs available");
  }
  
  if (context.container) {
    evidence.push("DOM container available");
  }
  
  if (context.page) {
    evidence.push("Playwright page available");
  }
  
  return evidence;
}

export function shouldFailBuild(category: FailureCategory): boolean {
  return CRITICAL_FAILURE_CATEGORIES.includes(category);
}

export function shouldWarn(category: FailureCategory): boolean {
  return WARNING_FAILURE_CATEGORIES.includes(category);
}

const CRITICAL_FAILURE_CATEGORIES: FailureCategory[] = ["test-infrastructure", "configuration"];
const WARNING_FAILURE_CATEGORIES: FailureCategory[] = ["timeout", "unknown"];