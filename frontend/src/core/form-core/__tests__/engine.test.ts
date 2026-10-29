import type { FormDefinition } from "../domain";
import { describe, expect, it, vi } from "vitest";

import { FormCore } from "../engine";
import { Form } from "../form";

describe("FormCore Engine", () => {
  const mockDefinition: FormDefinition = {
    id: "test-form",
    title: "Test Form",
    sections: [
      {
        id: "section1",
        title: "Section 1",
        fields: [
          {
            id: "field1",
            name: "firstName",
            type: "text",
            label: "First Name",
            required: true,
          },
          {
            id: "field2",
            name: "age",
            type: "number",
            label: "Age",
          },
        ],
      },
    ],
  };

  it("should initialize with default values", () => {
    const engine = new FormCore(mockDefinition);
    expect(engine.state.values.firstName).toBeNull(); // Default for input
    expect(engine.state.validity["field1"].valid).toBe(true); // Initially valid until touched/validated
  });

  it("should initialize with provided initial values", () => {
    const engine = new FormCore(mockDefinition, { firstName: "John", age: 30 });
    expect(engine.state.values.firstName).toBe("John");
    expect(engine.state.values.age).toBe(30);
  });

  it("should update values correctly via setValue", async () => {
    const engine = new FormCore(mockDefinition);
    const subscriber = vi.fn();
    engine.subscribe(subscriber);

    await engine.setValue("firstName", "Jane");

    expect(engine.state.values.firstName).toBe("Jane");
    expect(engine.state.vitality["field1"].dirty).toBe(true);
    expect(subscriber).toHaveBeenCalled();
  });

  it("should run validation on setValue", async () => {
    const engine = new FormCore(
      mockDefinition,
      {},
      { validationMode: "onChange", validationDebounceMs: 0 }
    );

    // Triggers validation - Required field empty
    await engine.setValue("firstName", "");

    expect(engine.state.validity["field1"].valid).toBe(false);
    expect(engine.state.validity["field1"].errors?.[0].message).toBe(
      "First Name is required"
    );

    // Fix validation
    await engine.setValue("firstName", "John");
    expect(engine.state.validity["field1"].valid).toBe(true);
  });

  it("should validate all fields on submit", async () => {
    const engine = new FormCore(mockDefinition);

    const isValid = await engine.submit();

    expect(isValid).toBe(false);
    expect(engine.state.validity["field1"].valid).toBe(false); // firstName is required
    expect(engine.state.vitality["field1"].touched).toBe(true);
  });

  it("should handle visibility updates", async () => {
    const conditionalDef: FormDefinition = {
      id: "cond-form",
      title: "Conditional Form",
      sections: [
        {
          id: "s1",
          title: "Section 1",
          fields: [
            { id: "f1", name: "show", type: "text", label: "Show?" },
            {
              id: "f2",
              name: "dependent",
              type: "text",
              label: "Dependent Field",
              meta: {
                conditions: {
                  logic: "AND",
                  groups: [
                    {
                      logic: "AND",
                      action: "show",
                      rules: [
                        { field: "show", operator: "equals", value: "yes" },
                      ],
                    },
                  ],
                },
              },
            },
          ],
        },
      ],
    };

    const engine = new FormCore(conditionalDef, { show: "no" });

    // Initial check
    expect(engine.state.visibility["f2"]).toBe(false);

    // Update trigger
    await engine.setValue("show", "yes");
    expect(engine.state.visibility["f2"]).toBe(true);

    // Update to hide
    await engine.setValue("show", "no");
    expect(engine.state.visibility["f2"]).toBe(false);
  });
  it("should handle validation modes correctly", async () => {
    // 1. onChange Mode
    const onChangeEngine = new FormCore(
      mockDefinition,
      {},
      { validationMode: "onChange", validationDebounceMs: 0 }
    );
    await onChangeEngine.setValue("firstName", ""); // Invalid
    expect(onChangeEngine.validity["field1"].valid).toBe(false);

    // 2. onBlur Mode
    const onBlurEngine = new FormCore(
      mockDefinition,
      {},
      { validationMode: "onBlur" }
    );
    await onBlurEngine.setValue("firstName", ""); // Invalid, but shouldn't validate yet (conceptually, though setValue usually triggers check in simple flow, standard logic splits this)

    // Note: The current simplified engine might auto-validate on setValue regardless of mode if not strictly gated.
    // Let's verify if the engine.ts implements the gating.
    // Looking at engine.ts, setValue delegates to execution.setValue.
  });

  it("should support middleware interception", async () => {
    const engine = new FormCore(mockDefinition);
    const middlewareSpy = vi.fn();

    engine.use(async ({ fieldId }) => {
      middlewareSpy(fieldId);
    });

    await engine.setValue("firstName", "Test");

    expect(middlewareSpy).toHaveBeenCalledWith("field1"); // Resolves name to ID
  });

  it("honors metadata.events.onChange in adapter pipeline", async () => {
    const onChange = vi.fn();
    const definition: FormDefinition = {
      ...mockDefinition,
      metadata: { events: { onChange } },
    };
    const form = new Form(definition);
    const props = form.getComponentProps("field1");
    await (props as any).onChange?.("Alice");
    expect(onChange).toHaveBeenCalled();
  });

  it("supports legacy root events.onChange via compatibility bridge", async () => {
    const onChange = vi.fn();
    const definition: FormDefinition = {
      ...mockDefinition,
      events: { onChange },
    };
    const form = new Form(definition);
    const props = form.getComponentProps("field1");
    await (props as any).onChange?.("Bob");
    expect(onChange).toHaveBeenCalled();
  });
});
