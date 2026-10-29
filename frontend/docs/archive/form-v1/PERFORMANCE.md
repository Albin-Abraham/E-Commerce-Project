# Performance Budgets & Benchmarks

This document defines performance budgets, benchmarking methodology, and optimization strategies for the Form Engine.

---

## 1. Performance Budgets

### Core Operations (Must Meet)

| Operation | Budget | Measurement | Rationale |
|-----------|--------|-------------|-----------|
| `setValue()` sync write | ≤ 1ms | Phase 1 only (no async) | Controlled input responsiveness |
| `setValue()` full pipeline | ≤ 16ms | Phases 0-2 complete | Single frame budget (60fps) |
| Initial engine creation | ≤ 50ms | Constructor return | App startup |
| Visibility evaluation (1000 fields) | ≤ 100ms | `evaluateVisibility()` | Large forms |
| Validation (single field) | ≤ 5ms | `validateField()` | Real-time feedback |
| Validation (full form, 100 fields) | ≤ 50ms | `validateFields()` | Submit latency |
| IR compilation | ≤ 20ms | `compileToIR()` | Authoring feedback |
| First render (100 fields) | ≤ 100ms | React mount | Perceived performance |

### Memory Budgets

| Metric | Budget | Notes |
|--------|--------|-------|
| Base engine (empty) | ≤ 2MB | Heap snapshot |
| Engine + 100 fields | ≤ 10MB | Including subscriptions |
| Engine + 1000 fields | ≤ 50MB | Large forms |
| Subscription leak | 0 bytes/test | After destroy() |

### Render Budgets

| Scenario | Budget | Notes |
|----------|--------|-------|
| Single field update | ≤ 2ms | React commit phase |
| 100 field form update | ≤ 16ms | Batched updates |
| Visibility toggle (50 fields) | ≤ 8ms | With cascade |

---

## 2. Benchmarking Methodology

### Test Environment
- Node.js 20+ (for headless benchmarks)
- Chrome 120+ (for React rendering benchmarks)
- Dedicated performance test runner
- Isolated from other tests

### Measurement Tools
- `performance.now()` for microbenchmarks
- `performance.mark()` / `measure()` for phases
- React DevTools Profiler for render times
- `vitest --benchmark` for CI integration

### Statistical Rigor
- Minimum 100 iterations per benchmark
- Report: min, max, mean, median, p95, p99
- Warmup: 10 iterations before measurement
- GC between runs: `global.gc()` if available

---

## 3. Benchmark Suites

### 3.1 Headless Engine Benchmarks (`tests/performance/engine.bench.ts`)

```typescript
// Key benchmarks to implement:

// 1. setValue sync write
bench("setValue sync write (1 field)", () => {
  form.setValue("field1", "value");
});

// 2. setValue full pipeline (onChange mode)
bench("setValue full pipeline (onChange)", async () => {
  await form.setValue("field1", "value");
});

// 3. setValue with validation (onBlur mode)
bench("setValue + blur validation", async () => {
  await form.setValue("field1", "value");
  await form.execution.handleFieldBlur("field1_id");
});

// 4. Visibility evaluation
bench("visibility 100 fields", () => {
  form.visibilityEngine.evaluateVisibility(form.values);
});

bench("visibility 1000 fields", () => {
  form.visibilityEngine.evaluateVisibility(form.values);
});

// 5. Validation
bench("validateField (simple)", () => {
  form.validator.validateField("field1_id");
});

bench("validateFields (100 fields)", () => {
  form.validator.validateFields(allFieldIds);
});

// 6. Middleware execution
bench("middleware chain (5 sync)", async () => {
  await form.execution.runMiddleware("field1_id");
});

bench("middleware chain (5 async)", async () => {
  await form.execution.runMiddleware("field1_id");
});

// 7. Computed fields
bench("computed field (3 deps)", () => {
  form.execution.recomputeComputedFields("depField");
});

// 8. Remote options trigger
bench("remoteOptions handleValueChange", () => {
  form.remoteOptions.handleValueChange("watchField_id");
});
```

### 3.2 React Rendering Benchmarks (`tests/performance/render.bench.tsx`)

```typescript
// Using React DevTools Profiler API or custom wrapper

bench("mount 100 field form", () => {
  render(<Form definition={schema100} />);
});

bench("mount 500 field form", () => {
  render(<Form definition={schema500} />);
});

bench("update 1 field in 100", () => {
  const { rerender } = render(<Form definition={schema100} />);
  act(() => form.setValue("field1", "new"));
  rerender(<Form definition={schema100} />);
});

bench("visibility toggle 50 fields", () => {
  const { rerender } = render(<Form definition={schemaWithVisibility} />);
  act(() => form.setValue("toggleField", "show"));
  rerender(<Form definition={schemaWithVisibility} />);
});
```

### 3.3 Compilation Benchmarks

```typescript
bench("compile Contract (50 fields)", () => {
  compileContractToFormDefinition(contract50);
});

bench("compile Entity (50 fields)", () => {
  compileEntityToFormDef(entity50, "form", "Submit");
});

bench("IR validation (100 fields)", () => {
  validateIR(ir100);
});
```

---

## 4. CI Integration

### GitHub Actions Workflow (`.github/workflows/performance.yml`)

```yaml
name: Performance Regression

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  performance:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - name: Run headless benchmarks
        run: pnpm vitest run tests/performance/engine.bench.ts
      - name: Run render benchmarks
        run: pnpm vitest run tests/performance/render.bench.tsx
      - name: Check budgets
        run: pnpm vitest run tests/performance/budgets.test.ts
      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: performance-results
          path: benchmark-results/
```

### Budget Enforcement Test

```typescript
// tests/performance/budgets.test.ts
import { expect } from "vitest";
import { runBenchmarks } from "./runner";

const BUDGETS = {
  "setValue sync": 1,
  "setValue pipeline (onChange)": 16,
  "visibility 100": 100,
  "visibility 1000": 500,
  "validateField": 5,
  "validateFields 100": 50,
  "compile Contract 50": 20,
  "IR validation 100": 10,
};

for (const [name, budgetMs] of Object.entries(BUDGETS)) {
  it(`${name} ≤ ${budgetMs}ms (p95)`, async () => {
    const result = await runBenchmark(name);
    expect(result.p95).toBeLessThanOrEqual(budgetMs);
  });
}
```

---

## 5. Optimization Strategies

### 5.1 Engine-Level

| Optimization | Implementation | Impact |
|--------------|----------------|--------|
| O(1) field lookup | `FieldRegistry` with Map | `setValue` resolution |
| Targeted visibility | Dependency graph | O(D) not O(N) |
| Batched notifications | `stateManager.batch()` | Single render per change |
| Memoized conditions | `ConditionProxy` cache | Re-evaluation speed |
| Selective subscription | Field-level `notifyField()` | Subscriber granularity |

### 5.2 React Integration

| Optimization | Implementation | Impact |
|--------------|----------------|--------|
| `usePrimitiveRuntime()` | Context, not props | No prop drilling |
| `withAtom` memo | `React.memo` + stable keys | Re-render reduction |
| `FormRuntimeProvider` | Single provider | Context consolidation |
| `LazyRegistryStore` | Code splitting | Bundle size |

### 5.3 Compilation

| Optimization | Implementation | Impact |
|--------------|----------------|--------|
| IR caching | Memoized compilation | Repeat compiles |
| Schema normalization | Single-pass fusion | Compile time |
| Tree shaking | ESM + sideEffects:false | Bundle size |

---

## 6. Profiling Guide

### Chrome DevTools
1. Open Performance tab
2. Record during form interaction
3. Look for:
   - Long tasks (>50ms)
   - Script evaluation time
   - Render duration
   - GC pauses

### React DevTools Profiler
1. Enable "Record why each component rendered"
2. Profile form interaction
3. Check for:
   - Components rendering unnecessarily
   - Expensive render functions
   - Context causing cascades

### Custom Metrics
```typescript
// In FormCore for production monitoring
form.subscribe((state) => {
  metrics.histogram("form.setValue.latency", state.performance.lastSetValueMs);
  metrics.histogram("form.visibility.duration", state.performance.lastVisibilityMs);
  metrics.histogram("form.validation.duration", state.performance.lastValidationMs);
});
```

---

## 7. Regression Detection

### Alerting Thresholds
| Metric | Warning | Critical |
|--------|---------|----------|
| p95 setValue pipeline | > 12ms | > 16ms |
| p95 visibility 100 | > 80ms | > 100ms |
| p99 memory growth | > 20% | > 50% |
| Bundle size (form) | > 50KB | > 100KB |

### Bisect Process
1. CI fails on performance budget
2. `git bisect` with `pnpm vitest run tests/performance/budgets.test.ts`
3. Identify commit
4. Analyze flamegraph before/after

---

## 8. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-10-12 | Initial budgets and methodology |

---

## Appendix: Running Benchmarks Locally

```bash
# Headless engine benchmarks
pnpm vitest run tests/performance/engine.bench.ts

# Render benchmarks (requires Chrome)
pnpm vitest run tests/performance/render.bench.tsx

# All with budget check
pnpm vitest run tests/performance/

# Generate flamegraph
pnpm vitest run tests/performance/engine.bench.ts -- --prof
```