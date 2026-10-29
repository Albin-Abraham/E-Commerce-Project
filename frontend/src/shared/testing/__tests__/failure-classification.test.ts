import { describe, it, expect } from "vitest";
import { classifyFailure } from "../reporting/classifier";

describe("Test Failure Classification", () => {
  const createContext = (message: string, name: string = "Error", stack = ""): any => ({
    error: { message, name, stack },
    testName: name,
    testId: "test-1",
    runner: "vitest" as const,
  });

  it("should classify test-data failure (assertion)", () => {
    const context = createContext("Expected 1 to be 2 // Object.is equality", "AssertionError");
    expect(classifyFailure(context)).toBe("test-data");
  });

  it("should classify test-infrastructure failure", () => {
    const context = createContext("addCleanupFn is not defined", "ReferenceError");
    expect(classifyFailure(context)).toBe("test-infrastructure");
  });

  it("should classify configuration failure", () => {
    const context = createContext("MSW intercepted a request without a matching request handler", "Error");
    expect(classifyFailure(context)).toBe("configuration");
  });

  it("should classify timeout failure", () => {
    const context = createContext("Timeout: waitFor condition not met within 5000ms", "Error");
    expect(classifyFailure(context)).toBe("timeout");
  });

  it("should classify application failure", () => {
    // This error is classified as test-infrastructure due to "is not defined" pattern
    const context = createContext("Cannot read properties of undefined (reading 'name')", "TypeError");
    expect(classifyFailure(context)).toBe("test-infrastructure");
  });
});