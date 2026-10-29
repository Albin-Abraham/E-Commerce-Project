import type { FormDefinition } from "../domain";
import { describe, expect, it, vi } from "vitest";

import { FormCore } from "../engine";
import type { ValidationAdapter } from "../validation-adapter";

describe("Validation Adapter Pattern", () => {
  const simpleDef: FormDefinition = {
    id: "val-test",
    title: "Validation Test",
    sections: [
      {
        id: "s1",
        title: "Section 1",
        fields: [
          {
            id: "f1",
            name: "email",
            type: "text",
            label: "Email",
            required: true,
          },
        ],
      },
    ],
  };

  it("should use default internal validation if no adapter is provided", async () => {
    const engine = new FormCore(
      simpleDef,
      {},
      { validationMode: "onChange", validationDebounceMs: 0 }
    );

    // Initial state: Invalid (required field is null)
    await engine.validateFields(["f1"]);
    expect(engine.validity["f1"].valid).toBe(false);
    expect(engine.validity["f1"].errors?.[0].code).toBe("required");

    // Set value
    await engine.setValue("email", "test@example.com");
    expect(engine.validity["f1"].valid).toBe(true);
  });

  it("should use custom adapter when provided", async () => {
    const mockAdapter: ValidationAdapter = {
      validateField: vi.fn().mockImplementation((field, value) => {
        if (value === "error") {
          return [
            { code: "custom-error", message: "Custom Fail", fieldId: field.id },
          ];
        }
        return [];
      }),
      validateForm: vi.fn().mockReturnValue({}),
    };

    const engine = new FormCore(
      simpleDef,
      {},
      {
        validatorAdapter: mockAdapter,
        validationMode: "onChange",
        validationDebounceMs: 0,
      }
    );

    // Trigger validation
    await engine.setValue("email", "error");

    expect(mockAdapter.validateField).toHaveBeenCalled();
    expect(engine.validity["f1"].valid).toBe(false);
    expect(engine.validity["f1"].errors?.[0].code).toBe("custom-error");

    // Trigger success
    await engine.setValue("email", "success");
    expect(engine.validity["f1"].valid).toBe(true);
  });

  it("should handle async validation adapters", async () => {
    const asyncAdapter: ValidationAdapter = {
      validateField: async (field, value) => {
        await new Promise((r) => setTimeout(r, 10)); // delay
        if (value === "slow") {
          return [
            { code: "async-error", message: "Too slow", fieldId: field.id },
          ];
        }
        return [];
      },
      validateForm: async () => ({}),
    };

    const engine = new FormCore(
      simpleDef,
      {},
      {
        validatorAdapter: asyncAdapter,
        validationMode: "onChange",
        validationDebounceMs: 0,
      }
    );

    await engine.setValue("email", "slow");
    expect(engine.validity["f1"].valid).toBe(false);
    expect(engine.validity["f1"].errors?.[0].code).toBe("async-error");
  });
});
