import type { FormDefinition } from "../domain";
import { describe, expect, it } from "vitest";

import { DebugManager } from "../modules/debug-manager";
import { ErrorManager } from "../modules/error-manager";
import { normalizeFormDefinition } from "../modules/field-registry";
import { StateManager } from "../modules/state-manager";

describe("Core Modules", () => {
  const mockDef: FormDefinition = {
    id: "test",
    title: "Test Form",
    sections: [],
  };
  const normalizedDef = normalizeFormDefinition(mockDef);

  // We recreate state manager for each test usually, but here we can reuse factory
  const createStateManager = () => new StateManager(normalizedDef);

  describe("ErrorManager", () => {
    it("should add and manage errors", () => {
      const stateManager = createStateManager();
      const errorManager = new ErrorManager(stateManager);
      const error = { code: "test", message: "Error", fieldId: "f1" };

      // Set Error
      errorManager.setError("f1", error);

      expect(stateManager.state.validity["f1"].valid).toBe(false);
      expect(stateManager.state.validity["f1"].errors).toContainEqual(error);
      expect(errorManager.getErrors("f1")).toContainEqual(error);
    });

    it("should clear errors", () => {
      const stateManager = createStateManager();
      const errorManager = new ErrorManager(stateManager);
      const error = { code: "test", message: "Error", fieldId: "f1" };

      errorManager.setError("f1", error);
      errorManager.clearErrors("f1"); // Corrected method name

      expect(stateManager.state.validity["f1"].valid).toBe(true);
      expect(stateManager.state.validity["f1"].errors).toHaveLength(0);
    });
  });

  describe("DebugManager", () => {
    it("should collect logs when enabled", () => {
      const stateManager = createStateManager();
      const debugManager = new DebugManager(stateManager);

      // Enable debug mode first
      debugManager.enable(true);

      debugManager.log("Test message", { data: 123 }); // Corrected signature

      const logs = stateManager.state.debug?.logs || [];
      expect(logs).toHaveLength(1);
      expect(logs[0]).toEqual(
        expect.objectContaining({
          message: "Test message",
          data: { data: 123 },
        })
      );
    });

    it("should not log when disabled", () => {
      const stateManager = createStateManager();
      const debugManager = new DebugManager(stateManager);

      // Default is disabled
      debugManager.log("Test");

      expect(stateManager.state.debug?.logs).toHaveLength(0);
    });
  });
});
