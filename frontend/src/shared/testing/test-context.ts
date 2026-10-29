import type { TestContext } from "../infrastructure/isolation";

let currentTestContext: TestContext | null = null;

export function setCurrentTestContext(context: TestContext | null): void {
  currentTestContext = context;
}

export function getCurrentTestContext(): TestContext | null {
  return currentTestContext;
}