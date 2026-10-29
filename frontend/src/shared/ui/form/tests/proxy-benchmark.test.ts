import { describe, expect, it } from "vitest";

import { StateManager } from "@form-core/modules/state-manager";

describe("Proxy Overhead Benchmark", () => {
  it("quantifies direct mutation vs proxy-guarded mutation overhead", () => {
    const dataSize = 1000;
    const iterations = 10000;

    // Create a large object
    const initialData: Record<string, any> = {};
    for (let i = 0; i < dataSize; i++) {
      initialData[`key_${i}`] = { value: i, nested: { val: i * 2 } };
    }

    // Create a mock NormalizedForm
    const mockDefinition: any = {
      fields: {},
      sections: {},
      rootSections: [],
      dependencyGraph: {},
      metadata: { id: "test", title: "Test" },
    };

    for (let i = 0; i < dataSize; i++) {
      mockDefinition.fields[`key_${i}`] = {
        id: `key_${i}`,
        name: `key_${i}`,
        type: "text",
        initialValue: { value: i, nested: { val: i * 2 } },
      };
    }

    const stateManager = new StateManager(mockDefinition, initialData);

    // 1. Benchmark Direct Mutation (Production mode simulation)
    const rawValues = stateManager.state.values;
    const startRaw = performance.now();
    for (let i = 0; i < iterations; i++) {
      const key = `key_${i % dataSize}`;
      rawValues[key].nested.val = i;
    }
    const endRaw = performance.now();
    const rawTime = endRaw - startRaw;

    // 2. Benchmark Proxy Mutation (Development mode simulation)
    // Deep Proxy simulation
    const createDeepProxy = (obj: any): any => {
      if (typeof obj !== "object" || obj === null) return obj;
      return new Proxy(obj, {
        get(target, prop) {
          return createDeepProxy(target[prop as string]);
        },
        set(target, prop, value) {
          target[prop as string] = value;
          return true;
        },
      });
    };

    const proxyValues = createDeepProxy(initialData);

    const startProxy = performance.now();
    for (let i = 0; i < iterations; i++) {
      const key = `key_${i % dataSize}`;
      proxyValues[key].nested.val = i;
    }
    const endProxy = performance.now();
    const proxyTime = endProxy - startProxy;

    console.log(`[Benchmark] Raw Mutation: ${rawTime.toFixed(4)}ms`);
    console.log(`[Benchmark] Proxy Mutation: ${proxyTime.toFixed(4)}ms`);
    console.log(`[Benchmark] Overhead: ${(proxyTime / rawTime).toFixed(2)}x`);

    // Basic assertion to ensure test runs
    expect(proxyTime).toBeGreaterThan(0);
  });
});
