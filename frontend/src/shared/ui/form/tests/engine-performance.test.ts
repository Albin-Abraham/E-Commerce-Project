import { describe, expect, it, vi } from "vitest";

import { FormCore } from "@form-core/engine";
import { normalizeFormDefinition } from "@form-core/modules/field-registry";

describe("Zenith Engine Performance Audit", () => {
  const generateDeepForm = (depth: number, fieldsPerLevel: number) => {
    const fields: any[] = [];
    for (let i = 0; i < fieldsPerLevel; i++) {
      // Alternate between Input and Static for every 2nd field
      const isStatic = i % 2 === 0;
      fields.push({
        id: `field_${depth}_${i}`,
        name: `field_${depth}_${i}`,
        type: isStatic ? "header" : "text", // "header" is Static, "text" is Input
        label: `Field ${depth}-${i}`,
      });
    }

    if (depth > 0) {
      fields.push({
        id: `section_${depth}`,
        type: "section", // Structure
        label: `Section ${depth}`,
        fields: generateDeepForm(depth - 1, fieldsPerLevel),
      });
    }
    return fields;
  };

  const largeFormDefinition: any = {
    id: "bench-form",
    title: "Benchmark Form",
    sections: [
      {
        id: "main",
        fields: generateDeepForm(10, 20), // 200 fields total
      },
    ],
  };

  it("quantifies normalization and state initialization overhead", () => {
    // 1. Normalization Bench
    const startNorm = performance.now();
    normalizeFormDefinition(largeFormDefinition);
    const endNorm = performance.now();
    const normDuration = endNorm - startNorm;

    // 2. State Initialization Bench (with Pruning)
    const startInit = performance.now();
    const form = new FormCore(largeFormDefinition);
    const endInit = performance.now();
    const initDuration = endInit - startInit;

    // 3. SetValue Latency (The "Input Lag" check)
    const startSet = performance.now();
    for (let i = 0; i < 100; i++) {
      form.setValue("field_0_1", `val_${i}`); // field_0_1 is Input
    }
    const endSet = performance.now();
    const setLatency = (endSet - startSet) / 100;

    const totalFields = Object.keys(form.definition.fields).length;
    const validityCount = Object.keys(form.validity).length;
    const vitalityCount = Object.keys(form.vitality).length;
    const visibilityCount = Object.keys(form.visibility).length;

    console.log(`[Performance Audit] 211-Field Form Results:`);
    console.log(`- Normalization: ${normDuration.toFixed(4)}ms`);
    console.log(`- Initialization: ${initDuration.toFixed(4)}ms`);
    console.log(`- SetValue Latency: ${setLatency.toFixed(4)}ms/op`);
    console.log(
      `- State Pruning: ${validityCount}/${totalFields} entries (Validity/Total)`
    );

    expect(normDuration).toBeLessThan(50); // Goal: <50ms for 200 fields
    expect(initDuration).toBeLessThan(100); // Goal: <100ms for full engine boot
    expect(setLatency).toBeLessThan(5); // Goal: <5ms for reactive update

    // Vitality Pruning Verification:
    // Only 'input' category fields (and repeaters) should have validity/vitality slots.
    // Our form has ~100 inputs out of 211 total fields.
    expect(validityCount).toBeLessThan(totalFields * 0.6);
    expect(vitalityCount).toBeLessThan(totalFields * 0.6);
    expect(visibilityCount).toBe(totalFields); // Visibility must be universal
  });

  it("verifies repeater validity rollup (Correctness Task #1)", async () => {
    vi.useFakeTimers();
    const repeaterDef: any = {
      id: "repeater-form",
      sections: [
        {
          id: "sec",
          fields: [
            {
              id: "users",
              name: "users",
              type: "repeater",
              fields: [
                { id: "email", name: "email", type: "text", required: true },
              ],
            },
          ],
        },
      ],
    };

    const form = new FormCore(
      repeaterDef,
      { users: [{ email: "valid@test.com" }] },
      { validationMode: "onChange", validationDebounceMs: 10 }
    );

    // Initial state: valid
    expect(form.isValid).toBe(true);

    // Set invalid value in repeater child
    await form.setValue("users[0].email", "");

    // Advance timers to trigger debounced validation
    await vi.advanceTimersByTimeAsync(20);

    // Check rollup
    expect(form.validity["users[0].email"]).toBeDefined();
    expect(form.validity["users[0].email"].valid).toBe(false);
    expect(form.validity["users"].valid).toBe(false);

    // Fix value
    await form.setValue("users[0].email", "fixed@test.com");
    await vi.advanceTimersByTimeAsync(20);

    expect(form.validity["users[0].email"].valid).toBe(true);
    expect(form.validity["users"].valid).toBe(true);
    expect(form.isValid).toBe(true);

    vi.useRealTimers();
  });
});
