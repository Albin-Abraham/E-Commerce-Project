# Migration Guide

This guide covers migrating from legacy patterns to the current v1 MDAP architecture with Contract API and FormRuntimeProvider.

---

## Migration Phases Overview

### Current Architecture Phases (Phases 0-4)
```
Phase 0: Flattened → MDAP Entity (v0 → v1)
Phase 1: MDAP Entity → Contract API (v1 → Contracts)
Phase 2: Manual Providers → FormRuntimeProvider
Phase 3: Prop Drilling → usePrimitiveRuntime
Phase 4: Scattered Registries → ManifestRegistry
```

### New Architecture Hardening Phases (Phases 5-9)
```
Phase 5: Legacy Compilers → Canonical Form IR
Phase 6: Implicit Execution → Formal Execution Semantics
Phase 7: Permissive Security → Hardened Security Model
Phase 8: Unmeasured Performance → Budget-Enforced Performance
Phase 9: Legacy Abstractions → Consolidated Public API
```

Each phase is independent - migrate incrementally.

---

## Phase 0: Flattened → MDAP Entity

### Before (Flattened - Anti-Pattern)
```tsx
// ❌ LEGACY - Direct FormDefinition passed to Form
const schema = {
  id: "user-form",
  title: "User Profile",
  sections: [
    {
      id: "basic",
      fields: [
        { id: "name", name: "name", type: "text", label: "Name", required: true },
        { id: "email", name: "email", type: "email", label: "Email" },
      ],
    },
  ],
};

<Form definition={schema} onSubmit={handleSubmit} />;
```

**Problems:**
- Surface/Presentation mixed with Content
- Not reusable across layouts (mobile vs desktop)
- No Behavior layer for middleware
- No type safety

### After (MDAP Entity)
```typescript
// ✅ v1 MDAP - Separated layers
import { EntityDefinition } from "@/shared/ui/form/types/application";
import { compileEntityToFormDef } from "@/shared/ui/form/utils/mdap-compiler";

const UserEntity: EntityDefinition = {
  id: "user-entity",
  name: "User Profile",
  content: {
    sections: [
      {
        id: "basic",
        title: "Basic Info",
        fields: [
          { id: "name", name: "name", type: "text", label: "Name", required: true },
          { id: "email", name: "email", type: "email", label: "Email" },
        ],
      },
    ],
  },
  surface: {
    ui: { density: "comfortable" },
  },
  // behavior: { pipeline: { middleware: [...] } }, // Optional
  // presentation: { style: {...} }, // Optional
};

// Compile at runtime
function buildUserSchema() {
  return compileEntityToFormDef(UserEntity, "user-form", "Save Profile");
}
```

```tsx
// Usage unchanged
const schema = useMemo(buildUserSchema, []);
<Form definition={schema} onSubmit={handleSubmit} />;
```

**Key Changes:**
| Before | After |
|--------|-------|
| Inline object | `EntityDefinition` + `compileEntityToFormDef` |
| Mixed layers | Separated `content`/`surface`/`behavior`/`presentation` |
| No reuse | Compile different surfaces from same entity |

---

## Phase 1: MDAP Entity → Contract API

### Before (EntityDefinition)
```typescript
const UserEntity: EntityDefinition = {
  id: "user-entity",
  name: "User Profile",
  content: {
    sections: [{
      id: "basic",
      fields: [
        { id: "name", name: "name", type: "text", label: "Name", required: true },
        { id: "role", name: "role", type: "select", label: "Role", options: [...] },
      ],
    }],
  },
  surface: { ui: { density: "comfortable" } },
};
```

### After (Contract API)
```typescript
import { defineFormContract, compileContractToFormDefinition } from "@/shared/ui/form";

const UserContract = defineFormContract({
  id: "user-profile",
  title: "User Profile",
  submitLabel: "Save Profile",
  settings: { density: "comfortable" },  // Surface merged into settings
  sections: [{
    id: "basic",
    title: "Basic Info",
    layout: { type: "grid", columns: 12, gap: "md" },
    fields: [
      {
        id: "name",
        name: "name",
        type: "string",
        component: "text",        // Discriminated union
        label: "Name",
        required: true,
        layout: { columnSpan: 6 },
        properties: { placeholder: "John" },
      },
      {
        id: "role",
        name: "role",
        type: "string",
        component: "select",
        label: "Role",
        options: [
          { label: "Admin", value: "admin" },
          { label: "User", value: "user" },
        ] as const,  // Literal inference
      },
    ],
  }],
});

// Type-safe inference!
type UserData = InferFormValues<typeof UserContract>;
// { name: string; role: "admin" | "user" }
```

**Key Changes:**
| EntityDefinition | Contract API |
|------------------|--------------|
| `content.sections` | `sections` (top-level) |
| `surface.ui.density` | `settings.density` |
| `type: "text"` | `type: "string", component: "text"` |
| `options: [...]` | `options: [...] as const` (literal types) |
| No inference | `InferFormValues<Contract>` |
| Separate compile fn | `compileContractToFormDefinition` |

**Migration Steps:**
1. Replace `EntityDefinition` with `defineFormContract`
2. Move `surface.ui` → `settings`
3. Change `type` + add `component` for discriminated unions
4. Add `as const` to `options` arrays
5. Replace `compileEntityToFormDef` with `compileContractToFormDefinition`
6. Use `InferFormValues` for type-safe data handling

---

## Phase 2: Manual Providers → FormRuntimeProvider

### Before (Manual Nesting - 10 Providers)
```tsx
import {
  FormOrchestratorProvider,
  LayoutProvider,
  LayoutManagerProvider,
  ControlProvider,
  PermissionProvider,
  DataSourceProvider,
  ActionProvider,
  ServiceProvider,
  ExpressionProvider,
  BindingProvider,
} from "@/shared/ui/form/context";

function FormWrapper({ definition, children }) {
  const form = useFormCore(definition);
  
  return (
    <FormOrchestratorProvider value={orchestratorValue}>
      <LayoutProvider value={surfaceValue}>
        <LayoutManagerProvider>
          <ControlProvider>
            <PermissionProvider permissions={permissions}>
              <DataSourceProvider remoteOptions={form.remoteOptions}>
                <ActionProvider actions={actions}>
                  <ServiceProvider services={services}>
                    <ExpressionProvider>
                      <BindingProvider>
                        {children}
                      </BindingProvider>
                    </ExpressionProvider>
                  </ServiceProvider>
                </ActionProvider>
              </DataSourceProvider>
            </PermissionProvider>
          </ControlProvider>
        </LayoutManagerProvider>
      </LayoutProvider>
    </FormOrchestratorProvider>
  );
}
```

### After (FormRuntimeProvider)
```tsx
import { FormRuntimeProvider, useFormCore } from "@/shared/ui/form";

function FormWrapper({ definition, children }) {
  const form = useFormCore(definition);
  
  const orchestratorValue = useMemo(() => ({
    theme: defaultTheme,
    registry: defaultRegistry,
    manifest: defaultManifest,
    getComponentProps: form.getComponentProps.bind(form),
    visibility: form.visibility,
    routing: form.routing,
    spacing: spacingConfig,
  }), [form]);
  
  return (
    <FormRuntimeProvider
      orchestrator={orchestratorValue}
      surface={{
        layoutMode: definition.settings?.layoutMode,
        isWizard: definition.settings?.wizard?.enabled,
        initialStepId: definition.settings?.wizard?.initialStepId,
      }}
      remoteOptions={form.remoteOptions}
      permissions={definition.permissions}
      actions={definition.actions}
      services={definition.services}
    >
      {children}
    </FormRuntimeProvider>
  );
}
```

**Key Changes:**
- 10 nested providers → 1 `FormRuntimeProvider`
- Props map directly to context values
- `surface` prop replaces `LayoutProvider` + `WizardProvider`
- Automatic internal composition in correct order

---

## Phase 3: Prop Drilling → usePrimitiveRuntime

### Before (Prop Drilling Through Layout Tree)
```tsx
// ❌ LEGACY - Props passed through every layout component
function SectionComposer({ field, getComponentProps, visibility, spacing, parentLayout }) {
  return (
    <div>
      {field.fields.map(child => (
        <FieldRouter
          key={child.id}
          field={child}
          getComponentProps={getComponentProps}
          visibility={visibility}
          spacing={spacing}
          parentLayout={parentLayout}
        />
      ))}
    </div>
  );
}

// FieldRouter passes to FieldRenderer...
// FieldRenderer passes to withAtom...
// 5+ levels of prop drilling
```

### After (Context Access)
```tsx
// ✅ CURRENT - Hooks access context directly
import { usePrimitiveRuntime } from "@/shared/ui/form/context/FormOrchestratorContext";

function SectionComposer({ field, spacing }) {
  // No props needed - resolved from context
  const { getComponentProps, visibility } = usePrimitiveRuntime();
  const renderField = useFieldRouter(); // From FormRoutingContext
  
  return (
    <div>
      {field.fields.map(child => (
        <FieldRouter
          key={child.id}
          field={child}
          // getComponentProps & visibility NOT passed - from context
          spacing={spacing}
        />
      ))}
    </div>
  );
}

// Inside FieldRenderer
function FieldRenderer({ field }) {
  const { getComponentProps, visibility } = usePrimitiveRuntime();
  // ...
}
```

**Key Changes:**
| Before | After |
|--------|-------|
| `getComponentProps` prop | `usePrimitiveRuntime()` hook |
| `visibility` prop | `usePrimitiveRuntime()` hook |
| Manual prop threading | Zero prop drilling |

**Migration:**
1. Remove `getComponentProps`/`visibility` from component props
2. Add `const { getComponentProps, visibility } = usePrimitiveRuntime()`
3. Update TypeScript interfaces (mark props `@deprecated`)

---

## Phase 4: Scattered Registries → ManifestRegistry

### Before (5 Separate Registries)
```typescript
// ❌ LEGACY - Multiple registry imports
import { FIELD_REGISTRY } from "@/shared/ui/form/fields/registry";
import { fieldRegistry } from "@/shared/ui/form/core/RegistryStore";
import { FIELD_METADATA } from "@/shared/ui/form/fields/field-metadata";
import { layoutRendererRegistry } from "@/shared/ui/form/layout/LayoutRendererRegistry";
import { RegistryStore } from "@/shared/ui/form/core/RegistryStore";

// Registration scattered
FIELD_REGISTRY.set("custom", CustomField);
fieldRegistry.register("custom", withAtom(CustomField));
FIELD_METADATA.set("custom", { label: "Custom", icon: "cog" });
layoutRendererRegistry.register("custom-layout", CustomLayoutRenderer);
RegistryStore.definitions.set("custom", customDefaults);
```

### After (Unified ManifestRegistry)
```typescript
// ✅ CURRENT - Single registration
import { manifestRegistry } from "@/shared/ui/form/core/ManifestRegistry";

manifestRegistry.registerField({
  type: "custom",
  category: "input",           // "input" | "composite" | "container" | "static" | "repeater" | "slot"
  routing: "leaf",             // "leaf" | "container" | "composite" | "repeater" | "slot"
  capabilities: {
    hasValue: true,
    hasValidity: true,
    hasVisibility: true,
    hasView: true,
    hasVitality: true,
    isAsync: false,
    isStructural: false,
  },
  label: "Custom Field",
  icon: "cog",
  wrapper: { enabled: true },
  aliases: ["custom-input"],   // Backward compat
  component: withAtom(CustomField), // Optional eager component
});

// Layout renderer
manifestRegistry.registerLayout({
  type: "custom-layout",
  renderer: CustomLayoutRenderer,
});

// Instance defaults (for form builder)
manifestRegistry.registerInstanceDefaults("custom", (schemaField) => ({
  options: { source: "remote", url: "/api/custom" },
  valueMapping: { value: "id", label: "name" },
}));
```

**Key Changes:**
| Before | After |
|--------|-------|
| 5 registry imports | 1 `manifestRegistry` import |
| 5 registration calls | 1 `registerField()` call |
| Manual alias management | `aliases` array in manifest |
| Separate instance defaults | `registerInstanceDefaults()` |

**Lazy Registration (Code Splitting):**
```typescript
// Heavy fields loaded on demand
manifestRegistry.registerField({
  type: "rich-editor",
  category: "input",
  routing: "leaf",
  capabilities: { hasValue: true, ... },
  label: "Rich Editor",
  // No component - lazy loaded
});

// In lazy-registry-builder.ts
export const createSplitRegistry = () => {
  const registry = new LazyRegistryStore();
  registry.registerLazy("rich-editor", () => import("./fields/primitive/RichEditorField"));
  return registry;
}
```

---

## Phase 5: Legacy Compilers → Canonical Form IR

### Before (Dual Compilation Paths)
```typescript
// Two separate compilers producing FormDefinition directly
const entityForm = compileEntityToFormDef(entity, "form", "Submit");
const contractForm = compileContractToFormDefinition(contract);
// No validation between them, no shared IR
```

### After (Unified IR Pipeline)
```typescript
import { compileToIR, IRToFormDefinition, validateIR } from "@/shared/ui/form";

// Both paths go through CanonicalFormIR
const entityResult = compileToIR(entity, { formId: "form", submitLabel: "Submit", sourceType: "entity" });
const contractResult = compileToIR(contract, { formId: "form", submitLabel: "Submit", sourceType: "contract" });

// Validate IR
if (!entityResult.validation.valid) throw new Error("Entity IR invalid");
if (!contractResult.validation.valid) throw new Error("Contract IR invalid");

// Convert to runtime
const entityForm = IRToFormDefinition(entityResult.ir);
const contractForm = IRToFormDefinition(contractResult.ir);
```

**Key Changes:**
| Before | After |
|--------|-------|
| Direct compilation to FormDefinition | Compile → IR → Validate → FormDefinition |
| No cross-validation | Both paths produce validated IR |
| No source maps | IR includes sourceMap for debugging |
| Silent failures | `validateIR()` catches errors early |

**Migration Steps:**
1. Replace `compileEntityToFormDef` with `compileToIR` + `IRToFormDefinition`
2. Replace `compileContractToFormDefinition` with `compileToIR` + `IRToFormDefinition`
3. Add `validateIR()` checks before converting to FormDefinition
4. Use `compileEntityToIR` / `compileContractToIR` for advanced IR access

---

## Phase 6: Implicit Execution → Formal Execution Semantics

### Before (Implicit Behavior)
```typescript
// Execution behavior was implicit, undocumented
form.setValue("field", "value");
// What runs? Validation? Middleware? Visibility? In what order?
```

### After (Formal Semantics)
```typescript
import { FormCore } from "@/shared/ui/form";

const form = new FormCore(definition, {}, {
  validationMode: "onBlur",      // Explicit mode
  validationDebounceMs: 300,     // Explicit debounce
});

// Execution follows documented phases:
// Phase 0: Pre-processing (handleChange, deferred validation)
// Phase 1: Sync write + immediate notify
// Phase 2: Async batch (validation → middleware → computed → visibility → remote)
// Phase 3: Blur handling (separate)
```

**Key Changes:**
- Validation modes now explicit with documented state machine
- Middleware execution order guaranteed (registration order)
- Visibility evaluation with dependency graph (O(D) not O(N))
- Cycle guard on setValue effects (MAX_DEPTH = 5)
- Blur handling separate from change handling

**Migration:**
- Set explicit `validationMode` and `validationDebounceMs` in FormCore options
- Review middleware for re-entrancy (nested setValue)
- Ensure visibility conditions use expressions, not functions

---

## Phase 7: Permissive Security → Hardened Security Model

### Before (Permissive)
```typescript
// Function callbacks allowed in schema
const schema = {
  fields: [{
    visible: (values) => values.role === "admin",  // Function - security risk
    computed: { expression: (values) => values.a + values.b, dependsOn: ["a", "b"] },  // Function
  }]
};

// Expressions could access anything
const dangerous = "eval('alert(1)')";
const alsoBad = "require('fs').readFileSync('/etc/passwd')";
```

### After (Hardened)
```typescript
// Only expressions allowed (serializable, sandboxed)
const schema = {
  fields: [{
    visible: "form.values.role === 'admin'",  // Expression string
    computed: { expression: "a + b + c", dependsOn: ["a", "b", "c"] },  // Expression
  }]
};

// IR Validator rejects dangerous patterns at compile time
const result = compileToIR(contract, { formId: "form", submitLabel: "Submit", sourceType: "contract" });
// Errors: FUNCTION_CALLBACK_IN_SCHEMA, EVAL_DETECTED, REQUIRE_DETECTED, etc.

// ExpressionEngine enforces at runtime
const engine = new ExpressionEngine({
  allowedFunctions: ["today", "sum", "uppercase", "lowercase", "currency", "hasrole"],
  maxDepth: 10,
  maxEvaluationTimeMs: 50,
  strictMode: true,
});
engine.evaluate("form.values.role === 'admin'", ctx); // OK
engine.evaluate("eval('bad')", ctx); // Throws ExpressionSecurityError
```

**Key Changes:**
| Before | After |
|--------|-------|
| Function callbacks in schema | Only expression strings |
| No expression validation | IR Validator + runtime engine |
| No function allowlist | Explicit allowlist (6 built-ins) |
| No depth/time limits | Max depth 10, max 50ms |
| Full global access | Sandboxed (no globals) |

**Migration Steps:**
1. Run `validateSchemaSecurity()` on all schemas
2. Replace function callbacks with expression strings
3. Configure `ExpressionEngine` with allowlist
4. Set `strictMode: true` in production

---

## Phase 8: Unmeasured Performance → Budget-Enforced Performance

### Before (No Budgets)
```typescript
// No performance budgets, no regression detection
form.setValue("field", "value"); // Could be 1ms or 100ms
```

### After (Budget-Enforced)
```typescript
// Budgets enforced in CI
const BUDGETS = {
  "setValue sync write": 1,           // ms p95
  "setValue pipeline (onChange)": 16,
  "visibility evaluation (100 fields)": 100,
  "single field validation": 5,
  "full form validation (100 fields)": 50,
  "sync middleware chain (5)": 1,
  "computed field recompute (3 deps)": 5,
  "simple contract compilation": 20,
  "large contract compilation": 50,
} as const;

// CI fails if p95 exceeds budget
await runBenchmark("setValue pipeline (onChange)", () => form.setValue("f1", "test"));
```

**Key Changes:**
- Defined budgets for all critical paths
- Benchmarks in `tests/performance/`
- CI enforcement via `tests/performance/budgets.test.ts`
- p95 metric (not average) for tail latency

**Migration:**
1. Run benchmarks locally: `pnpm vitest run tests/performance/`
2. Add budgets for custom code paths
3. Enable CI workflow: `.github/workflows/performance.yml`

---

## Phase 9: Legacy Abstractions → Consolidated Public API

### Before (Multiple Registries/Hooks)
```typescript
// 5 scattered registries
import { FIELD_REGISTRY } from "@/shared/ui/form/fields/registry";
import { fieldRegistry } from "@/shared/ui/form/core/RegistryStore";
import { FIELD_METADATA } from "@/shared/ui/form/fields/field-metadata";
import { layoutRendererRegistry } from "@/shared/ui/form/layout/LayoutRendererRegistry";
import { RegistryStore } from "@/shared/ui/form/core/RegistryStore";

// Multiple overlapping hooks
import { useActionManager, useAction } from "@/shared/ui/form";
import { useLayout } from "@/shared/ui/form/context/LayoutContext";
```

### After (Consolidated)
```typescript
// Single ManifestRegistry
import { manifestRegistry } from "@/shared/ui/form";

// Canonical hooks
import { useFormActionManager, useFormAction } from "@/shared/ui/form";
import { useSurface, useWizard } from "@/shared/ui/form";
import { usePrimitiveRuntime } from "@/shared/ui/form";

// Legacy exports deprecated (will be removed in v2)
import { FIELD_REGISTRY } from "@/shared/ui/form"; // @deprecated
import { useAction } from "@/shared/ui/form"; // @deprecated
import { useLayout } from "@/shared/ui/form"; // @deprecated
```

**Deprecation Timeline:**
| Export | Deprecated In | Removed In | Replacement |
|--------|---------------|------------|-------------|
| `FIELD_REGISTRY` | v1.0 | v2.0 | `manifestRegistry.getField()` |
| `fieldRegistry` (RegistryStore) | v1.0 | v2.0 | `manifestRegistry` |
| `FIELD_METADATA` | v1.0 | v2.0 | `manifestRegistry.getLabel()` |
| `layoutRendererRegistry` | v1.0 | v2.0 | `manifestRegistry.getLayout()` |
| `RegistryStore` | v1.0 | v2.0 | `ManifestRegistry` |
| `useActionManager` / `useAction` | v1.0 | v2.0 | `useFormActionManager` / `useFormAction` |
| `LayoutContext` / `useLayout()` | v1.0 | v2.0 | `SurfaceContext` + `WizardContext` |
| `LayoutProvider` | v1.0 | v2.0 | `SurfaceProvider` + `WizardProvider` |

**Migration:**
1. Enable TypeScript `deprecation` warnings
2. Run codemods (see below)
3. Update imports to canonical paths
3. Test with deprecation warnings as errors

---

## Breaking Changes Checklist

### API Changes
- [ ] `LayoutContext` → `SurfaceContext` + `WizardContext`
- [ ] `useLayout()` → `useSurface()` + `useWizard()`
- [ ] `fieldRegistry` → `manifestRegistry` + `LazyRegistryStore`
- [ ] `FIELD_REGISTRY` → `manifestRegistry.getFieldComponent()`
- [ ] `FIELD_METADATA` → `manifestRegistry.getLabel()` / `getIcon()`
- [ ] `layoutRendererRegistry` → `manifestRegistry.getLayout()`

### Component Props
- [ ] Remove `getComponentProps` from layout components
- [ ] Remove `visibility` from layout components
- [ ] Use `usePrimitiveRuntime()` instead

### Imports
- [ ] `@/shared/ui/form/context/LayoutContext` → `@/shared/ui/form/context/SurfaceContext` + `WizardContext`
- [ ] `@/shared/ui/form/core/RegistryStore` → `@/shared/ui/form/core/ManifestRegistry`
- [ ] `@/shared/ui/form/fields/registry` → `@/shared/ui/form/core/ManifestRegistry`

### Types
- [ ] `FormDefinition` unchanged (runtime format same)
- [ ] `EntityDefinition` still works but Contract API preferred
- [ ] New: `FormRuntimeConfig`, `FormOrchestratorValue`, `SurfaceContextValue`, `WizardContextValue`

---

## Codemods (Automated Migration)

### 1. LayoutContext → SurfaceContext + WizardContext
```bash
# Find all useLayout imports
grep -r "useLayout" --include="*.tsx" --include="*.ts" src/
```

### 2. Prop Drilling → usePrimitiveRuntime
```bash
# Find components receiving getComponentProps/visibility
grep -r "getComponentProps\|visibility" --include="*.tsx" src/shared/ui/form/
```

### 3. Registry Imports
```bash
# Find old registry imports
grep -r "FIELD_REGISTRY\|fieldRegistry\|FIELD_METADATA\|layoutRendererRegistry" --include="*.ts" src/
```

---

## Verification Checklist

After migration, verify:

- [ ] Form renders without console errors
- [ ] Field values update correctly
- [ ] Validation works (onChange/onBlur/onSubmit)
- [ ] Visibility conditions evaluate
- [ ] Wizard navigation works (if applicable)
- [ ] Tabs/Accordion state persists
- [ ] Focus management works on validation error
- [ ] Permissions apply (edit/view/hidden)
- [ ] Remote options load/search
- [ ] Actions execute from schema
- [ ] TypeScript compiles without errors
- [ ] `InferFormValues` produces correct types

---

## Rollback Plan

If issues arise:

1. **Phase 0-1** (Authoring): Both `EntityDefinition` and Contract API compile to same `FormDefinition` - interchangeable
2. **Phase 2** (Providers): `FormRuntimeProvider` is wrapper - can revert to manual providers
3. **Phase 3** (Props): Context fallback to props maintained for backward compat
4. **Phase 4** (Registry): `ManifestRegistry` syncs with legacy registries - both work

---

## Related Docs

- [Contract Authoring](./CONTRACT_AUTHORING.md) - New authoring pattern
- [Runtime Contexts](./RUNTIME_CONTEXTS.md) - Context architecture
- [Rules & Anti-Patterns](./RULES_AND_ANTI_PATTERNS.md) - What to avoid
- [Getting Started](./GETTING_STARTED.md) - Current recommended approach