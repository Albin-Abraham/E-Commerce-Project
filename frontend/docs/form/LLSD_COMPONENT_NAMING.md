# LLSD Component Naming and JSDoc Standardization Registry

This registry documents the standardized Low-Level System Design (LLSD) taxonomy, canonical symbol names, backward compatibility aliases, and JSDoc contracts for the Zenith Form System.

---

## 1. Naming Principles

1. **Intent-Revealing**: Names describe what responsibility the component or function fulfills, not its implementation accident.
2. **Responsibility-Focused**: A component name aligns strictly with its architectural boundary. (A visual decorator is not called an "Atom" if it encapsulates the full outer DCS field shell).
3. **Explicit Lifecycle**: Differentiates between definitions (declarative structure), runtimes (execution state), providers (context injection), and renderers (presentation).
4. **Public API Stability**: Historical names are preserved through direct aliases with `@deprecated` notices pointing to the canonical name. Exact referential identity is maintained (`withFieldShell === withAtom`).
5. **Contract Alignment**: Names reflect verified implementation behavior rather than speculative aspirations.

---

## 2. Architectural Taxonomy

| Category | Intent / Responsibility | Convention | Example |
|---|---|---|---|
| **Definition** | Declarative configuration or schema structure | `*Definition` | `FormDefinition`, `FieldDefinition` |
| **Runtime** | Headless execution state machine or session | `*Runtime` | `FormRuntime`, `useFormCore` |
| **Provider** | Makes shared context or orchestrators available | `*Provider` | `FormRuntimeProvider`, `FormThemeProvider` |
| **Hook** | React hook encapsulating state logic | `use*` | `useForm`, `useFieldAtom`, `useWatch` |
| **Renderer** | Projects models or definitions into presentation markup | `*Renderer` | `FormRenderer`, `DetailRenderer` |
| **Composer** | Composes multiple layout nodes into larger structures | `*Composer` | `FormComposer`, `SectionComposer` |
| **Field** | Smart field controller or visual input control | `*Field` | `Field`, `ControlledField`, `FormTextField` |
| **Shell** | Visual wrapper establishing labels, icons, error layout | `*Shell` / `with*Shell` | `FieldShell`, `withFieldShell` |
| **Adapter** | Bridges two architectural layers or libraries | `*Adapter` | `ReactFormAdapter`, `TailwindAdapter` |

---

## 3. LLSD Component Audit & Rename Registry

The following table documents the audited symbols across the 4 architecture layers:

| Canonical Name | Historical Symbol | Source File | Layer | Actual Responsibility | Backward Compat Status |
|---|---|---|---|---|---|
| `withFieldShell` | `withAtom` | `src/shared/ui/form/hoc/withAtom.tsx` | Visual / DCS (L4) | Decorates an atomic input with the "Wrapper Trinity" (OuterWrapper, InputWrapper, Density Box) and autonomous standalone fallback. | Exact referential alias: `export const withFieldShell = withAtom;` |
| `useFormCore` | `useFormShellRuntime` | `src/shared/ui/form/hooks/useFormCore.ts` | Application / Adapters (L2) | Orchestrates headless engine, middleware, theme, localization, submission lifecycle, and wizard navigation into a unified `FormRuntime` object for `<Form />`. | Canonical hook. Legacy alias `useFormShellRuntime` removed. |
| `useFormActionManager`, `useFormAction` | `useActionManager`, `useAction` | `src/shared/ui/form/context/ActionContext.tsx` | Application / Adapters (L2) | Form-level action dispatching and management. | Disambiguated from `@shell/view-controller/action/ActionManager`. Legacy un-prefixed shims removed. |
| `DetailRenderer.Header` | `DetailRenderers.Header` | `src/shared/ui/form/detail/DetailRenderers.tsx` | Presentation (L3) | Standalone named component `DetailHeader` attached as a compound property on `DetailRenderer`. | Both standalone export `DetailHeader` and compound `DetailRenderer.Header` supported. |
| `DetailRenderer.KeyDetailsCard` | `DetailRenderers.KeyDetailsCard` | `src/shared/ui/form/detail/DetailRenderers.tsx` | Presentation (L3) | Standalone named component `DetailKeyDetailsCard` attached as a compound property on `DetailRenderer`. | Supported via `DetailKeyDetailsCard` and `DetailRenderer.KeyDetailsCard`. |
| `DetailRenderer.BottomActions` | `DetailRenderers.BottomActionSlot` | `src/shared/ui/form/detail/DetailRenderers.tsx` | Presentation (L3) | Action container supporting responsive layouts and sticky bottom pinning. | Aliased in `DetailRenderers` dictionary under both `BottomActions` and legacy `BottomActionSlot`. |
| `DetailRenderer.KeyValueRow` | `DetailRenderers.KeyValueRow` | `src/shared/ui/form/detail/DetailRenderers.tsx` | Presentation (L3) | Semantic `<dt>`/`<dd>` definition list row. | Supported via `DetailKeyValueRow` and `DetailRenderer.KeyValueRow`. |
| `DetailRenderer.ValueDisplay` | `DetailRenderers.ValueDisplay` | `src/shared/ui/form/detail/DetailRenderers.tsx` | Presentation (L3) | Value projection utility (currency, dates, badges, booleans). | Supported via `DetailValueDisplay` and `DetailRenderer.ValueDisplay`. |
| `Field` | `Field` | `src/shared/ui/form/fields/Field.tsx` | Presentation / Controller (L3) | Canonical entry point module re-exporting `<Field />`, `<ControlledField />`, and `<UncontrolledField />`. | Canonical module `src/shared/ui/form/fields/Field.tsx` re-exports from `WrapperFields.tsx`. |

---

## 4. JSDoc Standards

All exported components, hooks, and types must include complete JSDoc annotations adhering to the following standard:

```tsx
/**
 * Visual Design Component System (DCS) Field Shell Decorator.
 *
 * Enhances a primitive atomic input with the "Wrapper Trinity":
 * 1. `OuterWrapper`: Prefix/suffix adornments, clear actions, password reveal toggles.
 * 2. `InputWrapper`: Accessible labels, required indicators, error reservations, validation hints.
 * 3. `Box`: Responsive density tokens (`compact`, `comfortable`, `spacious`) and CSS variables.
 *
 * @param Component - The atomic primitive input component to wrap.
 * @param options - Configuration options determining label display and outer wrapper wrapping.
 *
 * @returns Pre-wrapped field component ready for direct or schema-driven rendering.
 *
 * @remarks
 * Canonical intent-revealing name for `withAtom`. Preserves exact function identity.
 *
 * @see withAtom
 */
export const withFieldShell = withAtom;
```

---

## 5. Automated Verification

The entire naming and backward-compatibility contract is strictly enforced by unit and live tests:
- **`src/shared/ui/form/tests/api-compatibility.test.tsx`**: Verifies exact referential equality (`toBe`) for all aliases.
- **`src/shared/ui/form/tests/DetailRenderer.test.tsx`**: Verifies compound subcomponents and runtime boundaries.
- **`src/shared/ui/form/tests/StorybookLiveConformance.test.tsx`**: Verifies 30 live story renders across all overhauled fields and detail presentations.

---

## 6. Deprecated & Removed Legacy Shims (Clean Architecture Hardening)

To maintain clean DDD boundaries and eliminate naming ambiguity, the following legacy artifacts and compatibility shims have been removed from the codebase:

| Retired Symbol / File | Former Location | Reason for Removal | Canonical Replacement |
|---|---|---|---|
| `expression-engine.ts` | `src/core/form-core/expression-engine.ts` | Dead 0%-coverage code; superseded by reactive engine. | `ReactiveEngine` (`modules/reactive-engine.ts`) |
| `useFormShellRuntime` | `src/shared/ui/form/hooks/useFormCore.ts` | Redundant alias creating developer confusion. | `useFormCore` |
| `useActionManager`, `useAction` | `src/shared/ui/form/context/ActionContext.tsx` | High-risk namespace collision with `@shell/view-controller/action/ActionManager`. | `useFormActionManager`, `useFormAction` |
| `CustomSelectField` | `src/shared/ui/form/fields/primitive/SelectField.tsx` | Unnecessary wrapper around SelectField. | `SelectField` |

### 6.1 Deprecated but still exported

These symbols were scheduled for retirement but remain live exports. Prefer the canonical replacement in new code; do not assume they are absent from the codebase:

| Symbol | Status | Location | Canonical Replacement |
|---|---|---|---|
| `useMDAPForm`, `useEntityForm` | Deprecated aliases: `export const useMDAPForm = useFormFacade;` (and `useEntityForm` likewise). Not in the main barrel; import by path. | `src/shared/ui/form/hooks/useMDAPForm.ts` | `useFormFacade` / `useFormCore` |
| `field.meta.options.options` | Still honored as step 4 of the canonical option-resolution chain in `getFieldOptions()` (after `field.options`, remote options, and instance defaults). | `src/shared/ui/form/utils/form-layout-utils.ts` | `field.options` |

