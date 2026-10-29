> [!WARNING]
> **ARCHIVED / HISTORICAL DOCUMENTATION (v1 MDAP)**
> This documentation describes the legacy v1 MDAP architecture and has been archived. For active development, refer to the current **[v2 Form Architecture](../../form/FORM_ARCHITECTURE.md)**, **[Quick Start Guide](../../form/QUICK_START.md)**, and **[Documentation Index](../../form/README.md)**.

# MDAP v1 API Reference

This document is automatically generated and contains every exported module, function, component, and interface within `src/shared/ui/form`.

> **Link note:** Source links have been remapped to their current locations (`src/shared/ui/form/core/…` files moved to `src/core/form-core/…`; registry stores moved to `src/shared/ui/form/registry/…`). Heading text preserves the original v1 paths. Three indexed files no longer exist and are shown unlinked: `core/expression-engine.ts` (removed), `fields/primitive/CustomSelect.tsx` (removed), and `layout/SplitLayoutRenderer.tsx` (removed).

## [`FieldRenderer.tsx`](../../../src/shared/ui/form/FieldRenderer.tsx)

### `FieldRenderer`

_(No documentation provided)_

---

## [`FieldRouter.tsx`](../../../src/shared/ui/form/FieldRouter.tsx)

### `FieldRouter`

@file FieldRouter.tsx
@description Routes each field to the correct renderer based on manifest.
Decision flow:

1. Look up field type in ManifestRegistry.
2. Check visibility (skip hidden fields).
3. Route by category:

- `container` / `composite` → SectionComposer (via `renderStructure`)
- `repeater` routing → RepeaterField
- `leaf` / `slot` routing → FieldRenderer (atomic input / static field)
  No hardcoded type sets — all routing metadata comes from FieldManifest.
  @module FieldRouter
  /
  import React, { useMemo } from "react";
  import { m } from "framer-motion";
  import type { RuntimeLayoutConfig } from "@ui/form/types/layout";
  import { FieldRenderer } from "@ui/form/FieldRenderer";
  import { useFormRegistry } from "@ui/form/context/FormRegistryContext";
  import { useFormTheme } from "@ui/form/context/FormThemeContext";
  import { useStructureRenderer } from "@ui/form/context/FormRoutingContext";
  import { useManifestRegistry } from "@ui/form/context/ManifestRegistryContext";
  import { usePrimitiveRuntime } from "@ui/form/context/FormOrchestratorContext";
  import type { FormField } from "@ui/form/fields";
  import { RepeaterField } from "@ui/form/fields/structure/RepeaterField";
  import { FieldDebugWrapper } from "@ui/form/tools/FormDebugOverlay";
  import {
  buildFieldWrapperClasses,
  cn,
  } from "@ui/form/utils/form-styles";
  import type { SpacingConfig } from "@ui/form/utils/spacing-calculator";
  interface FieldRouterProps {
  / The field definition to render. /
  field: FormField;
  /
  @deprecated Resolved from context via usePrimitiveRuntime().
  Kept for backward-compatibility with direct usages.
  /
  getComponentProps?: (fieldId: string) => any;
  /
  @deprecated Resolved from context via usePrimitiveRuntime().
  Kept for backward-compatibility with direct usages.
  /
  visibility?: Record<string, boolean>;
  / Spacing configuration passed to child renderers. /
  spacing?: SpacingConfig;
  / Layout config of the parent container (for responsive column sizing). /
  parentLayout?: RuntimeLayoutConfig;
  }
  /
  FieldRouter — Routes each field to the correct renderer based on manifest.
  Routing strategy (manifest-driven):
- `container` / `composite` categories → renderStructure (SectionComposer)
- `repeater` routing → RepeaterField (dynamic row management)
- `leaf` / `slot` routing → FieldRenderer (atomic input / static field)
  No hardcoded type sets — all routing metadata comes from FieldManifest.

---

## [`Form.tsx`](../../../src/shared/ui/form/Form.tsx)

### `FormProps`

_(No documentation provided)_

### `FormHandle`

_(No documentation provided)_

### `Form`

_(No documentation provided)_

---

## [`FormComposer.tsx`](../../../src/shared/ui/form/FormComposer.tsx)

### `FormComposer`

@deprecated Pass getComponentProps/visibility into the FormOrchestratorContext
via usePrimitiveRuntime() at the root instead. These props are kept for
backward-compatibility but context values take precedence.
/
getComponentProps?: (fieldId: string) => any;
parentLayout?: RuntimeLayoutConfig;
visibility?: Record<string, boolean>;
/ Fill the parent pane's height, spreading fields evenly (e.g. auth split pane). /
fillVertical?: boolean;
}
/
FormComposer - Orchestrates form layout and structure.
COMPOSITION LAYER: Handles spacing context and wires FieldRouter ↔ SectionComposer
via FormRoutingContext (avoids circular imports between the two).
Phase 1: getComponentProps and visibility are now resolved from context
(usePrimitiveRuntime) rather than being prop-drilled. The props remain for
backward-compatibility with direct usages, but context always takes precedence.

---

## [`FormProps.ts`](../../../src/shared/ui/form/FormProps.ts)

### `FormProps`

_(No documentation provided)_

### `FormHandle`

_(No documentation provided)_

---

## [`FormRenderer.tsx`](../../../src/shared/ui/form/FormRenderer.tsx)

### `RenderNode`

RenderNode - Renders an individual FieldNode in the dynamic tree.
getComponentProps/visibility are optional — resolved from context (usePrimitiveRuntime).

### `RenderChild`

RenderChild - Recursively renders children list inside a parent layout node.
getComponentProps/visibility are optional — resolved from context (usePrimitiveRuntime).

### `FormRenderer`

FormRenderer - A lightweight Vue-like dynamic layout renderer.
Perfect for rendering a RenderDefinition or FormDefinition purely as functional
layout nodes without the full <form> wrapper, submit buttons, headers, or footers.
Uses `FormRuntimeProvider` for a single clean provider root — no provider hell.

### `FormRendererProps`

_(No documentation provided)_

---

## [`FormShowcase.stories.tsx`](../../../src/shared/ui/form/FormShowcase.stories.tsx)

### `HighDensityEnterprise`

_(No documentation provided)_

### `ValidationShowcase`

_(No documentation provided)_

### `StructuralOrchestration`

_(No documentation provided)_

### `AdvancedFieldsShowcase`

_(No documentation provided)_

### `ProDashboard`

_(No documentation provided)_

### `CustomizedShellDesign`

_(No documentation provided)_

### `HighLoyaltyDashboard`

_(No documentation provided)_

### `PerformanceStressTest`

_(No documentation provided)_

---

## [`IdentityShowcase.stories.tsx`](../../../src/shared/ui/form/IdentityShowcase.stories.tsx)

### `DashboardEnrollment`

Dashboard Enrollment Showcase:
Demonstrates the "Smart Shell" logic where the Form detects its hosted context
and "Yields" its header to the Page Shell.

### `PortalLogin`

_(No documentation provided)_

### `PortalRegistration`

_(No documentation provided)_

---

## [`LogicBranching.stories.tsx`](../../../src/shared/ui/form/LogicBranching.stories.tsx)

### `MembershipProvider`

_(No documentation provided)_

---

## [`RegistryInjection.stories.tsx`](../../../src/shared/ui/form/RegistryInjection.stories.tsx)

### `CustomFieldInjection`

_(No documentation provided)_

---

## [`ResilienceTest.stories.tsx`](../../../src/shared/ui/form/ResilienceTest.stories.tsx)

### `AdaptiveControls`

SMART LAYOUT & RESILIENCE TEST
Verifies:

1. Heuristic Span Engine (Smart Recommendations)
2. Relaxed Compact Density
3. Min-Width Protection (Prevent field collapse in dense grids)
4. Style Tracing (via DevTools Styles Tab)

---

## [`WizardOrchestration.stories.tsx`](../../../src/shared/ui/form/WizardOrchestration.stories.tsx)

### `OperationalSidebar`

_(No documentation provided)_

### `IdentityPortalWizard`

_(No documentation provided)_

---

## [`adapters/TreeSelectAdapter.tsx`](../../../src/shared/ui/form/adapters/TreeSelectAdapter.tsx)

### `TreeSelectAdapter`

1. Define the Expected JSON Definition for the Tree
   This is what the FormCore schema authors will write.
   /
   interface TreeFieldMeta {
   allowMultiple?: boolean;
   canDragAndDrop?: boolean;
   maxDepth?: number;
   dataProviderUrl?: string; // Where to fetch the tree nodes
   }
   /
2. The Adapter Component (Registered in FormRegistryContext)
   Wrapped in forwardRef so the Form Engine can imperatively control it
   or manage focus during validation errors.

---

## [`adapters/primitives.ts`](../../../src/shared/ui/form/adapters/primitives.ts)

### `UIPrimitiveAdapter`

Global Component Primitive Registry
Decouples core form fields from specific UI frameworks (HeroUI, MUI, AntD).

### `PrimitiveInputProps`

_(No documentation provided)_

### `PrimitiveSelectProps`

_(No documentation provided)_

### `PrimitiveComponentRegistry`

_(No documentation provided)_

---

## [`adapters/useFormAdapter.ts`](../../../src/shared/ui/form/adapters/useFormAdapter.ts)

### `useFormAdapter`

React Hook Form (RHF) Style Adapter for the Custom FormCore
This adapter bridges the gap between the high-performance atomic
state engine and the familiar developer experience of React Hook Form.
Usage:
const { register, formState: { errors }, handleSubmit } = useFormAdapter(mySchema);
<input {...register('firstName')} />

---

## [`atoms/FieldIcon.stories.tsx`](../../../src/shared/ui/form/atoms/FieldIcon.stories.tsx)

### `Default`

_(No documentation provided)_

### `CustomColor`

_(No documentation provided)_

### `CustomScale`

_(No documentation provided)_

---

## [`atoms/FieldIcon.tsx`](../../../src/shared/ui/form/atoms/FieldIcon.tsx)

### `FieldIcon`

_(No documentation provided)_

---

## [`atoms/FieldTooltip.stories.tsx`](../../../src/shared/ui/form/atoms/FieldTooltip.stories.tsx)

### `Default`

_(No documentation provided)_

### `LongText`

_(No documentation provided)_

---

## [`atoms/FieldTooltip.tsx`](../../../src/shared/ui/form/atoms/FieldTooltip.tsx)

### `FieldTooltip`

_(No documentation provided)_

---

## [`atoms/HelpText.stories.tsx`](../../../src/shared/ui/form/atoms/HelpText.stories.tsx)

### `SingleLine`

_(No documentation provided)_

### `MultiLine`

_(No documentation provided)_

---

## [`atoms/HelpText.tsx`](../../../src/shared/ui/form/atoms/HelpText.tsx)

### `HelpText`

_(No documentation provided)_

---

## [`atoms/ValidationHints.stories.tsx`](../../../src/shared/ui/form/atoms/ValidationHints.stories.tsx)

### `SingleHint`

_(No documentation provided)_

### `MultipleHints`

_(No documentation provided)_

---

## [`atoms/ValidationHints.tsx`](../../../src/shared/ui/form/atoms/ValidationHints.tsx)

### `ValidationHints`

_(No documentation provided)_

---

## [`builder/FormBuilder.ts`](../../../src/shared/ui/form/builder/FormBuilder.tsx)

### `FormBuilder`

FormBuilder implements the Builder Pattern (GoF Creational).
Provides a fluent API to construct complex FormDefinition schemas,
reducing boilerplate and improving type safety.

---

## [`builder/FormBuilder.tsx`](../../../src/shared/ui/form/builder/FormBuilder.tsx)

### `FormBuilder`

_(No documentation provided)_

---

## [`builder/board/Board.tsx`](../../../src/shared/ui/form/builder/board/Board.tsx)

### `Board`

_(No documentation provided)_

---

## [`builder/board/CanvasField.tsx`](../../../src/shared/ui/form/builder/board/CanvasField.tsx)

### `CanvasField`

_(No documentation provided)_

---

## [`builder/board/CanvasSection.tsx`](../../../src/shared/ui/form/builder/board/CanvasSection.tsx)

### `CanvasSection`

_(No documentation provided)_

---

## [`builder/board/Card.tsx`](../../../src/shared/ui/form/builder/board/Card.tsx)

### `Card`

_(No documentation provided)_

---

## [`builder/board/Column.tsx`](../../../src/shared/ui/form/builder/board/Column.tsx)

### `Column`

_(No documentation provided)_

---

## [`builder/board/FormCanvas.tsx`](../../../src/shared/ui/form/builder/board/FormCanvas.tsx)

### `FormCanvas`

_(No documentation provided)_

---

## [`builder/core/SFM.ts`](../../../src/shared/ui/form/builder/core/SFM.ts)

### `Identifiable`

Generic Interface for an Item (Card/Field)

### `IColumn`

Generic Interface for a Column (Section)
Must contain a list of Items.

### `IBoard`

Generic Interface for a Board (Form)
Must contain a list of Columns.

### `SFM`

SFM (Sortable Finite Machine / Manager)
A pure Domain Service for managing Board-Column-Item relationships.
TBoard: The type of the root container (e.g., FormDefinition)
TColumn: The type of the column (e.g., FormSection)
TItem: The type of the item (e.g., FormField)

---

## [`builder/hooks/PropertiesModal.tsx`](../../../src/shared/ui/form/builder/hooks/PropertiesModal.tsx)

### `PropertiesModal`

_(No documentation provided)_

---

## [`builder/hooks/useBoardAsViewModel.tsx`](../../../src/shared/ui/form/builder/hooks/useBoardAsViewModel.tsx)

### `useBoardAsViewModel`

_(No documentation provided)_

---

## [`builder/hooks/usePropertiesModalAsViewModel.tsx`](../../../src/shared/ui/form/builder/hooks/usePropertiesModalAsViewModel.tsx)

### `usePropertiesModalAsViewModel`

_(No documentation provided)_

---

## [`builder/palette/ComponentPanel.tsx`](../../../src/shared/ui/form/builder/palette/ComponentPanel.tsx)

### `ComponentPanel`

_(No documentation provided)_

---

## [`builder/panels/ConditionsEditor.tsx`](../../../src/shared/ui/form/builder/panels/ConditionsEditor.tsx)

### `ConditionsEditor`

_(No documentation provided)_

---

## [`builder/panels/FieldProperties.tsx`](../../../src/shared/ui/form/builder/panels/FieldProperties.tsx)

### `FieldProperties`

_(No documentation provided)_

---

## [`builder/panels/FormBehaviorEditor.tsx`](../../../src/shared/ui/form/builder/panels/FormBehaviorEditor.tsx)

### `FormBehaviorEditor`

_(No documentation provided)_

---

## [`builder/panels/FormProperties.tsx`](../../../src/shared/ui/form/builder/panels/FormProperties.tsx)

### `FormProperties`

_(No documentation provided)_

---

## [`builder/panels/PropertiesPanel.tsx`](../../../src/shared/ui/form/builder/panels/PropertiesPanel.tsx)

### `PropertiesPanel`

_(No documentation provided)_

---

## [`builder/panels/SectionProperties.tsx`](../../../src/shared/ui/form/builder/panels/SectionProperties.tsx)

### `SectionProperties`

_(No documentation provided)_

---

## [`builder/panels/ValidationRuleEditor.tsx`](../../../src/shared/ui/form/builder/panels/ValidationRuleEditor.tsx)

### `ValidationRuleEditor`

_(No documentation provided)_

---

## [`builder/store/builder.store.ts`](../../../src/shared/ui/form/builder/store/builder.store.ts)

### `Selection`

_(No documentation provided)_

### `useBuilderStore`

_(No documentation provided)_

---

## [`builder/utils/builder-utils.ts`](../../../src/shared/ui/form/builder/utils/builder-utils.ts)

### `generateId`

_(No documentation provided)_

### `createDefaultForm`

_(No documentation provided)_

### `createDefaultSection`

_(No documentation provided)_

### `createDefaultField`

_(No documentation provided)_

---

## [`components/FormShell.tsx`](../../../src/shared/ui/form/components/FormShell.tsx)

### `FormShell`

_(No documentation provided)_

---

## [`components/FormSkeleton.tsx`](../../../src/shared/ui/form/components/FormSkeleton.tsx)

### `FormSkeleton`

_(No documentation provided)_

### `FormErrorState`

_(No documentation provided)_

### `FormEmptyState`

_(No documentation provided)_

---

## [`components/FormValidationSummary.tsx`](../../../src/shared/ui/form/components/FormValidationSummary.tsx)

### `FormValidationSummary`

_(No documentation provided)_

---

## [`context/ActionContext.tsx`](../../../src/shared/ui/form/context/ActionContext.tsx)

### `FormActionHandler`

@file ActionContext.tsx
@description Action Manager for triggering external or form-level actions.
FormFooter dispatches `submit` and `cancel` by id. Hosts register those
handlers via `<Form actions={{ submit, cancel }} />`.

### `ActionManagerValue`

_(No documentation provided)_

### `ActionProvider`

_(No documentation provided)_

### `useActionManager`

_(No documentation provided)_

### `useAction`

_(No documentation provided)_

---

## [`context/BindingContext.tsx`](../../../src/shared/ui/form/context/BindingContext.tsx)

### `BindingManagerValue`

@file BindingContext.tsx
@description Binding Manager for resolving data bindings. Wraps FormCore value proxies.

### `BindingProvider`

_(No documentation provided)_

### `useBindingManager`

_(No documentation provided)_

### `useFieldBinding`

_(No documentation provided)_

---

## [`context/ControlContext.tsx`](../../../src/shared/ui/form/context/ControlContext.tsx)

### `ControlProvider`

@file ControlContext.tsx
@description Imperative control API for individual field drivers.
The ControlContext is the "ControlManager" mentioned in the architecture chat.
It gives field drivers and external orchestrators an imperative handle to:

- `focus(fieldId)` — programmatically focus a field
- `blur(fieldId)` — programmatically blur a field
- `scrollIntoView(fieldId)` — scroll a field into the viewport

## Design

Field drivers register their DOM ref on mount via `useFieldControl(fieldId)`.
External code (e.g., on validation error) calls `controlManager.focus(fieldId)`.
Analogous to React's `ref`-forwarding pattern, but centralized so that
any orchestrator (FormValidator, error summary, accessibility runtime)
can control any field without knowing its position in the tree.

## Usage

### Inside a field driver:

```tsx
const ref = useFieldControl(field.id);
return <input ref={ref} ... />;
```

### From FormValidator or error summary:

```ts
const control = useControlManager();
control.focus("email_field_id"); // focuses the email input
control.scrollIntoView("phone_id"); // scrolls it into view
```

/
// ── Types ───────────────────────────────────────────────────────────────────
export interface ControlManagerValue {
/
Register a field element ref. Called internally by `useFieldControl()`.
Do not call this directly from field components — use the hook instead.
/
register: (fieldId: string, el: HTMLElement | null) => void;
/ Programmatically focus a registered field. /
focus: (fieldId: string) => void;
/ Programmatically blur a registered field. /
blur: (fieldId: string) => void;
/
Scroll a registered field into view.
@param fieldId - The field ID to scroll to.
@param options - Standard ScrollIntoViewOptions.
/
scrollIntoView: (
fieldId: string,
options?: ScrollIntoViewOptions
) => void;
}
// ── Context ─────────────────────────────────────────────────────────────────
const ControlContext = createContext<ControlManagerValue | undefined>(undefined);
/
`ControlProvider` — wraps the form tree to enable imperative field control.
Place at the same level as `FormOrchestratorProvider`.

### `useControlManager`

`useControlManager` — access the imperative control API.
@example
// Jump focus to first invalid field after submit:
const control = useControlManager();
control.focus(firstInvalidFieldId);
control.scrollIntoView(firstInvalidFieldId);

### `useFieldControl`

`useFieldControl` — called inside a field driver to register the element ref.
Returns a `React.RefCallback` to attach to the field's root element.
The ref is automatically cleaned up on unmount.
@example
const controlRef = useFieldControl(field.id);
return <input ref={controlRef} type="text" ... />;

### `ControlManagerValue`

_(No documentation provided)_

---

## [`context/DataSourceContext.tsx`](../../../src/shared/ui/form/context/DataSourceContext.tsx)

### `DataSourceProvider`

@file DataSourceContext.tsx
@description DataSource Manager — wraps RemoteOptionsManager for context-based access.
The chat architecture calls this the "DataSourceManager":

```
Runtime
└── DataSource Manager
└── remote option fetch / search / pagination
```

Currently, `RemoteOptionsManager` lives inside `FormCore` and is accessed
via `useFieldViewModel → form.remoteOptions.executeSearch()`.
This context lifts it to a first-class runtime service so any driver
can trigger searches, refresh options, or subscribe to loading state
without going through the form facade.

## Usage

### Inside a field driver (AutocompleteField, SelectField):

```tsx
const { search, getOptions, isLoading } = useDataSource(field.id);
// Trigger a search:
search("query text");
// Get cached options:
const options = getOptions();
```

### Programmatic refresh (e.g., after a dependent field changes):

```tsx
const ds = useDataSourceManager();
ds.refresh("city_field_id");
```

/
// ── Types ─────────────────────────────────────────────────────────────────
export interface DataSourceManagerValue {
/
Trigger a search for a field's remote options.
Delegates to `form.remoteOptions.executeSearch(fieldId, query)`.
/
search: (fieldId: string, query: string) => void;
/
Force a refresh of all remote options for a field.
Useful when a dependent field changes.
/
refresh: (fieldId: string) => void;
/
Get the currently cached options for a field.
Returns an empty array if no options are loaded yet.
/
getOptions: (fieldId: string) => ReadonlyArray<{ label: string; value: unknown }>;
/
Check if a field's options are currently loading.
/
isLoading: (fieldId: string) => boolean;
}
export interface FieldDataSourceResult {
search: (query: string) => void;
refresh: () => void;
options: ReadonlyArray<{ label: string; value: unknown }>;
isLoading: boolean;
}
// ── Context ─────────────────────────────────────────────────────────────────
const DataSourceContext = createContext<DataSourceManagerValue | undefined>(
undefined
);
const DEFAULT_MANAGER: DataSourceManagerValue = {
search: () => {},
refresh: () => {},
getOptions: () => [],
isLoading: () => false,
};
/
`DataSourceProvider` — bridges the form engine's RemoteOptionsManager to
the context layer so field drivers can access it without prop drilling.
Place at the same level as `FormOrchestratorProvider`.
@example
<DataSourceProvider remoteOptions={form.remoteOptions}>
<FormComposer ... />
</DataSourceProvider>

### `useDataSourceManager`

The RemoteOptionsManager from FormCore. /
remoteOptions?: {
executeSearch: (fieldId: string, query: string) => void;
refresh?: (fieldId: string) => void;
getOptions?: (fieldId: string) => ReadonlyArray<{ label: string; value: unknown }>;
isLoading?: (fieldId: string) => boolean;
} | null;
}> = ({ children, remoteOptions }) => {
const search = useCallback(
(fieldId: string, query: string) => {
remoteOptions?.executeSearch(fieldId, query);
},
[remoteOptions]
);
const refresh = useCallback(
(fieldId: string) => {
remoteOptions?.refresh?.(fieldId);
},
[remoteOptions]
);
const getOptions = useCallback(
(fieldId: string) => remoteOptions?.getOptions?.(fieldId) ?? [],
[remoteOptions]
);
const isLoading = useCallback(
(fieldId: string) => remoteOptions?.isLoading?.(fieldId) ?? false,
[remoteOptions]
);
const value: DataSourceManagerValue = useMemo(
() => ({ search, refresh, getOptions, isLoading }),
[search, refresh, getOptions, isLoading]
);
return (
<DataSourceContext.Provider value={value}>
{children}
</DataSourceContext.Provider>
);
};
// ── Hooks ────────────────────────────────────────────────────────────────────
/
`useDataSourceManager` — access the full DataSource manager API.
@example
const ds = useDataSourceManager();
ds.refresh("city_field_id"); // refresh after country changes

### `useDataSource`

`useDataSource` — field-scoped data source hook for use inside field drivers.
Returns search/refresh/options/isLoading all pre-bound to the given fieldId.
@example
const { search, options, isLoading } = useDataSource(field.id);
return <Autocomplete options={options} onInputChange={search} loading={isLoading} />;

### `DataSourceManagerValue`

_(No documentation provided)_

### `FieldDataSourceResult`

_(No documentation provided)_

---

## [`context/ExpressionContext.tsx`](../../../src/shared/ui/form/context/ExpressionContext.tsx)

### `ExpressionContextValue`

@file ExpressionContext.tsx
@description Expression Context for evaluating dynamic conditions and expressions in the UI.

### `ExpressionProvider`

_(No documentation provided)_

### `useExpressionContext`

_(No documentation provided)_

---

## [`context/FormDIProvider.tsx`](../../../src/shared/ui/form/context/FormDIProvider.tsx)

### `FormDIProvider`

Dependency Injection (DI) Context for the Form Engine
Instead of forcing developers to use the JSON Schema `routing.renderField`,
this context injects the pure Engine into the component tree. This allows
developers to build highly bespoke, custom UIs using standard React
components while still benefiting from the atomic state performance.
/
interface FormDIContextValue {
engine: Form<any> | null;
}
const FormDIContext = createContext<FormDIContextValue>({ engine: null });
/
The Provider that wraps a custom UI area.

### `useFormEngine`

Hook to grab the engine from DI

### `useInjectedField`

Helper hook: Combines DI and Atomic Subscription
Allows a custom component to subscribe to exactly one field's state
without needing to pass the engine reference manually.

---

## [`context/FormOrchestratorContext.tsx`](../../../src/shared/ui/form/context/FormOrchestratorContext.tsx)

### `usePrimitiveRuntime`

Resolved component props factory for primitive fields.
Provided by Form/FormRenderer at the top level so that layout nodes
(Tabs, Accordion, Grid, etc.) do NOT need to receive it as a prop.
/
getComponentProps?: (fieldId: string) => any;
/
Map of fieldId → boolean visibility flags.
Provided at the top level so layout nodes don't pass it through.
/
visibility?: Record<string, boolean>;
}
export const FormOrchestratorContext = createContext<FormOrchestratorValue>({});
export const FormOrchestratorProvider: React.FC<{
value: FormOrchestratorValue;
children: React.ReactNode;
}> = ({ value, children }) => {
return (
<FormOrchestratorContext.Provider value={value}>
{children}
</FormOrchestratorContext.Provider>
);
};
export const useFormOrchestrator = () => useContext(FormOrchestratorContext);
/
`usePrimitiveRuntime` — the primary hook for primitive field drivers.
Instead of receiving `getComponentProps` and `visibility` as props,
every leaf field driver calls this hook to lazily resolve them from context.
This eliminates prop drilling through Tabs → Accordion → Grid → Field.
@example
// Inside FieldRouter or a custom driver — no props needed:
const { getComponentProps, visibility } = usePrimitiveRuntime();
const props = getComponentProps(field.id);

### `RoutingRenderProps`

_(No documentation provided)_

### `FormOrchestratorValue`

_(No documentation provided)_

### `FormOrchestratorContext`

_(No documentation provided)_

### `FormOrchestratorProvider`

_(No documentation provided)_

### `useFormOrchestrator`

_(No documentation provided)_

---

## [`context/FormRegistryContext.tsx`](../../../src/shared/ui/form/context/FormRegistryContext.tsx)

### `FormRegistryProvider`

_(No documentation provided)_

### `useFormRegistry`

_(No documentation provided)_

---

## [`context/FormRoutingContext.tsx`](../../../src/shared/ui/form/context/FormRoutingContext.tsx)

### `FormRoutingProvider`

_(No documentation provided)_

### `useFieldRouter`

_(No documentation provided)_

### `useStructureRenderer`

_(No documentation provided)_

---

## [`context/FormRuntimeProvider.tsx`](../../../src/shared/ui/form/context/FormRuntimeProvider.tsx)

### `FormRuntimeConfig`

@file FormRuntimeProvider.tsx
@description The single composition root for all form runtime managers.

## The Provider Hell Problem

Without this, `Form.tsx` had to nest 6 providers manually:

```tsx
<FormOrchestratorProvider>
<LayoutProvider>
<LayoutManagerProvider>
<ControlProvider>
<PermissionProvider>
{children}
```

## The Solution

`FormRuntimeProvider` is the single external API. The providers remain
separate, modular, and independently testable internally — but the
consumer only sees ONE provider:

```tsx
<FormRuntimeProvider orchestrator={...} surface={...} form={form}>
{children}
</FormRuntimeProvider>
```

## Analogy

This mirrors how `<MaterialApp>` (Flutter), `<ApolloProvider>`,
and `<QueryClientProvider>` all compose many internal providers
while presenting a single clean API to their consumers.
The domain boundaries are preserved — each manager is still a separate
context with its own hook. Only the provider nesting is centralized here.

### `FormRuntimeProvider`

Pre-built `FormOrchestratorValue` from the parent Form or FormRenderer.
Contains: theme, registry, getComponentProps, visibility, routing, manifest.
/
orchestrator: FormOrchestratorValue;
/
Application shell / surface configuration.
/
surface: {
layoutMode?: LayoutMode;
isWizard?: boolean;
initialStepId?: string;
};
/
The `form.remoteOptions` from FormCore — bridges RemoteOptionsManager
into the DataSourceContext. Or can be implemented via React Query in state.
/
remoteOptions?: {
executeSearch: (fieldId: string, query: string) => void;
refresh?: (fieldId: string) => void;
getOptions?: (fieldId: string) => ReadonlyArray<{ label: string; value: unknown }>;
isLoading?: (fieldId: string) => boolean;
} | null;
/
Field-level permission map: { [fieldId]: "edit" | "view" | "hidden" }.
Forwarded to PermissionProvider.
@example { salary_field: "view", delete_btn: "hidden" }
/
permissions?: PermissionMap;
/
External services configuration for dependency injection.
/
services?: Record<string, any>;
/
Action handlers map to fulfill string-based intents from the schema.
Forwarded to ActionProvider.
@example { "dispatch:SAVE_DRAFT": api.saveDraft }
/
actions?: Record<string, (payload?: any) => Promise<any>>;
children: React.ReactNode;
}
/
`FormRuntimeProvider` — single composition root for all form runtime services.
Internally composes (in order):

1. `FormOrchestratorProvider` — Global runtime: theme, registry, getComponentProps, visibility
2. `LayoutProvider` — Surface runtime: layoutMode, wizard navigation
3. `LayoutManagerProvider` — Layout runtime: Tabs/Accordion imperative control
4. `ControlProvider` — Primitive control: focus, blur, scrollIntoView
5. `PermissionProvider` — Primitive access: edit / view / hidden per field
6. `DataSourceProvider` — Primitive data: remote options search/refresh
7. `ActionProvider` — Primitive execution: trigger actions
8. `ServiceProvider` — Primitive DI: external service injection
9. `ExpressionProvider` — Primitive rules: dynamic expression evaluation
10. `BindingProvider` — Primitive binding: value binding abstraction
    Each layer corresponds to the hierarchical runtime:

```
Global Runtime (orchestrator)
↓
Surface Runtime (layout + wizard)
↓
Layout Runtime (tabs/accordion)
↓
Primitive Runtime (control + permissions + datasource)
↓
Field Drivers → HeroUI
```

@example

```tsx
// In Form.tsx — replaces 6 nested providers with one:
<FormRuntimeProvider
  orchestrator={orchestratorValue}
  surface={{
    layoutMode: "dashboard",
    isWizard: false,
    initialStepId: "step-1",
  }}
  remoteOptions={form.remoteOptions}
  permissions={{ salary_field: "view", delete_btn: "hidden" }}
>
  {formContent}
</FormRuntimeProvider>
```

---

## [`context/FormShellContext.tsx`](../../../src/shared/ui/form/context/FormShellContext.tsx)

### `FormShellProvider`

_(No documentation provided)_

### `useFormShell`

_(No documentation provided)_

---

## [`context/FormSpacingContext.tsx`](../../../src/shared/ui/form/context/FormSpacingContext.tsx)

### `withFormSpacing`

FORM SPACING CONTEXT
Provides spacing configuration to all form components.
Eliminates prop drilling of spacing config.
/
import { FormOrchestratorProvider, useFormOrchestrator } from "./FormOrchestratorContext";
export const FormSpacingProvider: React.FC<{ spacing: SpacingConfig; children: React.ReactNode }> = ({ spacing, children }) => {
const parent = useFormOrchestrator();
return (
<FormOrchestratorProvider value={{ ...parent, spacing }}>
{children}
</FormOrchestratorProvider>
);
};
export const useFormSpacing = (): SpacingConfig => {
const orchestrator = useFormOrchestrator();
return orchestrator?.spacing || SpacingCalculator.getDefaultSpacing();
};
/
HOC to inject spacing as prop

### `FormSpacingProvider`

_(No documentation provided)_

### `useFormSpacing`

_(No documentation provided)_

---

## [`context/FormThemeContext.tsx`](../../../src/shared/ui/form/context/FormThemeContext.tsx)

### `useStyleAdapter`

Returns the active StyleAdapter from the orchestrator context.
Falls back to TailwindAdapter if no adapter is set.

### `FormThemeProvider`

_(No documentation provided)_

### `useFormTheme`

_(No documentation provided)_

---

## [`context/LayoutContext.tsx`](../../../src/shared/ui/form/context/LayoutContext.tsx)

### `LayoutContextValue`

@file LayoutContext.tsx
@description Backward-compatible composition of SurfaceContext + WizardContext.

## Migration

- New code should import `useSurface` from `./SurfaceContext` for shell concerns.
- New code should import `useWizard` from `./WizardContext` for step navigation.
- `useLayout()` is kept for backward compatibility but is now a merged view of both.

## Architecture (Phase 2 of Runtime Context refactor)

The old LayoutContext mixed shell state (layoutMode, pageTitle, header/footer) with
wizard navigation (currentStepId, history, navigation). These are now separate contexts
with distinct scopes — SurfaceContext for the application shell, WizardContext for
step-by-step flows — then composed here for backward compatibility.
/
import React, { useMemo } from "react";
import { SurfaceProvider, useSurface, type LayoutMode } from "./SurfaceContext";
import { WizardProvider, useWizard } from "./WizardContext";
// Re-export so existing imports continue to work
export type { LayoutMode };
export { useSurface, useWizard };
/
@deprecated Prefer `useSurface()` for shell concerns and `useWizard()` for navigation.
This merged interface is kept for backward-compatibility only.

### `LayoutProvider`

`LayoutProvider` — composes SurfaceProvider + WizardProvider.
Replaces the old monolithic LayoutContext.Provider.
Existing consumers of `useLayout()` continue to work unchanged.

### `useLayout`

@deprecated Use `useSurface()` + `useWizard()` instead.
Returns a merged view of both contexts for backward compatibility.

---

## [`context/LayoutManagerContext.tsx`](../../../src/shared/ui/form/context/LayoutManagerContext.tsx)

### `LayoutManagerProvider`

@file LayoutManagerContext.tsx
@description Phase 3 of Runtime Context refactor.
The LayoutManager provides imperative control over layout nodes
(Tabs, Accordion, SplitPane, Tree) without prop drilling.

## Design Principles

- Each layout node (TabsField, AccordionField) registers itself on mount.
- External code (e.g., FormValidator jumping to an error tab) calls
  `layoutManager.tabs.setActiveTab(nodeId, tabId)` imperatively.
- The manager uses a ref-based registry — no re-renders unless state changes.

## Usage

### Inside a layout driver (TabsField):

```tsx
const { tabs } = useLayoutManager();
const { activeTab, setActiveTab } = tabs.use(field.id, tabs[0]?.id ?? "");
```

### Imperatively (e.g., from FormValidator on submit error):

```ts
const { tabs } = useLayoutManager();
tabs.setActiveTab("settings_tabs_id", "security_tab_id");
```

/
// ── Tabs State ──────────────────────────────────────────────────────────────
interface TabsEntry {
activeTab: string;
setActiveTab: (tabId: string) => void;
}
interface TabsManager {
/ Register a new tabs node and get reactive state + setter. /
use: (nodeId: string, initialTabId: string) => TabsEntry;
/ Imperatively set the active tab of a registered Tabs node. /
setActiveTab: (nodeId: string, tabId: string) => void;
/ Get the current active tab ID for a node (non-reactive). /
getActiveTab: (nodeId: string) => string | undefined;
}
// ── Accordion State ─────────────────────────────────────────────────────────
interface AccordionEntry {
isOpen: boolean;
setOpen: (open: boolean) => void;
toggle: () => void;
}
interface AccordionManager {
/ Register a new accordion node and get reactive state + controls. /
use: (nodeId: string, defaultOpen: boolean) => AccordionEntry;
/ Imperatively open or close a registered accordion node. /
setOpen: (nodeId: string, open: boolean) => void;
/ Toggle an accordion node open/closed. /
toggle: (nodeId: string) => void;
/ Get the current open state for a node (non-reactive). /
isOpen: (nodeId: string) => boolean;
}
// ── Context Value ───────────────────────────────────────────────────────────
export interface LayoutManagerContextValue {
tabs: TabsManager;
accordion: AccordionManager;
}
// ── Implementation ──────────────────────────────────────────────────────────
/
A lightweight reactive store for a single layout node's state.
Uses a ref + external state subscription pattern to avoid
re-rendering the whole tree when one node changes.
/
function useNodeState<T>(
nodeId: string,
initial: T,
registryRef: React.MutableRefObject<Map<string, { state: T; setState: (v: T) => void }>>
) {
const [state, setState] = useState<T>(() => {
return registryRef.current.get(nodeId)?.state ?? initial;
});
// Register on first render
if (!registryRef.current.has(nodeId)) {
registryRef.current.set(nodeId, { state, setState });
}
// Keep the registry in sync with the current setter
const entry = registryRef.current.get(nodeId)!;
entry.setState = setState;
entry.state = state;
return [state, setState] as const;
}
// ── Context ─────────────────────────────────────────────────────────────────
const LayoutManagerContext = createContext<LayoutManagerContextValue | undefined>(
undefined
);
/
`LayoutManagerProvider` — wraps a form/surface subtree that contains
layout nodes (Tabs, Accordion, etc.).
Typically placed at the same level as `FormOrchestratorProvider`.

### `useLayoutManager`

Access the LayoutManager's imperative API.
@example
// Jump to a tab from a submit-error handler:
const { tabs } = useLayoutManager();
tabs.setActiveTab("settings_node_id", "security_tab_id");

### `useTabsNode`

`useTabsNode` — called inside a `TabsField` component.
Registers the node with the LayoutManager and returns reactive state.
External code can then call `layoutManager.tabs.setActiveTab(nodeId, tabId)`
to imperatively control which tab is active.
@example
const { activeTab, setActiveTab } = useTabsNode(field.id, tabs[0]?.id ?? "");

### `useAccordionNode`

`useAccordionNode` — called inside an `AccordionField` component.
Registers the node with the LayoutManager and returns reactive open/close state.
External code can call `layoutManager.accordion.setOpen(nodeId, true)` to
imperatively expand the accordion (e.g., to reveal a validation error).
@example
const { isOpen, setOpen, toggle } = useAccordionNode(field.id, false);

### `LayoutManagerContextValue`

_(No documentation provided)_

---

## [`context/ManifestRegistryContext.tsx`](../../../src/shared/ui/form/context/ManifestRegistryContext.tsx)

### `ManifestRegistryProvider`

_(No documentation provided)_

### `useManifestRegistry`

_(No documentation provided)_

---

## [`context/PermissionContext.tsx`](../../../src/shared/ui/form/context/PermissionContext.tsx)

### `PermissionProvider`

@file PermissionContext.tsx
@description Field-level permission manager for the form runtime.
The PermissionManager is the context equivalent of what the chat architecture
calls "PermissionManager" — scoped to the form/primitive layer.
It provides per-field permission resolution so that field drivers can
determine their access level without receiving permission props.

## Permission Model

Each field can have one of:

- `"edit"` — user can view and modify the field (default)
- `"view"` — user can see the value but not modify it (read-only)
- `"hidden"` — field is completely hidden from the user

## Usage

### Provide permissions at the form root:

```tsx
<PermissionProvider
  permissions={{
    salary_field: "view", // read-only
    admin_notes: "hidden", // invisible to this user
  }}
>
  <Form definition={def} />
</PermissionProvider>
```

### Inside a field driver (automatic — drivers read via hook):

```tsx
const { canEdit, canView, isHidden } = useFieldPermission(field.id);
if (isHidden) return null;
```

### Dynamic permission updates:

```tsx
const { updatePermissions } = usePermissionManager();
updatePermissions({ salary_field: "edit" });
```

/
// ── Types ─────────────────────────────────────────────────────────────────
export type FieldPermission = "edit" | "view" | "hidden";
export interface PermissionMap {
[fieldId: string]: FieldPermission;
}
export interface PermissionManagerValue {
/ Resolve the permission for a given field ID. Defaults to "edit" if not set. /
getPermission: (fieldId: string) => FieldPermission;
/ Update permissions at runtime (e.g., when user role changes). /
updatePermissions: (updates: PermissionMap) => void;
/ Replace the entire permission map. /
setPermissions: (permissions: PermissionMap) => void;
}
export interface FieldPermissionResult {
permission: FieldPermission;
/ True if the field can be edited (permission === "edit"). /
canEdit: boolean;
/ True if the field is visible (permission !== "hidden"). /
canView: boolean;
/ True if the field is completely hidden. /
isHidden: boolean;
}
// ── Context ─────────────────────────────────────────────────────────────────
const PermissionContext = createContext<PermissionManagerValue | undefined>(
undefined
);
const DEFAULT_MANAGER: PermissionManagerValue = {
getPermission: () => "edit",
updatePermissions: () => {},
setPermissions: () => {},
};
/
`PermissionProvider` — provides field-level permission resolution to the form tree.
Place at the form root (or scoped to a subset of the form).
@example
<PermissionProvider permissions={{ invoice_total: "view", delete_btn: "hidden" }}>

<Form definition={def} />
</PermissionProvider>

### `usePermissionManager`

Initial permission map: { [fieldId]: "edit" | "view" | "hidden" } /
permissions?: PermissionMap;
}> = ({ children, permissions: initialPermissions = {} }) => {
const [permMap, setPermMap] = React.useState<PermissionMap>(initialPermissions);
const getPermission = useCallback(
(fieldId: string): FieldPermission => permMap[fieldId] ?? "edit",
[permMap]
);
const updatePermissions = useCallback((updates: PermissionMap) => {
setPermMap((prev) => ({ ...prev, ...updates }));
}, []);
const setPermissions = useCallback((permissions: PermissionMap) => {
setPermMap(permissions);
}, []);
const value: PermissionManagerValue = useMemo(
() => ({ getPermission, updatePermissions, setPermissions }),
[getPermission, updatePermissions, setPermissions]
);
return (
<PermissionContext.Provider value={value}>
{children}
</PermissionContext.Provider>
);
};
// ── Hooks ────────────────────────────────────────────────────────────────────
/
`usePermissionManager` — access the full permission manager API.
Use this to update permissions dynamically or check multiple fields.
@example
const { updatePermissions } = usePermissionManager();
updatePermissions({ salary_field: "edit" });

### `useFieldPermission`

`useFieldPermission` — called inside a field driver to get its access level.
Returns derived booleans so drivers don't need to compare strings.
@example
const { canEdit, isHidden } = useFieldPermission(field.id);
if (isHidden) return null;
return <input disabled={!canEdit} ... />;

### `FieldPermission`

_(No documentation provided)_

### `PermissionMap`

_(No documentation provided)_

### `PermissionManagerValue`

_(No documentation provided)_

### `FieldPermissionResult`

_(No documentation provided)_

---

## [`context/ServiceContext.tsx`](../../../src/shared/ui/form/context/ServiceContext.tsx)

### `ServiceManagerValue`

@file ServiceContext.tsx
@description Service Manager for injecting API services and external dependencies.

### `ServiceProviderProps`

_(No documentation provided)_

### `ServiceProvider`

_(No documentation provided)_

### `useServiceManager`

_(No documentation provided)_

### `useService`

_(No documentation provided)_

---

## [`context/SurfaceContext.tsx`](../../../src/shared/ui/form/context/SurfaceContext.tsx)

### `LayoutMode`

SurfaceContext
Manages application-shell concerns only:

- Layout mode (dashboard, portal, fullscreen, drawer, modal, inline)
- Page shell feature enrollment (header / footer)
- Page metadata (title, description)
  Replaces the shell portion of the old LayoutContext.
  Does NOT include wizard navigation (see WizardContext).

### `SurfaceContextValue`

_(No documentation provided)_

### `SurfaceProvider`

_(No documentation provided)_

### `useSurface`

_(No documentation provided)_

---

## [`context/WizardContext.tsx`](../../../src/shared/ui/form/context/WizardContext.tsx)

### `WizardContextValue`

WizardContext
Manages multi-step wizard navigation only.
Scoped to a single wizard instance — multiple wizards on the page
can each have their own WizardProvider without conflicting.
Extracted from the old LayoutContext to keep surface concerns separate
from step-navigation concerns.
@example
<WizardProvider initialStepId="step-1">
<WizardStep />
</WizardProvider>

### `WizardProvider`

_(No documentation provided)_

### `useWizard`

_(No documentation provided)_

---

## [`context/createLayoutStore.ts`](../../../src/shared/ui/form/context/createLayoutStore.ts)

### `LayoutMode`

_(No documentation provided)_

### `LayoutState`

_(No documentation provided)_

### `LayoutStore`

_(No documentation provided)_

### `createLayoutStore`

_(No documentation provided)_

---

## [`core/LazyRegistryStore.tsx`](../../../src/shared/ui/form/registry/LazyRegistryStore.tsx)

### `LazyRegistryStore`

@file LazyRegistryStore.ts
@description RegistryStore with support for lazy (code-split) field component registration.
Co-located with RegistryStore to avoid circular dependencies:
RegistryStore → lazy-registry-builder → LazyRegistryStore (was in utils/) → RegistryStore
Now: RegistryStore → LazyRegistryStore (here) → no circular path.
/
import React from "react";
import { RegistryStore } from "./RegistryStore";
import type { FieldComponent } from "../fields/registry";
type LazyImporter = () => Promise<{ default: FieldComponent } | FieldComponent>;
/
RegistryStore extension that supports both eager and lazy field registration.

- `register(type, component)` — eager, same as base RegistryStore
- `registerLazy(type, importer)` — deferred; `import()` runs on first `get(type)`
  `instanceof RegistryStore` returns `true`. `Object.keys()` enumerates eagerly
  registered types. Lazy types appear only after they've been loaded.

---

## [`core/ManifestRegistry.ts`](../../../src/core/form-core/ManifestRegistry.ts)

### `ManifestRegistry`

@file ManifestRegistry.ts
@description Unified registry for field types, layout renderers, field components,
and per-type InstanceDefinition defaults.
Replaces 5 scattered registries:

- `FIELD_REGISTRY` → `manifestRegistry.getField(type)`
- `fieldRegistry` → `manifestRegistry.getFieldComponent(type)`
- `FIELD_METADATA` → `manifestRegistry.getLabel(type)` / `getIcon(type)`
- `layoutRendererRegistry` → `manifestRegistry.getLayout(type)`
- `RegistryStore.definitions` → `manifestRegistry.getInstanceDefaults(type)`
  Each field type registers once via `registerField()`, which provides the
  complete routing, rendering, capabilities, and metadata contract.
  @module ManifestRegistry
  /
  import type React from "react";
  import type {
  FieldManifest,
  ManifestFieldCategory,
  FieldRouting,
  LayoutRendererManifest,
  InstanceDefinition,
  } from "../types/manifest";
  /
  ManifestRegistry — Central authority for field-type metadata.
  Features:
- Single registration for all metadata (category, routing, capabilities, icons, etc.)
- Backward-compatible alias support (e.g. "email" → "text")
- Lazy component resolution via `resolveFieldComponent()`
- Per-type InstanceDefinition defaults (options source, value mapping, selection config)
- Layout renderer registration (CardRenderer, TabsRenderer, etc.)
  Usage:

```ts
manifestRegistry.registerField({
type: "select",
category: "input",
routing: "leaf",
capabilities: { hasValue: true, hasValidity: true, ... },
label: "Select Dropdown",
wrapper: { enabled: true },
});
const category = manifestRegistry.getCategory("select"); // "input"
```

### `manifestRegistry`

@internal Map of field type → FieldManifest (including aliases). /
private fields = new Map<string, FieldManifest>();
/ @internal Map of layout type → LayoutRendererManifest. /
private layouts = new Map<string, LayoutRendererManifest>();
/ @internal Map of field type → eagerly-loaded React component (overrides manifest.component). /
private fieldComponents = new Map<string, React.ComponentType<any>>();
/ @internal Map of field type → Factory that produces InstanceDefinition defaults for that type. /
private instanceDefaults = new Map<string, (schemaField: any) => InstanceDefinition>();
// ── Field registration ──────────────────────────────────────────────────
/
Register a single field manifest.
Also creates alias entries for `manifest.aliases`.
@param manifest - Complete FieldManifest for the field type.
/
registerField(manifest: FieldManifest): void {
this.fields.set(manifest.type, { ...manifest, \_isAlias: false });
for (const alias of manifest.aliases ?? []) {
this.fields.set(alias, { ...manifest, type: alias, \_isAlias: true });
}
}
/
Register an eager React component override for a field type.
Used by `registry.tsx` and `LazyRegistryStore.register()` to sync
legacy registrations into the manifest system.
@param type - Field type string.
@param component - React component for this field type.
/
registerFieldComponent(type: string, component: React.ComponentType<any>): void {
this.fieldComponents.set(type, component);
}
/
Register a factory that produces InstanceDefinition defaults for a field type.
The factory receives the schema field object, allowing defaults to be
conditional per instance. Merged with schema-level config (remoteOptions, options, etc.)
in `resolveInstanceDefinition()`.
@param type - Field type string (e.g. "select", "autocomplete").
@param factory - Function receiving the schema field and returning InstanceDefinition defaults.
/
registerInstanceDefaults(
type: string,
factory: (schemaField: any) => InstanceDefinition
): void {
this.instanceDefaults.set(type, factory);
}
// ── Layout registration ─────────────────────────────────────────────────
/
Register a layout renderer manifest.
@param manifest - Complete LayoutRendererManifest.
/
registerLayout(manifest: LayoutRendererManifest): void {
this.layouts.set(manifest.type, manifest);
}
// ── Queries ─────────────────────────────────────────────────────────────
/
Get the FieldManifest for a given type.
@param type - Field type string.
@returns The FieldManifest, or `undefined` if not registered.
/
getField(type: string): FieldManifest | undefined {
return this.fields.get(type);
}
/
Get the LayoutRendererManifest for a given layout type.
@param type - Layout type string.
@returns The LayoutRendererManifest, or `undefined` if not registered.
/
getLayout(type: string): LayoutRendererManifest | undefined {
return this.layouts.get(type);
}
/
Get the eager React component override for a field type.
@param type - Field type string.
@returns The registered component, or `undefined`.
/
getFieldComponent(type: string): React.ComponentType<any> | undefined {
return this.fieldComponents.get(type);
}
/
Resolve the component for a field type with lazy loading support.
Resolution priority:

1. `manifest.loader()` — async lazy import
2. `registerFieldComponent()` — eager override
3. `manifest.component` — inline component from manifest
   @param type - Field type string.
   @returns A promise resolving to the React component, or `undefined`.
   /
   async resolveFieldComponent(type: string): Promise<React.ComponentType<any> | undefined> {
   const manifest = this.fields.get(type);
   if (manifest?.loader) {
   const mod = await manifest.loader();
   return mod.default;
   }
   return this.fieldComponents.get(type) ?? (manifest?.component as any);
   }
   /
   Get the manifest category for a field type.
   @param type - Field type string.
   @returns The manifest category, defaults to `"input"` if not registered.
   /
   getCategory(type: string): ManifestFieldCategory {
   return this.fields.get(type)?.category ?? "input";
   }
   /
   Get the routing strategy for a field type.
   @param type - Field type string.
   @returns The routing value, defaults to `"leaf"` if not registered.
   /
   getRouting(type: string): FieldRouting {
   return this.fields.get(type)?.routing ?? "leaf";
   }
   /
   Get the capabilities contract for a field type.
   @param type - Field type string.
   @returns The FieldCapabilities object, or `undefined` if not registered.
   /
   getCapabilities(type: string) {
   return this.fields.get(type)?.capabilities;
   }
   /
   Whether a field type acts as a container (renders children).
   @param type - Field type string.
   @returns `true` if category is `"container"` or `"composite"`.
   /
   isContainer(type: string): boolean {
   const cat = this.getCategory(type);
   return cat === "container" || cat === "composite";
   }
   /
   Whether a field type is structural (container, composite, or repeater).
   @param type - Field type string.
   @returns `true` if category is container/composite or routing is "repeater".
   /
   isStructural(type: string): boolean {
   return this.isContainer(type) || this.getRouting(type) === "repeater";
   }
   /
   Whether a field type accepts and renders children.
   @param type - Field type string.
   @returns `true` if the manifest's `layout.acceptsChildren` is `true`.
   /
   acceptsChildren(type: string): boolean {
   return this.fields.get(type)?.layout?.acceptsChildren ?? false;
   }
   /
   Get the InstanceDefinition defaults factory for a field type.
   @param type - Field type string.
   @returns The factory function, or `undefined`.
   /
   getInstanceDefaults(type: string): ((schemaField: any) => InstanceDefinition) | undefined {
   return this.instanceDefaults.get(type);
   }
   /
   Get the withAtom wrapper configuration for a field type.
   @param type - Field type string.
   @returns The wrapper config (enabled, showLabel, wrapOuter), or `undefined`.
   /
   getWrapper(type: string): { enabled: boolean; showLabel?: boolean; wrapOuter?: boolean } | undefined {
   return this.fields.get(type)?.wrapper;
   }
   /
   Get the human-readable label for a field type.
   @param type - Field type string.
   @returns The label, or the type string itself as fallback.
   /
   getLabel(type: string): string {
   return this.fields.get(type)?.label ?? type;
   }
   /
   Get the icon component for a field type.
   @param type - Field type string.
   @returns The icon component, or `undefined`.
   /
   getIcon(type: string): React.ComponentType<{ size?: number }> | undefined {
   return this.fields.get(type)?.icon;
   }
   /
   Get all registered field manifests (including aliases).
   @returns Array of all FieldManifest entries.
   /
   getAllFields(): FieldManifest[] {
   return Array.from(this.fields.values());
   }
   /
   Get only the primary (non-alias) field manifests.
   Useful for builder UIs that should show each distinct field type once.
   @returns Array of primary FieldManifest entries.
   /
   getAllPrimaryFields(): FieldManifest[] {
   return Array.from(this.fields.values()).filter((m) => !m.\_isAlias);
   }
   /
   Get all registered layout renderer manifests.
   @returns Array of all LayoutRendererManifest entries.
   /
   getAllLayouts(): LayoutRendererManifest[] {
   return Array.from(this.layouts.values());
   }
   /
   Check if a field type is registered.
   @param type - Field type string.
   @returns `true` if the type (or alias) exists in the registry.
   /
   hasField(type: string): boolean {
   return this.fields.has(type);
   }
   /
   Check if a layout type is registered.
   @param type - Layout type string.
   @returns `true` if the layout type exists in the registry.
   /
   hasLayout(type: string): boolean {
   return this.layouts.has(type);
   }
   // ── Bulk registration ───────────────────────────────────────────────────
   /
   Register multiple field manifests in a single call.
   @param manifests - Array of FieldManifest objects.
   /
   registerFields(manifests: FieldManifest[]): void {
   for (const m of manifests) this.registerField(m);
   }
   /
   Register multiple layout renderer manifests in a single call.
   @param manifests - Array of LayoutRendererManifest objects.
   /
   registerLayouts(manifests: LayoutRendererManifest[]): void {
   for (const m of manifests) this.registerLayout(m);
   }
   }
   / Singleton instance used across the form system.

---

## [`core/RegistryStore.ts`](../../../src/shared/ui/form/registry/RegistryStore.ts)

### `FieldDefinition`

FieldDefinition
Defines the strict structural, validation, and rendering contract for a field type.
Bundles raw API payload validation, lightweight mappers, and pure presenter components.

### `RegistryStore`

RegistryStore - Manages the mapping of field types to React components.
Extends the static registry into a dynamic plugin system supporting:

1. Runtime component and contract definition registration.
2. Context-dependent definition overrides (e.g. per-tenant, per-form overrides).
3. Zod-powered schema contract verification at boundary level.
4. Lightweight pure mapping & elegant fallbacks.

---

## [`core/SchemaRegistry.ts`](../../../src/core/form-core/SchemaRegistry.ts)

### `SchemaRegistry`

SchemaRegistry — Central authority for Form Schemas.
Replaces bespoke controllers by allowing developers to register form
definition factories centrally. The `useDynamicForm` hook can then
retrieve these schemas lazily by ID.

### `schemaRegistry`

Register a form schema factory.
@param formId Unique identifier for the form (e.g., "create-branch")
@param factory Function that returns the FormDefinition (can execute fuseSchema internally)
/
public register(formId: string, factory: SchemaBuilderFactory): void {
if (this.schemas.has(formId)) {
console.warn(`[SchemaRegistry] Overwriting existing schema for "${formId}"`);
}
this.schemas.set(formId, factory);
}
/
Check if a schema is registered.
/
public has(formId: string): boolean {
return this.schemas.has(formId);
}
/
Retrieve and build a form schema.
/
public async resolve(formId: string): Promise<FormDefinition> {
const factory = this.schemas.get(formId);
if (!factory) {
throw new Error(`[SchemaRegistry] No schema registered for form ID: "${formId}"`);
}
return factory();
}
/
Retrieve and build a form schema synchronously.
/
public resolveSync(formId: string): FormDefinition {
const factory = this.schemas.get(formId);
if (!factory) {
throw new Error(`[SchemaRegistry] No schema registered for form ID: "${formId}"`);
}
const result = factory();
if (result instanceof Promise) {
throw new Error(`[SchemaRegistry] Schema for "${formId}" is async. Use resolve() instead.`);
}
return result;
}
}
/ Singleton instance used across the form system.

### `SchemaBuilderFactory`

_(No documentation provided)_

---

## [`core/backend-normalizer.ts`](../../../src/core/form-core/backend-normalizer.ts)

### `BackendMetadataNormalizer`

BackendMetadataNormalizer
Transforms heterogeneous backend metadata (REST, SAP, Oracle, GraphQL)
into canonical Zenith MetaSchema FormDefinition / ContentDefinition.

### `BackendFieldMetadata`

_(No documentation provided)_

### `BackendSchemaMetadata`

_(No documentation provided)_

---

## [`core/composite-registry.ts`](../../../src/core/form-core/composite-registry.ts)

### `COMPOSITE_DCS`

COMPOSITE_DCS (Data Component Specification)
This registry defines reusable "Schema Fragments".
These are NOT React components; they are engine-level templates that the
FormCore ECS (Engine Component Specification) expands at runtime.

### `getCompositeFields`

address-group
A standard international address block.
/
"address-group": [
{
name: "street",
type: "text",
label: "Street Address",
properties: { placeholder: "123 Main St", width: "full" },
},
{
name: "city",
type: "text",
label: "City",
properties: { width: "half" },
},
{
name: "zip",
type: "text",
label: "ZIP / Postal Code",
properties: { width: "half" },
},
],
/
branch-address-group
A regional corporate branch address block with localized fields (line1, city, state).
/
"branch-address-group": [
{
name: "line1",
type: "text",
label: "Street Address",
required: true,
properties: { placeholder: "123 Main St", width: "full" },
meta: { ui: { icon: "home" } },
},
{
name: "city",
type: "text",
label: "City",
required: true,
properties: { width: "half" },
meta: { ui: { icon: "map" } },
},
{
name: "state",
type: "text",
label: "State/Province",
required: true,
properties: { width: "half" },
meta: { ui: { icon: "map" } },
},
],
/
table-filter-section
A high-density filtering block for data tables.
/
"table-filter-section": [
{
name: "search",
type: "text",
label: "Quick Search",
meta: { ui: { icon: "Search" } },
properties: { placeholder: "Search records...", width: "full" },
},
{
name: "status",
type: "select",
label: "Status",
options: [
{ label: "Active", value: "active" },
{ label: "Pending", value: "pending" },
{ label: "Archived", value: "archived" },
],
properties: { width: "half" },
},
{
name: "dateRange",
type: "date",
label: "Date Range",
properties: { width: "half" },
},
],
};
/
Resolves a composite type to its DCS fields.

---

## [`core/condition-proxy.ts`](../../../src/core/form-core/condition-proxy.ts)

### `ConditionContext`

@file condition-proxy.ts
@description Evaluates conditional logic (field visibility, disabled state, setValue triggers)
against the current form values.

## Responsibility

The `ConditionProxy` is a pure evaluator — it takes the current form values
and a field's condition schema, and returns answers: "should this field be visible?",
"should this field be disabled?", "what values should be set on other fields?"
It does NOT mutate state. It does NOT know about React. It is a stateless
computation engine over a snapshot of values.

## Condition Schema Structure

```
ConditionExpression
└── groups: ConditionGroup[]  (AND/OR between groups)
└── rules: ConditionRule[] (AND/OR within a group)
└── { field, operator, value }
```

## Supported Group Actions

| Action     | Method                                    | Effect                                  |
| ---------- | ----------------------------------------- | --------------------------------------- |
| `show`     | `isVisible()`                             | Field is visible when rules pass        |
| `hide`     | `isVisible()`                             | Field is hidden when rules pass         |
| `enable`   | `isEnabled()`                             | Field is interactable when rules pass   |
| `disable`  | `isEnabled()`                             | Field is disabled when rules pass       |
| `setValue` | `getSetValueEffects()`                    | Other fields get values when rules pass |
| `validate` | Used by ValidationProxy (rule.when logic) |                                         |

## Used By

- {@link FormVisibility.evaluateVisibility} — calls `isVisible()` and `isEnabled()`.
- {@link FormRuntime} — holds the singleton instance shared across modules.
- {@link ValidationProxy} — calls `evaluateExpression()` for `rule.when` checks.
  /
  import { get } from "lodash-es";
  import { conditionRegistry } from "./condition-registry";
  import type { FormField } from "../types";
  import type { ConditionExpression, ConditionGroup, ConditionOperator } from "../types/condition";
  / Context provided to functional predicates for edge-case logic

### `ConditionProxy`

_(No documentation provided)_

---

## [`core/condition-registry.ts`](../../../src/core/form-core/condition-registry.ts)

### `ConditionOperatorFn`

@file condition-registry.ts
@description Central plugin-based registry for condition operators.
Follows the Open/Closed principle: Add new operators here without
modifying the core ConditionProxy evaluation logic.

### `conditionRegistry`

_(No documentation provided)_

---

## [`core/default-registry.ts`](../../../src/shared/ui/form/fields/lazy-registry-builder.ts)

### `defaultRegistry`

@file default-registry.ts
@description Default registry singleton factory.
Isolated in its own file to break the circular dependency:
RegistryStore → LazyRegistryStore → RegistryStore
This module is loaded AFTER RegistryStore class is fully defined,
so LazyRegistryStore can safely extend it.
/
import { LazyRegistryStore } from "./LazyRegistryStore";
import { createDefaultRegistry } from "../fields/lazy-registry-builder";
/
The shared default registry instance used by <Form> when no custom registry is provided.
All heavy field types are registered lazily here; only the 80/20 core types are eager.

---

## [`core/engine.ts`](../../../src/core/form-core/engine.ts)

### `ValidationMode`

@file engine.ts
@description The headless Form Engine — composition root for all form modules.

## Architecture Overview

`FormCore` is the composition root of the form engine. It wires together
9 focused single-responsibility modules and exposes a clean public API.
It has no React dependency — it can be used in any JavaScript environment.

```
FormCore<T>
├── FieldRegistry      — normalizes the definition tree → O(1) field lookups
├── FieldResolver      — resolves fields by ID, name, or repeater path
├── StateManager       — holds the 5V state, pub/sub reactivity
├── ErrorManager       — single write path for validity/errors
├── DebugManager       — opt-in diagnostics logging
├── FormRuntime        — groups ValueProxy, ConditionProxy, FlowProxy
├── FormValidator      — orchestrates validation against a pluggable adapter
├── FormVisibility     — cascading show/hide evaluation with side effects
└── FormExecution      — setValue pipeline, middleware chain, blur handling
```

## Validation Modes

| Mode       | When validation fires                                   |
| ---------- | ------------------------------------------------------- |
| `onChange` | Immediately on every value change                       |
| `onBlur`   | When a field loses focus (recommended default)          |
| `onSubmit` | Only on explicit `form.submit()` call                   |
| `manual`   | Only via explicit `form.validateFields([...])` calls    |
| `lazy`     | `onBlur` until first submit, then `onChange` thereafter |

## 5V State Accessors

```
form.values      // V1: ValuesState<T>     — current data
form.validity    // V2: ValidityState      — errors per field
form.visibility  // V3: VisibilityState    — visible fields
form.view        // V4: ViewState          — dynamic display props
form.vitality    // V5: VitalityState      — touched/dirty/focused
```

## Usage Example

```typescript
const form = new FormCore(definition, { name: "Alice" });
// Subscribe to state changes (for custom React hook)
const unsub = form.subscribe((state) => setFormState({ ...state }));
// Get merged component props
const props = form.getComponentProps("name_field_id"); // via Form / ReactFormAdapter
// Submit
const isValid = await form.submit();
if (isValid) await api.save(form.values);
// Cleanup
unsub();
```

/
import type { FormField } from "@ui/form/fields";
import type { FormDefinition } from "@ui/form/types";
import { toCanonicalMetadataEvents } from "@ui/form/utils/schema-compat";
import { cloneDeep, unset } from "lodash-es";
// ── Internal Type Re-exports ───────────────────────────────────────────────────
import type {
DetailedError,
FieldEntity,
InternalFormState,
NormalizedForm,
RenderNode,
SectionEntity,
ValidityState,
ValuesState,
ViewState,
VisibilityState,
VitalityState,
} from "./int-types";
// ── Module Imports ─────────────────────────────────────────────────────────────
import {
DebugManager,
ErrorManager,
FieldRegistry,
FieldResolver,
FormExecution,
FormRuntime,
FormValidator,
FormVisibility,
RemoteOptionsManager,
RepeaterRowFactory,
ResolutionPipeline,
StateManager,
denormalizeForm,
normalizeFormDefinition,
} from "./modules";
import { CircuitBreaker, formCircuitBreaker } from "./modules/circuit-breaker";
import { FormHistory } from "./modules/history";
import type { IFormCore } from "./form-interface";
import type { ValidationAdapter } from "./validation-adapter";
import { ValidationProxy } from "./validation-proxy";
import type { ValidationMessageConfig } from "./validation-proxy";
// ── Validation Mode ────────────────────────────────────────────────────────────
/
Controls when validation is triggered during user interaction.

- `'onChange'` — Validate on every keystroke/change (aggressive, noisy UX).
- `'onBlur'` — Validate only when a field loses focus (recommended).
- `'onSubmit'` — Validate only on form submission (least intrusive).
- `'manual'` — Validate only via explicit `form.validateFields()` calls.
- `'lazy'` — `onBlur` until the user's first submit attempt, then `onChange`.
  This progressively tightens feedback without front-loading errors.

### `FormCoreOptions`

Configuration options for the form engine.

### `FormCore`

Controls when validation fires during user interaction.
@default 'onBlur'
/
validationMode?: ValidationMode;
/
If `true`, validates all fields immediately after the engine is constructed.
Useful for forms pre-populated with server data where you want immediate error state.
@default false
/
validateOnMount?: boolean;
/
Delay in milliseconds before triggering onChange validation.
Prevents excessive validation calls during rapid typing.
@default 300
/
validationDebounceMs?: number;
/
Optional custom ValidationAdapter (e.g., Yup, Zod).
If provided, replaces the built-in ValidationProxy.
/
validatorAdapter?: ValidationAdapter;
/
Per-field, per-rule error message overrides for the internal ValidationProxy.
/
messageConfig?: ValidationMessageConfig;
/
Optional i18n namespace for translating field labels and validation messages.
Defaults to 'features:forms'.
/
i18nNamespace?: string;
/
Optional outer facade interface (e.g. Form) to be passed as the 'form' parameter
in middleware callbacks instead of the raw FormCore engine.
/
facade?: IFormCore<any>;
/
Visual density for field layout: 'compact' | 'comfortable' | 'spacious'.
@default 'comfortable'
/
density?: "compact" | "comfortable" | "spacious";
/
Max consecutive failures before opening the circuit (default: 3).
/
circuitBreakerThreshold?: number;
/
Milliseconds to wait before attempting recovery (default: 30000).
/
circuitBreakerResetTimeoutMs?: number;
/
Max half-open probes before giving up (default: 2).
/
circuitBreakerMaxHalfOpenProbes?: number;
}
// ── Public Type Re-exports ─────────────────────────────────────────────────────
export type {
InternalFormState,
NormalizedForm,
ValuesState,
ValidityState,
VisibilityState,
ViewState,
VitalityState,
DetailedError,
SectionEntity,
FieldEntity,
};
export { normalizeFormDefinition, denormalizeForm };
// ============================================================================
// FORM ENGINE CORE (HEADLESS)
// ============================================================================
/
The headless form engine. Framework-agnostic and fully testable without React.
Composes 9 single-responsibility modules behind a unified API.
It has zero React dependency — it can run in Node.js, tests, or any UI framework.
Prefer {@link Form} for React applications — it extends this class and adds
`getComponentProps()` via a bundled {@link ReactFormAdapter}.

---

### Quick-start

```typescript
const form = new FormCore<{ name: string; role: string }>(definition, {
name: "Alice",
});
// Read state at any time
form.values;     // { name: "Alice", role: null }
form.validity;   // { name_id: { valid: true, errors: [] }, ... }
// Mutate
await form.setValue("name", "Bob");          // full pipeline: validate + visibility
form.setTouched("name_id");                  // mark for error display
form.setError("name_id", { ... });           // apply server errors
// Validate & submit
const ok = await form.submit();              // marks all touched, validates all
if (ok) await api.save(form.values);
// React to changes
const unsub = form.subscribe(s => setUiState(s));
return () => unsub();                        // cleanup
```

---

### Validation modes

| Mode       | When validation fires                                   |
| ---------- | ------------------------------------------------------- |
| `onChange` | After every value change                                |
| `onBlur`   | When a field loses focus (recommended default)          |
| `onSubmit` | Only on `form.submit()`                                 |
| `manual`   | Only via `form.validateFields([...])`                   |
| `lazy`     | `onBlur` until first submit, then `onChange` thereafter |

@template T - The typed form data shape.
Specify for autocomplete on `form.values` and `form.setValue(name, value)`.
Leave as default (`Record<string, any>`) for untyped use.
@see {@link Form} — React-ready wrapper (adds `getComponentProps`)
@see {@link ValidationAdapter} — plug in Yup/Zod/custom validation

---

## ``core/expression-engine.ts``

### `ExpressionEngine`

ExpressionEngine
Evaluates template expressions (e.g. "${customer.name}", "${total > 1000}")
and helper functions (sum, currency, uppercase) without raw eval() or Function unsafe code.

### `ExpressionContext`

_(No documentation provided)_

---

## [`core/flow-proxy.ts`](../../../src/core/form-core/flow-proxy.ts)

### `FlowProxy`

_(No documentation provided)_

---

## [`core/form-interface.ts`](../../../src/core/form-core/form-interface.ts)

### `IFormQuery`

@file form-interface.ts
@description The stable public contract for the form engine.

## Why this file exists

`FormCore` is the implementation. `IFormCore` is the contract.
Consumers (hooks, adapters, tests) should depend on `IFormCore`, not
on the concrete `FormCore` class. This enforces:

- ISP — consumers only see the methods they need via narrowed sub-interfaces.
- DIP — modules import the abstraction, not the implementation.
- LSP — `Form` (the React facade) can now implement `IFormCore` via
  delegation without extending `FormCore`, eliminating the inheritance
  chain that caused the `getComponentProps` recursion bug.

## Sub-interface design

The full `IFormCore` is composed from three focused sub-interfaces:
| Interface | Concern |
|-------------------|--------------------------------------------------|
| `IFormQuery` | Read-only state access (values, validity, etc.) |
| `IFormMutation` | State-changing operations (setValue, reset, etc.)|
| `IFormLifecycle` | Subscriptions, field resolution, diagnostics |
/
import type { FormField } from "@ui/form/fields";
import type {
DetailedError,
InternalFormState,
ResolvedFieldProps,
ValidityState,
ViewState,
VisibilityState,
VitalityState,
NormalizedForm,
} from "@ui/form/core/int-types";
// ── Sub-interface 1: Query (Read) ─────────────────────────────────────────────
/
Read-only access to the form's 5V state matrix.
Safe to expose to components that must not mutate form state.

### `IFormMutation`

State-mutating operations.
Only expose to components/hooks that legitimately need to write form state.

### `IFormLifecycle`

Subscription and lifecycle management.

### `IFormCore`

Full form engine contract.
Composed from the three focused sub-interfaces.
FormCore, Form, and any mock/test double must implement this.

---

## [`core/form.ts`](../../../src/core/form-core/form.ts)

### `Form`

@file form.ts
@description The `Form` facade — the primary entry point for React applications.

## Architecture (Composition over Inheritance)

`Form` now uses composition — it holds a `FormCore` instance internally
and delegates all method calls to it. It does NOT extend `FormCore`.

### Why this matters (LSP fix)

Previously `Form extends FormCore` and overrode `getComponentProps()`.
The `ReactFormAdapter` held a reference to `this.core` (the `Form` instance),
so calling `this.core.getComponentProps()` recursed back into the override —
a Liskov Substitution Principle violation that caused a `RangeError`.
With composition, `Form` passes the inner `FormCore` directly to the adapter.
The adapter calls `FormCore.getComponentProps()` (no override, no recursion),
then enriches the result with React handlers.

```
Form
├── engine: FormCore           ← pure headless engine
└── adapter: ReactFormAdapter  ← receives engine (NOT Form)
└── engine.getComponentProps() ← direct, no recursion
```

## When to use `Form` vs `FormCore`

| Use Case                                      | Use                         |
| --------------------------------------------- | --------------------------- |
| React component-driven forms (standard usage) | `Form`                      |
| Headless, framework-agnostic, or testing      | `FormCore`                  |
| Custom adapter (non-React, Vue, native)       | `FormCore` + custom adapter |

## Usage

```typescript
const form = new Form(definition, { email: "alice@example.com" });
// Get merged React props for a field component:
const props = form.getComponentProps("email_field_id");
// → { id, name, label, value, error, onChange, onBlur, ... }
// Subscribe to state changes in a React hook:
form.subscribe(setState);
// Submit and validate:
const isValid = await form.submit();
```

## Backward Compatibility

The public API surface is identical to the previous `extends FormCore` shape.
All consumer code (`form.values`, `form.setValue`, `form.submit`, etc.) works
unchanged — the implementation changed, the contract did not.
/
import type { FormDefinition } from "@ui/form/types";
import { FormCore } from "./engine";
import type { FormCoreOptions } from "./engine";
import type { IFormCore } from "./form-interface";
import { ReactFormAdapter } from "./react-adapter";
import type { ValidationMessageConfig } from "./validation-proxy";
export { FormCore, ReactFormAdapter };
export type { IFormCore };
export type {
InternalFormState,
ValuesState,
ValidityState,
VisibilityState,
ViewState,
VitalityState,
DetailedError,
} from "./engine";
// ============================================================================
// FORM (FACADE) — Composition-based, IFormCore implementation
// ============================================================================
/
The primary entry point for React-driven forms.
Implements `IFormCore<T>` via delegation to an internal `FormCore` instance.
Does NOT extend `FormCore` — composition prevents LSP violations.
@template T - The typed form data shape. Defaults to `Record<string, any>`.

---

## [`core/injection-registry.ts`](../../../src/core/form-core/injection-registry.ts)

### `InjectionFragment`

_(No documentation provided)_

### `injectionRegistry`

_(No documentation provided)_

---

## [`core/int-types.ts`](../../../src/core/form-core/int-types.ts)

### `SectionEntity`

A flattened representation of a {@link FormSection}.
Instead of holding nested `fields[]` and `sections[]`, we store IDs only.
This allows O(1) section lookup and avoids deep-tree traversal at runtime.
@example
// Raw FormSection:
{ id: "address", fields: [{ id: "city", ... }], subSections: [{ id: "billing", ... }] }
// Normalized SectionEntity :
{ id: "address", fieldIds: ["city"], subSectionIds: ["billing"], parentId: undefined }

### `FieldEntity`

IDs of all direct fields belonging to this section. /
fieldIds: string[];
/ IDs of all direct sub-sections belonging to this section. /
subSectionIds: string[];
/ ID of the parent section, or undefined if this is a root section. /
parentId?: string;
}
/
A flattened representation of a {@link FormField}.
Augmented with parent/section context injected during normalization,
enabling cascading visibility checks without re-traversing the tree.
@example
// Raw FormField (inside a section):
{ id: "city", name: "city", type: "text", label: "City" }
// Normalized FieldEntity:
{ id: "city", name: "city", type: "text", label: "City", sectionId: "address", parentId: undefined }

### `NormalizedForm`

ID of the section this field belongs to. Injected by {@link FieldRegistry}. /
sectionId: string;
/
ID of the parent field (used for nested/group fields and repeater children).
Undefined for top-level fields. Injected by {@link FieldRegistry}.
/
parentId?: string;
/
`true` if this field is a repeater template child — i.e., it lives inside
a repeater's `fields[]` definition and should NOT receive its own state entry.
Set to `true` during normalization by {@link FieldRegistry} for any field whose
direct or transitive ancestor field has `type === 'repeater'`.
Allows `StateManager.initializeState` to skip template fields in O(1)
instead of re-walking the ancestor chain on every field.
/
isTemplate?: boolean;
repeaterConfig?: import("../fields").RepeaterConfig;
/ Technical capabilities resolved from the registry. /
capabilities: import("../fields").FieldCapabilities;
}
/
The fully normalized (flat) representation of a {@link FormDefinition}.
This is the internal runtime format used by all core modules.
Created once by {@link normalizeFormDefinition} and never mutated after construction.
@example
const norm: NormalizedForm = {
metadata: { id: "my-form", name: "My Form" },
sections: { "personal": { fieldIds: ["name", "dob"], ... } },
fields: { "name": { type: "text", sectionId: "personal", ... } },
rootSections: ["personal", "address"]
}

### `RenderNode`

Form-level metadata (id, name, events, etc.) — everything except `sections`. /
metadata: Omit<FormDefinition, "sections">;
/ Flat map of all sections, indexed by section ID. O(1) lookup. /
sections: Record<string, SectionEntity>;
/ Flat map of all fields (including nested), indexed by field ID. O(1) lookup. /
fields: Record<string, FieldEntity>;
/ Ordered array of root-level section IDs. Used for wizard/stepper navigation. /
rootSections: string[];
/
Maps a field name (from the raw form values tree) to an array of field IDs
that depend on it for visibility, enabled state, or setValue effects.
Populated by {@link normalizeFormDefinition} during initialization.
Enables the visibility engine to perform targeted re-evaluation instead of
full O(N) passes on every change.
/
dependencyGraph: Record<string, string[]>;
/
Static intermediate representation for the render engine.
Computed once during normalization.
/
renderTree: RenderNode[];
/
Flat map of all render nodes, indexed by stateKey. O(1) lookup.
/
renderNodes: Record<string, RenderNode>;
}
/ Intermediate representation for rendering a field

### `ResolvedFieldProps`

The internal engine key for V2-V5 state slices. Stable and deterministic. /
stateKey: string;
/ The external data path for V1 (Value) access and serialization. e.g. "users[0].email" /
dataPath: string;
/ @deprecated Use stateKey or dataPath. Provided for legacy component compatibility. /
id: string;
fieldType: string;
category: string;
capabilities: import("../fields").FieldCapabilities;
depth: number;
parentId: string | null;
children: RenderNode[];
/ Assigned by FormMetricsAnalyzer for layout grouping /
rowGroup: number | null;
/ The state key used for V3 (Visibility) subscriptions /
visibilityKey: string;
}
/ The final resolved prop set passed to the React UI component

### `ValuesState`

The external data path for serialization. e.g. "users[0].email" /
dataPath: string;
/ The internal engine key for state slices. e.g. "users**0**email" /
stateKey: string;
/ @deprecated Use dataPath or stateKey. /
id: string;
label?: string;
description?: string;
placeholder?: string;
rowGroup: number | null;
density: "compact" | "comfortable" | "spacious";
/ Capability-gated input props (value, onChange, error) /
inputProps?: {
value: any;
valid: boolean;
errors: DetailedError[];
touched: boolean;
dirty: boolean;
focused: boolean;
version: number;
conflict?: { serverValue: any; clientValue: any; fieldId: string } | null;
onChange?: (value: any) => void;
onBlur?: () => void;
onFocus?: () => void;
};
/ Forwarded static componentProps from schema /
componentProps: Record<string, any>;
/ Dynamic options for select/radio/autocomplete, populated via RemoteOptionsManager /
options?: ReadonlyArray<{ label: string; value: unknown }>;
/ Whether the field is currently loading (e.g., fetching remote options) /
isLoading?: boolean;
}
// ============================================================================
// 5V STATE PATTERN
// The internal form state is divided into 5 orthogonal "V" slices.
// Each slice has a single concern, making them independently updatable
// and independently subscribable.
//
// 1. Values — the raw data model (what the user has typed)
// 2. Validity — validation status and error messages per field
// 3. Visibility— which fields are currently visible
// 4. View — dynamic display properties (label overrides, disabled, etc.)
// 5. Vitality — interaction lifecycle (touched, dirty, focused, version)
// ============================================================================
/
V1 — VALUES
The form's data model. Maps field names to their current values.
All other slices reference this as the source of truth for condition evaluation
and validation.
@template T - The shape of the form data object (e.g., `{ name: string; age: number }`).

### `DetailedError`

A structured error object for a single validation failure.
Richer than a plain string: carries a machine-readable `code` for
programmatic handling and an optional `details` bag for context (e.g., the
min/max value that was violated).
@example
const err: DetailedError = {
code: "minLength",
message: "Name must be at least 3 characters",
fieldId: "name_field_id",
details: { min: 3, actual: 1 }
};

### `ValidityState`

Machine-readable error code matching the validation rule type (e.g., `"required"`, `"email"`, `"min"`). /
code: string;
/ Human-readable error message shown in the UI. /
message: string;
/ The ID of the field this error belongs to. /
fieldId: string;
/ Optional extra context (e.g., `{ min: 3 }` for a minLength error). /
details?: any;
}
// ──────────────────────────────────────────────────────────────────────────────
// VALIDITY STATE
// ──────────────────────────────────────────────────────────────────────────────
/
V2 — VALIDITY
Tracks validation status for every field, keyed by field ID.

- `valid: true` with no errors = field is clean.
- `valid: false` with errors = field has failed validation.
- `pending: true` = async validation is in-flight.
  Updated by {@link ErrorManager} and consumed by {@link ReactFormAdapter}
  to derive `error` / `errorMessage` props for UI components.

### `VisibilityState`

Whether the field is currently valid. /
valid: boolean;
/ List of structured errors. Empty array = no errors. /
errors?: DetailedError[];
/ Optional non-blocking warning message (does not fail submission). /
warning?: string;
/ True while an async validator is running for this field. /
pending?: boolean;
};
}
// ──────────────────────────────────────────────────────────────────────────────
// VISIBILITY STATE
// ──────────────────────────────────────────────────────────────────────────────
/
V3 — VISIBILITY
A simple boolean map: `true` = field is rendered, `false` = field is hidden.
Computed by {@link FormVisibility.evaluateVisibility} based on the current
`ValuesState` and `meta.conditions` defined in each field's schema.
Supports cascading: a child field is hidden if its parent is hidden.
When a field transitions from visible → hidden:

- Its errors are auto-cleared (via {@link ErrorManager}).
- Its value is auto-reset to `null` (prevents phantom submit data).

### `ViewState`

V4 — VIEW
Dynamic display properties for each field. These can override static schema
values at runtime — e.g., changing a label based on another field's value,
or disabling a field when certain conditions are met.
Consumed by {@link ReactFormAdapter.getComponentProps} which merges this
into the final prop object passed to the UI component.

### `VitalityState`

Dynamic label override. Falls back to the static `field.label` if not set. /
label?: string;
/ Dynamic description or hint text shown below the field. /
description?: string;
/ Dynamic placeholder text. /
placeholder?: string;
/ When true, the field renders as a disabled UI control. /
disabled?: boolean;
/ When true, the field renders in read-only mode (displays value, no edit). /
readOnly?: boolean;
/ Computed CSS properties merged into the field's style attribute. /
style?: Record<string, string>;
/ Computed CSS class string merged into the field's className. /
className?: string;
/ Whether the field is currently performing an async operation (e.g., fetching options). /
isLoading?: boolean;
/ Dynamic options for select/radio fields, populated via remoteOptions. /
options?: any[];
/ Arbitrary dynamic props forwarded to the underlying UI component. /
componentProps?: Record<string, any>;
};
}
// ──────────────────────────────────────────────────────────────────────────────
// VITALITY STATE
// ──────────────────────────────────────────────────────────────────────────────
/
V5 — VITALITY
Interaction lifecycle state for each field.

- `touched`: field has been blurred at least once (controls when to show errors).
- `dirty`: field value differs from its initial value.
- `focused`: field currently has browser focus.
- `version`: monotonically increasing counter incremented on every `setValue` call,
  useful for keying re-renders or debounce guards.

### `PerformanceState`

True after the field has been blurred at least once. Errors are typically shown only when touched. /
touched: boolean;
/ True when the current value differs from the field's `initialValue`. /
dirty: boolean;
/ True while the field currently has browser focus. /
focused: boolean;
/
Monotonically increasing mutation counter.
Incremented on every `setValue` call. Useful for React key tricks or debounce guards.
/
version: number;
/
The value the field was initialized with. Used for calculating 'dirty' status.
Strictly managed by StateManager; never updated during the field lifecycle.
/
initialValue?: any;
/ If true, this field's state slice will not be purged even if the component unmounts. /
pinned?: boolean;
};
}
// ──────────────────────────────────────────────────────────────────────────────
// PERFORMANCE STATE
// ──────────────────────────────────────────────────────────────────────────────
/
Runtime performance metrics.
Collected during form interaction to monitor engine efficiency and user experience.

### `DebugState`

Time taken for the last submission (ms). /
lastSubmissionDurationMs?: number;
/ Time taken for the last full validation pass (ms). /
lastValidationDurationMs?: number;
/ Average latency for individual field updates (ms). /
averageLatencyMs?: number;
/ Time taken for the last remote options fetch (ms). /
lastOptionsFetchDurationMs?: number;
}
/
Internal debug/diagnostics state. Managed by {@link DebugManager}.
Only meaningful in development — the `isEnabled` flag gates all logging.

### `UIState`

Whether debug logging is active. /
isEnabled: boolean;
/ Ordered log entries with timestamps. /
logs: { timestamp: number; message: string; data?: any }[];
/ How many times the state has been published to subscribers. /
renderCount: number;
/ Label of the most recent action that mutated state. /
lastAction?: string;
}
// ──────────────────────────────────────────────────────────────────────────────
// CONSOLIDATED STATE
// ──────────────────────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────────────
// UI & BUSINESS STATE (METASCHEMA SEPARATION)
// ──────────────────────────────────────────────────────────────────────────────
/
UI STATE
UX and interactive state completely separated from submitted business data.

### `BusinessState`

BUSINESS STATE
Entity lifecycle stage and workflow status (Draft, Submitted, Approved, etc.).

### `InternalFormState`

The complete internal state of a {@link FormCore} instance.
All five V-slices plus UI state, business state, and debug are held here.
Managed by {@link StateManager} and published to subscribers on every mutation.
Consumers (React hooks, adapters) subscribe to this and re-render on change.
@template T - The form's data model type.
@example
form.subscribe((state: InternalFormState<MyForm>) => {
console.log(state.values.email); // V1
console.log(state.validity.email_id); // V2
console.log(state.visibility.email_id); // V3
console.log(state.view.email_id); // V4
console.log(state.vitality.email_id); // V5
console.log(state.uiState); // UI State
console.log(state.businessState); // Business State
});

---

## [`core/modules/capability-registry.ts`](../../../src/core/form-core/modules/capability-registry.ts)

### `CategoryDefinition`

_(No documentation provided)_

### `FieldTypeConfig`

_(No documentation provided)_

### `ResolvedFieldType`

_(No documentation provided)_

### `categoryRegistry`

_(No documentation provided)_

### `fieldTypeRegistry`

_(No documentation provided)_

---

## [`core/modules/circuit-breaker.ts`](../../../src/core/form-core/modules/circuit-breaker.ts)

### `BreakerState`

@file circuit-breaker.ts
@description Engine-level fault tolerance — catches and isolates failures
so a single broken field or middleware does not take down the entire form.

## States

- CLOSED — normal operation; all calls pass through.
- OPEN — failures detected; calls are degraded (return fallback values).
- HALF_OPEN — probe period; one call is allowed through to test recovery.

## Per-field granularity

Each field has its own breaker state so a misbehaving custom field component
does not degrade the entire form — only that specific field falls back.

### `formCircuitBreaker`

Max consecutive failures before opening the circuit (default: 3) /
threshold?: number;
/ Milliseconds to wait before attempting recovery (default: 30000) /
resetTimeoutMs?: number;
/ Max half-open probes before giving up (default: 2) /
maxHalfOpenProbes?: number;
}
const DEFAULT_OPTIONS: Required<CircuitBreakerOptions> = {
threshold: 3,
resetTimeoutMs: 30000,
maxHalfOpenProbes: 2,
};
export class CircuitBreaker {
private fields: Map<string, BreakerEntry> = new Map();
private globalEntry: BreakerEntry = {
state: "CLOSED",
failureCount: 0,
lastFailureTime: 0,
};
private halfOpenProbes = 0;
private options: Required<CircuitBreakerOptions>;
constructor(options?: CircuitBreakerOptions) {
this.options = { ...DEFAULT_OPTIONS, ...options };
}
/ Get the breaker state for a specific field (or global default). /
getState(fieldId?: string): BreakerState {
if (fieldId && this.fields.has(fieldId)) {
const entry = this.fields.get(fieldId)!;
if (entry.state === "OPEN" && this.shouldAttemptReset(entry)) {
return "HALF_OPEN";
}
return entry.state;
}
if (this.globalEntry.state === "OPEN" && this.shouldAttemptReset(this.globalEntry)) {
return "HALF_OPEN";
}
return this.globalEntry.state;
}
/ Returns true if the call should be allowed through (or probed). /
isOpen(fieldId?: string): boolean {
const state = this.getState(fieldId);
if (state === "HALF_OPEN") {
return !this.probeAllowed(fieldId);
}
return state === "OPEN";
}
/ Records a success — resets the breaker for the given field (or global if unspecified). /
recordSuccess(fieldId?: string) {
if (fieldId) {
this.fields.delete(fieldId);
// Field-level success: only reset global if it was also in a failed state
// for the same field. Otherwise, leave global alone to avoid falsely
// resetting the global circuit on unrelated field recoveries.
return;
}
this.globalEntry = { state: "CLOSED", failureCount: 0, lastFailureTime: 0 };
this.halfOpenProbes = 0;
}
/ Records a failure — may open the circuit. /
recordFailure(fieldId?: string) {
const entry = fieldId
? this.getOrCreateFieldEntry(fieldId)
: this.globalEntry;
entry.failureCount++;
entry.lastFailureTime = Date.now();
if (entry.failureCount >= this.options.threshold) {
entry.state = "OPEN";
}
}
/ Wrap an async operation with automatic circuit breaker protection. /
async guard<T>(
fn: () => Promise<T>,
fallback: T,
fieldId?: string
): Promise<T> {
if (this.isOpen(fieldId)) {
return fallback;
}
try {
const result = await fn();
this.recordSuccess(fieldId);
return result;
} catch (err) {
this.recordFailure(fieldId);
if (fieldId) {
console.warn(
`[CircuitBreaker] Field "${fieldId}" failed (${this.getOrCreateFieldEntry(fieldId).failureCount}/${this.options.threshold}):`,
err
);
}
return fallback;
}
}
/ Resets all breakers to CLOSED. /
reset() {
this.fields.clear();
this.globalEntry = { state: "CLOSED", failureCount: 0, lastFailureTime: 0 };
this.halfOpenProbes = 0;
}
private getOrCreateFieldEntry(fieldId: string): BreakerEntry {
if (!this.fields.has(fieldId)) {
this.fields.set(fieldId, {
state: "CLOSED",
failureCount: 0,
lastFailureTime: 0,
});
}
return this.fields.get(fieldId)!;
}
private shouldAttemptReset(entry: BreakerEntry): boolean {
return Date.now() - entry.lastFailureTime >= this.options.resetTimeoutMs;
}
private probeAllowed(fieldId?: string): boolean {
if (this.halfOpenProbes >= this.options.maxHalfOpenProbes) return false;
this.halfOpenProbes++;
return true;
}
}
/ Singleton global circuit breaker for the form system.

### `BreakerEntry`

_(No documentation provided)_

### `CircuitBreakerOptions`

_(No documentation provided)_

### `CircuitBreaker`

_(No documentation provided)_

---

## [`core/modules/debug-manager.ts`](../../../src/core/form-core/modules/debug-manager.ts)

### `DebugManager`

_(No documentation provided)_

---

## [`core/modules/error-manager.ts`](../../../src/core/form-core/modules/error-manager.ts)

### `ErrorManager`

_(No documentation provided)_

---

## [`core/modules/execution.ts`](../../../src/core/form-core/modules/execution.ts)

### `FormExecution`

_(No documentation provided)_

---

## [`core/modules/field-registry.ts`](../../../src/core/form-core/modules/field-registry.ts)

### `FieldRegistry`

@file field-registry.ts
@description Registry for form structure normalization and field resolution.

## Purpose

A `FormDefinition` is a hierarchical JSON tree:

```
FormDefinition
└── sections[]
├── fields[]
└── subSections[]
└── fields[]
```

Every time the engine needs to look up a field or section, walking this tree
is O(n). The `FieldRegistry` flattens this structure into two flat maps
(`fields` and `sections`), enabling O(1) lookups by ID throughout the engine.
Normalization happens once at construction — the `NormalizedForm` is
immutable at runtime (fields/sections are never added or removed).

## Normalization enrichment

During normalization, each field is augmented with:

- `sectionId` — which section it belongs to.
- `parentId` — its parent field ID (for nested/repeater children).
  These are used by {@link FormVisibility} for cascading hide/show logic.
  /
  import type { FormField } from "@ui/form/fields";
  import type { FormDefinition } from "@ui/form/types";
  import { injectionRegistry } from "../injection-registry";
  import { fieldTypeRegistry } from "./capability-registry";
  import type { FormSection } from "@ui/form/types/section";
  import type { NormalizedForm, SectionEntity } from "@ui/form/core/int-types";
  import { resolveFieldIdentity } from "@ui/form/utils/normalization-utils";
  import { getCompositeFields } from "../composite-registry";
  /
  Thin wrapper around `NormalizedForm`.
  Constructed once per form instance. All engine modules receive a reference to the
  same registry, ensuring they share a single, consistent view of the form structure.

### `normalizeFormDefinition`

The fully normalized (flat) form definition. Read-only after construction. /
public definition: NormalizedForm;
/
@param definition - The raw hierarchical `FormDefinition` from the schema.
It is immediately normalized into a flat `NormalizedForm` via {@link normalizeFormDefinition}.
/
constructor(definition: FormDefinition) {
this.definition = normalizeFormDefinition(definition);
}
/
Returns all registered fields as a flat array.
Useful for iterator-based operations like computed field recalculation.
/
public getAllFields(): FormField[] {
return Object.values(this.definition.fields);
}
}
// ============================================================================
// NORMALIZATION
// ============================================================================
/
Converts a hierarchical `FormDefinition` into a flat `NormalizedForm`.
This is the most important pre-processing step in the engine. By doing this
once at form construction, all subsequent operations (field lookup, validation,
visibility evaluation) are O(1) instead of O(n).
What it does:

- Records all fields in a flat `fields` map (indexed by field ID).
- Records all sections in a flat `sections` map (indexed by section ID).
- Captures `rootSections` as an ordered array of top-level section IDs.
- Injects `sectionId` and `parentId` into each field for cascading logic.
- Recursively handles nested fields (repeater children) and sub-sections.
  @param def - The raw hierarchical `FormDefinition` to normalize.
  @returns A fully flat `NormalizedForm` ready for runtime use.
  @example
  const norm = normalizeFormDefinition({
  id: "my-form",
  sections: [{
  id: "personal",
  fields: [
  { id: "name", name: "name", type: "text", label: "Name" },
  { id: "dob", name: "dob", type: "date", label: "DOB" }
  ]
  }]
  });
  norm.fields["name"]; // → { id: "name", sectionId: "personal", parentId: undefined, ... }
  norm.sections["personal"]; // → { id: "personal", fieldIds: ["name", "dob"], ... }
  norm.rootSections; // → ["personal"]

### `denormalizeForm`

Extracts field names that a field depends on for visibility or logic.
/
const extractDependencies = (field: FormField): string[] => {
const deps = new Set<string>();
const fieldRegex = /\{\{([\w.]+)\}\}/g;
// A. Reactive expressions (visible/enabled/computed)
const expressions = [
typeof field.visible !== "boolean"
? (field.visible as any)?.expression
: null,
typeof field.enabled !== "boolean"
? (field.enabled as any)?.expression
: null,
(field as any).computed?.formula,
].filter(Boolean);
expressions.forEach((expr) => {
let match;
while ((match = fieldRegex.exec(expr)) !== null) {
deps.add(match[1]);
}
});
// B. Condition schemas
const conditionsObj = field.conditions ?? field.meta?.conditions;
if (conditionsObj) {
if (conditionsObj.groups) {
conditionsObj.groups.forEach((group: any) => {
group.rules?.forEach((rule: any) => {
if (rule.field) deps.add(rule.field);
});
});
}
if (conditionsObj.if) {
conditionsObj.if.forEach((rule: any) => {
if (rule.field) deps.add(rule.field);
});
}
}
// C. Remote Options Watch
if (field.remoteOptions?.watch) {
field.remoteOptions.watch.forEach((w: string) => deps.add(w));
}
return Array.from(deps);
};
/
Detects circular dependencies in the dependency graph using DFS.
/
const detectCycle = (graph: Record<string, string[]>): string[] | null => {
const visited = new Set<string>();
const stack = new Set<string>();
const dfs = (node: string): string[] | null => {
if (stack.has(node)) return [node];
if (visited.has(node)) return null;
visited.add(node);
stack.add(node);
for (const dep of graph[node] ?? []) {
const cycle = dfs(dep);
if (cycle) return [node, ...cycle];
}
stack.delete(node);
return null;
};
for (const node of Object.keys(graph)) {
const cycle = dfs(node);
if (cycle) return cycle;
}
return null;
};
let idCounter = 0;
/
Recursively registers a field (and its nested children) into `norm.fields`.
Also handles 'slot' expansion from the InjectionRegistry.
/
const registerField = (
field: any,
sectionId: string,
parentId?: string,
isTemplate = false,
depth = 0
): import("@ui/form/core/int-types").RenderNode[] => {
// ── SLOT EXPANSION ───────────────────────────────────────────────────
if (field.type === "slot" && field.name) {
const fragment = injectionRegistry.get(field.name, def.metadata);
if (fragment) {
return fragment.flatMap((f: any) =>
registerField(f, sectionId, parentId, isTemplate, depth)
);
} else {
console.warn(`[FieldRegistry] Injection Slot "${field.name}" not found in registry.`);
return [];
}
}
const { id: fieldId, name: fieldName } = resolveFieldIdentity(
field,
`register:${field.type || "unknown"}`,
{ value: idCounter }
);
field.id = fieldId;
field.name = fieldName;
// ── ECS Composite Expansion ──
const compositeTemplates = getCompositeFields(field.type);
if (compositeTemplates && (!field.fields || field.fields.length === 0)) {
field.fields = compositeTemplates.map((template: any) => {
const childName = template.name;
const childId = template.id || childName;
return {
...template,
id: `${fieldId}-${childId}`,
name: field.name && childName ? `${field.name}.${childName}` : (childName || childId),
properties: {
...field.properties,
...template.properties,
},
} as FormField;
});
if (field.type !== "repeater") {
field.isExpandedComposite = true;
}
}
// Ensure virtual section exists for orphaned fields
if (sectionId === "root-section" && !norm.sections["root-section"]) {
norm.sections["root-section"] = {
id: "root-section",
title: "Root",
fieldIds: [],
subSectionIds: [],
parentId: undefined,
} as any;
norm.rootSections.push("root-section");
}
// --- INJECTION MERGE (Global-to-Local Stitching) ---
const injections = def.injections || {};
const validationInjection =
(fieldName && injections.validations?.[fieldName]) ||
injections.validations?.[fieldId];
const uiInjection =
(fieldName && injections.ui?.[fieldName]) || injections.ui?.[fieldId];
const conditionInjection =
(fieldName && injections.conditions?.[fieldName]) ||
injections.conditions?.[fieldId];
// Conflict detection for injections
if (process.env.NODE*ENV === "development") {
if (fieldName && injections.validations?.[fieldName] && injections.validations?.[fieldId] && fieldName !== fieldId) {
console.warn(`[FieldRegistry] Injection conflict: field "${fieldName}" (id: ${fieldId}) has multiple validation injections.`);
}
}
const mergedField: any = {
...field,
validation: validationInjection
? { ...field.validation, ...validationInjection }
: field.validation,
properties: uiInjection
? { ...field.properties, ...uiInjection }
: field.properties,
conditions: conditionInjection || field.conditions,
sectionId,
parentId,
isTemplate,
repeaterConfig: (field as any).repeaterConfig,
capabilities: (() => {
try {
return fieldTypeRegistry.getCapabilities(field.type);
} catch {
console.warn(`[FieldRegistry] Unknown field type "${field.type}". Capabilities defaulted to INPUT.`);
return fieldTypeRegistry.getCapabilities("text");
}
})(),
};
// Store enriched field in the flat map
norm.fields[fieldId] = mergedField;
const node: import("@ui/form/core/int-types").RenderNode = {
stateKey: fieldId,
dataPath: field.name || fieldId,
id: fieldId,
fieldType: field.type,
category: (() => {
try {
return fieldTypeRegistry.get(field.type).category;
} catch {
return "input" as const;
}
})(),
capabilities: mergedField.capabilities,
depth,
parentId: parentId || null,
children: [],
rowGroup: null,
visibilityKey: fieldId,
};
// Store in flat node map for resolution
norm.renderNodes[fieldId] = node;
// Track field in section
if (norm.sections[sectionId]) {
norm.sections[sectionId].fieldIds.push(fieldId);
}
// Build dependency graph
const dependencies = extractDependencies(mergedField);
dependencies.forEach((depName) => {
if (!norm.dependencyGraph[depName]) {
norm.dependencyGraph[depName] = [];
}
norm.dependencyGraph[depName].push(fieldId);
});
// Recursively register nested children (e.g., fields inside a repeater/group)
if (field.fields) {
// Children of a repeater are always templates, regardless of nesting depth
const childIsTemplate = isTemplate || field.type === "repeater";
node.children = field.fields.flatMap((child: any) =>
registerField(child, sectionId, fieldId, childIsTemplate, depth + 1)
);
}
return [node];
};
/
Recursively traverses sections (and sub-sections), building `norm.sections`.
/
const traverse = (
sections?: import("@ui/form/fields").RawFormSection[],
parentId?: string
): string[] => {
if (!Array.isArray(sections)) return [];
return sections.map((section) => {
if (section.key && !section.id) {
section.id = section.key;
}
const sectionId = section.id || `section*${++idCounter}`;
// Build a SectionEntity: strip nested arrays, replace with ID lists
const sectionEntity: SectionEntity = {
...section,
id: sectionId,
fields: undefined, // Remove raw field array — use fieldIds instead
subSections: undefined, // Remove raw sub-section array — use subSectionIds instead
fieldIds: [],
subSectionIds: [],
parentId,
} as unknown as SectionEntity;
// Add to flat sections map BEFORE registering fields
// This ensures registerField can push to sectionEntity.fieldIds
norm.sections[sectionId] = sectionEntity;
// Register all direct fields of this section
if (section.fields) {
const nodes = section.fields.flatMap((f) => registerField(f, sectionId));
if (!parentId) {
norm.renderTree.push(...nodes);
}
}
// Recursively traverse sub-sections
if (section.subSections) {
sectionEntity.subSectionIds = traverse(section.subSections, sectionId);
}
return sectionId;
});
};
/
Scans structural containers (Split/Hero) for inline field definitions.
/
const traverseContainers = (containers?: any[]) => {
if (!containers) return;
containers.forEach((container) => {
const config = container.config || {};
// Handle Split Layout Panes
[config.leftContent, config.rightContent].forEach((pane) => {
if (pane?.type === "container" && pane.fields) {
pane.fields.forEach((field: FormField) => {
registerField(field, "root-section");
});
}
});
// Handle Generic Container Fields
if (container.fields) {
container.fields.forEach((field: FormField) => {
registerField(field, "root-section");
});
}
});
};
// 1. Register Root-Level Fields (Orphans)
if (def.fields && Array.isArray(def.fields)) {
const nodes = def.fields.flatMap((field) =>
registerField(field, "root-section")
);
norm.renderTree.push(...nodes);
}
// 2. Traverse Containers (Layout-driven fields)
traverseContainers(def.containers);
// 3. Traverse standard sections
norm.rootSections = traverse(def.sections);
// 4. Layout Orchestration (Simple Row-Group Assignment)
let currentRow = 0;
const assignRows = (nodes: import("@ui/form/core/int-types").RenderNode[]) => {
nodes.forEach((node) => {
if (node.category === "structure" || node.category === "repeater") {
currentRow++;
node.rowGroup = currentRow;
assignRows(node.children);
currentRow++;
} else {
node.rowGroup = currentRow;
}
});
};
assignRows(norm.renderTree);
// 5. Final Correctness Check: Cycle Detection
const cycle = detectCycle(norm.dependencyGraph);
if (cycle) {
const cycleStr = cycle.join(" → ");
if (process.env.NODE_ENV === "development") {
console.error(`[FieldRegistry] 🚨 Circular dependency detected in form schema: ${cycleStr}`);
} else {
throw new Error(`Circular dependency detected: ${cycleStr}`);
}
}
return norm;
}
// ============================================================================
//  DENORMALIZATION
// ============================================================================
/
Reconstructs a hierarchical `FormDefinition`from a`NormalizedForm`.
This is the inverse of {@link normalizeFormDefinition}. Useful for:

- Serializing the form definition back to JSON (e.g., for persistence).
- Debugging — inspecting the current structural state of a normalized form.
- Round-trip testing: `denormalize(normalize(def))` should equal `def`.
  @param norm - The normalized form to reconstruct.
  @returns The hierarchical `FormDefinition`.
  @throws If a section or field ID referenced in the maps does not exist.
  @example
  const original = { id: "my-form", sections: [{ id: "s1", fields: [{ id: "f1", ... }] }] };
  const norm = normalizeFormDefinition(original);
  const rebuilt = denormalizeForm(norm);
  // rebuilt.sections[0].fields[0].id === "f1" ✓

---

## [`core/modules/history.ts`](../../../src/core/form-core/modules/history.ts)

### `HistorySnapshot`

@file history.ts
@description Undo/redo history stack for form field values.
Captures deep-cloned snapshots of `form.values` on each mutation
and supports undo/rewind with configurable capacity.

## Usage (via FormCore)

```ts
form.undo(); // revert to previous snapshot
form.redo(); // re-apply a reverted snapshot
form.canUndo; // boolean
form.canRedo; // boolean
form.history.clear(); // reset
```

## Design

- Capacity-bound: defaults to 50 snapshots to prevent memory leaks.
- Coalescing: rapid successive mutations within 300ms overwrite the last snapshot
  so that a typed word is one undo step, not 5 keystrokes.
- Deep clones: each snapshot is a structured clone (via `structuredClone` or fallback).
  /
  const DEFAULT_CAPACITY = 50;
  const COALESCE_WINDOW_MS = 300;
  / A single snapshot in the undo stack.

### `HistoryOptions`

_(No documentation provided)_

### `FormHistory`

_(No documentation provided)_

---

## [`core/modules/reactive-engine.ts`](../../../src/core/form-core/modules/reactive-engine.ts)

### `ReactiveEngine`

Evaluates reactive expressions like `{{ fieldName }}` in form schemas.
⚠️ Security: Uses `new Function()` to evaluate expressions. The schema AST
is interpolated directly into the function body. Only pass trusted schemas.
Do NOT use with user-supplied expression strings unless they have been
validated against an allow-list of known-safe patterns.
@internal

---

## [`core/modules/remote-options.ts`](../../../src/core/form-core/modules/remote-options.ts)

### `RemoteOptionsManager`

RemoteOptionsManager
Handles fetching dynamic options for fields based on their remoteOptions configuration.
Features:

- Debounced re-fetching when watched fields change (configurable per field)
- Deduplication via dependency key hashing
- Performance metrics tracking
- Debug logging integration

---

## [`core/modules/repeater-factory.ts`](../../../src/core/form-core/modules/repeater-factory.ts)

### `RepeaterRowFactory`

Handles the materialization and destruction of dynamic Repeater rows.
Part of the Layer 3 (Render Output) logic of the Zenith Render Engine.
It ensures that every dynamic field instance in a repeater receives
its own unique state slices (V1-V5) and clean namespaced IDs.

---

## [`core/modules/resolution-pipeline.ts`](../../../src/core/form-core/modules/resolution-pipeline.ts)

### `ResolutionContext`

Context passed through the resolution pipeline.
Carries shared state across field resolutions in a single render pass.

### `ResolutionPipeline`

Shared cache across fields in the same render pass /
cache: Map<string, unknown>;
/ Abort signal for cancellation (e.g., when a new render supersedes this one) /
signal?: AbortSignal;
/ The FormCore instance — enables resolveProps to access the full engine /
form?: any;
}
/
Pure functions to resolve a field's visual and behavioral props
from the 5V state matrix and i18n context.
This is the Layer 2 (Resolution Pipeline) of the Zenith Render Engine.

### `IFieldTypeRegistry`

_(No documentation provided)_

---

## [`core/modules/resolver.ts`](../../../src/core/form-core/modules/resolver.ts)

### `FieldResolver`

_(No documentation provided)_

---

## [`core/modules/runtime.ts`](../../../src/core/form-core/modules/runtime.ts)

### `FormRuntime`

_(No documentation provided)_

---

## [`core/modules/state-manager.ts`](../../../src/core/form-core/modules/state-manager.ts)

### `StateManager`

_(No documentation provided)_

---

## [`core/modules/validator.ts`](../../../src/core/form-core/modules/validator.ts)

### `FormValidator`

_(No documentation provided)_

---

## [`core/modules/visibility.ts`](../../../src/core/form-core/modules/visibility.ts)

### `FormVisibility`

_(No documentation provided)_

---

## [`core/react-adapter.ts`](../../../src/core/form-core/react-adapter.ts)

### `FieldComponentProps`

@file react-adapter.ts
@description Bridges the headless FormCore engine to React component props.

## Responsibility

`ReactFormAdapter` is an anti-corruption layer between the pure TypeScript
engine (`FormCore`) and React UI components. It translates engine state and events
into a React-friendly props object via `getComponentProps()`.
This separation means:

- `FormCore` never imports React or knows about JSX.
- UI components never care about the engine internals.
- The adapter is the one place where framework coupling lives.

## Props built by `getComponentProps(fieldId)`

| Prop            | Source                                     |
| --------------- | ------------------------------------------ |
| `id`, `name`    | Field definition                           |
| `label`, etc.   | `state.view[fieldId]` (dynamic view state) |
| `style`         | Merged: computed layout CSS + view.style   |
| `...properties` | `field.properties` (static schema props)   |
| `options`       | `field.options`                            |
| `value`         | `state.values[field.name]` via ValueProxy  |
| `error`         | `!validity.valid`                          |
| `errorMessage`  | `validity.errors[0].message`               |
| `errors`        | `validity.errors[]` (full list)            |
| `onChange`      | Fires hooks + `core.setValue()`            |
| `onBlur`        | Sets touched + triggers blur validation    |
| `onFocus`       | Reserved for future hook support           |

## onChange Hook Order

```
onChange(val)
│
├── 1. events.beforeChange(field, oldValues, val) — return false to cancel (receives pre-mutation snapshot)
├── 2. await core.setValue(field.name, val)       — engine update (async)
├── 3. events.onChange(field, val, values)         — side effect (post-mutation snapshot ✓)
└── 4. events.afterChange(field, val, values)      — side effect (post-mutation snapshot ✓)
```

✅ Fix applied: hooks in steps 3 & 4 now receive the post-mutation snapshot.
`beforeChange` (step 1) still receives the pre-mutation snapshot so it can inspect the old state.
/
import type { IFormCore } from "@ui/form/core/form-interface";
import { enhanceFieldProps } from "@ui/form/utils/accessibility-runtime";
/
Props object produced by `ReactFormAdapter.getComponentProps()`.
Known properties are typed explicitly; unknown properties are allowed
via the index signature so the object can be spread onto any custom
field component without type errors.

### `ReactFormAdapter`

_(No documentation provided)_

---

## [`core/validation-adapter.ts`](../../../src/core/form-core/validation-adapter.ts)

### `ValidationAdapter`

@file validation-adapter.ts
@description Port interface for pluggable validation strategies.
This is the boundary contract (Ports & Adapters / Hexagonal Architecture)
between the form engine and any external validation library.
The engine only ever depends on this interface — it never imports Yup, Zod,
or any other concrete library. To swap validation backends, implement this
interface and pass it to `FormCore` at construction time via `validatorAdapter`.
Built-in implementation: {@link ValidationProxy} (uses the internal {@link ValidationRegistry}).
@example
// Yup adapter example:
class YupAdapter implements ValidationAdapter {
constructor(private schema: yup.ObjectSchema<any>) {}
async validateField(field, value, values) {
try {
await this.schema.validateAt(field.name, values, { abortEarly: false });
return [];
} catch (err: any) {
return err.inner.map((e: any) => ({
code: e.type ?? "invalid",
message: e.message,
fieldId: field.id
}));
}
}
validateForm(values) { return {}; }
}
const form = new FormCore(definition, {}, new YupAdapter(mySchema));

---

## [`core/validation-proxy.ts`](../../../src/core/form-core/validation-proxy.ts)

### `ValidationMessageConfig`

@file validation-proxy.ts
@description The engine's built-in `ValidationAdapter` implementation.
`ValidationProxy` is the default validator used when no external adapter
(e.g., Yup, Zod) is provided to `FormCore`. It validates fields against the
rules defined inline in the field schema (`field.validation.rules[]`) using
the pluggable strategies in {@link ValidationRegistry}.

## Rule Priority (highest → lowest)

1. Rule-level message (`rule.message`) — explicit override per rule entry.
2. Field-level override (`messageConfig[fieldId][ruleCode]`) — overrides per field.
3. Strategy default (`ValidationStrategy.defaultMessage()`) — generated from label.

## Validation flow per field

```
validate(field, value, values)
│
├── 1. Top-level `field.required` shorthand check
├── 2. Iterate `field.validation.rules[]` → check rule.when → run each strategy
└── 3. Implicit type checks (e.g., field.type === "email" auto-adds email rule)
```

## 2C: rule.when (Conditional Validation)

Each rule can have an optional `when: ConditionExpression`. If the condition
evaluates to false against the current form values, the rule is skipped.
This enables context-sensitive validation without splitting schemas.

## 2E: Cross-field Validation

`validate(field, value, values)` now receives the full form values snapshot.
Strategies that need to compare against another field (e.g., `matches`) can
use `values` to read the dependent field's current value.

## Implements

{@link ValidationAdapter} — can be swapped for any external adapter.
/
import type { FormField } from "../fields";
import { ConditionProxy } from "./condition-proxy";
import type { DetailedError } from "./int-types";
import { ReactiveEngine } from "./modules/reactive-engine";
import type { ValidationAdapter } from "./validation-adapter";
import { ValidationRegistry } from "./validation-registry";
/
Configuration map for per-field, per-rule message overrides.
Shape: `{ [fieldId]: { [ruleCode]: "custom message" } }`
@example
const config: ValidationMessageConfig = {
"email_field_id": {
"required": "Please enter your email address",
"email": "That doesn't look like a valid email"
}
};
const form = new Form(definition, {}, config);

### `ValidationProxy`

_(No documentation provided)_

---

## [`core/validation-registry.ts`](../../../src/core/form-core/validation-registry.ts)

### `ValidationStrategy`

@file validation-registry.ts
@description Strategy registry for built-in field validation rules.

## Pattern: Strategy + Registry (GoF)

Each validation rule type (`"required"`, `"min"`, `"email"`, etc.) is implemented
as a `ValidationStrategy` object with two responsibilities:

- `validate()` — returns `true` if the value is valid, `false` otherwise.
- `defaultMessage()` — returns the human-readable error string for this rule.
  Strategies are registered in `ValidationRegistry` (a plain object map) and
  looked up by rule type at runtime by {@link ValidationProxy}.

## Extension via OCP

New rule types can be added at runtime without touching this file:

```ts
registerValidationStrategy("phone", {
  validate: (value) => PATTERNS.PHONE.test(value),
  defaultMessage: (rule, field) =>
    `${field.label} must be a valid phone number`,
});
```

## Built-in strategies

| Key         | Alias for | Behaviour                                        |
| ----------- | --------- | ------------------------------------------------ |
| `required`  | —         | Value must be non-null, non-undefined, non-empty |
| `min`       | —         | String/array length ≥ N, or number ≥ N           |
| `minLength` | `min`     | Alias for `min`                                  |
| `max`       | —         | String/array length ≤ N, or number ≤ N           |
| `maxLength` | `max`     | Alias for `max`                                  |
| `email`     | —         | Must match `PATTERNS.EMAIL` regex                |
| `pattern`   | —         | Must match a named PATTERN or literal regex      |

/
import as EmailValidator from "email-validator";
import isAlpha from "validator/lib/isAlpha";
import isAlphanumeric from "validator/lib/isAlphanumeric";
import isIP from "validator/lib/isIP";
import isNumeric from "validator/lib/isNumeric";
import isPostalCode from "validator/lib/isPostalCode";
import isURL from "validator/lib/isURL";
import { PATTERNS } from "@libs/validations";
import type { FormField } from "../fields";
import type { ValidationRule } from "../types/validation";
// ============================================================================
// STRATEGY INTERFACE
// ============================================================================
/
Contract for a single validation rule strategy.
Implementations are stateless objects — they receive all context via
parameters and return a boolean/string with no side effects.
@example
const PhoneStrategy: ValidationStrategy = {
validate: (value) => !value || PATTERNS.PHONE.test(value),
defaultMessage: (rule, field) => `${field.label} must be a valid phone number`,
};

### `ValidationRegistry`

Checks whether a value satisfies this rule.
@param value - The current field value.
@param rule - The full rule definition (includes `type`, `value`, optional `message`).
@param field - The full field definition (useful for label in error messages).
@param values - [2E] The full form values snapshot (optional). Available for
strategies that need to compare against sibling fields (e.g., `matches`).
@returns `true` if the value is valid; `false` if the rule is violated.
/
validate: (
value: any,
rule: ValidationRule,
field: FormField,
values?: any
) => boolean | Promise<boolean>;
/
Returns the default error message for a rule violation.
@param rule - The rule definition (carries e.g. `min` value for the message).
@param field - The field definition (provides `label` or `name` for the message).
@returns Human-readable error string shown to the user.
/
defaultMessage: (rule: ValidationRule, field: FormField) => string;
}
// ============================================================================
// SHARED HELPER
// ============================================================================
/
Checks whether a value is considered "present" (non-null, non-undefined, non-empty-string).
Used consistently across strategies to avoid duplicating the empty-check logic.
@param value - Any form field value.
@returns `true` if the value is meaningfully present.
/
const hasValue = (value: any): boolean => {
return value !== null && value !== undefined && value !== "";
};
// ============================================================================
// BUILT-IN STRATEGIES
// ============================================================================
/
`required` — Fails if the value is null, undefined, or empty string.
Also used implicitly when `field.required === true` (shorthand).
/
const RequiredStrategy: ValidationStrategy = {
validate: (value) => hasValue(value),
defaultMessage: (\_rule, field) => `${field.label || field.name} is required`,
};
/
`min` / `minLength` — Enforces a minimum value or length.
Behaviour by value type:

- `string` → minimum character count (`.length >= rule.value`)
- `Array` → minimum item count (`.length >= rule.value`)
- `number` → minimum numeric value (`>= rule.value`)
- `null/undefined` → treated as 0 for numeric context, or fails for others
  /
  const MinStrategy: ValidationStrategy = {
  validate: (value, rule) => {
  // No value: treat as length 0 for string/array context, or 0 for numeric
  if (!hasValue(value)) {
  if (typeof rule.value === "number") {
  return 0 >= rule.value; // e.g. min: 0 → still valid
  }
  return false; // Empty string/null fails min check for non-numeric
  }
  if (typeof value === "string" || Array.isArray(value)) {
  return value.length >= rule.value;
  }
  if (typeof value === "number") {
  return value >= rule.value;
  }
  return true; // Unknown types pass silently
  },
  defaultMessage: (rule, field) => {
  return `${field.label || field.name} must be at least ${rule.value}`;
  },
  };
  /
  `max` / `maxLength` — Enforces a maximum value or length.
  Behaviour by value type:
- `string` → maximum character count (`.length <= rule.value`)
- `Array` → maximum item count (`.length <= rule.value`)
- `number` → maximum numeric value (`<= rule.value`)
- Empty/null values pass this check (use `required` to enforce presence).
  /
  const MaxStrategy: ValidationStrategy = {
  validate: (value, rule) => {
  // Empty values pass max — max is about "not too much", not "must have something"
  if (!hasValue(value)) return true;
  if (typeof value === "string" || Array.isArray(value)) {
  return value.length <= rule.value;
  }
  if (typeof value === "number") {
  return value <= rule.value;
  }
  return true;
  },
  defaultMessage: (rule, field) =>
  `${field.label || field.name} must be at most ${rule.value}`,
  };
  /
  `email` — Value must be a syntactically valid email address.
  Uses `PATTERNS.EMAIL` from the shared validations library.
  Empty values pass this check (combine with `required` to enforce presence).
  /
  const EmailStrategy: ValidationStrategy = {
  validate: (value) => {
  // Empty is OK — combine with `required` if email is mandatory
  if (!hasValue(value)) return true;
  return typeof value === "string" && EmailValidator.validate(value);
  },
  defaultMessage: (\_rule, field) =>
  `${field.label || field.name} must be a valid email`,
  };
  /
  `phone` — Value must be a valid phone number.
  Uses `PATTERNS.PHONE` from the shared validations library.
  /
  const PhoneStrategy: ValidationStrategy = {
  validate: async (value) => {
  if (!hasValue(value)) return true;
  try {
  // Dynamic import for modern, lightweight, tree-shaken library
  const { isValidPhoneNumber } = await import("libphonenumber-js");
  return isValidPhoneNumber(String(value), "US");
  } catch {
  return false;
  }
  },
  defaultMessage: (\_rule, field) =>
  `${field.label || field.name} must be a valid phone number`,
  };
  /
  `pattern` — Value must match a regex pattern.
  `rule.value` can be:

1. A named pattern key from `PATTERNS` (e.g., `"PHONE"`, `"EMAIL"`)
   → looked up from the `PATTERNS` object.
2. A raw regex string (e.g., `"^[A-Z]+"`)
   → wrapped in `new RegExp(rule.value)`.
   Empty values pass this check.
   @example
   // Named pattern:
   { type: "pattern", value: "PHONE" }
   // Raw regex:
   { type: "pattern", value: "^[A-Z]{2,4}$" }
/
const PatternStrategy: ValidationStrategy = {
validate: (value, rule) => {
// Empty is OK — combine with `required` if presence is mandatory
if (!hasValue(value)) return true;
let regex: RegExp;
// 1. Try named pattern from lib
if (
typeof rule.value === "string" &&
PATTERNS[rule.value as keyof typeof PATTERNS]
) {
regex = PATTERNS[rule.value as keyof typeof PATTERNS];
} else {
// 2. Treat as raw regex string
regex = new RegExp(rule.value);
}
return regex.test(String(value));
},
defaultMessage: () => "Invalid format",
};
/
`alphanumeric` — Value must contain only letters and numbers.
/
const AlphanumericStrategy: ValidationStrategy = {
validate: (value) => {
if (!hasValue(value)) return true;
return isAlphanumeric(String(value));
},
defaultMessage: (_rule, field) =>
`${field.label || field.name} must contain only letters and numbers`,
};
/
`digitsOnly`— Value must contain only numbers.
/
const DigitsOnlyStrategy: ValidationStrategy = {
validate: (value) => {
if (!hasValue(value)) return true;
return isNumeric(String(value), { no_symbols: true });
},
defaultMessage: (_rule, field) =>`${field.label || field.name} must contain only digits`,
};
/
`alphaOnly` — Value must contain only letters.
/
const AlphaOnlyStrategy: ValidationStrategy = {
validate: (value, rule) => {
if (!hasValue(value)) return true;
// Allow passing characters to ignore (like spaces for names) via rule.value
const ignore = typeof rule.value === "string" ? rule.value : undefined;
return isAlpha(String(value), "en-US", { ignore });
},
defaultMessage: (_rule, field) =>
`${field.label || field.name} must contain only letters`,
};
/
`url`— Value must be a valid URL.
/
const UrlStrategy: ValidationStrategy = {
validate: (value) => {
if (!hasValue(value)) return true;
return isURL(String(value));
},
defaultMessage: (_rule, field) =>`${field.label || field.name} must be a valid URL`,
};
/
`ip` — Value must be a valid IP address (v4 or v6).
/
const IpStrategy: ValidationStrategy = {
validate: (value) => {
if (!hasValue(value)) return true;
return isIP(String(value));
},
defaultMessage: (_rule, field) =>
`${field.label || field.name} must be a valid IP address`,
};
/
`postalCode`— Value must be a valid postal code.
/
const PostalCodeStrategy: ValidationStrategy = {
validate: (value) => {
if (!hasValue(value)) return true;
// Default to 'any' locale if not specified
return isPostalCode(String(value), "any");
},
defaultMessage: (_rule, field) =>`${field.label || field.name} must be a valid postal code`,
};
/
`date` — Value must be a valid date string (ISO 8601 or parseable by Date).
`rule.value` can be an optional format hint (e.g., `"YYYY-MM-DD"`).
Empty values pass this check.
/
const DateStrategy: ValidationStrategy = {
validate: (value) => {
if (!hasValue(value)) return true;
const str = String(value);
// ISO 8601 date regex: YYYY-MM-DD (with optional time)
const isoDateRegex =
/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;
   if (isoDateRegex.test(str)) {
   const parsed = new Date(str);
   return !isNaN(parsed.getTime());
   }
   // Fallback: try Date.parse
   const parsed = Date.parse(str);
   return !isNaN(parsed);
   },
   defaultMessage: (\_rule, field) =>
   `${field.label || field.name} must be a valid date`,
   };
   /
   `time` — Value must be a valid time string (HH:MM, 24-hour format).
   Empty values pass this check.
   /
   const TimeStrategy: ValidationStrategy = {
   validate: (value) => {
   if (!hasValue(value)) return true;
   const str = String(value);
   // HH:MM or HH:MM:SS
   const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/;
return timeRegex.test(str);
},
defaultMessage: (_rule, field) =>
`${field.label || field.name} must be a valid time (HH:MM)`,
};
/
`uuid`— Value must be a valid UUID v4.
Empty values pass this check.
/
const UuidStrategy: ValidationStrategy = {
validate: (value) => {
if (!hasValue(value)) return true;
const str = String(value);
const uuidRegex =
/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
return uuidRegex.test(str);
},
defaultMessage: (_rule, field) =>`${field.label || field.name} must be a valid UUID`,
};
/
`fileSize` — File value must be within the size limit.
`rule.value` is the maximum size in bytes.
Works with `File` objects or numeric byte values.
Empty values pass this check.
/
const FileSizeStrategy: ValidationStrategy = {
validate: (value, rule) => {
if (!hasValue(value)) return true;
const maxBytes = Number(rule.value);
if (Number.isNaN(maxBytes)) return true;
// Handle File objects (browser)
if (typeof File !== "undefined" && value instanceof File) {
return value.size <= maxBytes;
}
// Handle numeric byte values
if (typeof value === "number") {
return value <= maxBytes;
}
return true;
},
defaultMessage: (rule, field) => {
const bytes = Number(rule.value);
if (bytes >= 1048576) {
return `${field.label || field.name} must be at most ${(bytes / 1048576).toFixed(1)} MB`;
}
if (bytes >= 1024) {
return `${field.label || field.name} must be at most ${(bytes / 1024).toFixed(0)} KB`;
}
return `${field.label || field.name} must be at most ${bytes} bytes`;
},
};
/
`fileType` — File value must have an allowed MIME type.
`rule.value` is a comma-separated list of allowed MIME types
(e.g., `"image/png,image/jpeg,application/pdf"`)
or file extensions (e.g., `".png,.jpg,.pdf"`).
Works with `File` objects (browser).
Empty values pass this check.
/
const FileTypeStrategy: ValidationStrategy = {
validate: (value, rule) => {
if (!hasValue(value)) return true;
if (typeof File === "undefined" || !(value instanceof File)) return true;
const allowed = String(rule.value || "")
.split(",")
.map((s) => s.trim().toLowerCase());
if (allowed.length === 0) return true;
const fileType = value.type?.toLowerCase() || "";
const fileName = value.name?.toLowerCase() || "";
return allowed.some((accept) => {
if (accept.startsWith(".")) {
return fileName.endsWith(accept);
}
if (accept.endsWith("/")) {
const prefix = accept.slice(0, -2);
return fileType.startsWith(prefix + "/");
}
return fileType === accept;
});
},
defaultMessage: (_rule, field) =>
`${field.label || field.name} has an invalid file type`,
};
// ============================================================================
//  REGISTRY
// ============================================================================
/
The central registry mapping rule type strings to their `ValidationStrategy` implementations.
   Populated with built-in strategies at module load time.
   Extended at runtime via {@link registerValidationStrategy}.
   Looked up in:

- {@link ValidationProxy.getMessage} — to get the default message.
- {@link ValidationProxy.validate} — to call the strategy's `validate()` function.

### `registerValidationStrategy`

Registers a custom validation strategy under a new or existing rule type key.
Follows the Open/Closed Principle — add new rules without modifying this file.
Call this once at app initialization (e.g., in your form bootstrap or plugin setup).
@param name - The rule type string used in your field schema (e.g., `"phone"`, `"ssn"`).
@param strategy - The {@link ValidationStrategy} implementation for this rule.
@example
registerValidationStrategy("phone", {
validate: (value) => !value || /^\+?[\d\s\-()]{7,15}$/.test(value),
defaultMessage: (rule, field) => `${field.label} must be a valid phone number`
});
// Then in your field schema:
{ type: "phone", message: "Custom phone message (optional)" }

---

## [`core/value-proxy.ts`](../../../src/core/form-core/value-proxy.ts)

### `ValueProxy`

_(No documentation provided)_

---

## [`fields/WrapperFields.tsx`](../../../src/shared/ui/form/fields/WrapperFields.tsx)

### `UncontrolledField`

UncontrolledField Component
For standard registered fields. Automatically resolves the field definition
from the active Form context and delegates to `FieldRenderer` (which sets up
micro-subscriptions and renders within the `withAtom` HOC).
@example
<UncontrolledField name="email" className="my-custom-layout-class" />

### `ControlledField`

ControlledField Component
Binds custom third-party inputs (e.g. React Select, datepickers, slider inputs)
to the active Form context. It hooks into O(1) atomic value updates and automatically
wraps the custom input in Zenith's visual `withAtom` HOC layer (labels, icons, grids, and error feedback).
@example
<ControlledField
name="rating"
render={({ value, onChange }) => (
<MyRatingSlider value={value} onChange={onChange} />
)}
/>

### `Field`

Unified Field Component
The ultimate smart controller input wrapper. Automatically delegates to
UncontrolledField or ControlledField depending on the presence of the `render` prop.
@example
// Uncontrolled Native Input
<Field name="email" />
// Controlled Custom Dropdown
<Field
name="role"
render={({ value, onChange }) => (
<ReactSelect value={value} onChange={onChange} />
)}
/>

### `UncontrolledFieldProps`

_(No documentation provided)_

### `ControlledFieldProps`

_(No documentation provided)_

### `FieldProps`

_(No documentation provided)_

---

## [`fields/identity/IdentityAtoms.tsx`](../../../src/shared/ui/form/fields/identity/IdentityAtoms.tsx)

### `FormDivider`

FormDivider: Semantic "OR" separator for authentication flows.
Updated to support the standard FieldComponent interface.

### `SocialAuthButtons`

SocialAuthButtons: Integrated social authentication adapters.
Updated to support the standard FieldComponent interface.

---

## [`fields/lazy-registry-builder.ts`](../../../src/shared/ui/form/fields/lazy-registry-builder.ts)

### `createDefaultRegistry`

@file lazy-registry-builder.ts
@description Default code-split field registry — all heavy field types dynamically imported.

## Bundle impact

| Strategy    | Initial chunk | Deferred chunks |
| ----------- | ------------- | --------------- |
| Eager (old) | ~35 KB        | 0               |
| Lazy (new)  | ~8 KB         | ~27 KB split    |

## How it works

- 8 core fields (text, email, number, password, textarea, select, checkbox, radio)
  are eagerly loaded — they're small and almost every form uses them.
- 18+ other field types are loaded on first render via `React.lazy` + dynamic `import()`.
- The `defaultRegistry` now returns a `LazyRegistryStore`.
  /
  import type { FieldComponent } from "./registry";
  import { LazyRegistryStore } from "@ui/form/core/LazyRegistryStore";
  // ── Eager Core (~8 KB) — imported statically ──────────────────────────────
  import { withAtom } from "../hoc/withAtom";
  import { TextField } from "./primitive/TextField";
  import { TextareaField } from "./primitive/TextareaField";
  import { SelectField } from "./primitive/SelectField";
  import { CheckboxField } from "./primitive/CheckboxField";
  import { RadioField } from "./primitive/RadioField";
  import { AutocompleteField } from "./primitive/AutocompleteField";
  import { NumberInputField } from "./primitive/NumberInputField";
  const EAGER_CORE: Record<string, FieldComponent> = {
  text: withAtom(TextField),
  textarea: withAtom(TextareaField),
  select: withAtom(SelectField),
  autocomplete: withAtom(AutocompleteField),
  "async-select": withAtom(AutocompleteField),
  checkbox: withAtom(CheckboxField),
  radio: withAtom(RadioField),
  // Aliases — share the same TextField component instance
  email: withAtom(TextField),
  password: withAtom(TextField),
  number: withAtom(NumberInputField),
  };
  // ── Lazy Deferred (~27 KB) — each field type is its own chunk ─────────────
  / Extract a React component from a module, preferring default export then first component-like named export. /
  function extractComponent(mod: Record<string, any>): any {
  if (mod.default) return mod.default;
  const values = Object.values(mod);
  return (
  values.find((v) => v !== null && typeof v === "object" && "$$typeof" in v) ||
  values.find((v) => typeof v === "function") ||
  mod
  );
  }
  / Helper to wrap a field component with `withAtom` lazily. /
  function lazyWrapped(
  importFn: () => Promise<any>,
  exportName?: string,
  opts?: { showLabel?: boolean; wrapOuter?: boolean }
  ): () => Promise<{ default: FieldComponent }> {
  return async () => {
  const mod = await importFn();
  const Component = (exportName && typeof exportName === "string" && mod[exportName]) ? mod[exportName] : extractComponent(mod);
  const { withAtom: wa } = await import("../hoc/withAtom");
  return { default: wa(Component, opts) as FieldComponent };
  };
  }
  / Helper to import a direct component (not wrapped in withAtom). /
  function lazyDirect(
  importFn: () => Promise<any>,
  exportName?: string
  ): () => Promise<{ default: FieldComponent }> {
  return async () => {
  const mod = await importFn();
  const Component = (exportName && typeof exportName === "string" && mod[exportName]) ? mod[exportName] : extractComponent(mod);
  return { default: Component as FieldComponent };
  };
  }
  /
  All lazy field registrations.
  Each entry becomes a separate output chunk in Vite/webpack.
  /
  const LAZY_FIELDS: Array<[string, () => Promise<{ default: FieldComponent }>]> = [
  // ── Primitive inputs ──────────────────────────────────────────────────
  ["switch", lazyWrapped(() => import("./primitive/SwitchField"), "SwitchField", { wrapOuter: false })],
  ["range", lazyDirect(() => import("./primitive/RangeField"), "RangeField")],
  ["file", lazyDirect(() => import("./primitive/FileField"), "FileField")],
  ["multiselect",lazyDirect(() => import("./primitive/MultiSelectField"), "MultiSelectField")],
  ["phone", lazyWrapped(() => import("./primitive/PhoneField"), "PhoneField")],
  ["code", lazyWrapped(() => import("./primitive/CodeInputField"), "CodeInputField")],
  ["search_input", lazyWrapped(() => import("./primitive/SearchInputField"), "SearchInputField", { showLabel: false })],
  ["table_filter", lazyWrapped(() => import("./primitive/TableFilterField"), "TableFilterField", { showLabel: false })],
  // ── Static / display ──────────────────────────────────────────────────
  ["header", lazyWrapped(() => import("./primitive/StaticFields"), "HeaderField", { showLabel: false, wrapOuter: false })],
  ["paragraph", lazyWrapped(() => import("./primitive/StaticFields"), "ParagraphField", { showLabel: false, wrapOuter: false })],
  ["html", lazyWrapped(() => import("./primitive/StaticFields"), "HtmlField", { showLabel: false, wrapOuter: false })],
  ["image", lazyWrapped(() => import("./primitive/ImageField"), "ImageField", { showLabel: false, wrapOuter: false })],
  ["button", lazyWrapped(() => import("./primitive/ButtonField"), "ButtonField", { showLabel: false, wrapOuter: false })],
  ["divider", lazyDirect(() => import("./identity/IdentityAtoms"), "FormDivider")],
  ["divider-label", lazyDirect(() => import("./identity/IdentityAtoms"), "FormDivider")],
  ["social", lazyDirect(() => import("./identity/IdentityAtoms"), "SocialAuthButtons")],
  // ── Structure ─────────────────────────────────────────────────────────
  ["container", lazyDirect(() => import("./structure/ContainerField"), "ContainerField")],
  ["card", lazyDirect(() => import("./structure/CardField"), "CardField")],
  ["accordion", lazyDirect(() => import("./structure/AccordionField"), "AccordionField")],
  ["fieldset", lazyDirect(() => import("./structure/FieldsetField"), "FieldsetField")],
  ["group", lazyDirect(() => import("./structure/GroupField"), "GroupField")],
  ["slot", lazyWrapped(() => import("./structure/SlotField"), "SlotField", { showLabel: false, wrapOuter: false })],
  ["tab", lazyDirect(() => import("./structure/TabsField"), "TabsField")],
  ];
  /
  Creates the default code-split registry with lazy-loaded heavy fields.
  Drop-in replacement for `defaultRegistry`:

```tsx
import { defaultRegistry } from "@ui/form/core/RegistryStore";

// defaultRegistry now uses lazy loading — zero migration needed
```

### `createMinimalRegistry`

Creates a minimal registry with only basic input fields.
Use for forms with very specific field needs.

### `createSplitRegistry`

Creates the split registry (alias of createDefaultRegistry for discoverability).

---

## [`fields/primitive/AutocompleteField.tsx`](../../../src/shared/ui/form/fields/primitive/AutocompleteField.tsx)

### `AutocompleteField`

_(No documentation provided)_

---

## [`fields/primitive/ButtonField.tsx`](../../../src/shared/ui/form/fields/primitive/ButtonField.tsx)

### `ButtonField`

ButtonField - Native action component for the Form Engine.
Supports variant themes (primary, secondary, danger) and full-width layout.
Now 100% harmonized with the global SlotMap/DCS theme engine.

---

## [`fields/primitive/CheckboxField.tsx`](../../../src/shared/ui/form/fields/primitive/CheckboxField.tsx)

### `CheckboxField`

CheckboxField Component
Responsibility: Single-state toggle (true/false).
Implements the Slot-Based Style Architecture.
DESIGN INTENT:

- `inputWrapper` slot: Optional boxed foundation for the label + toggle group.
- `input` slot: Handled by the native/themed checkbox control.
  @param props.field - Field definition with state and labels.
  @param props.styles - Computed SlotMap foundations and overrides.

---

## [`fields/primitive/CodeInputField.tsx`](../../../src/shared/ui/form/fields/primitive/CodeInputField.tsx)

### `CodeInputField`

_(No documentation provided)_

---

## ``fields/primitive/CustomSelect.tsx``

### `Select`

_(No documentation provided)_

### `SelectTrigger`

_(No documentation provided)_

### `SelectMenu`

_(No documentation provided)_

### `SelectOption`

_(No documentation provided)_

### `CustomSelectField`

_(No documentation provided)_

---

## [`fields/primitive/FileField.tsx`](../../../src/shared/ui/form/fields/primitive/FileField.tsx)

### `FileField`

_(No documentation provided)_

---

## [`fields/primitive/ImageField.tsx`](../../../src/shared/ui/form/fields/primitive/ImageField.tsx)

### `ImageField`

ImageField: A presentational primitive for rendering images within the form.
Supports src, alt, and overlay properties via the schema.

---

## [`fields/primitive/MultiSelectField.tsx`](../../../src/shared/ui/form/fields/primitive/MultiSelectField.tsx)

### `MultiSelectField`

_(No documentation provided)_

---

## [`fields/primitive/NumberInputField.tsx`](../../../src/shared/ui/form/fields/primitive/NumberInputField.tsx)

### `NumberInputField`

_(No documentation provided)_

---

## [`fields/primitive/ParagraphField.stories.tsx`](../../../src/shared/ui/form/fields/primitive/ParagraphField.stories.tsx)

### `Default`

Default — plain text paragraph

### `LongText`

Long text — wrapping and line height

### `HTMLContent`

HTML mode — renders rich content safely via dangerouslySetInnerHTML

### `WarningText`

Custom text color override via styles

### `PlainDivider`

_(No documentation provided)_

### `LabelledDivider`

_(No documentation provided)_

### `SequentialDividers`

_(No documentation provided)_

---

## [`fields/primitive/PhoneField.tsx`](../../../src/shared/ui/form/fields/primitive/PhoneField.tsx)

### `PhoneField`

_(No documentation provided)_

---

## [`fields/primitive/RadioField.tsx`](../../../src/shared/ui/form/fields/primitive/RadioField.tsx)

### `RadioField`

RadioField Component
Responsibility: Exclusive selection from a small set of options.
Implements the Slot-Based Style Architecture.
DESIGN INTENT:

- `inputWrapper` slot: Provides the foundation for the entire radio group container.
- `input` slot: Applied to each individual radio control for themed consistency.
  @param props.field - Field definition containing static/dynamic options.
  @param props.styles - Computed SlotMap foundations and overrides.

---

## [`fields/primitive/RangeField.tsx`](../../../src/shared/ui/form/fields/primitive/RangeField.tsx)

### `RangeField`

_(No documentation provided)_

---

## [`fields/primitive/SearchInputField.tsx`](../../../src/shared/ui/form/fields/primitive/SearchInputField.tsx)

### `SearchInputField`

SearchInputField
A specialized Atomic Adapter for search inputs.
Features:

- Built-in Search Icon
- Integrated Clear button
- Submit (Enter) indicator
- Consistent Zenith search aesthetics

---

## [`fields/primitive/SelectField.stories.tsx`](../../../src/shared/ui/form/fields/primitive/SelectField.stories.tsx)

### `BottomOfCard`

Testing Clipping Fix:
When a field is at the very bottom of a CardField,
the menu should "float" outside the card without being clipped.

### `Default`

_(No documentation provided)_

### `WithIcons`

_(No documentation provided)_

### `ErrorState`

_(No documentation provided)_

### `Disabled`

_(No documentation provided)_

### `LongList`

_(No documentation provided)_

---

## [`fields/primitive/SelectField.tsx`](../../../src/shared/ui/form/fields/primitive/SelectField.tsx)

### `SelectField`

SelectField Component
Responsibility: Manages single-selection from a list of options.
This refactored version ensures the current Field Surface (OuterWrapper)
acts as the Select Trigger, allowing start/end icons and slots to
participate in the interaction scope.

---

## [`fields/primitive/StaticFields.stories.tsx`](../../../src/shared/ui/form/fields/primitive/StaticFields.stories.tsx)

### `H3Default`

Default — h3 with description

### `AllHeadingLevels`

All six heading levels rendered together

### `H1Hero`

H1 — Hero-level heading with description

### `H2Section`

H2 — Section title

### `H6Eyebrow`

H6 — Micro label / eyebrow text

### `CustomStyled`

With custom className override

---

## [`fields/primitive/StaticFields.tsx`](../../../src/shared/ui/form/fields/primitive/StaticFields.tsx)

### `HeaderField`

_(No documentation provided)_

### `ParagraphField`

_(No documentation provided)_

### `DividerField`

_(No documentation provided)_

### `HtmlField`

_(No documentation provided)_

---

## [`fields/primitive/SwitchField.tsx`](../../../src/shared/ui/form/fields/primitive/SwitchField.tsx)

### `SwitchField`

_(No documentation provided)_

---

## [`fields/primitive/TableFilterField.tsx`](../../../src/shared/ui/form/fields/primitive/TableFilterField.tsx)

### `TableFilterField`

TableFilterField
A high-performance Atomic Adapter specialized for data grid filtering.
Features:

- Compact footprint for toolbar integration
- Integrated Clear button (visible only on hover or when populated)
- Minimalist search icon

---

## [`fields/primitive/TextField.stories.tsx`](../../../src/shared/ui/form/fields/primitive/TextField.stories.tsx)

### `Default`

_(No documentation provided)_

### `WithStartContent`

_(No documentation provided)_

### `WithEndContent`

_(No documentation provided)_

### `SearchBar`

_(No documentation provided)_

### `WithError`

_(No documentation provided)_

---

## [`fields/primitive/TextField.tsx`](../../../src/shared/ui/form/fields/primitive/TextField.tsx)

### `TextField`

TextField Component (Atomic Adapter)
Responsibility: Generic text-based input (text, number, email, password, etc.).
Implements the Slot-Based Style Architecture as an Atomic Adapter.

---

## [`fields/primitive/TextareaField.tsx`](../../../src/shared/ui/form/fields/primitive/TextareaField.tsx)

### `TextareaField`

TextareaField Component
Responsibility: Multiline text input.
SURFACE-TRANSPARENT: Relies on OuterWrapper for borders/bg.

---

## [`fields/primitive/WrapperSlots.stories.tsx`](../../../src/shared/ui/form/fields/primitive/WrapperSlots.stories.tsx)

### `FloatingLabel`

_(No documentation provided)_

### `AtomicTooltip`

_(No documentation provided)_

---

## [`fields/primitive/types.ts`](../../../src/shared/ui/form/fields/primitive/types.ts)

### `AtomicFieldProps`

_(No documentation provided)_

---

## [`fields/registry.tsx`](../../../src/shared/ui/form/fields/registry.tsx)

### `FieldRendererProps`

Standard Props for all Field Components in the Registry.
Any component registered in `fieldRegistry` must adhere to this interface.

### `FieldComponent`

The canonical field definition from the Form Schema. /
field: FormField;
/ The current value resolved by the ValueProxy. /
value: any;
/ Current validation error message (if any). /
error?: string;
/ Callback to update the value in the Form State. /
onChange: (value: any) => void;
/ Combined CSS classes from the theme and layout rules. /
className?: string;
}
/
The Component Type used for registering fields.
Includes advanced styling objects and children slots.

### `fieldRegistry`

Granular style overrides passed from the FieldRenderer. /
styles?: {
base?: string;
label?: string;
inputWrapper?: string;
innerWrapper?: string;
mainWrapper?: string;
input?: string;
clearButton?: string;
helperWrapper?: string;
description?: string;
errorMessage?: string;
};
/ Dynamic options provided by the Form Engine or an external provider. /
options?: any[];
}>;
const WrappedTextField = withAtom(TextField);
/
The Master Registry of Field Components.
To add a new field type to the engine, register it here.

### `FIELD_METADATA`

Lazily-rendered icon — call as `metadata.icon()` in JSX to avoid eager evaluation. /
icon: () => React.ReactNode;
}
/
Metadata for visual Field Selection (e.g. in a Form Builder).
Maps field types to human-readable labels and icons.

### `FieldMetadata`

_(No documentation provided)_

---

## [`fields/structure/AccordionField.tsx`](../../../src/shared/ui/form/fields/structure/AccordionField.tsx)

### `AccordionField`

AccordionField
A collapsible section that hides/shows its child fields on click.
Works as a structural container — child fields are rendered inside when open.

## Schema Usage

```ts
{
key: "advanced",           // key sets both id and name
type: "accordion",
label: "Advanced Settings",
defaultOpen: false,        // via customData.defaultOpen
fields: [
{ key: "timeout", type: "number", label: "Timeout (ms)" },
]
}
```

---

## [`fields/structure/CardField.stories.tsx`](../../../src/shared/ui/form/fields/structure/CardField.stories.tsx)

### `AllSlots`

Full manually-assembled card — all slots visible

### `HeaderTitleOnly`

Header-only — title without description

### `BodyOnly`

Body only — no header, no footer

### `ElevationScale`

All four elevation levels

### `Default`

Engine-assembled CardField — default usage

### `HoverStaysGrounded`

Hover does NOT lift card off the page — visual regression test

### `WithFooter`

With footer slot

### `CompactDensity`

Compact density — smaller padding via useFormTheme()

### `NestedCards`

Nested cards — the critical regression test.
Inner cards must NOT break the outer card's border-radius or create
z-index / overflow issues. No overflow-hidden on CardWrapper means
each card is an independent stacking context.

### `DropdownNotClipped`

Dropdown overflow regression — select at bottom of card must NOT be clipped

---

## [`fields/structure/CardField.tsx`](../../../src/shared/ui/form/fields/structure/CardField.tsx)

### `CardWrapper`

_(No documentation provided)_

### `CardHeader`

_(No documentation provided)_

### `CardTitle`

_(No documentation provided)_

### `CardDescription`

_(No documentation provided)_

### `CardBody`

_(No documentation provided)_

### `CardFooter`

_(No documentation provided)_

### `CardField`

_(No documentation provided)_

---

## [`fields/structure/ContainerField.stories.tsx`](../../../src/shared/ui/form/fields/structure/ContainerField.stories.tsx)

### `Default`

Default — transparent container, just groups children

### `StatusStrip`

Horizontal strip — `ContainerField` with flex-row layout via `properties.margin`
to group badge-style metadata side-by-side.

### `SidebarLayout`

Sidebar layout — a container used as the right-rail column inside a 12-col grid.
Demonstrates `col-span` via parent grid on the container itself.

### `NestedContainers`

Nested containers — demonstrates recursive nesting for complex layouts

### `InsideCard`

Inside a Card — demonstrates the typical Card > Container composition

---

## [`fields/structure/ContainerField.tsx`](../../../src/shared/ui/form/fields/structure/ContainerField.tsx)

### `ContainerField`

_(No documentation provided)_

---

## [`fields/structure/FieldsetField.tsx`](../../../src/shared/ui/form/fields/structure/FieldsetField.tsx)

### `FieldsetField`

FieldsetField
A semantic `<fieldset>` + `<legend>` wrapper for grouping related fields.
Improves accessibility (screen readers announce the group context for every child input)
and provides a native HTML landmark for form navigation.
Unlike `section` (a `<div>` group), `fieldset` is an HTML semantic element
explicitly designed for grouping form controls.

## Schema Usage

```ts
{
key: "address",
type: "fieldset",
label: "Shipping Address",
description: "Where should we deliver?",
fields: [
{ key: "street", type: "text", label: "Street" },
{ key: "city",   type: "text", label: "City"   },
]
}
```

---

## [`fields/structure/GroupField.tsx`](../../../src/shared/ui/form/fields/structure/GroupField.tsx)

### `GroupField`

GroupField
An inline horizontal row of fields that share a single group label.
Each child field renders without its own individual label, relying on
the group label for context (e.g., "Full Name" containing "First" + "Last").
This fills the gap between a full `section` (vertical stack) and raw `flex` layout —
Group is a semantic, labeled, horizontal cluster.

## Schema Usage

```ts
{
key: "full_name",
type: "group",
label: "Full Name",
required: true,
layout: { gap: "gap-4" },     // via customData.gap
fields: [
{ key: "first_name", type: "text", label: "First", placeholder: "Alice" },
{ key: "last_name",  type: "text", label: "Last",  placeholder: "Smith" },
]
}
```

---

## [`fields/structure/RepeaterField.tsx`](../../../src/shared/ui/form/fields/structure/RepeaterField.tsx)

### `RepeaterField`

RepeaterField Component
Responsibility: Manages dynamic arrays of complex objects.
OPTIMIZATION: Implements virtualization via @tanstack/react-virtual for O(1) rendering
performance on datasets with 100+ rows.

---

## [`fields/structure/SlotField.tsx`](../../../src/shared/ui/form/fields/structure/SlotField.tsx)

### `SlotField`

SlotField - Portal component for injecting arbitrary React components into the Form.
Usage: Provide a React component or element in field.meta.ui.component OR field.componentProps.component

---

## [`fields/structure/TabsField.tsx`](../../../src/shared/ui/form/fields/structure/TabsField.tsx)

### `TabsField`

Optional icon class (e.g. iconify class) /
icon?: string;
/ Optional badge count /
badge?: number;
/ Whether this tab is disabled /
disabled?: boolean;
}
/
TabsField
A full tab panel renderer for structural sections.
Each child `FormField` (of any type) becomes a tab panel, using `field.label` as the tab title.
Implements ARIA tabs pattern (role="tablist" / role="tab" / role="tabpanel")
with keyboard navigation (ArrowLeft/Right, Home/End).

## Schema Usage

```ts
{
key: "settings",
type: "section",
label: "Settings",
layout: { type: "tabs" },
fields: [
{
key: "general",
type: "section",
label: "General",
fields: [{ key: "name", type: "text", label: "Name" }]
},
{
key: "security",
type: "section",
label: "Security",
fields: [{ key: "password", type: "password", label: "Password" }]
}
]
}
```

### `TabDefinition`

_(No documentation provided)_

---

## [`fields/structure/types.ts`](../../../src/shared/ui/form/fields/structure/types.ts)

### `StructuralFieldProps`

_(No documentation provided)_

---

## [`fields.ts`](../../../src/shared/ui/form/fields.ts)

### `CustomFieldTypes`

Extension point for custom field types.
Use declaration merging to add your own field types:

```ts
declare module "@ui/form/fields" {
  interface CustomFieldTypes {
    "my-custom-field": never;
    "api-field": never;
  }
}
```

Custom types will get autocomplete in schema definitions and the builder palette.

### `FieldType`

Supported field types

### `StringPath`

Deep path resolver for strict form data binding

### `FieldCategory`

Field Categories for Palettes

### `FIELD_CONSTANTS`

Global Field Constants

### `FieldCapabilities`

Field Capabilities (The technical contract for state allocation)

### `FieldRegistryItem`

Registry Entry Definition

### `FIELD_REGISTRY`

Central Field Registry

### `getFieldCategory`

Get category for a field type

### `getFieldDefinition`

Get full registry item

### `isNativeDelegationSupported`

Determines if a field type supports Native DOM Event Delegation.
Standard inputs return true. Complex custom UI components return false.
This encapsulates behavioral metadata within the Domain Model.

### `extractNativeDOMValue`

Extracts the normalized data value from a native DOM element.
Encapsulates the logic of mapping DOM node types (like checkbox vs text)
to their corresponding JavaScript value types.

### `FieldOption`

Static option for select-type fields

### `DynamicOptionSource`

Optional dynamic option source

### `SyncMode`

Synchronization Strategy

- 'keystroke' (default) - Update state on every change
- 'blur' - Update state only when field loses focus
- 'manual' - Update state only via explicit code calls

### `RemoteOptions`

Unified Remote Options (v2 Specification)

### `RepeaterConfig`

Debounce delay in ms for re-fetching when watched fields change. Default: 300. /
debounceMs?: number;
/ Custom mapping paths for the response-to-option transformation. /
mapping?: {
valuePath?: string;
labelPath?: string;
groupBy?: string;
};
}
/ Configuration for Repeater fields (New 5V)

### `RowPathFormat`

How row state is keyed internally.

- 'index' (default): State is bound to the position in the array.
- 'identity': State is bound to a unique ID in the row data.
  /
  rowStateStrategy?: "index" | "identity";
  / Required if rowStateStrategy is 'identity'. The field in row data containing the unique ID. /
  rowIdentityField?: string;
  / How row data paths are formatted in the submission payload. /
  rowPathFormat?: RowPathFormat;
  }
  / Configuration for customizing the external data path for repeater rows

### `FormRow`

Formatting template.

- [idx] is replaced by the current row index.
- [id] is replaced by the value from identityField.
  @example "[idx]." or ".[idx]." or "#[id]."
  /
  template: string;
  / The field in row data providing the value for [id] /
  identityField?: string;
  }
  / Form Row Definition for Renderers

### `FieldEvents`

=========================
FIELD CONCERNS
========================= /
/ Field Lifecycle Events

### `FieldOptions`

@deprecated Moved to FormField root for better DX /
onChange?: (field: FormField<T>, value: T, formData: any) => void | T;
beforeChange?: (
field: FormField<T>,
value: T,
formData: any
) => boolean | void;
afterChange?: (field: FormField<T>, value: T, formData: any) => void;
onBlur?: (field: FormField<T>, value: T, formData: any) => void;
onFocus?: (field: FormField<T>, value: T, formData: any) => void;
onValidate?: (
field: FormField<T>,
value: T,
formData: any
) => boolean | string;
}
/ Field options

### `FieldMeta`

UI Component override (Decoupled Architecture).
Allows passing a string registry key (e.g. "async-select") or a raw React Node.
If provided, the FieldRenderer uses this instead of `field.type` for rendering.
/
component?: string | React.ComponentType<any> | React.ReactNode;
}
/ Aggregated Field Metadata

### `FieldLayout`

@deprecated Use `field.conditions` at the root level instead.
Kept for backwards compatibility — the engine reads both paths,
preferring the root `field.conditions`.
/
conditions?: FieldConditionExpression;
i18n?: Internationalization;
category?: FieldCategory; // explicit override
// Visual Enhancements (Refactored to UI namespace)
ui?: FieldUI;
}
/ Layout configuration

### `FieldProperties`

HeroUI-compatible presentation wrapper (semantic only)

### `BaseComponentProps`

@deprecated Use `meta.ui.classNames` instead. This path will be removed in v2.
/
customClasses?: string | string[];
placeholder?: string; // Convenience prop
intent?:
| "primary"
| "secondary"
| "success"
| "danger"
| "warning"
| "info"
| "subtle"; // Strategic Enhancement
/
@deprecated Use `meta.ui.classNames` instead. This path will be removed in v2.
/
classNames?: {
base?: string;
label?: string;
inputWrapper?: string;
innerWrapper?: string;
mainWrapper?: string;
input?: string;
clearButton?: string;
helperWrapper?: string;
description?: string;
errorMessage?: string;
};
// Spacing & Layout Structure (New 5V) - Strict Modifiers
modifiers?: ModifierProps;
backgroundColor?: string;
border?: string;
// Card Specific
elevation?: "sm" | "md" | "lg" | "none";
footer?: string;
footerContent?: React.ReactNode;
// Data
options?: FieldOption[];
tooltip?: string | readonly string[];
// Placement Control (Variants)
slotPlacement?: "inner" | "outer"; // inner = inside input border, outer = outside input border
tooltipPlacement?: "label" | "inner"; // label = standard, inner = inside input wrapper
/ Allow for component-specific properties without breaking types /
[key: string]: any;
}
/ Component Props Definitions (Strict Typing)

### `FormField`

Base Form Field

### `RawFormField`

High-level identifier used to automate 'id' and 'name' generation.

- Sets 'id' (structural logic) if missing.
- Sets 'name' (form data logic) if missing.
  /
  key?: string;
  /
  The canonical key used for state binding.
  STRICTLY TYPED: If this field is an input, 'name' MUST map to a valid path in TFormData.
  /
  name?: TType extends InputFieldType
  ? StringPath<TFormData> | (string & {})
  : string;
  type: TType;
  label: string | TranslatedText;
  description?: string | TranslatedText;
  /
  Explicit component override.
- If a string, looks up the component in the registry.
- If a React component, uses it directly.
  /
  component?: any;
  /
  Guidance text displayed when the field is empty.
  /
  placeholder?: string | TranslatedText;
  initialValue?: TValue;
  value?: TValue;
  /
  How the UI field syncs with the engine state.
  @default 'keystroke'
  /
  syncMode?: SyncMode;
  /
  Defines how the field value behaves when the field becomes hidden.
- 'purge' (default): Value is set to null and errors are cleared.
- 'preserve': Value is retained in state but errors are cleared.
- 'suspend': Value and errors are retained, only the UI is hidden.
  /
  visibilityBehavior?: "purge" | "preserve" | "suspend";
  /
  onChange — fires when the field value changes.
  Return a value to transform it before it hits the state.
  /
  onChange?: (
  value: TValue,
  field: FormField<TValue, TType, TFormData>,
  formData: TFormData
  ) => void | TValue;
  /
  onSelectChange — specifically for select-type fields.
  Return a value to transform it before it hits the state.
  /
  onSelectChange?: (
  value: TValue,
  field: FormField<TValue, TType, TFormData>,
  formData: TFormData
  ) => void | TValue;
  /
  @internal Internal use only — not part of the public API.
  Used by withAtom HOC for high-density rendering optimizations.
  /
  componentProps?: TType extends keyof ComponentPropsMap
  ? ComponentPropsMap[TType]
  : BaseComponentProps;
  validation?: ValidationSettings;
  meta?: FieldMeta<TValue>;
  /
  Condition expression controlling visibility, disabled state, and setValue effects
  for this field based on other fields' values.
  /
  conditions?: FieldConditionExpression;
  required?:
  | boolean
  | ReactiveValue<boolean>
  | ((
  values: any,
  context: import("./core/condition-proxy").ConditionContext
  ) => boolean);
  visible?:
  | boolean
  | ReactiveValue<boolean>
  | ((
  values: any,
  context: import("./core/condition-proxy").ConditionContext
  ) => boolean);
  enabled?:
  | boolean
  | ReactiveValue<boolean>
  | ((
  values: any,
  context: import("./core/condition-proxy").ConditionContext
  ) => boolean);
  computed?: ComputedField;
  autoComplete?: string;
  tags?: string[];
  customData?: Record<string, any>;
  / Field-level behavioral and presentation overrides /
  settings?: {
  density?: "compact" | "comfortable" | "spacious";
  };
  nextField?:
  | string
  | ((
  formData: TFormData,
  field: FormField<TValue, TType, TFormData>
  ) => string | null);
  // Recursive Nesting for Container Fields
  fields?: FormField<any, any, TFormData>[];
  /
  Configuration for Repeater fields.
  Defines how row state is keyed internally and how data paths are formatted for serialization.
  /
  repeaterConfig?: RepeaterConfig;
  // Data Options for Select/Radio (Moved to root for better DX)
  options?: FieldOption[];
  remoteOptions?: RemoteOptions; // v2 Async Support
  / Whether the field allows creating new options (tags/creatable select). /
  creatable?: boolean;
  / Whether the field's current selection can be cleared. /
  clearable?: boolean;
  properties?: FieldProperties;
  layout?: FieldLayout | SectionLayoutConfig;
  /
  @deprecated Use `meta.ui.classNames` instead. This path will be removed in v2.
  /
  custom?: { cssClasses?: string[] };
  columnSpan?: number; // legacy support
  /
  Headless Mode: If true, the withAtom HOC will bypass the standard
  OuterWrapper/InnerWrapper trinity, allowing the component to render
  its own surface entirely (e.g., Buttons, Spacers, Custom Hero atoms).
  /
  headless?: boolean;
  /
  Whether this composite field has had its children expanded inline
  during schema normalization. Set by field-registry.ts for DCS composite
  types (e.g., address-group) whose sub-fields are injected into the tree.
  /
  isExpandedComposite?: boolean;
  /
  If true, the field exists only for UI state (e.g. driving conditionals, tabs, wizard steps)
  and will be stripped from the final payload when form.getPayload() is called.
  /
  ephemeral?: boolean;
  }
  /
  Raw Form Field (Developer Facing)
  IDs are optional here as they are auto-generated during normalization.

### `RawFormSection`

High-level identifier used to automate 'id' and 'name' generation.
/
key?: string;
component?: any;
/
Guidance text displayed when the field is empty.
/
placeholder?: string | TranslatedText;
/
The unique identifier for the field.
If 'name' is omitted, the engine uses 'id' as the state binding key,
so it receives strict path autocomplete for input fields.
/
id?: TType extends InputFieldType
? StringPath<TFormData> | (string & {})
: string;
fields?: RawFormField<any, any, TFormData>[];
/
If true, the field exists only for UI state and will be stripped from the final payload.
/
ephemeral?: boolean;
}
/ Raw Form Section (Developer Facing)

### `InputFieldType`

_(No documentation provided)_

### `StaticFieldType`

_(No documentation provided)_

### `StructureFieldType`

_(No documentation provided)_

### `FieldUI`

_(No documentation provided)_

### `TextFieldProps`

_(No documentation provided)_

### `SelectFieldProps`

_(No documentation provided)_

### `ComponentPropsMap`

_(No documentation provided)_

---

## [`hoc/withAtom.tsx`](../../../src/shared/ui/form/hoc/withAtom.tsx)

### `withAtom`

withAtom HOC (The DCS - Data Component System Layer)
Responsibiliy: Handles only the visual orchestration of a component.
It applies the "Wrapper Trinity" (Outer/Inner) and maps presentation
data (intent, variant, layout) to Tailwind classes.

---

## [`hooks/useController.ts`](../../../src/shared/ui/form/hooks/useController.ts)

### `useController`

useController<T>(fieldKey)
Full controlled field hook. Provides the complete field state + handlers
needed to build a custom controlled input component connected to the form engine.
Internally delegates to `useFieldAtom` (the engine's micro-subscription primitive)
but resolves the field by `key`, `name`, OR `id` — removing the need to know
which addressing mode to use.

## Key-Based Addressing

When a schema uses `key`, `id === name === key`. Passing `key` to `useController`
always resolves correctly regardless of whether the engine looks up by id or name.
@param fieldKey - The field's `key`, `name`, or `id`.
@returns Full field state + stable handlers + resolved field definition.
@example
// Schema: { key: "email", type: "text", validation: { required: true } }
function CustomEmailInput() {
const { value, error, errorMessage, onChange, onBlur, field } = useController("email");
return (
<input
value={value ?? ""}
onChange={(e) => onChange(e.target.value)}
onBlur={onBlur}
aria-invalid={!!error}
aria-describedby={error ? `${field?.id}-error` : undefined}
/>
);
}

---

## [`hooks/useDynamicForm.ts`](../../../src/shared/ui/form/hooks/useDynamicForm.ts)

### `useDynamicForm`

If true, the hook will load the schema synchronously and skip the loading state.
Only use this if you know the schema builder registered is synchronous.
/
sync?: boolean;
}
/
useDynamicForm
Replaces bespoke controllers (e.g. useCreateBranchController).
Retrieves the logical skeleton, rules, and UI config dynamically by formId.

### `UseDynamicFormOptions`

_(No documentation provided)_

---

## [`hooks/useField.tsx`](../../../src/shared/ui/form/hooks/useField.tsx)

### `useField`

useField Hook — Performs ATOMIC subscriptions to a specific field's state.
PERFORMANCE: This is the core of the O(1) re-render architecture.
Instead of subscribing to the entire form state in the shell, each field
component uses this hook to listen only for changes to its specific ID.
`subscribeToField` is defined on `StateManager` and surfaced on `FormCore`
(engine.ts L1054). It maintains a per-field subscriber set and only notifies
listeners when `notifyField(fieldId)` is called — not on every global mutation.
`getComponentProps` is on the `Form` facade (form.ts L120) which extends `FormCore`.
@param fieldId - The ID of the field to subscribe to.
@returns The merged props for the field, derived from the latest engine state.

---

## [`hooks/useFieldAtom.ts`](../../../src/shared/ui/form/hooks/useFieldAtom.ts)

### `useFieldAtom`

useFieldAtom
ATOMIC SUBSCRIPTION HOOK: Subscribes directly to a specific field's state slice
via the engine's per-field notification channel (`subscribeToField`).
This ensures that a re-render is triggered ONLY if the value, validity, or vitality
of this specific entity changes, preventing full-form layout thrashing.
Previously used the global `form.subscribe()` channel which fired on EVERY state
change across the entire form.
@param fieldId - The unique ID of the field entity.
@param fieldName - Optional dot-notation path for value resolution.

---

## [`hooks/useFieldViewModel.ts`](../../../src/shared/ui/form/hooks/useFieldViewModel.ts)

### `FieldViewModelProps`

View-model props produced by {@link useFieldViewModel}.
Flattens nested `inputProps` to the top level so `withAtom` / AtomicFieldProps
can read `value`, `onChange`, `onBlur` directly without drilling into `inputProps`.

### `useFieldViewModel`

_(No documentation provided)_

---

## [`hooks/useFilterUrlSync.ts`](../../../src/shared/ui/form/hooks/useFilterUrlSync.ts)

### `useFilterUrlSync`

How long to wait after the last keystroke before writing to the URL.
Defaults to 300ms to prevent flooding the browser history API.
/
debounceMs?: number;
/
Transforms Engine Data (e.g. Dates, Arrays) into simple string records for the URL.
Omitting undefined or empty strings keeps the URL clean.
/
serialize?: (values: T) => Record<string, string>;
/
Transforms raw URL strings back into strongly-typed Engine Data (e.g. "18" -> 18).
/
deserialize?: (params: URLSearchParams) => Partial<T>;
/
If true, uses history.replaceState (doesn't add to back-button history).
Defaults to true for inline typing.
/
replaceHistory?: boolean;
}
/
Bi-Directional URL Synchronization Hook (The 10,000,000x Filter Bridge)
Safely bridges a Headless Form Engine to the Browser's URL Parameters.

- Engine ➡️ URL (Debounced & Serialized)
- URL ➡️ Engine (Back-button safe & Hydrated)

### `UseFilterUrlSyncOptions`

_(No documentation provided)_

---

## [`hooks/useFocusTrap.ts`](../../../src/shared/ui/form/hooks/useFocusTrap.ts)

### `useFocusTrap`

When true, the focus trap is active. /
enabled: boolean;
/ CSS selector for the container element. Defaults to '[data-form-shell]'. /
containerSelector?: string;
/ Auto-focus first element when enabled changes to true. /
autoFocus?: boolean;
}
/
Traps Tab/Shift+Tab cycling within the form container.
Used for wizard modals and dialogs to prevent keyboard focus from escaping.

---

## [`hooks/useForm.tsx`](../../../src/shared/ui/form/hooks/useForm.tsx)

### `useForm`

_(No documentation provided)_

---

## [`hooks/useFormContext.ts`](../../../src/shared/ui/form/hooks/useFormContext.ts)

### `useFormContext`

useFormContext<T>
Typed access to the live `FormCore` instance from anywhere inside a `<Form>` tree.
The generic `T` should match the shape of the form's data model to get full
autocomplete on `form.values`, `form.setValue()`, etc.
Resolves fields by `key` (which auto-sets both `id` and `name` to the same value),
eliminating the id/name split entirely when a schema uses `key`.
@example
// Inside any component rendered within a <Form>:
const form = useFormContext<{ email: string; role: string }>();
const email = form.values.email;
await form.setValue("email", "alice@example.com");
const isValid = form.isValid;
@throws If called outside of a `<FormRegistryProvider>` (i.e., outside a `<Form>`).

---

## [`hooks/useFormEventDelegation.ts`](../../../src/shared/ui/form/hooks/useFormEventDelegation.ts)

### `useFormEventDelegation`

Hook that creates onChange/onBlur handlers for the <form> element
using event delegation — captures bubbling native DOM events to
minimize React listener overhead.

---

## [`hooks/useFormExternalStore.ts`](../../../src/shared/ui/form/hooks/useFormExternalStore.ts)

### `useFormExternalStore`

Subscribe to global form state via `useSyncExternalStore`.
Re-renders on any structural change (visibility, isDirty, isValid, etc.).
Does NOT re-render on per-field keystrokes — use `useFieldExternalStore` for that.
@param form - A `FormCore` or `Form` instance.
@returns The current `structuralVersion` (monotonic counter).
@example
function FormStatus({ form }) {
const version = useFormExternalStore(form);
return <span>Form v{version}</span>;
}

### `useFieldExternalStore`

Subscribe to a single field's props via `useSyncExternalStore`.
Atomic per-field subscription — only re-renders when this specific field changes.
Returns the cached `FieldComponentProps` from the React adapter.
@param form - A `FormCore` or `Form` instance.
@param fieldId - The field's internal state key.
@returns The field's resolved component props (value, onChange, error, etc.).
@example
function ExternalEmailDisplay({ form }) {
const props = useFieldExternalStore(form, "email_field_id");
return <div>{props.label}: {props.value}</div>;
}

### `useFormSlice`

Subscribe to a derived slice of form state via `useSyncExternalStore`.
Only re-renders when the selected slice changes (identity check).
@param form - A `FormCore` or `Form` instance.
@param selector - Pure function that extracts a slice from `InternalFormState`.
@returns The selected slice.
@example
// Subscribe to only validity:
const validity = useFormSlice(form, (state) => state.validity);
@example
// Subscribe to visible field IDs:
const visibleIds = useFormSlice(form, (state) =>
Object.keys(state.visibility).filter(k => state.visibility[k])
);

---

## [`hooks/useFormFields.tsx`](../../../src/shared/ui/form/hooks/useFormFields.tsx)

### `useFormField`

useFormField
A convenience wrapper for rendering form fields manually (outside of FormComposer).
DELEGATION PRINCIPLE: This hook MUST always delegate to form.getComponentProps()
to ensure visual and behavioral consistency with the v2 engine.

---

## [`hooks/useFormI18n.ts`](../../../src/shared/ui/form/hooks/useFormI18n.ts)

### `useFormI18n`

_(No documentation provided)_

---

## [`hooks/useFormMiddleware.ts`](../../../src/shared/ui/form/hooks/useFormMiddleware.ts)

### `useFormMiddleware`

_(No documentation provided)_

---

## [`hooks/useFormTheme.ts`](../../../src/shared/ui/form/hooks/useFormTheme.ts)

### `ThemeResult`

_(No documentation provided)_

### `useFormTheme`

_(No documentation provided)_

---

## [`hooks/useMDAPForm.ts`](../../../src/shared/ui/form/hooks/useMDAPForm.ts)

### `useMDAPForm`

DX Facade: A streamlined hook for initializing enterprise forms.
Abstracts the 6-layer MDAP compilation and formalizes the Mutation/Submit architecture,
including React Query Cache invalidation and Optimistic updates.

### `UseMDAPFormOptions`

_(No documentation provided)_

---

## [`hooks/usePreloadFields.ts`](../../../src/shared/ui/form/hooks/usePreloadFields.ts)

### `usePreloadFormFields`

Preloads lazy field components for a set of form definitions.
Call this at the route level to warm the field component cache
before the form renders — eliminates the loading skeleton flash.

## Usage

```tsx
import { createSplitRegistry } from "@ui/form/fields/lazy-registry-builder";
import { usePreloadFormFields } from "@ui/form/hooks/usePreloadFields";

function ProductPage() {
  usePreloadFormFields(productFormDef);
  return <Form definition={productFormDef} registry={createSplitRegistry()} />;
}
```

---

## [`hooks/useValidationJump.ts`](../../../src/shared/ui/form/hooks/useValidationJump.ts)

### `useValidationJump`

Hook to automatically expand Tabs and Accordions when a validation error occurs.
Works by looking up the first invalid field in FormCore, then walking up its
ancestor chain to find any parent layout nodes, and imperatively opening them.

---

## [`hooks/useWatch.ts`](../../../src/shared/ui/form/hooks/useWatch.ts)

### `useWatch`

useWatch<T>(fieldKey)
Reactively subscribes to a single field's value. Re-renders the calling component
ONLY when that field's value changes — not on every form keystroke.

## Key-Based Addressing

Pass a field's `key` (preferred), `name`, or `id` — they all resolve via
`form.resolveField()`. When using `key` in the schema, `id === name === key`,
making this hook the single, consistent way to address any field.
@param fieldKey - The field's `key`, `name`, or `id`.
@returns The current value of the field (type-safe via generic T).
@example
// Schema uses key:
// { key: "role", type: "select", options: [...] }
function RoleAwarePanel() {
const role = useWatch<string>("role"); // key = name = id = "role"
return role === "admin" ? <AdminPanel /> : null;
}

### `useWatchFields`

useWatchFields<T>(fieldKeys)
Reactively subscribes to multiple field values simultaneously.
Returns a partial object keyed by the field keys you passed in.
@param fieldKeys - Array of field keys/names/ids to watch.
@returns A stable object updated whenever any of the watched fields change.
@example
const { country, city } = useWatchFields(["country", "city"]);
// Shows "city" only when country is set
if (!country) return null;

---

## [`layout/LayoutRendererRegistry.ts`](../../../src/shared/ui/form/layout/LayoutRendererRegistry.ts)

### `LayoutRendererContext`

Render child field callback type — mirrors the render prop in FormComposer.
/
type RenderChildFieldFn = (props: {
field: FormField;
getComponentProps: (id: string) => any;
visibility?: Record<string, boolean>;
spacing?: SpacingConfig;
parentLayout?: RuntimeLayoutConfig;
key?: string;
}) => React.ReactNode;
/
Rendering context passed to layout renderers that need access to
the rendering pipeline utilities (e.g., tabs renderer that creates
per-child SectionContent instances).

### `LayoutRendererProps`

Props that every layout renderer receives.

### `LayoutRenderer`

A layout renderer is a React component that renders a structural container.
The renderer is resolved from the layout type string via the registry.

### `layoutRendererRegistry`

_(No documentation provided)_

---

## [`layout/SectionComposer.tsx`](../../../src/shared/ui/form/layout/SectionComposer.tsx)

### `SectionContent`

@deprecated Resolved from context via usePrimitiveRuntime().
Kept for backward-compatibility only.
/
getComponentProps?: (fieldId: string) => any;
/
@deprecated Resolved from context via usePrimitiveRuntime().
Kept for backward-compatibility only.
/
visibility?: Record<string, boolean>;
spacing?: SpacingConfig;
parentLayout?: RuntimeLayoutConfig;
dcsStyles?: any;
}
/
Renders child fields via the FieldRouter from FormRoutingContext.
getComponentProps and visibility are resolved from context — not passed as args.
/
function renderChildFields(
fields: FormField[],
getComponentProps: (id: string) => any,
visibility: Record<string, boolean>,
spacing?: SpacingConfig,
parentLayout?: RuntimeLayoutConfig,
renderField?: ReturnType<typeof useFieldRouter>
): React.ReactNode {
if (!renderField) return null;
return (
<>
{fields.map((childField) =>
renderField({
field: childField,
getComponentProps,
visibility,
spacing,
parentLayout,
})
)}
</>
);
}
export interface SectionContentProps {
layoutConfig: RuntimeLayoutConfig;
children: React.ReactNode;
spacing?: SpacingConfig;
headless?: boolean;
}
/
SectionContent — Resolves a section's layout algorithm and renders its child fields.
Supports three layout modes:

- Grid (default) — CSS Grid with configurable columns via `parseLayoutConfig`
- Flex — horizontal flex layout
- Block — vertical stack layout
  BREAKS THE CIRCULAR DEPENDENCY: receives pre-rendered ReactNode children
  instead of raw FormField[] + rendering callbacks.
  Wrapped in `React.memo` to avoid re-renders when the layout config hasn't changed.

### `SectionComposer`

SectionComposer — Renders structural containers via the layout renderer registry.
Resolves the layout config from field schema, then delegates to the registered
renderer for the given layout type. If no renderer is registered, falls back
to the default section renderer.
The renderer registry replaces the previous if/else chain, making new layout
types extensible without modifying core renderer code.

### `SectionComposerProps`

_(No documentation provided)_

### `SectionContentProps`

_(No documentation provided)_

---

## ``layout/SplitLayoutRenderer.tsx``

### `SplitLayoutRenderer`

_(No documentation provided)_

---

## [`manifest/default-manifests.ts`](../../../src/shared/ui/form/manifest/default-manifests.ts)

### `registerDefaultManifests`

@file default-manifests.ts
@description Default field and layout manifest registrations.
This module has a side-effect: calling `registerDefaultManifests()` registers
all built-in field types (input, static, container, composite) and layout
renderers into the singleton `manifestRegistry`. It is auto-imported by
`fields.ts` to ensure the registry is populated at module load time.
Also registers per-type InstanceDefinition defaults for select-like fields
(select, multiselect, radio, autocomplete) that configure value mapping,
selection behavior, and search configuration.
@module DefaultManifests
/
import { manifestRegistry } from "../core/ManifestRegistry";
import type { FieldManifest, LayoutRendererManifest } from "../types/manifest";
/ @internal Convenience capability presets — matches field.ts CAPS. /
const CAPS = {
INPUT: { hasValue: true, hasValidity: true, hasVisibility: true, hasView: true, hasVitality: true },
STATIC: { hasValue: false, hasValidity: false, hasVisibility: true, hasView: true, hasVitality: false },
CONTAINER: { hasValue: false, hasValidity: false, hasVisibility: true, hasView: true, hasVitality: false },
COLLECTOR: { hasValue: false, hasValidity: true, hasVisibility: true, hasView: true, hasVitality: false, derivesValidityFromChildren: true },
};
// ── INPUT FIELDS ───────────────────────────────────────────────────────────
const inputFields: FieldManifest[] = [
{ type: "text", aliases: ["email", "number", "password", "phone", "url", "date", "datetime", "time"], category: "input", routing: "leaf", capabilities: CAPS.INPUT, label: "Text Field", wrapper: { enabled: true } },
{ type: "textarea", category: "input", routing: "leaf", capabilities: CAPS.INPUT, label: "Text Area", wrapper: { enabled: true } },
{ type: "select", category: "input", routing: "leaf", capabilities: CAPS.INPUT, label: "Select Dropdown", wrapper: { enabled: true } },
{ type: "checkbox", category: "input", routing: "leaf", capabilities: CAPS.INPUT, label: "Checkbox", wrapper: { enabled: true } },
{ type: "radio", category: "input", routing: "leaf", capabilities: CAPS.INPUT, label: "Radio Group", wrapper: { enabled: true } },
{ type: "switch", category: "input", routing: "leaf", capabilities: CAPS.INPUT, label: "Switch Toggle", wrapper: { enabled: true } },
{ type: "multiselect", category: "input", routing: "leaf", capabilities: CAPS.INPUT, label: "Multi Select", wrapper: { enabled: true } },
{ type: "autocomplete", category: "input", routing: "leaf", capabilities: CAPS.INPUT, label: "Autocomplete", wrapper: { enabled: true } },
{ type: "file", category: "input", routing: "leaf", capabilities: CAPS.INPUT, label: "File Upload", wrapper: { enabled: true } },
{ type: "signature", category: "input", routing: "leaf", capabilities: CAPS.INPUT, label: "Signature", wrapper: { enabled: true } },
{ type: "rating", category: "input", routing: "leaf", capabilities: CAPS.INPUT, label: "Rating", wrapper: { enabled: true } },
{ type: "range", category: "input", routing: "leaf", capabilities: CAPS.INPUT, label: "Range Slider", wrapper: { enabled: true } },
{ type: "rich-text", category: "input", routing: "leaf", capabilities: CAPS.INPUT, label: "Rich Text Editor", wrapper: { enabled: true } },
{ type: "formatted-number", category: "input", routing: "leaf", capabilities: CAPS.INPUT, label: "Formatted Number", wrapper: { enabled: true } },
{ type: "search_input", category: "input", routing: "leaf", capabilities: CAPS.INPUT, label: "Search Input", wrapper: { enabled: true, showLabel: false } },
{ type: "table_filter", category: "input", routing: "leaf", capabilities: CAPS.INPUT, label: "Table Filter", wrapper: { enabled: true, showLabel: false } },
];
// ── STATIC FIELDS ──────────────────────────────────────────────────────────
const staticFields: FieldManifest[] = [
{ type: "header", category: "static", routing: "leaf", capabilities: CAPS.STATIC, label: "Header", wrapper: { enabled: true, showLabel: false, wrapOuter: false } },
{ type: "paragraph", category: "static", routing: "leaf", capabilities: CAPS.STATIC, label: "Paragraph", wrapper: { enabled: true, showLabel: false, wrapOuter: false } },
{ type: "image", category: "static", routing: "leaf", capabilities: CAPS.STATIC, label: "Image", wrapper: { enabled: true, showLabel: false, wrapOuter: false } },
{ type: "button", category: "static", routing: "leaf", capabilities: CAPS.STATIC, label: "Button", wrapper: { enabled: true, showLabel: false, wrapOuter: false } },
{ type: "divider", category: "static", routing: "leaf", capabilities: CAPS.STATIC, label: "Divider", wrapper: { enabled: false } },
{ type: "divider-label", category: "static", routing: "leaf", capabilities: CAPS.STATIC, label: "Labeled Divider", wrapper: { enabled: false } },
{ type: "message", category: "static", routing: "leaf", capabilities: CAPS.STATIC, label: "Message / Alert", wrapper: { enabled: false } },
{ type: "html", category: "static", routing: "leaf", capabilities: CAPS.STATIC, label: "HTML Block", wrapper: { enabled: false } },
{ type: "qr-code", category: "static", routing: "leaf", capabilities: CAPS.STATIC, label: "QR Code", wrapper: { enabled: false } },
{ type: "tooltip", category: "static", routing: "leaf", capabilities: CAPS.STATIC, label: "Tooltip", wrapper: { enabled: false } },
{ type: "social", category: "static", routing: "leaf", capabilities: CAPS.STATIC, label: "Social Buttons", wrapper: { enabled: false } },
{ type: "spacer", category: "static", routing: "leaf", capabilities: CAPS.STATIC, label: "Spacer", wrapper: { enabled: false } },
{ type: "progress-line", category: "static", routing: "leaf", capabilities: CAPS.STATIC, label: "Progress Bar", wrapper: { enabled: false } },
{ type: "progress-circle", category: "static", routing: "leaf", capabilities: CAPS.STATIC, label: "Circular Progress", wrapper: { enabled: false } },
];
// ── CONTAINER FIELDS (pure children renderers, no self-value) ──────────────
const containerFields: FieldManifest[] = [
{ type: "container", category: "container", routing: "container", capabilities: CAPS.CONTAINER, label: "Container", layout: { acceptsChildren: true, childLayoutMode: "grid", defaultColumns: 12 } },
{ type: "section", category: "container", routing: "container", capabilities: CAPS.CONTAINER, label: "Section", layout: { acceptsChildren: true, childLayoutMode: "grid", defaultColumns: 12 } },
{ type: "card", category: "container", routing: "container", capabilities: CAPS.CONTAINER, label: "Card", layout: { acceptsChildren: true, childLayoutMode: "grid", defaultColumns: 12 } },
{ type: "accordion", category: "container", routing: "container", capabilities: CAPS.CONTAINER, label: "Accordion", layout: { acceptsChildren: true, childLayoutMode: "block", defaultColumns: 12 } },
{ type: "tab", category: "container", routing: "container", capabilities: CAPS.CONTAINER, label: "Tabs", layout: { acceptsChildren: true, childLayoutMode: "block", defaultColumns: 12 } },
{ type: "slot", category: "container", routing: "slot", capabilities: CAPS.CONTAINER, label: "Slot", layout: { acceptsChildren: true, childLayoutMode: "grid", defaultColumns: 12 } },
];
// ── COMPOSITE FIELDS (render themselves AND manage children) ───────────────
const compositeFields: FieldManifest[] = [
{ type: "repeater", category: "composite", routing: "repeater", capabilities: CAPS.COLLECTOR, label: "Repeater", layout: { acceptsChildren: true }, wrapper: { enabled: false } },
{ type: "fieldset", category: "composite", routing: "container", capabilities: CAPS.COLLECTOR, label: "Fieldset", layout: { acceptsChildren: true, childLayoutMode: "grid", defaultColumns: 12 } },
{ type: "group", category: "composite", routing: "container", capabilities: CAPS.COLLECTOR, label: "Field Group", layout: { acceptsChildren: true, childLayoutMode: "grid", defaultColumns: 12 } },
// DCS composite types (engine-expanded, registered for backward compat)
{ type: "address-group", category: "composite", routing: "container", capabilities: CAPS.COLLECTOR, label: "Address Group", layout: { acceptsChildren: true, childLayoutMode: "grid", defaultColumns: 12 } },
{ type: "branch-address-group", category: "composite", routing: "container", capabilities: CAPS.INPUT, label: "Branch Address Group", layout: { acceptsChildren: true, childLayoutMode: "grid", defaultColumns: 12 } },
];
// ── LAYOUT RENDERERS ────────────────────────────────────────────────────────
const layoutRenderers: LayoutRendererManifest[] = [
{ type: "grid", category: "container", acceptsChildren: true, childLayout: "grid", label: "Grid Layout" },
{ type: "flex", category: "container", acceptsChildren: true, childLayout: "flex", label: "Flex Layout" },
{ type: "block", category: "container", acceptsChildren: true, childLayout: "block", label: "Block Layout" },
{ type: "card", category: "container", acceptsChildren: true, childLayout: "grid", label: "Card Layout" },
{ type: "container", category: "container", acceptsChildren: true, childLayout: "grid", label: "Plain Container" },
{ type: "accordion", category: "container", acceptsChildren: true, childLayout: "block", label: "Accordion" },
{ type: "tabs", category: "container", acceptsChildren: true, childLayout: "block", label: "Tabs" },
{ type: "fieldset", category: "composite", acceptsChildren: true, childLayout: "grid", label: "Fieldset Layout" },
{ type: "group", category: "composite", acceptsChildren: true, childLayout: "grid", label: "Group Layout" },
{ type: "repeater", category: "composite", acceptsChildren: true, childLayout: "block", label: "Repeater Layout" },
];
/
Register all default manifests into the singleton `manifestRegistry`.
Called automatically as a side-effect of importing `fields.ts`.
Safe to call multiple times — subsequent calls overwrite earlier registrations
for the same type.
Also registers per-type InstanceDefinition defaults:

- `select` — uses String-based value matching, single select, clearable
- `multiselect` — multiple selection mode
- `radio` — uses String-based value matching
- `autocomplete` — client-side search, clearable, String matching

---

## [`shell/FormBody.tsx`](../../../src/shared/ui/form/shell/FormBody.tsx)

### `FormBodyProps`

_(No documentation provided)_

### `FormBody`

_(No documentation provided)_

---

## [`shell/FormContentRenderer.tsx`](../../../src/shared/ui/form/shell/FormContentRenderer.tsx)

### `FormContentRendererProps`

_(No documentation provided)_

### `FormContentRenderer`

_(No documentation provided)_

---

## [`shell/FormFooter.tsx`](../../../src/shared/ui/form/shell/FormFooter.tsx)

### `FormFooterProps`

_(No documentation provided)_

### `FormFooter`

_(No documentation provided)_

---

## [`shell/FormHeader.tsx`](../../../src/shared/ui/form/shell/FormHeader.tsx)

### `FormHeaderProps`

_(No documentation provided)_

### `FormHeader`

_(No documentation provided)_

---

## [`shell/FormStepper.tsx`](../../../src/shared/ui/form/shell/FormStepper.tsx)

### `FormStepper`

FormStepper: The Navigation Chassis for Multi-Step Orchestration.
Supports Sidebar (operational) and Top-bar (consumer) variants.
Synchronized with LayoutContext for real-time step visualization.

---

## [`shell/MetadataSchemaForm.tsx`](../../../src/shared/ui/form/shell/MetadataSchemaForm.tsx)

### `applicationMetadataSchema`

_(No documentation provided)_

### `MetadataSchemaFormProps`

_(No documentation provided)_

### `MetadataSchemaForm`

_(No documentation provided)_

---

## [`shell/ModalShell.tsx`](../../../src/shared/ui/form/shell/ModalShell.tsx)

### `ModalShell`

Form surface adapter: maps FormShell regions onto the src-1 Overlay composite.
Host must open headless so ModalProvider only supplies backdrop + dialog;
Modal.Header / Nav / Body / Footer own the chrome inside that frame.

---

## [`shell/surface-shell.ts`](../../../src/shared/ui/form/shell/surface-shell.ts)

### `FormSurfaceShellProps`

_(No documentation provided)_

### `FormSurfaceShell`

_(No documentation provided)_

---

## [`stories/AuthPortal.stories.tsx`](../../../src/shared/ui/form/stories/AuthPortal.stories.tsx)

### `Login`

_(No documentation provided)_

### `Registration`

_(No documentation provided)_

### `ResetPassword`

_(No documentation provided)_

---

## [`structure/FieldFeedback.tsx`](../../../src/shared/ui/form/structure/FieldFeedback.tsx)

### `FieldFeedback`

_(No documentation provided)_

---

## [`structure/FieldLabel.tsx`](../../../src/shared/ui/form/structure/FieldLabel.tsx)

### `FieldLabel`

_(No documentation provided)_

---

## [`structure/InputWrapper.tsx`](../../../src/shared/ui/form/structure/InputWrapper.tsx)

### `InputWrapper`

InputWrapper: The "Designer's View" (Internal Relationships)
Responsibility: Manages the spatial relationship between the Label and the Input surface.
It implements label placement logic (top, side, hidden) using CSS Grid/Flex primitives.

---

## [`structure/OuterWrapper.tsx`](../../../src/shared/ui/form/structure/OuterWrapper.tsx)

### `OuterWrapper`

OuterWrapper: The Unified Interaction Surface.
Responsibility: Provides the singular 'Etched' surface, border, and focus-glow
for all primitive fields. By centralizing the surface here, we eliminate the
'Double Surface Problem' and ensure consistent alignment.

---

## [`styles/FormTheme.ts`](../../../src/shared/ui/form/styles/FormTheme.ts)

### `FormTheme`

_(No documentation provided)_

### `ShellStyles`

_(No documentation provided)_

### `ComponentStateStyles`

_(No documentation provided)_

### `DEFAULT_FORM_THEME`

_(No documentation provided)_

---

## [`styles/sass-adapter.ts`](../../../src/shared/ui/form/styles/sass-adapter.ts)

### `defaultSassAdapter`

SassAdapter — StyleAdapter using semantic SASS class names.
Returns semantic class names (`z-field`, `z-field--outlined`, etc.)
instead of raw Tailwind utilities. The SCSS files in `./scss/` define
the actual styles using CSS variables from the token system.
CSS variables (`--color-primary`, `--space-4`, `--radius-md`) work
identically across Tailwind and SASS — the adapter only controls how
layout/visual classes are generated, not how tokens are resolved.
/
import type { FormField } from "@ui/form/fields";
import type { FormTheme } from "@ui/form/styles/FormTheme";
import type { FormDefinition } from "@ui/form/types";
import type { FormSection } from "@ui/form/types/section";
import { cn } from "@libs/utils";
import type {
ActionStyleSlots,
FieldStyleSlots,
SectionStyleSlots,
ShellStyleSlots,
StyleAdapter,
} from "./style-adapter";
// ---------------------------------------------------------------------------
// Semantic class name helpers
// ---------------------------------------------------------------------------
function getVariantClass(variant: string, hasError: boolean): string {
const base = `z-input-wrapper z-input-wrapper--${variant}`;
return hasError ? `${base} z-input-wrapper--error` : base;
}
function getIntentClass(intent?: string): string {
if (!intent) return "";
return `z-input-wrapper z-input-wrapper--${intent}`;
}
function getRadiusClass(radius?: string): string {
if (!radius || radius === "default") return "";
if (radius === "none") return "z-input-wrapper--radius-none";
return `z-input-wrapper--radius-${radius}`;
}
function getDensityFieldClass(density?: string): string {
if (density === "compact") return "z-field--compact";
if (density === "spacious") return "z-field--spacious";
return "";
}
function getDensityInputClass(density?: string): string {
if (density === "compact") return "z-input--compact";
if (density === "spacious") return "z-input--spacious";
return "";
}
function getResponsiveClass(field: FormField, isEditor: boolean): string {
if (isEditor) return "";
const layout = field.layout as any;
if (!layout?.responsive) return "";
const classes: string[] = [];
if (layout.responsive.hideOnMobile) classes.push("z-field--hidden-mobile");
if (layout.responsive.hideOnTablet) classes.push("z-field--hidden-tablet");
if (layout.responsive.hideOnDesktop) classes.push("z-field--hidden-desktop");
return classes.join(" ");
}
function getInputTypeClass(field: FormField): string {
if (field.type === "checkbox" || field.type === "radio") {
return `z-input z-input--${field.type}`;
}
if (field.type === "select") {
return "z-input z-input--select";
}
return "z-input";
}
// ---------------------------------------------------------------------------
// HeuristicClassParser — semantic version
//
// Unlike the Tailwind version which distributes raw utilities by regex,
// the SASS adapter treats all custom classes as wrapper-level overrides.
// This is simpler and avoids the misrouting problem.
// ---------------------------------------------------------------------------
function parseCustomClasses(customClasses: string): {
wrapper: string;
inputWrapper: string;
input: string;
label: string;
description: string;
} {
if (!customClasses.trim()) {
return {
wrapper: "",
inputWrapper: "",
input: "",
label: "",
description: "",
};
}
// For SASS adapter, custom classes go to wrapper (no heuristic distribution)
return {
wrapper: customClasses.trim(),
inputWrapper: "",
input: "",
label: "",
description: "",
};
}
// ---------------------------------------------------------------------------
// SassAdapter
// ---------------------------------------------------------------------------
export class SassAdapter implements StyleAdapter {
readonly name = "sass";
buildFieldStyles(
field: FormField,
isEditor: boolean = false,
hasError: boolean = false,
theme: FormTheme = {
density: "comfortable",
radius: "large",
motion: true,
} as FormTheme
): FieldStyleSlots {
const variant = (field.meta?.ui?.variant || "outlined") as string;
const isButton = field.type === "button" || field.properties?.submit;
const intent = field.properties?.intent;
// Canonical source of truth: meta.ui.classNames
const canonicalClassNames = field.meta?.ui?.classNames || {};
// DEPRECATED FALLBACK
const legacyPropClassNames = field.properties?.classNames || {};
const allCustomClasses = [
field.properties?.customClasses || "",
field.custom?.cssClasses?.join(" ") || "",
]
.filter(Boolean)
.join(" ");
const heuristicClasses = parseCustomClasses(allCustomClasses);
const explicitClassNames = {
...legacyPropClassNames,
...canonicalClassNames,
};
return {
base: cn(
"z-field",
getDensityFieldClass(theme.density),
getResponsiveClass(field, isEditor),
heuristicClasses.wrapper,
explicitClassNames.base || (explicitClassNames as any).wrapper
),
label: cn("z-label", heuristicClasses.label, explicitClassNames.label),
inputWrapper: cn(
getVariantClass(variant, hasError),
!isButton && intent ? getIntentClass(intent) : "",
getRadiusClass(field.properties?.borderRadius),
heuristicClasses.inputWrapper,
explicitClassNames.inputWrapper
),
input: cn(
getInputTypeClass(field),
getDensityInputClass(theme.density),
field.properties?.alignment,
heuristicClasses.input,
explicitClassNames.input
),
clearButton: cn("z-clear-button", explicitClassNames.clearButton),
helperWrapper: cn("z-helper-wrapper", explicitClassNames.helperWrapper),
description: cn(
"z-description",
heuristicClasses.description,
explicitClassNames.description
),
errorMessage: cn("z-error-message", explicitClassNames.errorMessage),
};
}
buildShellStyles(
definition: FormDefinition,
theme?: FormTheme,
shellProps?: { background?: string; className?: string }
): ShellStyleSlots {
const { settings, style } = definition;
const density = theme?.density || settings?.density || "comfortable";
const isPortal = settings?.layoutMode === "portal";
const isSplit = definition.layout === "split";
const userSlots = style?.classNames || {};
// Width class
let widthClass = "";
if (!isPortal) {
if (settings?.width === "full") widthClass = "z-shell**root--full";
else if (settings?.width === "contained")
widthClass = "z-shell**root--contained";
else widthClass = "z-shell**root--centered";
}
// Mode class
let modeClass = "z-shell--dashboard";
if (isPortal) modeClass = "z-shell--portal";
else if (settings?.layoutMode === "drawer") modeClass = "z-shell--drawer";
else if (settings?.layoutMode === "modal") modeClass = "z-shell--modal";
// Gradient class for portal
const gradientClass =
isPortal && shellProps?.background === "gradient"
? "z-shell--gradient"
: "";
return {
shell: cn(
"z-shell",
modeClass,
gradientClass,
shellProps?.className,
userSlots.shell
),
atmosphere: cn("z-shell**atmosphere", userSlots.atmosphere),
root: cn(
"z-shell**root",
`z-shell**root--${density}`,
widthClass,
isPortal
? cn(isSplit ? "z-shell**root--split" : "", style?.customClasses)
: "",
userSlots.root
),
header: cn("z-shell**header", userSlots.header),
title: cn("z-shell**title", userSlots.title),
description: cn("z-shell**description", userSlots.description),
body: cn("z-shell**body", userSlots.body),
footer: cn("z-shell**footer", userSlots.footer),
};
}
buildSectionStyles(section: FormSection): SectionStyleSlots {
const { layout, meta } = section;
const isCard = layout?.type === "card";
const isTabs = layout?.type === "tabs";
return {
base: cn(
"z-section",
isCard ? "z-section--card" : "",
isTabs ? "z-section--tabs" : "",
layout?.className || "",
meta?.className || ""
),
header: cn("z-section**header", isCard ? "" : ""),
title: "z-section**title",
description: "z-section**description",
content: "z-section**content",
};
}
buildActionStyles(
definition: FormDefinition,
\_theme?: FormTheme
): ActionStyleSlots {
const isPortal = definition.settings?.layoutMode === "portal";
const isCentered = definition.settings?.width === "centered";
return {
base: cn(
"z-actions",
isPortal ? "z-actions--portal" : "",
!isPortal && isCentered ? "z-actions--centered" : ""
),
submitButton: "z-actions**submit",
cancelButton: "z-actions**cancel",
};
}
}
/ Default singleton for SASS adapter.

### `SassAdapter`

_(No documentation provided)_

---

## [`styles/style-adapter.ts`](../../../src/shared/ui/form/styles/style-adapter.ts)

### `FieldStyleSlots`

StyleAdapter — Abstract interface for form style generation.
Implementations (TailwindAdapter, SassAdapter, CSSInJSAdapter, etc.)
must return the same slot shapes. The form system consumes these slot
maps and merges them with user-provided classNames from meta.ui.classNames.
CSS variables (`--color-primary`, `--space-4`, `--radius-md`) work identically
across all adapters — the adapter only controls how layout/visual classes are
generated, not how tokens are resolved.
/
import type { FormField } from "@ui/form/fields";
import type { FormTheme } from "@ui/form/styles/FormTheme";
import type { FormDefinition } from "@ui/form/types";
import type { FormSection } from "@ui/form/types/section";
// ---------------------------------------------------------------------------
// Slot result types
// ---------------------------------------------------------------------------
/ The 10 canonical field slots from FieldUI.classNames.

### `ShellStyleSlots`

Optional — only populated by field-type-specific adapters. /
[key: string]: string;
}
/ Shell-level slot map returned by buildFormShellClasses.

### `SectionStyleSlots`

Section-level slot map returned by buildSectionClasses.

### `ActionStyleSlots`

Action bar slot map returned by buildFormActionClasses.

### `StyleAdapter`

_(No documentation provided)_

---

## [`styles/tailwind-adapter.ts`](../../../src/shared/ui/form/styles/tailwind-adapter.ts)

### `defaultTailwindAdapter`

TailwindAdapter — Default StyleAdapter using Tailwind CSS utilities.
Extracts the existing form-styles.ts logic behind the StyleAdapter interface.
This is the zero-change migration: all existing behavior is preserved exactly.
/
import type { FormField } from "@ui/form/fields";
import type { FormTheme } from "@ui/form/styles/FormTheme";
import type { FormDefinition } from "@ui/form/types";
import type { FormSection } from "@ui/form/types/section";
import { tokens } from "@shared/theme";
import { cn } from "@libs/utils";
import type {
ActionStyleSlots,
FieldStyleSlots,
SectionStyleSlots,
ShellStyleSlots,
StyleAdapter,
} from "./style-adapter";
const formTokens = tokens.form;
// ---------------------------------------------------------------------------
// Default theme (same as DEFAULT_FORM_THEME in FormTheme.ts / form-styles.ts)
// ---------------------------------------------------------------------------
const DEFAULT_FORM_THEME: FormTheme = {
density: "comfortable",
radius: "large",
motion: true,
colors: {
primary: "var(--color-primary)",
secondary: "var(--color-secondary)",
background: "var(--color-background)",
surface: "var(--color-surface)",
border: "var(--color-border)",
text: {
primary: "var(--color-foreground)",
secondary: "var(--text-foreground/70)",
inverse: "var(--color-background)",
},
error: "var(--color-danger)",
success: "var(--color-success)",
warning: "var(--color-warning)",
},
spacing: {
xs: "0.25rem",
sm: "var(--space-sm)",
md: "var(--space-md)",
lg: "var(--space-lg)",
xl: "var(--space-xl)",
xxl: "4rem",
},
borderRadius: {
sm: "var(--radius-sm)",
md: "var(--radius-md)",
lg: "var(--radius-lg)",
full: "var(--radius-full)",
},
typography: {
fontFamily: "var(--font-sans)",
fontSize: {
sm: "var(--text-sm)",
base: "var(--text-base)",
lg: "var(--text-lg)",
xl: "var(--text-xl)",
},
},
components: {
input: {
variants: {
outlined: formTokens.inputVariants.outlined,
filled: formTokens.inputVariants.filled,
underlined: formTokens.inputVariants.underlined,
},
},
label: {
base: "block font-semibold text-foreground/80 mb-1.5 leading-snug",
requiredIndicator:
"after:content-[''] after:ml-0.5 after:text-danger after:font-bold",
},
helpText: {
base: "text-[length:var(--text-xs)] text-muted mt-1",
},
error: {
base: "text-[length:var(--text-xs)] text-danger font-medium mt-1.5",
},
section: {
title:
"text-[length:var(--text-lg)] font-bold text-foreground tracking-tight",
description:
"text-[length:var(--text-sm)] text-muted mt-1 leading-relaxed",
card: "app-card",
header: "mb-[var(--space-md)]",
content: "flex flex-col gap-6",
},
shell: {
header: {
padding: "py-[var(--space-md)] px-1",
border: "border-b border-border",
background: "bg-background/80",
shadow: "shadow-sm",
},
body: {
padding:
"data-[layout-mode=portal]:p-0 p-[var(--space-md)] lg:p-[var(--space-xl)]",
},
footer: {
padding: "py-[var(--space-md)]",
border: "border-t border-border",
background: "bg-background/80",
},
stepper: {
margin: "mb-8",
},
},
},
};
// ---------------------------------------------------------------------------
// Base field styles (moved from form-styles.ts)
// ---------------------------------------------------------------------------
export const BASE_FIELD_STYLES = {
base: `form-field ${formTokens.field.shell} flex flex-col opacity-100`,
label: `${formTokens.text.label} mb-2 transition-all group-hover:text-primary group-focus-within:text-primary`,
inputWrapper: `${formTokens.field.surface.idle} overflow-hidden isolation-auto flex items-center transition-all duration-300`,
input: `${formTokens.input.base} ${formTokens.text.value}`,
description: `${formTokens.text.description} mt-2 font-medium border-l-2 border-primary/20 pl-3 opacity-60`,
errorMessage: `${formTokens.text.error} mt-1.5 flex items-center gap-1.5`,
helperWrapper: "mt-2",
clearButton:
"absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer transition-all hover:scale-125 z-[var(--z-overlap)]",
} as const;
// ---------------------------------------------------------------------------
// Internal helpers (moved from form-styles.ts)
// ---------------------------------------------------------------------------
type ComponentStateStyles = {
base: string;
hover?: string;
focus?: string;
error?: string;
};
function getFieldVariantClasses(
field: FormField,
hasError: boolean,
theme: FormTheme,
useFocusWithin: boolean
): string {
const variant = (field.meta?.ui?.variant || "outlined") as keyof NonNullable<
NonNullable<NonNullable<FormTheme["components"]>["input"]>["variants"]

> ;
> const getVariantString = (styles?: ComponentStateStyles) => {
> if (!styles) return "";
> const parts = [styles.base];
> parts.push(styles.hover || "");
> let focusClass = styles.focus || "";
> if (useFocusWithin) {
> focusClass = focusClass.replace(/focus:/g, "focus-within:");
> }
> parts.push(focusClass);
> if (hasError) parts.push(styles.error || "");
> return parts.filter(Boolean).join(" ");
> };
> const componentTheme = theme.components?.input?.variants;
> if (componentTheme && componentTheme[variant]) {
> return getVariantString(componentTheme[variant]);
> }
> const defaultDetails =
> DEFAULT_FORM_THEME.components?.input?.variants?.[variant];
> return getVariantString(defaultDetails);
> }
> function getIntentClasses(
> intent?: string,
> type: "input" | "button" = "input"
> ): string {
> if (type === "button") {
> switch (intent) {
> case "primary":
> return "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md";
> case "secondary":
> return "bg-surface text-foreground border border-border hover:bg-subtle shadow-sm";
> case "danger":
> return "bg-danger text-danger-foreground hover:bg-danger/90 shadow-md shadow-danger/10";
> case "success":
> return "bg-success text-success-foreground hover:bg-success/90 shadow-md shadow-success/10";
> case "warning":
> return "bg-warning text-warning-foreground hover:bg-warning/90 shadow-md shadow-warning/10";
> case "subtle":
> return "bg-transparent text-foreground/60 hover:text-foreground hover:bg-subtle";
> default:
> return "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md";
> }
> }
> switch (intent) {
> case "primary":
> return "text-primary border-primary group-focus-within:text-primary";
> case "secondary":
> return "text-secondary border-secondary group-focus-within:text-secondary";
> case "success":
> return "text-success border-success group-focus-within:text-success";
> case "danger":
> return "text-danger border-danger group-focus-within:text-danger";
> case "warning":
> return "text-warning border-warning group-focus-within:text-warning";
> case "info":
> return "text-blue-500 border-blue-500 group-focus-within:text-blue-500";
> default:
> return "";
> }
> }
> function getBorderRadiusClass(
> radius?: string | "none" | "small" | "medium" | "large" | "full" | "default"
> ): string {
> switch (radius) {
> case "none":
> return "rounded-none";
> case "small":
> return "rounded-[var(--radius-sm)]";
> case "medium":
> return "rounded-[var(--radius-md)]";
> case "large":
> return "rounded-[var(--radius-lg)]";
> case "full":
> return "rounded-[var(--radius-full)]";
> case "default":
> default:
> return "rounded-[var(--radius-md)]";
> }
> }
> function getResponsiveClasses(field: FormField, isEditor: boolean) {
> const classes: string[] = [];
> const layout = field.layout as any;
> if (!isEditor && layout && layout.responsive) {
> if (layout.responsive.hideOnMobile) classes.push("hidden sm:block");
> if (layout.responsive.hideOnTablet) classes.push("sm:hidden lg:block");
> if (layout.responsive.hideOnDesktop) classes.push("lg:hidden");
> }
> return { visibility: classes.join(" ") };
> }
> /
> HeuristicClassParser — regex-based distribution of raw class strings
> to the correct field slot. This is the main blocker for SASS adapters.
> /
> const HeuristicClassParser = {
> parse: (customClasses: string) => {
> if (!customClasses.trim()) {
> return {
> wrapper: "",
> inputWrapper: "",
> input: "",
> label: "",
> description: "",
> };
> }
> const classes = customClasses.trim().split(/\s+/);
> const result: Record<string, string[]> = {
> wrapper: [],
> inputWrapper: [],
> input: [],
> label: [],
> description: [],
> };
> classes.forEach((className) => {
> if (
> className.match(
> /(?:^|:)(m[tlrbx]?-[0-9.]+|p[tlrbx]?-[0-9.]+|w-[0-9./]+|h-[0-9./]+|max-w-|min-w-|flex|grid|col-|row-|gap-|space-|justify-|items-|self-|absolute|relative|top-|bottom-|left-|right-|z-)/
> )
> ) {
> result.wrapper.push(className);
> } else if (
> className.match(
> /(?:^|:)(tracking-|uppercase|capitalize|lowercase|whitespace-|text-(xs|sm|base|lg|xl|2xl|3xl))/
> )
> ) {
> result.label.push(className);
> } else if (
> className.match(/(?:^|:)(border|shadow|bg-|rounded|ring|backdrop-blur)/)
> ) {
> result.inputWrapper.push(className);
> } else if (
> className.match(
> /(?:^|:)(text-|font-|placeholder|italic|underline|leading-)/
> )
> ) {
> result.input.push(className);
> } else {
> result.inputWrapper.push(className);
> }
> });
> return {
> wrapper: result.wrapper.join(" "),
> inputWrapper: result.inputWrapper.join(" "),
> input: result.input.join(" "),
> label: result.label.join(" "),
> description: result.description.join(" "),
> };
> },
> };
> function getFormContainerClass(
> width?: "full" | "contained" | "centered"
> ): string {
> switch (width) {
> case "full":
> return "w-full max-w-none";
> case "contained":
> return "max-w-7xl mx-auto px-4";
> case "centered":
> default:
> return "max-w-3xl mx-auto";
> }
> }
> // ---------------------------------------------------------------------------
> // TailwindAdapter
> // ---------------------------------------------------------------------------
> export class TailwindAdapter implements StyleAdapter {
> readonly name = "tailwind";
> buildFieldStyles(
> field: FormField,
> isEditor: boolean = false,
> hasError: boolean = false,
> theme: FormTheme = DEFAULT_FORM_THEME
> ): FieldStyleSlots {
> const responsive = getResponsiveClasses(field, isEditor);
> const isCompact = theme.density === "compact";
> const isSpacious = theme.density === "spacious";
> // Canonical source of truth: meta.ui.classNames
> const canonicalClassNames = field.meta?.ui?.classNames || {};
> // DEPRECATED FALLBACK: properties.classNames
> const legacyPropClassNames = field.properties?.classNames || {};
> const deprecatedKeys = Object.keys(legacyPropClassNames).filter(
> (k) => !canonicalClassNames[k as keyof typeof canonicalClassNames]
> );
> if (deprecatedKeys.length > 0 && process.env.NODE_ENV === "development") {
> console.warn(
> `[form-styles] "${field.id}" uses deprecated properties.classNames (${deprecatedKeys.join(", ")}). Use meta.ui.classNames instead.`
> );
> }
> const explicitClassNames = {
> ...legacyPropClassNames,
> ...canonicalClassNames,
> };
> // DEPRECATED FALLBACK: properties.customClasses + custom.cssClasses
> const legacyCustomClasses = field.properties?.customClasses || "";
> const customCssClasses = field.custom?.cssClasses?.join(" ") || "";
> const allCustomClasses = [legacyCustomClasses, customCssClasses]
> .filter(Boolean)
> .join(" ");
> if (allCustomClasses && process.env.NODE_ENV === "development") {
> console.warn(
> `[form-styles] "${field.id}" uses deprecated customClasses/cssClasses. Use meta.ui.classNames instead.`
> );
> }
> const heuristicClasses = HeuristicClassParser.parse(allCustomClasses);
> const autoSpacing = isCompact ? "mb-2" : isSpacious ? "mb-6" : "mb-0";
> const variantClasses = getFieldVariantClasses(field, hasError, theme, true);
> const isButton = field.type === "button" || field.properties?.submit;
> const intentClasses = getIntentClasses(
> field.properties?.intent,
> isButton ? "button" : "input"
> );
> const radiusClasses = getBorderRadiusClass(field.properties?.borderRadius);
> return {
> base: cn(
> BASE_FIELD_STYLES.base,
> autoSpacing,
> !isEditor && responsive.visibility,
> heuristicClasses.wrapper,
> explicitClassNames.base || (explicitClassNames as any).wrapper,
> "min-w-0"
> ),
> label: cn(
> BASE_FIELD_STYLES.label,
> heuristicClasses.label,
> explicitClassNames.label
> ),
> inputWrapper: cn(
> BASE_FIELD_STYLES.inputWrapper,
> variantClasses,
> intentClasses,
> radiusClasses,
> heuristicClasses.inputWrapper,
> explicitClassNames.inputWrapper,
> isSpacious ? "px-6 py-4 gap-4" : isCompact ? "px-3 py-1.5 gap-2" : "px-4 py-2.5 gap-3"
> ),
> input: cn(
> BASE_FIELD_STYLES.input,
> field.type === "checkbox" || field.type === "radio"
> ? "inline-block w-auto"
> : field.type === "select"
> ? "flex w-full border-transparent bg-transparent focus:ring-0"
> : "block w-full border-transparent bg-transparent focus:ring-0",
> isCompact ? "min-h-[40px]" : isSpacious ? "min-h-[52px]" : "",
> field.properties?.alignment,
> heuristicClasses.input,
> explicitClassNames.input
> ),
> clearButton: cn(
> BASE_FIELD_STYLES.clearButton,
> explicitClassNames.clearButton
> ),
> helperWrapper: cn(
> BASE_FIELD_STYLES.helperWrapper,
> explicitClassNames.helperWrapper
> ),
> description: cn(
> BASE_FIELD_STYLES.description,
> heuristicClasses.description,
> explicitClassNames.description
> ),
> errorMessage: cn(
> BASE_FIELD_STYLES.errorMessage,
> theme.components?.error?.base,
> explicitClassNames.errorMessage
> ),
> };
> }
> buildShellStyles(
> definition: FormDefinition,
> theme?: FormTheme,
> shellProps?: { background?: string; className?: string }
> ): ShellStyleSlots {
> const { settings, style } = definition;
> const density = theme?.density || settings?.density || "comfortable";
> const isPortal = settings?.layoutMode === "portal";
> const hasShell = !!definition.shell?.length;
> const isSplit = definition.layout === "split" || hasShell;
> const userSlots = style?.classNames || {};
> const widthClass = getFormContainerClass(settings?.width);
> const radiusClass = getBorderRadiusClass(theme?.radius || "large");
> const layoutMode = settings?.layoutMode || "dashboard";
> const SHELL_MODE_CLASSES: Record<string, string> = {
> portal: "page-shell--portal min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-subtle",
> drawer: "page-shell--drawer flex flex-col w-full",
> modal: "page-shell--modal h-full w-full bg-surface",
> dashboard: hasShell
> ? "page-shell--dashboard w-full h-full"
> : "page-shell--dashboard w-full h-full p-4 sm:p-6 lg:p-8",
> };
> const modeClass = SHELL_MODE_CLASSES[layoutMode] || SHELL_MODE_CLASSES.dashboard;
> return {
> shell: cn(
> "page-shell z-shell transition-all duration-500",
> modeClass,
> isPortal && shellProps?.background === "gradient"
> ? "bg-gradient-to-br from-surface to-subtle text-foreground"
> : isPortal
> ? "bg-transparent text-foreground"
> : "",
> shellProps?.className,
> userSlots.shell
> ),
> atmosphere: cn(
> "page-shell**atmosphere hidden",
> userSlots.atmosphere
> ),
> root: cn(
> "form-root w-full transition-all duration-700 animate-in fade-in zoom-in-95",
> `z-density-${density}`,
> `form-root--${density}`,
> !isPortal ? widthClass : "",
> hasShell
> ? "bg-transparent w-full flex justify-center"
> : isPortal
> ? cn(
> "bg-surface border border-border relative transition-all duration-700 shadow-xl",
> radiusClass,
> isSplit
> ? "w-[840px] max-w-[95vw] flex-shrink-0 p-0 overflow-hidden"
> : "w-full p-8 lg:p-10"
> )
> : settings?.layoutMode === "drawer" ||
> settings?.layoutMode === "modal"
> ? "p-0 border-none shadow-none bg-transparent"
> : "",
> style?.customClasses,
> userSlots.root
> ),
> header: cn(
> "form-header flex items-center",
> isPortal ? "mb-6 px-1 gap-4" : "mb-4 gap-6 py-6",
> userSlots.header
> ),
> title: cn(
> "form-header**title text-[var(--text-3xl)] font-black text-foreground tracking-tightest leading-none drop-shadow-sm",
> userSlots.title
> ),
> description: cn(
> "form-header**description mt-1.5 text-[var(--text-sm)] text-foreground/50 leading-relaxed font-medium",
> userSlots.description
> ),
> body: cn("form-body", userSlots.body),
> footer: cn("form-footer", userSlots.footer),
> };
> }
> buildSectionStyles(section: FormSection, theme: FormTheme = DEFAULT_FORM_THEME): SectionStyleSlots {
> const { layout, meta } = section;
> const isCard = layout?.type === "card";
> const variant = (layout as any)?.variant || "default";
> const isTabs = layout?.type === "tabs";
> // Pure metadata-driven override capability
> const customSlots = (meta?.ui as any)?.classNames || {};
> const variantTheme = theme.components?.section?.variants?.[variant] || {};
> const base = [
> > "form-section z-layout-boundary transition-all duration-300",
> > isCard && !customSlots.base && !variantTheme.base ? "z-card !bg-surface shadow-md" : "",
> > isTabs ? "border-b border-border mb-6" : "",
> > variantTheme.base || "",
> > layout?.className || "",
> > meta?.className || "",
> > customSlots.base || ""
> > ]
> .filter(Boolean)
> .join(" ");
> const header = [
> "form-section**header relative flex flex-col gap-1",
> isCard && !customSlots.header && !variantTheme.header
> ? "px-8 py-6 border-b border-border bg-surface-raised rounded-t-[var(--radius-xl)]"
> : !isCard && !customSlots.header && !variantTheme.header
> ? "pl-6 mb-6 border-l-4 border-primary/20"
> : "",
> variantTheme.header || "",
> customSlots.header || ""
> ]
> .filter(Boolean)
> .join(" ");
> const title = [
> > "form-section__title text-lg font-bold text-foreground tracking-tight",
> > DEFAULT_FORM_THEME.components?.section?.title || "",
> > variantTheme.title || "",
> > customSlots.title || ""
> > ].filter(Boolean).join(" ");
> const description = [
> > "form-section__description text-xs text-foreground/60 leading-relaxed font-medium",
> > DEFAULT_FORM_THEME.components?.section?.description || "",
> > variantTheme.description || "",
> > customSlots.description || ""
> > ].filter(Boolean).join(" ");
> const content = [
> "form-section\_\_content",
> isCard && !customSlots.content && !variantTheme.content ? "p-[var(--space-md)]" : "",
> variantTheme.content || "",
> customSlots.content || ""
> ]
> .filter(Boolean)
> .join(" ");
> return { base, header, title, description, content };
> }
> buildActionStyles(
> definition: FormDefinition,
> theme: FormTheme = DEFAULT_FORM_THEME
> ): ActionStyleSlots {
> const isPortal = definition.settings?.layoutMode === "portal";
> const align =
> definition.settings?.width === "centered"
> ? "justify-center"
> : "justify-end";
> const userSlots = definition.style?.classNames || {};
> const isCompact = theme.density === "compact";
> const base = [
> > "form-actions",
> > "flex items-center w-full",
> > isPortal
> > ? `${isCompact ? "mt-4" : "mt-8"} flex-col gap-3`
> > : `${isCompact ? "mt-4 pt-4" : "mt-8 pt-6"} gap-4 border-t border-border ${align}`,
> > userSlots.actionContainer
> > ]
> .filter(Boolean)
> .join(" ");
> const baseBtn = "inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
> const submitButton =
> userSlots.submitButton ||
> theme.components?.actions?.submitButton ||
> (isPortal
> ? `${baseBtn} w-full py-3.5 text-sm font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 bg-primary text-primary-foreground transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]`
> : `${baseBtn} px-8 py-3.5 text-sm font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]`);
> const cancelButton =
> userSlots.cancelButton ||
> theme.components?.actions?.cancelButton ||
> (isPortal
> ? `${baseBtn} w-full py-3.5 bg-surface text-foreground hover:bg-subtle rounded-xl border border-border`
> : `${baseBtn} px-4 py-2.5 rounded-[var(--radius-md)] bg-surface text-foreground border border-border hover:bg-subtle shadow-sm`);
> return { base, submitButton, cancelButton };
> }
> }
> / Default singleton — imported by the form system when no adapter is set.

### `BASE_FIELD_STYLES`

_(No documentation provided)_

### `TailwindAdapter`

_(No documentation provided)_

---

## [`surfaces/PrintDocumentRenderer.tsx`](../../../src/shared/ui/form/surfaces/PrintDocumentRenderer.tsx)

### `PrintDocumentRenderer`

PrintDocumentRenderer
Renders a clean printable document (HTML / A4 format) directly from ContentDefinition
and form data, completely independent of interactive React UI form components.

### `PrintDocumentRendererProps`

_(No documentation provided)_

---

## [`tools/FormDebugOverlay.tsx`](../../../src/shared/ui/form/tools/FormDebugOverlay.tsx)

### `FormDebugOverlay`

FormDebugOverlay - A transparency layer that visualizes form structure.
Helps developers inspect grid layouts, field boundaries, and spacing.

### `FieldDebugWrapper`

FieldDebugWrapper - Wraps individual fields to show their boundaries and IDs.

---

## [`tools/FormDevTools.tsx`](../../../src/shared/ui/form/tools/FormDevTools.tsx)

### `FormDevTools`

_(No documentation provided)_

---

## [`tools/FormStyleDebugger.tsx`](../../../src/shared/ui/form/tools/FormStyleDebugger.tsx)

### `FormStyleDebugger`

_(No documentation provided)_

---

## [`types/application.ts`](../../../src/shared/ui/form/types/application.ts)

### `ApplicationDefinition`

Global Application MetaSchema Definition
Top-level container for multi-module ERP / B2B SaaS applications.

### `EntityDefinition`

_(No documentation provided)_

### `ModuleDefinition`

_(No documentation provided)_

---

## [`types/behavior.ts`](../../../src/shared/ui/form/types/behavior.ts)

### `BehaviorDefinition`

Layer 4 — Behavior Schema
Execution logic, state machine transitions, event hooks, and business pipelines.

### `WorkflowState`

_(No documentation provided)_

### `WorkflowDefinition`

_(No documentation provided)_

### `DeclarativeRule`

_(No documentation provided)_

---

## [`types/condition.ts`](../../../src/shared/ui/form/types/condition.ts)

### `ConditionOperator`

Operators supported in conditions

### `ConditionRule`

A single conditional rule

### `ConditionAction`

The name (dot-notation path) of the field to read from form values.
This MUST match the field's `name` property, NOT its `id`.
@example "address.city" // not "city_field_id"
/
field: string;
/ Operator for comparison /
operator: ConditionOperator;
/ Value(s) to compare with /
value?: string | number | boolean | Array<string | number>;
}
// ---------------------------------------------------------------------------
// Full action set (used by ConditionGroup in ValidationRule.when)
// ---------------------------------------------------------------------------
/ All possible group actions including validate (used in ValidationRule.when)

### `ConditionGroup`

Group of rules with a logical operator and action

### `ConditionExpression`

Action to apply when rules match /
action: ConditionAction;
/ Logical operator for combining rules in the group (default AND) /
logic?: "AND" | "OR";
/ Rules in this group /
rules: ConditionRule[];
}
/ Full conditional expression (generic — used in ValidationRule.when)

### `FieldConditionAction`

Logical operator between groups (default AND) /
logic?: "AND" | "OR";
/ Groups of rules /
groups: ConditionGroup[];
}
// ---------------------------------------------------------------------------
// Narrowed set for field.conditions / section.meta.conditions
// The `validate` action is NOT valid here — it belongs only in ValidationRule.when.
// ---------------------------------------------------------------------------
/
Actions valid inside a field or section condition expression.
`validate` is intentionally excluded — put conditional validation on
`field.validation.rules[].when` instead.

### `FieldConditionGroup`

Narrowed ConditionGroup for field/section conditions (no `validate`)

### `FieldConditionExpression`

For `action: "setValue"` — the target field name (dot-notation) to set.
@example "address.city"
/
targetField?: string;
/ The value to assign when the rules match /
targetValue?: any;
}
/
Condition expression for use in `field.conditions` and `section.meta.conditions`.
Narrowed to exclude `validate` — use `ValidationRule.when` for conditional validation.

---

## [`types/content.ts`](../../../src/shared/ui/form/types/content.ts)

### `ContentFieldDefinition`

Field-level business semantics (independent of UI layout & rendering).

### `ContentSectionDefinition`

Section-level business semantics.

### `ContentDefinition`

Layer 1 — Content Schema
Pure business domain semantics decoupled from UI layout, grid, CSS, or rendering targets.

---

## [`types/i18n-accessibility.ts`](../../../src/shared/ui/form/types/i18n-accessibility.ts)

### `TranslatedText`

_(No documentation provided)_

### `Internationalization`

_(No documentation provided)_

### `Accessibility`

_(No documentation provided)_

---

## [`types/index.ts`](../../../src/shared/ui/form/types/index.ts)

### `FormUIFieldConfig`

Presentation-only overlay fused onto a logical FormDefinition via fuseSchema.
Key fields by `name` (then `id` / `key`). Nested `fields` maps apply to groups.
Canonical keys: `fields`, `sections`, `layout`, `settings`.
Legacy hospital keys (`fieldConfig`, `gridColumn`) are normalized by fuseSchema.

### `RenderDefinition`

@deprecated Use `fields`. Accepted and normalized by fuseSchema. /
fieldConfig?: Record<string, FormUIFieldConfig>;
sections?: Record<string, FormUISectionConfig>;
settings?: FormDefinition["settings"];
style?: FormDefinition["style"];
layout?:
| FormDefinition["layout"]
| {
type: string;
columns?: number;
gap?: string | number;
[key: string]: any;
};
containers?: FormDefinition["containers"];
shell?: FormDefinition["shell"];
}
/
RenderDefinition
Represents a pure layout and style structural definition of sections and fields,
completely decoupled from any top-level form container context.

### `FormDefinition`

_(No documentation provided)_

### `FormUISectionConfig`

_(No documentation provided)_

### `FormUIConfig`

_(No documentation provided)_

---

## [`types/layout.ts`](../../../src/shared/ui/form/types/layout.ts)

### `SectionLayoutConfig`

Convenience type for section-level layout configs.
Used by entry-level form definitions.

### `RuntimeLayoutConfig`

Runtime layout config — a closed discriminated union over all known layout types.
Every type string here MUST have a corresponding handler in the layout registry.
If you add a new type, TypeScript will error on the exhaustive check until you
register a renderer for it.

### `assertExhaustiveLayout`

Exhaustive check helper.
Place this in a switch default to get a compile error if a new layout type is added
without being handled.

### `SegmentedContent`

Segmented single-select content (radio semantics).
Renders one active option from a closed set — exactly the behavior of a
radio button group, delivered as a typed config instead of a bespoke
component. Drives view-state (V4) via `onChange` without polluting the
form's data payload.

### `ShellNode`

Radio-like options — exactly one is active at a time. /
options: { label: string; value: string }[];
/ Currently selected value. /
value?: string;
/ Fired when an option is selected (picks exactly one). /
onChange?: (value: string) => void;
className?: string;
}
export type ContainerContentType =
| "image"
| "section-ref"
| "component"
| "html"
| "container"
| "segmented";
export interface ContainerContent {
type: ContainerContentType;
fields?: FormField[]; // Support for inline fields in split/hero panes
id?: string; // Optional identifier for pane-specific targeting
src?: string;
alt?: string;
overlay?: boolean;
sectionId?: string;
content?: string;
className?: string;
/ Custom React component for `type: "component"` panes (e.g. a branded hero panel). /
component?: ComponentType<any>;
/ Props forwarded to `component` when using `type: "component"`. /
componentProps?: Record<string, any>;
/ Radio-like segmented options for `type: "segmented"`. /
options?: SegmentedContent["options"];
/ Active value for `type: "segmented"`. /
value?: string;
/ Selection handler for `type: "segmented"`. /
onChange?: (value: string) => void;
}
export interface ContainerDefinition {
id: string;
type: "split" | "card" | "hero" | "sidebar";
config?: {
splitRatio?: "50/50" | "40/60" | "30/70";
orientation?: "horizontal" | "vertical";
/ Full-width strip rendered above the panes (e.g. an auth mode toggle). /
topContent?: ContainerContent;
leftContent?: ContainerContent;
rightContent?: ContainerContent;
};
children?: string[]; // Reference section IDs
}
// Props interface for any layout component
// Props interface for any layout component
export interface LayoutComponentProps {
section: any; // Using any temporarily to avoid circular deps with FormSection - strictly it is FormSection
childrenNodes: any[]; // RenderNodes
data?: any; // Made optional for 5V compatibility
errors?: Record<string, string>; // Made optional for 5V compatibility
setValue?: (name: string, value: any) => void; // Made optional for 5V compatibility
getComponentProps?: (fieldId: string) => any; // New 5V prop
renderChildren: () => React.ReactNode; // Callback to render all standard children (default behavior)
renderNode: (node: any) => React.ReactNode; // Callback to render a specific node
className?: string; // BEM/Tailwind class injection from SectionRenderer
}
/ ============================================================================
RUNTIME SHELL CONFIGURATION (Grid-Surface-Content Model)
============================================================================
Strongly typed discriminated unions for schema-driven full page layout.

### `LayoutType`

_(No documentation provided)_

### `BaseLayoutConfig`

_(No documentation provided)_

### `GridLayoutConfig`

_(No documentation provided)_

### `FlexLayoutConfig`

_(No documentation provided)_

### `BlockLayoutConfig`

_(No documentation provided)_

### `TabsLayoutConfig`

_(No documentation provided)_

### `CardLayoutConfig`

_(No documentation provided)_

### `AccordionLayoutConfig`

_(No documentation provided)_

### `ContainerLayoutConfig`

_(No documentation provided)_

### `StepsLayoutConfig`

_(No documentation provided)_

### `SectionLayout`

_(No documentation provided)_

### `GroupLayoutConfig`

_(No documentation provided)_

### `FieldsetLayoutConfig`

_(No documentation provided)_

### `ContainerContentType`

_(No documentation provided)_

### `ContainerContent`

_(No documentation provided)_

### `ContainerDefinition`

_(No documentation provided)_

### `LayoutComponentProps`

_(No documentation provided)_

### `LayoutNode`

_(No documentation provided)_

### `SurfaceNode`

_(No documentation provided)_

### `FlowNode`

_(No documentation provided)_

### `ContentNode`

_(No documentation provided)_

---

## [`types/manifest.ts`](../../../src/shared/ui/form/types/manifest.ts)

### `ManifestFieldCategory`

@file manifest.ts
@description Type definitions for the ManifestRegistry system.
The manifest system consolidates field-type metadata (category, routing, capabilities),
layout-renderer registration, and per-type InstanceDefinition defaults into a single
registry, replacing the 5 legacy registries (FIELD_REGISTRY, fieldRegistry,
FIELD_METADATA, layoutRendererRegistry, RegistryStore.definitions).
@module ManifestTypes
/
import React from "react";
import type { FieldCapabilities } from "../fields";
import type { LayoutType } from "./layout";
/
Categories that determine how a field is routed and rendered.

- `"input"` — Leaf interactive widget (text, select, checkbox). Has value/validity state.
- `"static"` — Leaf display-only element (header, divider, image). No value state.
- `"container"` — Pure children renderer (card, container, tabs, accordion). No self-value.
- `"composite"` — Renders itself AND manages children (repeater, fieldset, group). May have value.

### `FieldRouting`

Determines how the field's children (if any) are rendered.

- `"leaf"` — Atomic field with no children.
- `"container"` — Structural wrapper that renders children via SectionComposer.
- `"repeater"` — Dynamic row-based list managed by RepeaterField.
- `"slot"` — Named slot that renders children via SectionComposer.

### `FieldManifest`

Complete manifest for a field type.
All field metadata lives in one object. Registration is a single call:
`manifestRegistry.registerField(manifest)`.

### `LayoutRendererManifest`

Canonical field type string (e.g. "text", "select"). /
type: string;
/ Alternative type strings that map to this manifest (e.g. "email" → "text"). /
aliases?: string[];
/ @internal Whether this entry was created from an alias. /
\_isAlias?: boolean;
/ Category that controls routing and rendering strategy. /
category: ManifestFieldCategory;
/ How children are managed. /
routing: FieldRouting;
/ State-contract flags (hasValue, hasValidity, etc.). /
capabilities: FieldCapabilities;
/ Human-readable label for builder UIs. /
label: string;
/ Optional description shown in builder tooltips. /
description?: string;
/ Icon component for builder palette rendering. /
icon?: React.ComponentType<{ size?: number }>;
/ Eagerly-loaded React component for this field type. /
component?: React.ComponentType<any>;
/ Lazy import loader — import() runs on first render. /
loader?: () => Promise<{ default: React.ComponentType<any> }>;
/ Configuration for the withAtom HOC wrapper (label visibility, outer wrap). /
wrapper?: {
/ Whether the HOC wrapper is applied. /
enabled: boolean;
/ Whether the label is rendered. /
showLabel?: boolean;
/ Whether the outer wrapper div is rendered. /
wrapOuter?: boolean;
};
/ Layout configuration for container/composite types. /
layout?: {
/ Whether the field renders children. /
acceptsChildren: boolean;
/ Default child layout mode (e.g. "grid", "flex", "block"). /
childLayoutMode?: LayoutType;
/ Default column count for child grid. /
defaultColumns?: number;
};
/ Whether per-instance component override (field.component) is allowed. /
overridable?: boolean;
}
/
Manifest for a layout renderer component.
Unlike FieldManifest which describes a field type, LayoutRendererManifest
describes a layout renderer that wraps field children (e.g. CardRenderer,
TabsRenderer, AccordionRenderer).

### `InstanceDefinition`

Layout type key (e.g. "card", "container", "accordion", "tabs"). /
type: LayoutType | (string & {});
/ Category for routing — typically "container" or "composite". /
category: ManifestFieldCategory;
/ Whether this renderer renders children. /
acceptsChildren: boolean;
/ Default child layout mode (e.g. "grid") when not explicitly set. /
childLayout?: LayoutType;
/ The React component that renders the layout (resolved via layoutRendererRegistry at runtime). /
component?: React.ComponentType<any>;
/ Optional human-readable label. /
label?: string;
}
/
InstanceDefinition — All configuration for a single field instance.
Merges manifest-level type defaults with schema-level overrides.
Used by SelectField, RadioField, RemoteOptionsManager, etc. to
resolve options, selection behavior, and value mapping without ad-hoc chains.

---

## [`types/presentation.ts`](../../../src/shared/ui/form/types/presentation.ts)

### `PresentationDefinition`

Layer 5 — Presentation Definition
Theming, design tokens, visual classes, and animations decoupled from domain logic.

---

## [`types/reactive.ts`](../../../src/shared/ui/form/types/reactive.ts)

### `ReactiveValue`

Reactive value definition

### `ComputedField`

Computed field

---

## [`types/section.ts`](../../../src/shared/ui/form/types/section.ts)

### `FormSection`

_(No documentation provided)_

---

## [`types/security-performance-history.ts`](../../../src/shared/ui/form/types/security-performance-history.ts)

### `SecuritySettings`

_(No documentation provided)_

### `PerformanceSettings`

_(No documentation provided)_

### `HistorySettings`

_(No documentation provided)_

---

## [`types/surface.ts`](../../../src/shared/ui/form/types/surface.ts)

### `SurfaceDefinition`

Layer 2 — Surface Definition
Multi-target presentation definitions (UI, Print, PDF, Mobile, API).

### `UIScreenSurface`

_(No documentation provided)_

### `PrintSurface`

_(No documentation provided)_

### `PDFSurface`

_(No documentation provided)_

### `MobileSurface`

_(No documentation provided)_

### `APISurface`

_(No documentation provided)_

### `SurfaceTargetDefinition`

_(No documentation provided)_

---

## [`types/validation.ts`](../../../src/shared/ui/form/types/validation.ts)

### `CustomValidationTypes`

Extension point for custom validation rule types.
Use declaration merging to add your own validation strategies:

```ts
declare module "@ui/form/types/validation" {
  interface CustomValidationTypes {
    ssn: never;
    "credit-card": never;
  }
}
```

Then register the strategy at runtime:

```ts
registerValidationStrategy("ssn", {
  validate: (value) => /^\d{3}-\d{2}-\d{4}$/.test(value),
  defaultMessage: (rule, field) => `${field.label} must be a valid SSN`,
});
```

### `ValidationRule`

Single field validation rule

### `AsyncValidation`

Value associated with the rule, e.g., min, maxLength /
value?: any;
/ Custom validation function /
fn?: (value: any, form: Record<string, any>) => boolean | string;
/ Message to show when validation fails /
message?: string;
/ Severity level /
severity?: "error" | "warning" | "info";
/ Optional condition to apply this validation /
when?: ConditionExpression;
}
/ Async validation rule (e.g., API-based)

### `CrossFieldValidation`

Cross-field validation (dependent on multiple fields)

### `ValidationSettings`

Full validation settings for a field or form

---

## [`utils/ErrorParser.ts`](../../../src/shared/ui/form/utils/ErrorParser.ts)

### `ErrorParser`

ErrorParser
Responsibility: Transforms complex, nested API error responses into the flat
DetailedError format required by the Form Engine.

---

## [`utils/ExpressionEvaluator.ts`](../../../src/shared/ui/form/utils/ExpressionEvaluator.ts)

### `ExpressionEvaluator`

EXPRESSION EVALUATOR
Safely evaluates conditional logic strings against the form data.
Used primarily for URL interpolation in RemoteOptions and legacy condition evaluation.

---

## [`utils/FormAutoGenerator.ts`](../../../src/shared/ui/form/utils/FormAutoGenerator.ts)

### `DomainFieldMetadata`

Domain Field Metadata

### `DomainFormConfig`

Domain Form Configuration

### `FormAutoGenerator`

FormAutoGenerator
Automatically generates a high-fidelity FormDefinition from domain metadata.

---

## [`utils/MetaSchemaBridge.ts`](../../../src/shared/ui/form/utils/MetaSchemaBridge.ts)

### `HeaderMetaSchemaField`

HeaderMetaSchemaField
Defines the generic shape of an individual field/column in a dynamic API metaSchema.

### `HeaderMetaSchema`

HeaderMetaSchema
Defines a dynamic, dynamic metadata schema structure returned from databases or APIs.
The `id` and `title` fields are optional since form-wrapping parameters are not
required when mapping pure dynamic layouts.

### `MetaSchemaBridge`

MetaSchemaBridge
Bridges generic model schemas (the "header metaSchema") with the rendering components
(FormDefinition / RenderDefinition for forms, and TableColumn for high-density grids).

---

## [`utils/SchemaMigrator.ts`](../../../src/shared/ui/form/utils/SchemaMigrator.ts)

### `MigrationFunction`

_(No documentation provided)_

### `MigrationStep`

_(No documentation provided)_

### `SchemaMigrator`

_(No documentation provided)_

---

## [`utils/SchemaNormalizer.ts`](../../../src/shared/ui/form/utils/SchemaNormalizer.ts)

### `SchemaNormalizer`

SchemaNormalizer - Sanitizes and transforms raw schemas into a predictable internal format.
DESIGN PATTERN: Buffer/Normalization Layer
Ensures the rendering engine (FormComposer) only ever deals with a clean FormField[] tree.
NOTE: This produces a tree (FormField[]) for the UI renderer.
The engine uses a separate normalization (normalizeFormDefinition) that produces
flat O(1) maps for state lookups. Both share identity resolution via normalization-utils.

---

## [`utils/accessibility-runtime.ts`](../../../src/shared/ui/form/utils/accessibility-runtime.ts)

### `enhanceFieldProps`

@file accessibility-runtime.ts
@description Runtime accessibility enforcement for the form system.

## Why this exists

The schema has accessibility metadata (`FieldMeta.accessibility`) but
there was no runtime layer that actually applies ARIA attributes,
manages focus, or validates keyboard navigation.

## What it provides

1. Focus management — auto-focus first error on submit, tab order
2. ARIA attribute injection — merges aria- into component props
3. Keyboard navigation — Enter/Space for non-native controls
4. Announcements — live region for validation feedback
5. Audit logging — warns about missing alt text, labels, etc.

## Usage

```tsx
import { AccessibilityManager } from "@ui/form/utils/accessibility-runtime";

const a11y = new AccessibilityManager();
const props = a11y.enhanceFieldProps(field, baseProps);
```

/
import type { FormField } from "@ui/form/fields";
/ Aria roles for each field category. /
const FIELD_ROLES: Record<string, string> = {
text: "textbox",
textarea: "textbox",
email: "textbox",
number: "spinbutton",
password: "textbox",
phone: "textbox",
url: "textbox",
search_input: "searchbox",
select: "combobox",
multiselect: "listbox",
checkbox: "checkbox",
radio: "radio",
switch: "switch",
slider: "slider",
rating: "slider",
date: "textbox",
time: "textbox",
autocomplete: "combobox",
};
/
Builds ARIA attributes for a field based on type, validation, and metadata.
/
function buildAriaAttributes(
field: FormField,
error?: string | boolean,
errorMessage?: string
): Record<string, string | boolean | undefined> {
const role = FIELD_ROLES[field.type];
const aria: Record<string, string | boolean | undefined> = {};
if (role) {
aria.role = role;
}
// Label
if (field.label) {
aria["aria-label"] = typeof field.label === "string" ? field.label : undefined;
}
// Required
if (field.required) {
aria["aria-required"] = true;
}
// Disabled
if (field.enabled === false) {
aria["aria-disabled"] = true;
}
// Describedby for help text
if (field.description) {
aria["aria-describedby"] = `${field.id}-description`;
}
// Invalid / error
if (error || errorMessage) {
aria["aria-invalid"] = true;
aria["aria-errormessage"] = `${field.id}-error`;
} else {
aria["aria-invalid"] = false;
}
// Expanded for accordion/select
if (field.type === "accordion") {
aria["aria-expanded"] = field.properties?.expanded ?? false;
}
return aria;
}
/
Audit a field for common accessibility issues.
Only runs in development mode.
/
function auditField(field: FormField) {
if (process.env.NODE_ENV !== "development") return;
const warnings: string[] = [];
if (!field.label && FIELD_ROLES[field.type]) {
warnings.push(`Missing accessible label for "${field.id}" (type: ${field.type})`);
}
if (field.type === "image" && !field.properties?.alt) {
warnings.push(`Image field "${field.id}" is missing alt text`);
}
if (warnings.length > 0) {
console.warn(`[Accessibility] ${warnings.join("; ")}`);
}
}
/
Enhances field props with runtime ARIA attributes.

### `createAnnouncement`

Creates a live region announcement for screen readers.
Use for validation summary, submit confirmation, etc.

### `focusFirstInvalidField`

Focus management: moves focus to the first invalid field.

---

## [`utils/create-field.ts`](../../../src/shared/ui/form/utils/create-field.ts)

### `createField`

_(No documentation provided)_

---

## [`utils/field-utils.ts`](../../../src/shared/ui/form/utils/field-utils.ts)

### `classNames`

_(No documentation provided)_

### `getI18nString`

_(No documentation provided)_

### `getOptionLabel`

_(No documentation provided)_

---

## [`utils/focus-trap.ts`](../../../src/shared/ui/form/utils/focus-trap.ts)

### `getFocusableElements`

@file focus-trap.ts
@description Keyboard focus trap and tab-order management for wizards/modals.
/
/ Returns all focusable elements within a container.

### `createFocusTrap`

Creates a focus trap that keeps Tab/Shift+Tab cycling within a container.
Returns control functions — activate, deactivate, and isActive.

### `focusFirstFocusable`

Moves focus to the first focusable element within a container.
Used when navigating to a new wizard step.

### `getTabOrder`

Returns the tab order of elements within a container.
Useful for debugging keyboard navigation.

### `FocusTrap`

_(No documentation provided)_

---

## [`utils/form-layout-utils.ts`](../../../src/shared/ui/form/utils/form-layout-utils.ts)

### `getFieldLayout`

Extract layout-related metadata from a field
Note: FieldUI is strictly for visual metadata (icon, variant, color).
Functional props (readOnly, disabled) should be handled via field.enabled / field.readOnly logic if added.

### `getFormLayoutTree`

Normalize a className value that may be a string or string[].
Returns a single space-separated string, or undefined if empty.
/
function flattenClassName(
value: string | string[] | undefined
): string | undefined {
if (!value) return undefined;
return Array.isArray(value) ? value.join(" ") : value;
}
// ============================================================================
// HIERARCHICAL LAYOUT UTILS
// ============================================================================
/
Converts a flat list of sections into a hierarchical tree of FormFields.
Sections are treated as fields of type 'section' or 'card' (Structure category).

### `getFormFields`

_(No documentation provided)_

### `FieldLayout`

_(No documentation provided)_

---

## [`utils/form-metrics.ts`](../../../src/shared/ui/form/utils/form-metrics.ts)

### `FormMetricsAnalyzer`

_(No documentation provided)_

---

## [`utils/form-persistence.ts`](../../../src/shared/ui/form/utils/form-persistence.ts)

### `FormDraft`

@file form-persistence.ts
@description Automatic form state persistence to localStorage with draft recovery.

## Usage

```tsx
import { createPersistenceMiddleware } from "@ui/form/utils/form-persistence";

// Attach to any Form:
<Form
  definition={myFormDef}
  middleware={[createPersistenceMiddleware("checkout-form")]}
/>;
```

## Storage format

| Key                        | Value                                      |
| -------------------------- | ------------------------------------------ |
| `form_draft:{formId}`      | JSON `{ values, timestamp, definitionId }` |
| `form_draft_meta:{formId}` | JSON `{ savedAt, fieldCount }`             |

## Recovery

Call `recoverDraft(formId)` to retrieve saved values before initializing the form.
/
const STORAGE_PREFIX = "form_draft";
const META_SUFFIX = "\_meta";
/ A saved form draft.

### `PersistenceConfig`

Persistence configuration.

### `recoverDraft`

Storage backend (defaults to localStorage). /
storage?: Storage;
/ Debounce interval in ms between saves (default: 500). /
debounceMs?: number;
/ Max draft age in ms before it is considered stale (default: 24h). /
maxAgeMs?: number;
/ Field names to exclude from persistence (e.g., passwords). /
excludeFields?: string[];
}
const DEFAULT_CONFIG: Required<PersistenceConfig> = {
storage: typeof localStorage !== "undefined" ? localStorage : null as any,
debounceMs: 500,
maxAgeMs: 24 60 60 1000,
excludeFields: ["password", "confirmPassword", "currentPassword"],
};
function isStorageAvailable(storage: Storage): boolean {
try {
const key = "**form_persistence_test**";
storage.setItem(key, "1");
storage.removeItem(key);
return true;
} catch {
return false;
}
}
/
Recovers a saved form draft from storage.
Returns `null` if no draft exists or it has expired.

### `createPersistenceMiddleware`

Creates a middleware function that auto-saves form state to storage.
Attach via the `middleware` prop on `<Form>`.

### `clearDraft`

Clears a saved form draft from storage.

### `getDraftMeta`

Returns metadata about a saved draft (without the full values).

---

## [`utils/form-styles.ts`](../../../src/shared/ui/form/utils/form-styles.ts)

### `getFieldVariantClasses`

Default form theme derived from global tokens.
Replaces the deleted DEFAULT_FORM_THEME from FormTheme.ts.
/
const DEFAULT_FORM_THEME: FormTheme = {
density: "comfortable",
radius: "large",
motion: true,
colors: {
primary: "var(--color-primary)",
secondary: "var(--color-secondary)",
background: "var(--color-background)",
surface: "var(--color-surface)",
border: "var(--color-border)",
text: {
primary: "var(--color-foreground)",
secondary: "var(--text-foreground/70)",
inverse: "var(--color-background)",
},
error: "var(--color-danger)",
success: "var(--color-success)",
warning: "var(--color-warning)",
},
spacing: {
xs: "0.25rem",
sm: "var(--space-sm)",
md: "var(--space-md)",
lg: "var(--space-lg)",
xl: "var(--space-xl)",
xxl: "4rem",
},
borderRadius: {
sm: "var(--radius-sm)",
md: "var(--radius-md)",
lg: "var(--radius-lg)",
full: "var(--radius-full)",
},
typography: {
fontFamily: "var(--font-sans)",
fontSize: {
sm: "var(--text-sm)",
base: "var(--text-base)",
lg: "var(--text-lg)",
xl: "var(--text-xl)",
},
},
components: {
input: {
variants: {
outlined: formTokens.inputVariants.outlined,
filled: formTokens.inputVariants.filled,
underlined: formTokens.inputVariants.underlined,
},
},
label: {
base: "block font-semibold text-foreground/80 mb-1.5 leading-snug",
requiredIndicator:
"after:content-[''] after:ml-0.5 after:text-danger after:font-bold",
},
helpText: {
base: "text-[length:var(--text-xs)] text-muted mt-1",
},
error: {
base: "text-[length:var(--text-xs)] text-danger font-medium mt-1.5",
},
section: {
title:
"text-[length:var(--text-lg)] font-bold text-foreground tracking-tight",
description:
"text-[length:var(--text-sm)] text-muted mt-1 leading-relaxed",
card: "app-card",
header: "mb-[var(--space-md)]",
content: "flex flex-col gap-6",
},
shell: {
header: {
padding: "py-[var(--space-md)] px-1",
border: "border-b border-border",
background: "bg-background/80",
shadow: "shadow-sm",
},
body: {
padding:
"data-[layout-mode=portal]:p-0 p-[var(--space-md)] lg:p-[var(--space-xl)]",
},
footer: {
padding: "py-[var(--space-md)]",
border: "border-t border-border",
background: "bg-background/80",
},
stepper: {
margin: "mb-8",
},
},
},
};
export const BASE_FIELD_STYLES = {
/ Outer container: flex traits and grid alignment basics. /
base: `form-field ${formTokens.field.shell} flex flex-col opacity-100`,
/ Label foundation: font-weight, dark mode support, and hover transitions. /
label: `${formTokens.text.label} mb-2 transition-all group-hover:text-primary group-focus-within:text-primary`,
/ Interactive box: The boundary for borders, backgrounds, and focus-rings. /
inputWrapper: `${formTokens.field.surface.idle} overflow-hidden isolation-auto flex items-center transition-all duration-300`,
/ Raw control: Stripped of native borders/outlines to live cleanly inside the wrapper. /
input: `${formTokens.input.base} ${formTokens.text.value}`,
description: `${formTokens.text.description} mt-2 font-medium border-l-2 border-primary/20 pl-3 opacity-60`,
errorMessage: `${formTokens.text.error} mt-1.5 flex items-center gap-1.5`,
helperWrapper: "mt-2",
clearButton:
"absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer transition-all hover:scale-125 z-[var(--z-overlap)]",
} as const;
/
Helper to get Tailwind classes for visual variants

### `buildFieldLayoutCSS`

Build layout dynamically from FieldLayout semantic properties

### `getBorderRadiusClass`

getIntentClasses (Semantic Styling)
Maps intent identifiers to atmospheric accents.
/
function getIntentClasses(
intent?: string,
type: "input" | "button" = "input"
): string {
if (type === "button") {
switch (intent) {
case "primary":
return "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md";
case "secondary":
return "bg-surface text-foreground border border-border hover:bg-subtle shadow-sm";
case "danger":
return "bg-danger text-danger-foreground hover:bg-danger/90 shadow-md shadow-danger/10";
case "success":
return "bg-success text-success-foreground hover:bg-success/90 shadow-md shadow-success/10";
case "warning":
return "bg-warning text-warning-foreground hover:bg-warning/90 shadow-md shadow-warning/10";
case "subtle":
return "bg-transparent text-foreground/60 hover:text-foreground hover:bg-subtle";
default:
return "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md";
}
}
switch (intent) {
case "primary":
return "text-primary border-primary group-focus-within:text-primary";
case "secondary":
return "text-secondary border-secondary group-focus-within:text-secondary";
case "success":
return "text-success border-success group-focus-within:text-success";
case "danger":
return "text-danger border-danger group-focus-within:text-danger";
case "warning":
return "text-warning border-warning group-focus-within:text-warning";
case "info":
return "text-blue-500 border-blue-500 group-focus-within:text-blue-500";
default:
return "";
}
}
/
getBorderRadiusClass
Maps semantic radius identifiers to Tailwind rounded classes.

### `buildSectionClasses`

Build Section Classes (BEM + Tailwind)
@deprecated Use `adapter.buildSectionStyles()` via `useStyleAdapter()` instead.

### `buildFormShellClasses`

Build Form Shell Classes (DCS / ECS Slot Architecture)
Handles root-level wrapper styling, backwards compatibility, and custom DCS slots.
@deprecated Use `adapter.buildShellStyles()` via `useStyleAdapter()` instead.

### `buildFormActionClasses`

Build Form Action Classes (Action Bar)
@deprecated Use `adapter.buildActionStyles()` via `useStyleAdapter()` instead.

### `buildHeroUIClasses`

@deprecated Use `adapter.buildFieldStyles()` via `useStyleAdapter()` instead.
This function is kept for backward compatibility and testing only.

### `BASE_FIELD_STYLES`

_(No documentation provided)_

### `HeroUIStyleResult`

_(No documentation provided)_

### `DetailedStyleResult`

_(No documentation provided)_

### `buildFieldWrapperClasses`

_(No documentation provided)_

### `FORM_WIDTH_OPTIONS`

_(No documentation provided)_

### `FORM_DENSITY_OPTIONS`

_(No documentation provided)_

### `FORM_THEME_COLORS`

_(No documentation provided)_

### `getFormContainerClass`

_(No documentation provided)_

### `getFormDensityClass`

_(No documentation provided)_

---

## [`utils/i18n.utils.ts`](../../../src/shared/ui/form/utils/i18n.utils.ts)

### `resolveTranslation`

resolveTranslation: The Semantic Bridge
Bridges the Form Engine's schema-driven TranslatedText objects with
the global react-i18next dictionary.
@param value - Either a constant string key (e.g. "forms:onboarding.title"),
a TranslatedText object (e.g. { en: "Name", es: "Nombre" }),
or a raw literal.
@param defaultNamespace - Namespace to use if key string doesn't have one (defaults to 'features:forms').
@returns The resolved string based on the active locale.

---

## [`utils/layout-generator.tsx`](../../../src/shared/ui/form/utils/layout-generator.tsx)

### `LayoutContext`

UTILITY: Layout Generator
Replaces React Layout Components with pure functional class generation.

### `buildBoxModelClasses`

Universal Utility function to generate structured Box Model
CSS from a canonical configuration object.
@deprecated Use `renderBoxModel()` instead, which returns React elements
using Box/Flex/Grid primitives. Keep only for semantic elements (`<nav>`,
`<form>`) where the wrapper element must be controlled by the caller.
@example
renderBoxModel({ display: "flex", direction: "col", gap: "4" }, children)

### `getLayoutContainerClasses`

Returns the container classes for a specific layout configuration.
Adapts legacy SectionLayoutConfig to BoxModel parser.

### `parseLayoutConfig`

Modern Parser: Converts various layout schemas into a standard BoxModelProperties object.

### `getLayoutItemClasses`

Returns the wrapper classes for an individual item (field) within a layout.

### `renderBoxModel`

Maps semantic spacing identifiers to Tailwind spacing classes.
/
function getSpacingMapper(
value?: string,
type: "m" | "p" | "mt" | "mb" | "gap" = "m"
): string {
if (!value) return "";
if (value.includes("-")) return value;
const key = value === "small" ? "sm" : value === "medium" ? "md" : value === "large" ? "lg" : value;
if (type === "m") {
const map: Record<string, string> = { none: "m-0", xs: "m-[var(--space-1)]", sm: "m-[var(--space-2)]", md: "m-[var(--space-4)]", lg: "m-[var(--space-8)]", xl: "m-[var(--space-12)]", xxl: "m-[var(--space-16)]" };
return map[key] || map.md;
}
if (type === "p") {
const map: Record<string, string> = { none: "p-0", xs: "p-[var(--space-1)]", sm: "p-[var(--space-2)]", md: "p-[var(--space-4)]", lg: "p-[var(--space-8)]", xl: "p-[var(--space-12)]", xxl: "p-[var(--space-16)]" };
return map[key] || map.md;
}
if (type === "mt") {
const map: Record<string, string> = { none: "mt-0", xs: "mt-[var(--space-1)]", sm: "mt-[var(--space-2)]", md: "mt-[var(--space-4)]", lg: "mt-[var(--space-8)]", xl: "mt-[var(--space-12)]", xxl: "mt-[var(--space-16)]" };
return map[key] || map.md;
}
if (type === "mb") {
const map: Record<string, string> = { none: "mb-0", xs: "mb-[var(--space-1)]", sm: "mb-[var(--space-2)]", md: "mb-[var(--space-4)]", lg: "mb-[var(--space-8)]", xl: "mb-[var(--space-12)]", xxl: "mb-[var(--space-16)]" };
return map[key] || map.md;
}
if (type === "gap") {
const map: Record<string, string> = { none: "gap-0", xs: "gap-[var(--space-1)]", sm: "gap-[var(--space-2)]", md: "gap-[var(--space-4)]", lg: "gap-[var(--space-8)]", xl: "gap-[var(--space-12)]", xxl: "gap-[var(--space-16)]" };
return map[key] || map.md;
}
return "";
}
function getSpacingClasses(field: FormField) {
const marginTop = field.properties?.marginTop;
const marginBottom = field.properties?.marginBottom;
const padding = field.properties?.padding;
return {
margin: [
getSpacingMapper(marginTop, "mt"),
getSpacingMapper(marginBottom, "mb"),
]
.filter(Boolean)
.join(" "),
padding: getSpacingMapper(padding, "p"),
};
}
// --- Grid Implementation ---
// --- Static Maps for Tailwind Safelist ---
const GAP_MAP: Record<string, string> = {
"0": "gap-0",
"1": "gap-1",
"2": "gap-2",
"3": "gap-3",
"4": "gap-4",
"5": "gap-5",
"6": "gap-6",
"8": "gap-8",
"10": "gap-10",
"12": "gap-12",
sm: "gap-[var(--space-sm)]",
md: "gap-[var(--space-md)]",
lg: "gap-[var(--space-lg)]",
xl: "gap-[var(--space-xl)]",
};
// --- Grid Implementation ---
export { getFieldSpan, getGridClassName };
/ Map numeric/symbolic gap values to Flex/Grid gap scale. /
function mapGapToScale(
gap: string | number | undefined
): "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" {
if (gap === undefined || gap === 0 || gap === "0") return "none";
if (typeof gap === "string") {
const match = gap.match(/(?:gap|space-y|space-x)(?:-|(?:-\[var\(--space-))(\d+(?:\.\d+)?)/);
if (match) {
const num = parseFloat(match[1]);
if (num <= 1.5) return "xs";
if (num <= 3) return "sm";
if (num <= 5) return "md";
if (num <= 8) return "lg";
if (num <= 12) return "xl";
return "2xl";
}
}
if (typeof gap === "number") {
if (gap <= 1) return "xs";
if (gap <= 2) return "sm";
if (gap <= 4) return "md";
if (gap <= 6) return "lg";
if (gap <= 8) return "xl";
return "2xl";
}
const str = String(gap).toLowerCase();
if (str === "sm" || str === "small") return "sm";
if (str === "md" || str === "medium") return "md";
if (str === "lg" || str === "large") return "lg";
if (str === "xl") return "xl";
if (str === "2xl") return "2xl";
return "md";
}
/
Render a layout using primitives instead of raw Tailwind class strings.
@example
renderBoxModel({ display: "flex", direction: "col", gap: "4" }, children)
// → <Flex direction="col" gap="md">{children}</Flex>

### `CSSDisplay`

_(No documentation provided)_

### `BoxModelProperties`

_(No documentation provided)_

---

## [`utils/mdap-compiler.ts`](../../../src/shared/ui/form/utils/mdap-compiler.ts)

### `compileEntityToFormDef`

── TRUE MDAP COMPILER ───────────────────────────────────────────────────────
Consumes a complete 6-Layer MDAP Entity (Content, Behavior, Surface, Presentation)
and compiles it down into a flattened runtime FormDefinition.

---

## [`utils/normalization-utils.ts`](../../../src/shared/ui/form/utils/normalization-utils.ts)

### `hashString`

Shared normalization utilities used by both SchemaNormalizer (render tree)
and normalizeFormDefinition (engine flat maps).
These are intentionally independent — SchemaNormalizer produces a FormField[]
tree for the renderer, while normalizeFormDefinition produces flat O(1) maps
for the state engine. But they share ID resolution and key automation logic.

### `resolveFieldIdentity`

Resolves field identity from key/id/name with consistent priority.
Both normalizers call this to avoid drift in id/name generation.

### `getDeterministicId`

_(No documentation provided)_

---

## [`utils/resolve-instance-def.ts`](../../../src/shared/ui/form/utils/resolve-instance-def.ts)

### `resolveInstanceDefinition`

@file resolve-instance-def.ts
@description InstanceDefinition resolver utility.
Merges manifest-level type defaults with schema-level field configuration to
produce a complete InstanceDefinition. Replaces ad-hoc options resolution
(e.g. `options || field.options || field.meta?.options?.options || []`)
in SelectField, RadioField, and RemoteOptionsManager.
@module ResolveInstanceDef
/
import type { FormField } from "../fields";
import type { ManifestRegistry } from "../core/ManifestRegistry";
import { manifestRegistry as defaultRegistry } from "../core/ManifestRegistry";
import type { InstanceDefinition } from "../types/manifest";
import { useManifestRegistry } from "../context/ManifestRegistryContext";
/
Resolves an InstanceDefinition for a given field.
Merges (in order, later wins):

1. Manifest-level type defaults (via `manifestRegistry.getInstanceDefaults`).
2. Schema-level `field.remoteOptions` → sets `options.source = "remote"` and configures the remote block.
3. Schema-level `field.options` / `field.meta?.options?.options` → sets `options.source = "static"` and `items`.
4. Schema-level `field.creatable` / `field.clearable` → merges into `selection`.
   @param field - The schema field definition.
   @param registry - Optional ManifestRegistry instance (defaults to the global singleton).
   @returns A merged InstanceDefinition object.

### `useInstanceDefinition`

Hook version of `resolveInstanceDefinition`.
Returns the resolved InstanceDefinition for a field. Resolves the
ManifestRegistry from React context (falls back to the global singleton
when called outside a ManifestRegistryProvider tree).
@param field - The schema field definition.
@returns A merged InstanceDefinition object.

---

## [`utils/row-layout.ts`](../../../src/shared/ui/form/utils/row-layout.ts)

### `groupFieldsIntoRows`

Groups a flat list of fields into rows based on their column span (12-column grid).

### `getFieldSpan`

Calculates the column span (1-12) for a field based on its properties.
Now includes a "Smart Recommendation" layer if no explicit span is defined.

### `getGridClassName`

_(No documentation provided)_

---

## [`utils/schema-compat.ts`](../../../src/shared/ui/form/utils/schema-compat.ts)

### `toCanonicalMetadataEvents`

_(No documentation provided)_

---

## [`utils/schema-factory.ts`](../../../src/shared/ui/form/utils/schema-factory.ts)

### `createFormDefinition`

createFormDefinition — one-shot fuse of a logical skeleton and a UI overlay.
ViewModels should call this instead of fuseSchema directly so formId
registration and future compile steps stay in one place.

### `compileEntityToFormDef`

compileEntityToFormDef — MDAP compiler (react-vite reference).
Flattens Content + Behavior + Surface + Presentation into a runtime
FormDefinition. Domain modules supply the entity; this stays in core.

### `createSchemaFactory`

createSchemaFactory — single vertical entry point for defining a form.
Collapses the repeated per-form plumbing (fuseSchema + generic cast +
schemaRegistry.register) into one call, so adding a form is a one-liner
instead of N horizontal copies of the same merge code.

---

## [`utils/schema-fusion.ts`](../../../src/shared/ui/form/utils/schema-fusion.ts)

### `UIConfiguration`

Schema Fusion Logic
Implements the Data-Centric Style (DCS) by separating logical structure
from visual branding. This utility "fuses" a skeletal form definition with
a UI configuration object.
Canonical UI shape (react-vite):
{ fields, sections, layout, settings }
Legacy hospital shape (accepted, not required at call sites):
{ fieldConfig: { name: { gridColumn: "span 1" } }, layout: { type: "grid", columns: 2 } }
/
/ @deprecated Use FormUIConfig — kept so existing fuseSchema call sites type-check.

### `normalizeUIConfig`

Rewrites legacy hospital UI overlays into the canonical fusion contract
so domain files do not need to change.

### `fuseSchema`

fuseSchema
Joins a logical form definition with a UI configuration mapping.
@example

```ts
const schema = fuseSchema(logicalSkeleton, {
  settings: { density: "compact" },
  sections: {
    personal: {
      layout: { type: "card" },
      fields: {
        fullName: { properties: { placeholder: "Full Name" } },
      },
    },
  },
});
```

---

## [`utils/schema-signature.ts`](../../../src/shared/ui/form/utils/schema-signature.ts)

### `buildSchemaStructuralSignature`

_(No documentation provided)_

---

## [`utils/spacing-calculator.ts`](../../../src/shared/ui/form/utils/spacing-calculator.ts)

### `FormMetrics`

SPACING CALCULATOR
Dynamically calculates optimal spacing based on form complexity metrics.
Strategy:

- More fields → More spacing (breathing room)
- Deeper nesting → Less spacing (visual hierarchy)
- User density override → Respected

### `SpacingConfig`

_(No documentation provided)_

### `SpacingCalculator`

_(No documentation provided)_

---

## [`utils/ssr-compat.tsx`](../../../src/shared/ui/form/utils/ssr-compat.tsx)

### `isSSR`

@file ssr-compat.ts
@description SSR-safe utilities for the form system.

## Problem

Several form features depend on browser-only APIs:

- `framer-motion` animations (`AnimatePresence`, `m.div`)
- Field types like `signature`, `file`, `qr-code`
- `localStorage` for draft persistence
  During SSR (Next.js, Remix, etc.), these APIs are unavailable and
  will throw at module import time or during render.

## Solution

- `SSRSafe` wrapper: renders children only on the client
- `isSSR()` / `isClient()` guards
- Dynamic imports for browser-only field components
  /
  import React, { useEffect, useState } from "react";
  / Returns true when running on the server.

### `isClient`

Returns true when running in a browser.

### `isMotionSupported`

Returns true when Motion/Animation APIs are available.

### `SSRSafe`

SSR-safe wrapper — renders nothing on the server,
mounts its children only after hydration on the client.

## Usage

```tsx
<SSRSafe fallback={<div className="h-10 animate-pulse bg-muted rounded" />}>
  <SignatureField />
</SSRSafe>
```

### `createMotionWrapper`

SSR-safe animation wrapper.
Disables framer-motion animations on the server and when reduced motion is preferred.

## Usage

```tsx
import { createMotionWrapper } from "@ui/form/utils/ssr-compat";
import { AnimatePresence, m } from "framer-motion";

const MotionDiv = createMotionWrapper("div");
```

### `BROWSER_ONLY_FIELD_TYPES`

List of field types that require browser APIs and should be SSR-guarded.

---

## [`utils/tailwind-safelist.ts`](../../../src/shared/ui/form/utils/tailwind-safelist.ts)

### `SAFELIST`

_(No documentation provided)_

---

## [`utils/tokens.ts`](../../../src/shared/ui/form/utils/tokens.ts)

### `ZENITH_TOKENS`

ZENITH SEMANTIC TOKEN REGISTRY
Responsibility: Decouple the Form Engine from concrete styling libraries (Tailwind).
Every visual property in the engine should reference a semantic token key.

### `ZenithToken`

_(No documentation provided)_

---

## [`utils/typography.ts`](../../../src/shared/ui/form/utils/typography.ts)

### `buildTypographyClasses`

_(No documentation provided)_

---
