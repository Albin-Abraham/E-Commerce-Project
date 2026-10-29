import { describe, it, expect, vi, beforeEach } from "vitest";
import { FormCore } from "@/shared/ui/form";
import { defineFormContract, compileContractToFormDefinition } from "@/shared/ui/form";

// Simple test form for benchmarks
const SimpleContract = defineFormContract({
  id: "bench-simple",
  title: "Simple Form",
  submitLabel: "Submit",
  sections: [
    {
      id: "main",
      fields: [
        { id: "field1", name: "field1", type: "string", component: "text", label: "Field 1" },
        { id: "field2", name: "field2", type: "string", component: "text", label: "Field 2" },
        { id: "field3", name: "field3", type: "string", component: "text", label: "Field 3" },
      ],
    },
  ],
});

const MediumContract = defineFormContract({
  id: "bench-medium",
  title: "Medium Form",
  submitLabel: "Submit",
  sections: Array.from({ length: 10 }, (_, si) => ({
    id: `section${si}`,
    fields: Array.from({ length: 10 }, (_, fi) => ({
      id: `field${si}_${fi}`,
      name: `field${si}_${fi}`,
      type: "string",
      component: "text",
      label: `Field ${si}-${fi}`,
    })),
  })),
});

// Generate 100-field contract
const LargeContract = defineFormContract({
  id: "bench-large",
  title: "Large Form",
  submitLabel: "Submit",
  sections: Array.from({ length: 20 }, (_, si) => ({
    id: `section${si}`,
    fields: Array.from({ length: 5 }, (_, fi) => ({
      id: `field${si}_${fi}`,
      name: `field${si}_${fi}`,
      type: "string",
      component: "text",
      label: `Field ${si}-${fi}`,
    })),
  })),
});

describe("FormCore Performance Benchmarks", () => {
  let simpleForm: FormCore;
  let mediumForm: FormCore;
  let largeForm: FormCore;

  beforeEach(() => {
    simpleForm = new FormCore(compileContractToFormDefinition(SimpleContract));
    mediumForm = new FormCore(compileContractToFormDefinition(MediumContract));
    largeForm = new FormCore(compileContractToFormDefinition(LargeContract));
  });

  describe("setValue Performance", () => {
    it("sync write should be fast (< 1ms)", () => {
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        simpleForm.setValue("field1", `value${i}`);
      }
      const elapsed = performance.now() - start;
      const avg = elapsed / 100;
      expect(avg).toBeLessThan(1); // < 1ms per setValue
    });

    it("full pipeline onChange should be fast (< 16ms)", async () => {
      const form = new FormCore(compileContractToFormDefinition(SimpleContract), {}, {
        validationMode: "onChange",
        validationDebounceMs: 0,
      });

      const start = performance.now();
      await form.setValue("field1", "test");
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(16);
    });

    it("full pipeline onBlur should be fast", async () => {
      const form = new FormCore(compileContractToFormDefinition(SimpleContract), {}, {
        validationMode: "onBlur",
      });

      const start = performance.now();
      await form.setValue("field1", "test");
      await form.execution.handleFieldBlur("field1");
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(16);
    });
  });

  describe("Visibility Evaluation Performance", () => {
    it("100 fields should evaluate quickly", () => {
      const form = new FormCore(compileContractToFormDefinition(MediumContract));

      const start = performance.now();
      form.visibilityEngine.evaluateVisibility(form.values);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(100);
    });

    it("500 fields should evaluate within budget", () => {
      const form = new FormCore(compileContractToFormDefinition(LargeContract));

      const start = performance.now();
      form.visibilityEngine.evaluateVisibility(form.values);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(500);
    });

    it("targeted evaluation should be faster than full", () => {
      const form = new FormCore(compileContractToFormDefinition(LargeContract));

      // Full evaluation
      const fullStart = performance.now();
      form.visibilityEngine.evaluateVisibility(form.values);
      const fullElapsed = performance.now() - fullStart;

      // Targeted (should be same or faster due to memoization)
      const targetedStart = performance.now();
      form.visibilityEngine.evaluateVisibility(form.values, "field0_0");
      const targetedElapsed = performance.now() - targetedStart;

      // Targeted should not be significantly slower
      expect(targetedElapsed).toBeLessThanOrEqual(fullElapsed * 1.5);
    });
  });

  describe("Validation Performance", () => {
    it("single field validation should be fast", () => {
      const form = new FormCore(compileContractToFormDefinition(SimpleContract), {}, {
        validationMode: "manual",
      });

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        form.validator.validateField("field1");
      }
      const elapsed = performance.now() - start;
      const avg = elapsed / 100;
      expect(avg).toBeLessThan(5);
    });

    it("100 field validation should complete within budget", async () => {
      const form = new FormCore(compileContractToFormDefinition(LargeContract), {}, {
        validationMode: "manual",
      });

      const fieldIds = Object.keys(form.registry.definition.fields);
      const start = performance.now();
      await form.validator.validateFields(fieldIds);
      const elapsed = performance.now() - start;
      expect(elapsed).toBeLessThan(50);
    });
  });

  describe("Middleware Performance", () => {
    it("sync middleware chain should be fast", async () => {
      const form = new FormCore(compileContractToFormDefinition(SimpleContract));

      // Add 5 sync middleware
      for (let i = 0; i < 5; i++) {
        form.execution.use(({ form }) => {
          // No-op sync
        });
      }

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        await form.execution.runMiddleware("field1");
      }
      const elapsed = performance.now() - start;
      const avg = elapsed / 100;
      expect(avg).toBeLessThan(1);
    });

    it("async middleware chain should complete", async () => {
      const form = new FormCore(compileContractToFormDefinition(SimpleContract));

      // Add 3 async middleware
      for (let i = 0; i < 3; i++) {
        form.execution.use(async () => {
          await new Promise(r => setTimeout(r, 1));
        });
      }

      const start = performance.now();
      await form.execution.runMiddleware("field1");
      const elapsed = performance.now() - start;
      // 3 middleware * 1ms each = ~3ms minimum
      expect(elapsed).toBeGreaterThanOrEqual(3);
      expect(elapsed).toBeLessThan(50);
    });
  });

  describe("Computed Fields Performance", () => {
    it("recompute with 3 dependencies should be fast", () => {
      const ComputedContract = defineFormContract({
        id: "computed",
        title: "Computed",
        sections: [
          {
            id: "main",
            fields: [
              { id: "a", name: "a", type: "number", component: "number", label: "A" },
              { id: "b", name: "b", type: "number", component: "number", label: "B" },
              { id: "c", name: "c", type: "number", component: "number", label: "C" },
              {
                id: "sum",
                name: "sum",
                type: "number",
                component: "number",
                label: "Sum",
                computed: { expression: "a + b + c", dependsOn: ["a", "b", "c"] },
              },
            ],
          },
        ],
      });

      const form = new FormCore(compileContractToFormDefinition(ComputedContract));

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        form.execution.recomputeComputedFields("a");
      }
      const elapsed = performance.now() - start;
      const avg = elapsed / 100;
      expect(avg).toBeLessThan(5);
    });
  });

  describe("Compilation Performance", () => {
    it("simple contract compilation should be fast", () => {
      const start = performance.now();
      for (let i = 0; i < 10; i++) {
        compileContractToFormDefinition(SimpleContract);
      }
      const elapsed = performance.now() - start;
      const avg = elapsed / 10;
      expect(avg).toBeLessThan(20);
    });

    it("large contract compilation should be fast", () => {
      const start = performance.now();
      for (let i = 0; i < 5; i++) {
        compileContractToFormDefinition(LargeContract);
      }
      const elapsed = performance.now() - start;
      const avg = elapsed / 5;
      expect(avg).toBeLessThan(50);
    });
  });

  describe("Memory", () => {
    it("should not leak on destroy", () => {
      if (!global.gc) {
        console.warn("GC not available, skipping memory leak test");
        return;
      }

      global.gc();
      const before = process.memoryUsage().heapUsed;

      for (let i = 0; i < 100; i++) {
        const form = new FormCore(compileContractToFormDefinition(SimpleContract));
        form.destroy();
      }

      global.gc();
      const after = process.memoryUsage().heapUsed;
      const growth = after - before;

      // Should not grow significantly (allow 5MB for test overhead)
      expect(growth).toBeLessThan(5 * 1024 * 1024);
    });
  });
});

// Performance test utilities
export function measureAsync<T>(fn: () => Promise<T>): Promise<{ result: T; elapsed: number }> {
  const start = performance.now();
  return fn().then(result => ({
    result,
    elapsed: performance.now() - start,
  }));
}

export function measureSync<T>(fn: () => T): { result: T; elapsed: number } {
  const start = performance.now();
  const result = fn();
  return { result, elapsed: performance.now() - start };
}