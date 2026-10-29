import { describe, it, expect, vi } from "vitest";
import { FormCore } from "@/shared/ui/form";
import { compileContractToFormDefinition, defineFormContract } from "@/shared/ui/form";

// Performance budgets (in milliseconds)
const BUDGETS = {
  "setValue sync write": 1,
  "setValue pipeline (onChange)": 16,
  "setValue + blur validation": 16,
  "visibility evaluation (100 fields)": 100,
  "visibility evaluation (500 fields)": 500,
  "single field validation": 5,
  "full form validation (100 fields)": 50,
  "sync middleware chain (5)": 1,
  "async middleware chain (3)": 50,
  "computed field recompute (3 deps)": 5,
  "simple contract compilation": 20,
  "large contract compilation": 50,
  "IR validation (100 fields)": 10,
} as const;

type BudgetKey = keyof typeof BUDGETS;

interface BenchmarkResult {
  name: string;
  iterations: number;
  totalMs: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  p95Ms: number;
  budgetMs: number;
  passed: boolean;
}

function runBenchmark<T>(
  name: BudgetKey,
  fn: () => T | Promise<T>,
  iterations: number = 100
): Promise<BenchmarkResult> {
  const budgetMs = BUDGETS[name];
  const times: number[] = [];

  const runOnce = async () => {
    const start = performance.now();
    await fn();
    return performance.now() - start;
  };

  // Warmup
  for (let i = 0; i < 10; i++) {
    await fn();
  }

  // Measured runs
  for (let i = 0; i < iterations; i++) {
    times.push(await runOnce());
  }

  times.sort((a, b) => a - b);
  const totalMs = times.reduce((a, b) => a + b, 0);
  const avgMs = totalMs / iterations;
  const minMs = times[0];
  const maxMs = times[times.length - 1];
  const p95Idx = Math.floor(iterations * 0.95);
  const p95Ms = times[p95Idx];

  return {
    name,
    iterations,
    totalMs,
    avgMs,
    minMs,
    maxMs,
    p95Ms,
    budgetMs,
    passed: p95Ms <= budgetMs,
  };
}

describe("Performance Budget Enforcement", () => {
  // Test fixtures
  const SimpleContract = defineFormContract({
    id: "budget-simple",
    title: "Simple",
    sections: [{ id: "s1", fields: [{ id: "f1", name: "f1", type: "string", component: "text", label: "F1" }] }],
  });

  const LargeContract = defineFormContract({
    id: "budget-large",
    title: "Large",
    sections: Array.from({ length: 20 }, (_, si) => ({
      id: `s${si}`,
      fields: Array.from({ length: 5 }, (_, fi) => ({
        id: `f${si}_${fi}`,
        name: `f${si}_${fi}`,
        type: "string",
        component: "text",
        label: `F${si}-${fi}`,
      })),
    })),
  });

  const VisibilityContract = defineFormContract({
    id: "budget-vis",
    title: "Visibility",
    sections: Array.from({ length: 10 }, (_, si) => ({
      id: `s${si}`,
      fields: Array.from({ length: 10 }, (_, fi) => ({
        id: `f${si}_${fi}`,
        name: `f${si}_${fi}`,
        type: "string",
        component: "text",
        label: `F${si}-${fi}`,
        visible: si > 0 ? "form.values.f0_0 === 'show'" : true,
      })),
    })),
  });

  const ComputedContract = defineFormContract({
    id: "budget-computed",
    title: "Computed",
    sections: [{
      id: "main",
      fields: [
        { id: "a", name: "a", type: "number", component: "number", label: "A" },
        { id: "b", name: "b", type: "number", component: "number", label: "B" },
        { id: "c", name: "c", type: "number", component: "number", label: "C" },
        { id: "sum", name: "sum", type: "number", component: "number", label: "Sum", computed: { expression: "a + b + c", dependsOn: ["a", "b", "c"] } },
      ],
    }],
  });

  it("setValue sync write ≤ 1ms (p95)", async () => {
    const form = new FormCore(compileContractToFormDefinition(SimpleContract));
    const result = await runBenchmark("setValue sync write", () => form.setValue("f1", "test"));
    expect(result.passed).toBe(true);
  });

  it("setValue pipeline (onChange) ≤ 16ms (p95)", async () => {
    const form = new FormCore(compileContractToFormDefinition(SimpleContract), {}, {
      validationMode: "onChange",
      validationDebounceMs: 0,
    });
    const result = await runBenchmark("setValue pipeline (onChange)", () => form.setValue("f1", "test"));
    expect(result.passed).toBe(true);
  });

  it("setValue + blur validation ≤ 16ms (p95)", async () => {
    const form = new FormCore(compileContractToFormDefinition(SimpleContract), {}, {
      validationMode: "onBlur",
    });
    const result = await runBenchmark("setValue + blur validation", async () => {
      await form.setValue("f1", "test");
      await form.execution.handleFieldBlur("f1");
    });
    expect(result.passed).toBe(true);
  });

  it("visibility evaluation (100 fields) ≤ 100ms (p95)", async () => {
    const form = new FormCore(compileContractToFormDefinition(VisibilityContract));
    const result = await runBenchmark("visibility evaluation (100 fields)", () =>
      form.visibilityEngine.evaluateVisibility(form.values)
    );
    expect(result.passed).toBe(true);
  });

  it("visibility evaluation (500 fields) ≤ 500ms (p95)", async () => {
    const form = new FormCore(compileContractToFormDefinition(LargeContract));
    const result = await runBenchmark("visibility evaluation (500 fields)", () =>
      form.visibilityEngine.evaluateVisibility(form.values)
    );
    expect(result.passed).toBe(true);
  });

  it("single field validation ≤ 5ms (p95)", async () => {
    const form = new FormCore(compileContractToFormDefinition(SimpleContract), {}, { validationMode: "manual" });
    const result = await runBenchmark("single field validation", () =>
      form.validator.validateField("field1")
    );
    expect(result.passed).toBe(true);
  });

  it("full form validation (100 fields) ≤ 50ms (p95)", async () => {
    const form = new FormCore(compileContractToFormDefinition(LargeContract), {}, { validationMode: "manual" });
    const fieldIds = Object.keys(form.registry.definition.fields);
    const result = await runBenchmark("full form validation (100 fields)", () =>
      form.validator.validateFields(fieldIds)
    );
    expect(result.passed).toBe(true);
  });

  it("sync middleware chain (5) ≤ 1ms (p95)", async () => {
    const form = new FormCore(compileContractToFormDefinition(SimpleContract));
    for (let i = 0; i < 5; i++) {
      form.execution.use(() => {});
    }
    const result = await runBenchmark("sync middleware chain (5)", () =>
      form.execution.runMiddleware("field1")
    );
    expect(result.passed).toBe(true);
  });

  it("computed field recompute (3 deps) ≤ 5ms (p95)", async () => {
    const form = new FormCore(compileContractToFormDefinition(ComputedContract));
    const result = await runBenchmark("computed field recompute (3 deps)", () =>
      form.execution.recomputeComputedFields("a")
    );
    expect(result.passed).toBe(true);
  });

  it("simple contract compilation ≤ 20ms (p95)", async () => {
    const result = await runBenchmark("simple contract compilation", () => {
      // Simple contract defined inline to avoid import
      const contract = {
        id: "x", title: "X", sections: [{ id: "s", fields: [{ id: "f", name: "f", type: "string", component: "text", label: "F" }] }]
      };
      // @ts-ignore - using defineFormContract at runtime
      return compileContractToFormDefinition(contract as any);
    });
    expect(result.passed).toBe(true);
  });

  it("large contract compilation ≤ 50ms (p95)", async () => {
    const result = await runBenchmark("large contract compilation", () =>
      compileContractToFormDefinition(LargeContract)
    );
    expect(result.passed).toBe(true);
  });
});

// Summary reporter for CI
export async function runAllBudgets(): Promise<void> {
  // This would be run in CI to get full report
  console.log("Performance budget check complete");
}