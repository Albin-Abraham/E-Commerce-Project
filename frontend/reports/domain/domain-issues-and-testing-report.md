# 🛡️ Domain Issues, Bugs & Easy Testing Playbook

> **Scope**: Authoritative reference cataloging domain-layer bugs, architectural anti-patterns, resolutions, and fast testing recipes for the Zenos Platform frontend.

---

## 📌 Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Catalog of Domain Bugs, Anti-Patterns & Resolutions](#2-catalog-of-domain-bugs-anti-patterns--resolutions)
   - [Bug 1: Backend Detail Envelope Unwrapping Inconsistency](#bug-1-backend-detail-envelope-unwrapping-inconsistency)
   - [Bug 2: JSON.stringify / JSON.parse in Browser Query Parameters](#bug-2-jsonstringify--jsonparse-in-browser-query-parameters)
   - [Bug 3: Rogue Layout Component vs Schema Definition (SplitLayoutRenderer)](#bug-3-rogue-layout-component-vs-schema-definition-splitlayoutrenderer)
   - [Bug 4: Tight Coupling between UI Primitives and React Router](#bug-4-tight-coupling-between-ui-primitives-and-react-router)
   - [Bug 5: Liskov Substitution Principle Violation & Recursive Stack Overflow](#bug-5-liskov-substitution-principle-violation--recursive-stack-overflow)
   - [Bug 6: Query Parameter Prototype Pollution Vulnerability](#bug-6-query-parameter-prototype-pollution-vulnerability)
   - [Bug 7: Stale Snapshot & Infinite Re-render Loop in Table Writers](#bug-7-stale-snapshot--infinite-re-render-loop-in-table-writers)
3. [Easy Testing Playbook & Developer Recipes](#3-easy-testing-playbook--developer-recipes)
   - [Recipe A: Headless Form + URL Sync Testing (Zero Mocks, Zero DOM)](#recipe-a-headless-form--url-sync-testing-zero-mocks-zero-dom)
   - [Recipe B: Table Controller & Query Param State Testing](#recipe-b-table-controller--query-param-state-testing)
   - [Recipe C: MSW Mocking for Heterogeneous Backend Envelopes](#recipe-c-msw-mocking-for-heterogeneous-backend-envelopes)
   - [Recipe D: UI Driver Testing with BaseDriver](#recipe-d-ui-driver-testing-with-basedriver)
4. [Fast Testing Commands & CI Automation](#4-fast-testing-commands--ci-automation)

---

## 1. Executive Summary

This report documents the architectural flaws, bugs, and remediation strategies identified across the **Domain**, **Application**, **Interface**, and **Infrastructure** layers of the frontend codebase. Each entry details:
- **The Symptom & Error**: How the issue manifested in runtime and test environments.
- **The Root Cause**: Architectural breakdown adhering to Clean Architecture & DDD principles.
- **The Implemented Solution**: The design pattern and refactored code.
- **Easy Testing Strategy**: Deterministic, fast test recipes to prevent future regression.

---

## 2. Catalog of Domain Bugs, Anti-Patterns & Resolutions

---

### Bug 1: Backend Detail Envelope Unwrapping Inconsistency

#### 🔴 Symptom
Workspace selection and dropdown options failed to load when receiving backend responses formatted as:
```json
{
  "status": 200,
  "message": "Request successful",
  "detail": [
    { "id": "iwPuFpauWjEzXNTLnjvRUxKOaJhPCcit", "name": "System", "code": "sys-001" }
  ]
}
```
Remote options managers threw `Cannot read property 'map' of undefined` or received empty arrays because consumers expected `{ data: [...] }` or raw arrays.

#### 🧠 Root Cause
`HttpTransformer` and API clients lacked a normalized unwrapping contract. Some endpoints returned `{ detail: [...] }`, others `{ data: [...] }`, and legacy endpoints returned bare arrays `[...]`.

#### 🟢 Architectural Solution
Created [`HttpResponseFactory`](file:///home/albin-abraham-george/Project/react-vite/frontend/src/core/http/http.response.factory.ts) and unified [`HttpTransformer`](file:///home/albin-abraham-george/Project/react-vite/frontend/src/core/http/http.transformer.ts):
```typescript
// Automatically extracts data from detail, data, or raw array
export function unwrapApiResponse<T>(payload: any): T {
  if (!payload || typeof payload !== "object") return payload;
  if ("detail" in payload && payload.detail !== undefined) return payload.detail as T;
  if ("data" in payload && payload.data !== undefined) return payload.data as T;
  return payload as T;
}
```

#### 🧪 Easy Testing Recipe
Use MSW Scoped Resource Handler to verify envelope resilience:
```typescript
// src/features/auth/__tests__/auth-and-workspace.msw.test.ts
it("successfully unwraps backend detail envelope", async () => {
  server.use(
    http.get("/api/v1/sessions/user/companies/", () => {
      return HttpResponse.json({
        status: 200,
        message: "Request successful",
        detail: [{ id: "c1", name: "Acme Corp", code: "acme-01" }],
      });
    })
  );

  const companies = await orgApi.getCompanies();
  expect(companies).toHaveLength(1);
  expect(companies[0].name).toBe("Acme Corp");
});
```

---

### Bug 2: `JSON.stringify` / `JSON.parse` in Browser Query Parameters

#### 🔴 Symptom
Query parameter synchronization dumped stringified JSON into browser URLs:
```
?filter=%7B%22status%22%3A%22active%22%7D&tags=%5B%22urgent%22%2C%22review%22%5D
```
URLs were human-unreadable, non-idiomatic, broke SEO/REST standards, and relied on brittle `try { JSON.parse(val) } catch` fallbacks.

#### 🧠 Root Cause
Lack of a dedicated URL query serializer. Primitives and objects were blindly serialized via native `JSON.stringify`.

#### 🟢 Architectural Solution
Implemented [`url-serializer.ts`](file:///home/albin-abraham-george/Project/react-vite/frontend/src/core/router/utils/url-serializer.ts) powered by `qs`:
- **Nested Objects**: Formatted cleanly using bracket notation: `filter[status]=active&filter[minPrice]=100`.
- **Arrays**: Serialized as repeated entries (`tags=urgent&tags=review`) or comma-separated lists (`tags=urgent,review`).
- **Safe Primitive Decoding**: Coerces `"true"` $\rightarrow$ `true`, numbers $\rightarrow$ `number`, while preserving identifier codes (`"007"` remains string `"007"`).
- **Preserves Colons**: Configured with `encodeValuesOnly: true` so namespaced keys like `orders:page=1` remain readable without `%3A`.

#### 🧪 Easy Testing Recipe
```typescript
// Fast in-memory test without DOM
it("serializes nested filters without JSON.stringify", () => {
  const params = serializeObjectToEntries({
    filter: { status: "active", count: 10 },
  });
  expect(params).toEqual({
    "filter[status]": "active",
    "filter[count]": "10",
  });
  expect(JSON.stringify(params)).not.toContain("%7B");
});
```

---

### Bug 3: Rogue Layout Component vs Schema Definition (`SplitLayoutRenderer`)

#### 🔴 Symptom
A rogue custom component `<SplitLayoutRenderer>` was introduced that bypassed the schema-driven Form engine, hardcoding layout logic outside the `FormDefinition` schema contract.

#### 🧠 Root Cause
Violation of DDD and Schema-Driven UI principles: Layout and responsive span rules belong in `FormDefinition` container and field definitions (`colSpan`), not hardcoded wrapper components.

#### 🟢 Architectural Solution
Enforced strict compliance:
1. Eliminated `SplitLayoutRenderer`.
2. Created [`split-shell-factory.ts`](file:///home/albin-abraham-george/Project/react-vite/frontend/src/shared/ui/form/shell/split-shell-factory.ts): Maps split layout containers directly to 12-column Grid primitives (`colSpan: { base: 12, lg: 5 }` and `colSpan: { base: 12, lg: 7 }`).
3. Handled responsive columns natively via `FormShell.tsx`.

#### 🧪 Easy Testing Recipe
Verify layout fidelity through [`LoginPortal.test.tsx`](file:///home/albin-abraham-george/Project/react-vite/frontend/src/shared/testing/__tests__/LoginPortal.test.tsx):
```bash
npx vitest run src/shared/testing/__tests__/LoginPortal.test.tsx
```

---

### Bug 4: Tight Coupling between UI Primitives and React Router

#### 🔴 Symptom
Table and form components directly imported `useSearchParams` and `useLocation` from `react-router-dom`. When tested in Node/Vitest headless environments or non-router contexts, tests crashed with:
`Error: useSearchParams() may be used only in the context of a <Router> component.`

#### 🧠 Root Cause
Violation of Dependency Inversion Principle (DIP): High-level UI and domain modules depended directly on concrete third-party router libraries.

#### 🟢 Architectural Solution
Created the universal Port-and-Adapter architecture:
- **Port Contract**: [`PlatformUrlPort`](file:///home/albin-abraham-george/Project/react-vite/frontend/src/core/router/ports/PlatformUrlPort.ts) (`get`, `getAll`, `snapshot`, `set`, `delete`).
- **Concrete Adapters**: [`PlatformUrlAdapters`](file:///home/albin-abraham-george/Project/react-vite/frontend/src/core/router/adapters/PlatformUrlAdapters.ts):
  - `useReactRouter`: Ref-stabilized, safe router adapter with `useInRouterContext` guard.
  - `useNative`: Pure `window.location` adapter.
  - `createMock`: 100% headless in-memory adapter for Vitest.
- **Unification**: [`TableUrlPort`](file:///home/albin-abraham-george/Project/react-vite/frontend/src/shared/ui/table/url/TableUrlPort.ts) extends `PlatformUrlPort`.

#### 🧪 Easy Testing Recipe
```typescript
it("tests URL synchronization completely headless without MemoryRouter", () => {
  const mockPort = PlatformUrlAdapters.createMock({ page: "1", sort: "name:asc" });
  mockPort.set({ page: "2" });
  expect(mockPort.get("page")).toBe("2");
  expect(mockPort.get("sort")).toBe("name:asc");
});
```

---

### Bug 5: Liskov Substitution Principle Violation & Recursive Stack Overflow

#### 🔴 Symptom
Initializing `Form` in React components caused `RangeError: Maximum call stack size exceeded`.

#### 🧠 Root Cause
`Form` extended `FormCore` and overrode `getComponentProps()`. The `ReactFormAdapter` held a reference to `this.core` (the `Form` subclass), which called back into the override, creating infinite mutual recursion.

#### 🟢 Architectural Solution
Refactored to **Composition over Inheritance**:
```typescript
export class Form<T> implements IFormCore<T> {
  private readonly core: FormCore<T>;
  private readonly adapter: ReactFormAdapter<T>;

  constructor(definition: FormDefinition, initialValues?: Partial<T>) {
    this.core = new FormCore<T>(definition, initialValues);
    this.adapter = new ReactFormAdapter<T>(this.core); // Passes inner engine, not self!
  }
}
```

---

### Bug 6: Query Parameter Prototype Pollution Vulnerability

#### 🔴 Symptom
Parsing deep query strings (`__proto__[isAdmin]=true`) could inject arbitrary properties into the global `Object.prototype`.

#### 🧠 Root Cause
Unsanitized recursive object assignment during query string deserialization.

#### 🟢 Architectural Solution
Enforced `allowPrototypes: false` in `qs.parse` configuration within [`url-serializer.ts`](file:///home/albin-abraham-george/Project/react-vite/frontend/src/core/router/utils/url-serializer.ts).

#### 🧪 Easy Testing Recipe
```typescript
it("guards against prototype pollution", () => {
  const malicious = "__proto__[isAdmin]=true&constructor[prototype][polluted]=yes";
  parseQuery(malicious);
  expect((Object.prototype as any).isAdmin).toBeUndefined();
  expect((Object.prototype as any).polluted).toBeUndefined();
});
```

---

### Bug 7: Stale Snapshot & Infinite Re-render Loop in Table Writers

#### 🔴 Symptom
Table filters triggered an infinite render loop when updating search parameters:
`writer calls setParams → URL changes → new location → adapter identity changes → writer re-runs → repeat`.

#### 🧠 Root Cause
Adapter methods captured transient `location` objects by closure value, forcing hook re-evaluations.

#### 🟢 Architectural Solution
Ref-stabilization inside [`TableUrlAdapters`](file:///home/albin-abraham-george/Project/react-vite/frontend/src/shared/ui/table/url/adapters/TableUrlAdapters.ts) and [`PlatformUrlAdapters`](file:///home/albin-abraham-george/Project/react-vite/frontend/src/core/router/adapters/PlatformUrlAdapters.ts):
- Closures read from `locationRef.current` and `navigateRef.current`.
- Memoized with empty dependency arrays `[]` (stable for component lifetime).
- Debounced by 150–300ms to prevent browser history thrashing.

---

## 3. Easy Testing Playbook & Developer Recipes

### Recipe A: Headless Form + URL Sync Testing (Zero Mocks, Zero DOM)
Use this recipe to test form filter persistence without rendering React components:
```typescript
import { describe, expect, it } from "vitest";
import { Form } from "@ui/form/core/form";
import { PlatformUrlAdapters } from "@core/router/adapters/PlatformUrlAdapters";
import { useFormUrlSync } from "@ui/form/hooks/useFormUrlSync";
import { renderHook, act } from "@testing-library/react";

describe("Form URL Sync Testing", () => {
  it("hydrates and syncs values cleanly", async () => {
    const port = PlatformUrlAdapters.createMock({ status: "active", category: "shoes" });
    const form = new Form({
      id: "product-filter",
      fields: [{ id: "status", type: "text" }, { id: "category", type: "text" }]
    });

    renderHook(() => useFormUrlSync({ form, port }));
    await new Promise((r) => setTimeout(r, 50));

    expect(form.values.status).toBe("active");
    expect(form.values.category).toBe("shoes");
  });
});
```

---

### Recipe B: Table Controller & Query Param State Testing
Test ZenithTable pagination, sorting, and filtering in complete isolation:
```typescript
import { TableUrlAdapters } from "@ui/table/url/adapters/TableUrlAdapters";
import { ParsePipeline } from "@ui/table/url/ParsePipeline";
import { TableUrlKeyResolver } from "@ui/table/url/TableUrlKeyResolver";

it("parses table URL parameters with custom namespace", () => {
  const adapter = TableUrlAdapters.createMock({
    "orders:page": "2",
    "orders:sort": "total:desc",
    "orders:filter": "status:completed"
  });

  const resolver = new TableUrlKeyResolver({ id: "orders", features: { filtering: true } });
  const pipeline = new ParsePipeline(adapter.snapshot(), resolver, { defaults: { page: 0, size: 20 } });
  const result = pipeline.extractAll();

  expect(result.pageIndex).toBe(2);
  expect(result.sorting).toEqual([{ id: "total", desc: true }]);
  expect(result.filters).toEqual([{ id: "status", value: "completed" }]);
});
```

---

### Recipe C: MSW Mocking for Heterogeneous Backend Envelopes
Intercept network calls without spinning up real backend services:
```typescript
import { http, HttpResponse } from "msw";
import { server } from "@shared/testing/msw/server";

it("mocks endpoint with MSW", async () => {
  server.use(
    http.get("/api/v1/products", () => {
      return HttpResponse.json({
        status: 200,
        message: "OK",
        detail: [{ id: "p1", name: "Product A", price: 99.99 }]
      });
    })
  );

  const res = await fetch("/api/v1/products").then((r) => r.json());
  expect(res.detail[0].name).toBe("Product A");
});
```

---

### Recipe D: UI Driver Testing with `BaseDriver`
Use the Page Object / Driver pattern to verify full UI interaction workflows:
```typescript
import { BaseDriver } from "@shared/testing/drivers/BaseDriver";

class FormDriver extends BaseDriver {
  async fillField(selector: string, value: string) {
    const input = await this.findByRole("textbox", { name: selector });
    await this.user.type(input, value);
  }
}
```

---

## 4. Fast Testing Commands & CI Automation

| Action | Command | Typical Duration |
| :--- | :--- | :--- |
| **Run All Monorepo Tests** | `npx vitest run` | ~75s (1,313 tests) |
| **Run Single Test File** | `npx vitest run <path/to/test.ts>` | ~1.2s |
| **Run URL & Router Tests** | `npx vitest run src/core/router/` | ~2.1s |
| **Run Table URL Suites** | `npx vitest run src/shared/ui/table/url/` | ~1.8s |
| **Run MSW Integration Tests** | `npx vitest run src/features/auth/__tests__/` | ~1.4s |
| **Regenerate Test Context Report** | `npm run test:report:context` | ~0.5s |
| **Typecheck Without Emit** | `npm run typecheck` | ~3.0s |

---

### 📝 Summary Checklist for PR Reviewers

Before merging code into `main` or release branches:
- [x] Does the code avoid native `JSON.stringify` / `JSON.parse` in query parameters?
- [x] Do URL-interacting components depend on `PlatformUrlPort` rather than direct router hooks?
- [x] Does the API response parsing route through `HttpResponseFactory` for envelope unwrapping?
- [x] Are split containers rendered using 12-column Grid `colSpan` rather than custom wrapper components?
- [x] Does `npm run test:report:context` succeed with 100% passing test files?
