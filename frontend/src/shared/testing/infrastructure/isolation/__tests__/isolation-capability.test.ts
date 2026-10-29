import { describe, it, expect } from "vitest";
import { createIsolationCapability } from "../index";

describe("Isolation Capability", () => {
  const isolate = createIsolationCapability();

  it("should have addCleanupFn", () => {
    expect(typeof isolate.addCleanupFn).toBe("function");
  });

  it("should have createTestContext", () => {
    expect(typeof isolate.createTestContext).toBe("function");
  });

  it("should create test context", () => {
    const context = isolate.createTestContext("test-1", "Test 1", "component", "full");
    expect(context.testId).toBe("test-1");
    expect(context.testName).toBe("Test 1");
    expect(context.profile).toBe("component");
    expect(context.isolationLevel).toBe("full");
  });

  it("should manage shared resources", () => {
    const context = isolate.createTestContext("test-2", "Test 2", "component", "full");
    isolate.shareResource(context, "apiClient", { baseUrl: "/api" });
    
    const client = isolate.getSharedResource(context, "apiClient");
    expect(client).toEqual({ baseUrl: "/api" });
  });

  it("should run cleanup functions", async () => {
    const context = isolate.createTestContext("test-3", "Test 3", "component", "full");
    let cleanedUp = false;
    
    isolate.addCleanupFn(context, () => {
      cleanedUp = true;
    });
    
    await isolate.runCleanupFns(context);
    expect(cleanedUp).toBe(true);
  });
});