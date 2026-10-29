# Architecture Specification: DetailRenderer & Presentation Engine

**Status:** Approved  
**Domain:** Presentation / Detail Layer  
**Architectural Framework:** Clean Architecture + DDD-lite + SOLID  

---

## 1. Executive Summary

This document specifies the architecture of the **DetailRenderer** subsystem within the ZenOS enterprise frontend platform. It evaluates the architectural relationship between **Detail Views** and **Form Architecture**, and establishes a Clean Architecture roadmap to progressively decouple entity presentation from input mutation.

---

## 2. The Domain Bounded Context: Forms vs. Details

In Domain-Driven Design (DDD), conflating two distinct problem spaces into a single model leads to bloated abstractions and high cognitive load.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        DOMAIN BOUNDARY AUDIT                           │
├───────────────────────────────────┬────────────────────────────────────┤
│         FORM BOUNDED CONTEXT      │       DETAIL BOUNDED CONTEXT       │
├───────────────────────────────────┼────────────────────────────────────┤
│ Intent: Data Capture & Mutation   │ Intent: Entity Inspection & Review │
│ Invariants: Validation pipelines  │ Invariants: Format accuracy,       │
│   (Zod/Yup), cross-field rules,   │   label projection, visual tags,   │
│   dirty/touched state tracking    │   status badges, responsive cards  │
│ DOM Representation: <form>        │ DOM Representation: <article>      │
│ Output: JSON mutation payload     │ Output: Human-scannable UI sheet   │
└───────────────────────────────────┴────────────────────────────────────┘
```

### The Architectural Problem
Historically, `DetailRenderer` was implemented as a sub-module of `src/shared/ui/form/detail/`. Because of this physical co-location, `DetailRenderer` previously wrapped every rendered sheet with `FormRuntimeProvider`, mounting **10 nested form context providers**:
1. `ActionContext`
2. `BindingContext`
3. `ControlContext`
4. `DataSourceContext`
5. `ExpressionContext`
6. `FormOrchestratorContext`
7. `LayoutContext`
8. `LayoutManagerContext`
9. `PermissionContext`
10. `ServiceProvider`

For read-only inspection views (representing >70% of enterprise UI surfaces), these 10 providers created unnecessary memory overhead, increased render depths, and tightly coupled pure presentation to the form state engine.

---

## 3. SOLID Principles Audit

### 1. Single Responsibility Principle (SRP)
- **Violation in Coupled Design**: `DetailRenderer` carried form submission lifecycles, dirty state tracking, and form theme contexts.
- **Clean Solution**: `DetailRenderer` is solely responsible for transforming a structured schema and an entity record into semantic, responsive UI components.

### 2. Open-Closed Principle (OCP)
- Detail layouts are open for extension via **Injected Slots** (`headerSlot`, `mediaSlot`, `actionSlot`, `footerSlot`, and field-level slots) without requiring modifications to the rendering core.

### 3. Liskov Substitution Principle (LSP)
- `DetailRenderer` interchangeably accepts `DetailDefinition`, `FormDefinition`, or `RenderDefinition`, normalizing them through `SchemaNormalizer` into a canonical `FormField[]` tree.

### 4. Interface Segregation Principle (ISP)
- Consumers rendering read-only detail views depend only on `DetailDefinition` and `DetailRendererProps`. They are not forced to define validation schemas (Zod/Yup), submit action handlers, or form control handles.

### 5. Dependency Inversion Principle (DIP)
- High-level presentation logic depends on the abstract schema contract (`DetailDefinition`) and pure value formatters (`DetailValueDisplay`), not on concrete form engines.
- When live interactive controls (`mode="interactive"`) or conditional rules are needed, the form engine is plugged in via a lightweight bridge adapter (`DetailRuntimeBoundary`).

---

## 4. Separation Roadmap: Moving to `src/shared/ui/detail/`

ZenOS organizes core capabilities into clean, first-class pillars:
- `src/core/form-core/` & `src/shared/ui/form/` (Data Mutation)
- `src/core/table-core/` & `src/shared/ui/table/` (Tabular Collections)
- **`src/shared/ui/detail/` (Entity Inspection & Presentation)**

### Phased Migration Strategy (Zero Breaking Changes)

```mermaid
graph TD
    subgraph Phase 1: Modular Decomposition & Decoupling [Phase 1: Modular Decomposition & Decoupling (Completed)]
        ROOT["src/shared/ui/form/detail/"]
        ROOT --> TYPES["types.ts"]
        ROOT --> COMPS["components/<br/>(Header, Cards, Rows, ValueDisplay, Actions)"]
        ROOT --> FORMAT["formatters/<br/>(display-model, isSafeUrl)"]
        ROOT --> RUNTIME["runtime/<br/>(View, Boundary, FieldList)"]
        ROOT --> BARREL["DetailRenderer.tsx & DetailRenderers.tsx"]
    end

    subgraph Phase 2: Domain Promotion [Phase 2: Domain Promotion (Physical Move)]
        NEW_DIR["src/shared/ui/detail/"]
        NEW_DIR --> NEW_MODULE["Full detail modular package"]
        
        OLD_DIR["src/shared/ui/form/index.ts"] -->|Re-exports for backward compatibility| NEW_DIR
    end
```

1. **Phase 1 (Completed)**:
   - Decomposed monolithic `DetailRenderer.tsx` into modular sub-packages: `types.ts`, `components/`, `formatters/`, and `runtime/`.
   - In `display` mode without conditional rules, `DetailRenderer` skips `FormRuntimeProvider` entirely.
   - Pure domain normalization (`normalizeDisplayModel`) and protocol security allowlist (`isSafeUrl`) implemented.
   - React 19 Storybook performance fix applied (`docs: { source: { type: "code" } }`).
2. **Phase 2 (Subsequent Optional Step)**:
   - Move directory to `src/shared/ui/detail/`.
   - Maintain re-exports in `src/shared/ui/form/` so all existing imports continue working without friction.

### Modular File Structure Reference

```text
src/shared/ui/form/detail/
├── types.ts                                # Core contracts (DetailRendererProps, DetailRendererSlots, etc.)
├── DetailRenderer.tsx                      # Root entrypoint: schema normalization & pipeline dispatch
├── index.ts                                # Public barrel export
├── components/                             # Standalone visual subcomponents (SRP)
│   ├── DetailHeader.tsx                    # Concentric hero header with icon badge & status
│   ├── DetailKeyDetailsCard.tsx            # Elevated section card container
│   ├── DetailKeyValueRow.tsx               # Two-column definition list row (<dt>/<dd>)
│   ├── DetailBottomActions.tsx             # 48px touch-safe responsive action bar
│   ├── DetailValueDisplay.tsx              # Secure value renderer with protocol allowlisting
│   └── index.ts
├── formatters/                             # Pure domain logic (0 UI/React dependencies)
│   ├── display-model.ts                    # normalizeDisplayModel, isSafeUrl, isSafeEmail, isSafePhone
│   └── index.ts
├── runtime/                                # Dual Execution Pipeline
│   ├── DetailRendererView.tsx              # Pure display projection (<article>, zero FormRuntimeProvider)
│   ├── DetailRuntimeBoundary.tsx           # Headless engine mount boundary (useForm, diff tracking)
│   ├── DetailFieldList.tsx                 # Recursive field list & layout style dispatcher
│   └── index.ts
└── DetailRenderers.tsx                     # Backward-compatible re-export barrel & dictionary
```

---

## 5. React 19 Storybook Performance Architecture

### Root Cause Analysis of Storybook Browser Freezes
During initial Storybook verification, opening `DetailRenderer` pegged Chromium to **107% CPU and 1GB memory**, crashing the browser tab.

#### Investigation via Chrome DevTools Protocol (CDP)
A CDP debugger pause captured the exact recursive call stack:
```text
prettyPrint2 (pretty-print-object)
formatComplexDataStructure (react-element-to-jsx-string)
formatPropValue (prop Name: "context")
formatProp (prop Name: "slots")
formatReactElementNode (DetailRenderer)
reactElementToJsxString
renderJsx (@storybook/addon-docs / jsxDecorator)
```

#### Why the Lockup Occurred
1. `@storybook/addon-docs` runs `jsxDecorator`, which executes `reactElementToJsxString` to generate code snippets for the Docs tab.
2. In React 19, JSX elements contain an `_owner` reference pointing to the active `FiberNode`.
3. `reactElementToJsxString`'s `simplifyNodeForStringify` only strips `_owner` from root elements and array children; it does **not** strip `_owner` from elements nested inside plain object props like `slots={{ headerSlot: <Header /> }}`.
4. As a result, `pretty-print-object` recursively traversed the entire React 19 Fiber graph (`return`, `stateNode`, `__reactContainer`, Storybook `context`), causing an unbounded traversal of circular object references.

#### Mandated Configuration Rule
In `.storybook/preview.ts` and `DetailRenderer.stories.tsx`, always configure:
```typescript
parameters: {
  docs: {
    source: {
      type: "code",
    },
  },
}
```
This instructs Storybook to display the pristine TypeScript source directly, completely eliminating dynamic Fiber traversal.

---

## 6. TypeScript Interface Contracts

```typescript
export interface DetailRendererSlots<T = any> {
  headerSlot?: React.ReactNode | React.ComponentType<{ data?: T }>;
  mediaSlot?: React.ReactNode | React.ComponentType<{ data?: T }>;
  actionSlot?: React.ReactNode | React.ComponentType<{ data?: T }>;
  footerSlot?: React.ReactNode | React.ComponentType<{ data?: T }>;
  [slotName: string]: any;
}

export interface DetailRendererProps<T extends Record<string, any> = Record<string, any>> {
  definition?: FormDefinition<T> | RenderDefinition<T> | DetailDefinition<T>;
  fields?: FormField[];
  data?: T;
  mode?: "display" | "interactive";
  layoutStyle?: "cards" | "key-value" | "flat";
  density?: "compact" | "comfortable" | "spacious";
  slots?: DetailRendererSlots<T>;
  onChange?: (fieldId: string, value: any) => void;
  className?: string;
  adapter?: StyleAdapter;
}
```

---

## 7. Comparative Architectural Strength Analysis

### Overall Architectural Evaluation
**Verdict: YES, this is an exceptionally strong architecture (Grade: A- / 91/100)**.

The combination of the **Zenith Form Architecture (v2)** and the **DetailRenderer Architecture** demonstrates state-of-the-art separation of concerns, high micro-subscription performance, and consistent design system ergonomics.

### Comparative Evaluation Matrix

| Architectural Vector | Form Architecture (v2) | DetailRenderer Architecture | Alignment / Synergy |
|---|---|---|---|
| **1. Primary Intent** | User data capture, validation, state mutation, and API submission. | Entity inspection, specification sheets, and formatted audit UI. | Complementary (Mutations vs. Inspection). |
| **2. Domain Layer (Clean Arch)** | Headless `FormCore` state machine with **zero framework imports**. | `SchemaNormalizer` and pure formatters with **zero framework imports**. | 100% Inward Dependency flow. |
| **3. State Management** | 5V State Matrix (Values, Validity, Visibility, Vitality, View). | Stateless functional projection (display) / baseline diffing (interactive). | Minimal cognitive load. |
| **4. Re-render Performance** | Micro-subscriptions (`useFieldAtom`) releasing parent form parking brake. | Single-pass functional render with zero form provider overhead in display mode. | Sub-millisecond re-render targets. |
| **5. DOM Semantics** | Accessible `<form>` container with submit/reset handlers. | Semantic `<article>` and `<section>` with zero `<form>` DOM tags. | Accessible and screen-reader safe. |
| **6. Visual Ergonomics** | The Wrapper Trinity (`OuterWrapper` + `InputWrapper` + `Box`). | Compound subcomponents (`Header`, `KeyDetailsCard`, `KeyValueRow`, `ValueDisplay`). | Consistent ZenOS token hierarchy. |
| **7. Extensibility** | Extensible registries (`defaultRegistry`, `manifestRegistry`). | Dynamic Injected Slots (`headerSlot`, `mediaSlot`, `actionSlot`, field slots). | Open for extension, closed for modification. |
| **8. Runtime Safety** | Decoupled initialData re-instantiation; persistence circuit breakers. | Static source code mode in Storybook preventing Fiber graph traversal memory leaks. | Resilient against browser lockups. |

### Architectural Strengths
1. **Domain Purity**: State and validation algorithms in `src/core/form-core` can execute in headless Node.js CLI tools and worker threads with zero browser or React dependencies.
2. **Micro-Subscription Granularity**: Eliminates React root re-renders on keystrokes by isolating state notifications to leaf atom components.
3. **Semantic Hygiene**: Guarantees read-only entity inspection pages never emit false form inputs that confuse password managers or screen readers.

### Identified Fractures & Implemented Remediations
1. **Provider Bloat Fracture (Remediated)**: `DetailRenderer` previously mounted 10 form runtime contexts even for read-only spec sheets. Remediated by decoupling `DetailRendererView` so display mode renders directly without `FormRuntimeProvider`.
2. **React 19 Fiber Traversal Fracture (Remediated)**: Passing React elements inside object slots caused Storybook's JSX stringifier to recursively traverse React 19 Fiber graphs. Remediated by enforcing `docs: { source: { type: "code" } }`.
3. **Documentation Drift Fracture (Remediated)**: Outdated slot prop syntax (`headerSlot={...}`) across legacy markdown docs was modernized to the canonical `slots={{ headerSlot: ... }}` contract.

