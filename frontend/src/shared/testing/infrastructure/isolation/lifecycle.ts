export type IsolationLevel = "full" | "shared-infrastructure" | "fresh-context" | "none";

export interface IsolationPolicy {
  level: IsolationLevel;
  beforeEach: IsolationHook[];
  afterEach: IsolationHook[];
  beforeAll: IsolationHook[];
  afterAll: IsolationHook[];
}

export interface IsolationHook {
  name: string;
  fn: () => void | Promise<void>;
  timeout?: number;
  order?: number;
}

export interface TestContext {
  testId: string;
  testName: string;
  profile: string;
  isolationLevel: IsolationLevel;
  sharedResources: Map<string, any>;
  cleanupFns: Array<() => void | Promise<void>>;
}

export const defaultIsolationPolicy: IsolationPolicy = {
  level: "full",
  beforeEach: [
    { name: "create-fresh-state", fn: () => {}, order: 10 },
    { name: "initialize-dependencies", fn: () => {}, order: 20 },
    { name: "reset-network-handlers", fn: () => {}, order: 30 },
    { name: "configure-test-data", fn: () => {}, order: 40 },
  ],
  afterEach: [
    { name: "unmount-components", fn: () => {}, order: 10 },
    { name: "restore-mocks", fn: () => {}, order: 20 },
    { name: "clear-temporary-state", fn: () => {}, order: 30 },
    { name: "release-resources", fn: () => {}, order: 40 },
  ],
  beforeAll: [
    { name: "setup-infrastructure", fn: () => {}, order: 10 },
    { name: "start-services", fn: () => {}, order: 20 },
  ],
  afterAll: [
    { name: "teardown-infrastructure", fn: () => {}, order: 10 },
    { name: "stop-services", fn: () => {}, order: 20 },
  ],
};

export function createIsolationPolicy(overrides: Partial<IsolationPolicy>): IsolationPolicy {
  return {
    ...defaultIsolationPolicy,
    ...overrides,
    beforeEach: [...defaultIsolationPolicy.beforeEach, ...(overrides.beforeEach || [])].sort((a, b) => (a.order || 0) - (b.order || 0)),
    afterEach: [...defaultIsolationPolicy.afterEach, ...(overrides.afterEach || [])].sort((a, b) => (a.order || 0) - (b.order || 0)),
    beforeAll: [...defaultIsolationPolicy.beforeAll, ...(overrides.beforeAll || [])].sort((a, b) => (a.order || 0) - (b.order || 0)),
    afterAll: [...defaultIsolationPolicy.afterAll, ...(overrides.afterAll || [])].sort((a, b) => (a.order || 0) - (b.order || 0)),
  };
}

export function createTestContext(testId: string, testName: string, profile: string, isolationLevel: IsolationLevel): TestContext {
  return {
    testId,
    testName,
    profile,
    isolationLevel,
    sharedResources: new Map(),
    cleanupFns: [],
  };
}

export async function runIsolationHooks(hooks: IsolationHook[], context: TestContext): Promise<void> {
  for (const hook of hooks) {
    const timeout = hook.timeout || 5000;
    try {
      await Promise.race([
        hook.fn(),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`Hook ${hook.name} timed out`)), timeout)),
      ]);
    } catch (error) {
      console.error(`Isolation hook failed: ${hook.name}`, error);
      throw error;
    }
  }
}

export function addCleanupFn(context: TestContext, fn: () => void | Promise<void>): void {
  context.cleanupFns.push(fn);
}

export async function runCleanupFns(context: TestContext): Promise<void> {
  for (const fn of context.cleanupFns.reverse()) {
    try {
      await fn();
    } catch (error) {
      console.error("Cleanup function failed:", error);
    }
  }
  context.cleanupFns = [];
}

export function shareResource(context: TestContext, key: string, value: any): void {
  context.sharedResources.set(key, value);
}

export function getSharedResource<T>(context: TestContext, key: string): T | undefined {
  return context.sharedResources.get(key);
}

export function hasSharedResource(context: TestContext, key: string): boolean {
  return context.sharedResources.has(key);
}

export function removeSharedResource(context: TestContext, key: string): boolean {
  return context.sharedResources.delete(key);
}

export function clearSharedResources(context: TestContext): void {
  context.sharedResources.clear();
}