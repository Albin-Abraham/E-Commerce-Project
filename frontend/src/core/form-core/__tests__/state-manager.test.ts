import type { FormDefinition } from "../domain";
import { describe, expect, it, vi } from "vitest";

import { normalizeFormDefinition } from "../modules/field-registry";
import { StateManager } from "../modules/state-manager";

describe("StateManager (5V Architecture)", () => {
  const mockDef: FormDefinition = {
    id: "test",
    title: "Test Form",
    sections: [
      {
        id: "s1",
        title: "Section 1",
        fields: [
          {
            id: "f1",
            name: "firstName",
            type: "text",
            label: "First Name",
            initialValue: "John",
          },
          { id: "f2", name: "age", type: "number", label: "Age" },
        ],
      },
    ],
  };

  // Normalize the definition as StateManager expects NormalizedForm
  const normalizedDef = normalizeFormDefinition(mockDef);

  it("should initialize with correct default structure", () => {
    const manager = new StateManager(normalizedDef);
    const state = manager.state;

    // 1. Values
    expect(state.values.firstName).toBe("John");
    expect(state.values.age).toBeNull();

    // 2. Vitality (Meta)
    expect(state.vitality["f1"]).toEqual(
      expect.objectContaining({
        dirty: false,
        touched: false,
        focused: false,
      })
    );

    // 3. Validity
    expect(state.validity["f1"]).toEqual(
      expect.objectContaining({
        valid: true,
        errors: [],
      })
    );

    // 4. Visibility
    expect(state.visibility["f1"]).toBe(true);
  });

  it("should update values and vitality on setRawValue", () => {
    const manager = new StateManager(normalizedDef);

    manager.setRawValue("firstName", "Jane");

    expect(manager.state.values.firstName).toBe("Jane");

    // Manually update vitality to simulate runtime behavior
    manager.setVitality("f1", { dirty: true });
    expect(manager.state.vitality["f1"].dirty).toBe(true);
  });

  it("should update vitality specifically using setVitality", () => {
    const manager = new StateManager(normalizedDef);

    manager.setVitality("f1", { touched: true, focused: true });

    expect(manager.state.vitality["f1"].touched).toBe(true);
    expect(manager.state.vitality["f1"].focused).toBe(true);
  });

  it("should update vitality using setVitality and trigger notification", () => {
    const manager = new StateManager(normalizedDef);
    const listener = vi.fn();
    manager.subscribe(listener);

    manager.setVitality("f1", { touched: true });

    expect(manager.state.vitality["f1"].touched).toBe(true);
    expect(listener).toHaveBeenCalled();
  });

  it("should notify subscribers on change", () => {
    const manager = new StateManager(normalizedDef);
    const listener = vi.fn();

    manager.subscribe(listener);

    manager.setVitality("f1", { touched: true }); // setVitality calls notify()

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(manager.state);
  });

  it("should maintain immutability of state values", () => {
    const manager = new StateManager(normalizedDef);
    manager.setRawValue("firstName", "Changed");
    expect(manager.values.firstName).toBe("Changed");
  });
});
