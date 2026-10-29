// Mock document.cookie before i18n loads - i18next-browser-languagedetector reads it during init
Object.defineProperty(document, 'cookie', {
  value: '',
  writable: true,
  configurable: true,
});

import "@core/i18n/i18n";
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, beforeEach } from "vitest";
import { toHaveNoViolations } from "vitest-axe/matchers";

// Register axe matcher at top level - this runs when the setup file is loaded
// vitest's expect should be available by this point
import { expect } from "vitest";
console.log('[vitest.setup] Registering axe matcher...');
expect.extend(toHaveNoViolations);
console.log('[vitest.setup] Axe matcher registered');

import { server } from "./src/shared/testing/msw/server";
import {
  setupTestIsolation,
  teardownTestIsolation,
  setupTestNetworkIsolation,
  teardownTestNetworkIsolation,
  createTestContext,
} from "./src/shared/testing/infrastructure/isolation";
import { getVitestFailureReporter } from "./src/shared/testing/reporting";
import { setCurrentTestContext } from "./src/shared/testing/test-context";

let interceptedFetch: typeof globalThis.fetch;

const vitestFailureReporter = getVitestFailureReporter();

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
  interceptedFetch = globalThis.fetch;
});

beforeEach(async (context) => {
  const testId = `test-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const testName = context.task.name || "unknown-test";
  
  const testContext = createTestContext(testId, testName, "component", "full");
  setCurrentTestContext(testContext);
  
  await setupTestIsolation(testContext);
  await setupTestNetworkIsolation(testContext);
});

afterEach(async (context) => {
  if (context.task.result?.state === "fail" && context.task.result.error) {
    vitestFailureReporter.onTestFailed(context.task, context.task.result.error);
  }
  
  const testContext = { testId: "", testName: "", profile: "", isolationLevel: "full" as const, sharedResources: new Map(), cleanupFns: [] };
  await teardownTestNetworkIsolation(testContext);
  await teardownTestIsolation(testContext);
  setCurrentTestContext(null);
  
  cleanup();
  server.resetHandlers();
  
  if (globalThis.fetch !== interceptedFetch) {
    globalThis.fetch = interceptedFetch;
  }
});

afterAll(() => {
  server.close();
});

if (typeof globalThis.Request !== "undefined") {
  const OriginalRequest = globalThis.Request;
  try {
    function isNativeSignal(s: any): boolean {
      if (!s) return true;
      return Object.getOwnPropertySymbols(s).some(
        (sym) => sym.description === "kAborted"
      );
    }

    class CompatibleRequest extends OriginalRequest {
      constructor(input: RequestInfo | URL, init?: RequestInit) {
        let cleanInit = init ? { ...init } : undefined;
        if (cleanInit?.signal && !isNativeSignal(cleanInit.signal)) {
          delete cleanInit.signal;
        }

        if (
          input &&
          typeof input === "object" &&
          "signal" in input &&
          !isNativeSignal((input as any).signal)
        ) {
          const url = (input as any).url || (input as any).href || String(input);
          const headers = (input as any).headers;
          const method = (input as any).method;
          super(url, {
            ...cleanInit,
            headers: cleanInit?.headers || headers,
            method: cleanInit?.method || method,
          });
        } else {
          super(input, cleanInit);
        }
      }
    }

    globalThis.Request = CompatibleRequest as any;
    if (typeof window !== "undefined") {
      window.Request = CompatibleRequest as any;
    }
  } catch {
    // Ignore fallback
  }
}

if (typeof window !== "undefined") {

  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null;
    readonly rootMargin: string = "";
    readonly thresholds: ReadonlyArray<number> = [];
    disconnect() {}
    observe() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
    unobserve() {}
  }

  window.IntersectionObserver = MockIntersectionObserver as any;
  global.IntersectionObserver = MockIntersectionObserver as any;

  if (typeof Element !== "undefined" && !Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
}