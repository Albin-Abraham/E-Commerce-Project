# Zenith Form Providers & Contexts Reference

**Path:** `frontend/src/shared/ui/form/context/`

This file documents every provider and consumer hook in the context layer of the Zenith Form Architecture: the single composition root, the orchestrator hub, and the per-concern managers (control, permission, data, routing, shell, styling, layout). Signatures below are copied verbatim from the source files listed in each section.

---

## 1. Runtime & engine providers

Composition root and engine-facing runtime contexts. Mount these through `FormRuntimeProvider` unless you are building a standalone host that assembles providers manually.

### 1.1 FormRuntimeProvider

#### `FormRuntimeConfig`

```ts
export interface FormRuntimeConfig {
  orchestrator: FormOrchestratorValue;
  surface: {
    layoutMode?: LayoutMode;
    isWizard?: boolean;
    initialStepId?: string;
  };
  remoteOptions?: {
    executeSearch: (fieldId: string, query: string) => void;
    refresh?: (fieldId: string) => void;
    getOptions?: (
      fieldId: string
    ) => ReadonlyArray<{ label: string; value: unknown }>;
    isLoading?: (fieldId: string) => boolean;
  } | null;
  permissions?: PermissionMap;
  services?: Record<string, any>;
  actions?: Record<string, (payload?: any) => Promise<any>>;
  children: React.ReactNode;
}
```

Props object for `FormRuntimeProvider`. `orchestrator` is the pre-built `FormOrchestratorValue` from `Form`/`FormRenderer`; `surface` configures shell mode; `remoteOptions`, `permissions`, `services`, and `actions` are forwarded to their respective providers.

#### `FormRuntimeProvider`

```tsx
export const FormRuntimeProvider: React.FC<FormRuntimeConfig>
```

Single composition root for the form runtime. Internally nests, in order: `FormOrchestratorProvider`, `LayoutProvider`, `LayoutManagerProvider`, `ControlProvider`, `PermissionProvider`, `DataSourceProvider`, `ActionProvider`, `ServiceProvider`, `ExpressionProvider`, `BindingProvider`. Use it as the one entry point instead of nesting those providers by hand.

[Source: FormRuntimeProvider.tsx](../../../src/shared/ui/form/context/FormRuntimeProvider.tsx)

```tsx
import { FormRuntimeProvider } from "@ui/form";

<FormRuntimeProvider
  orchestrator={orchestratorValue}
  surface={{ layoutMode: "dashboard", isWizard: false, initialStepId: "step-1" }}
  permissions={{ salary_field: "view", delete_btn: "hidden" }}
>
  {children}
</FormRuntimeProvider>
```

### 1.2 FormOrchestratorContext

#### `FormOrchestratorValue`

```ts
export interface FormOrchestratorValue {
  mode?: "edit" | "view";
  slots?: Record<string, any>;
  data?: Record<string, any>;
  registry?: {
    registry: RegistryStore;
    form: Form<any>;
    i18nNamespace?: string;
    debug?: boolean;
    motionConfig?: { disabled?: boolean; reduced?: boolean };
  };
  theme?: FormTheme;
  styleAdapter?: StyleAdapter;
  spacing?: SpacingConfig;
  routing?: {
    renderField: (props: RoutingRenderProps) => React.ReactNode;
    renderStructure: (props: RoutingRenderProps) => React.ReactNode;
  };
  manifest?: {
    manifestRegistry: ManifestRegistry;
  };
  getComponentProps?: (fieldId: string) => any;
  visibility?: Record<string, boolean>;
  spacingAuthority?: "gap";
}
```

The value carried by the orchestrator context: theme, registry, spacing, routing functions, manifest registry, and the top-level `getComponentProps`/`visibility` factories consumed by primitive field drivers.

#### `RoutingRenderProps`

```ts
export interface RoutingRenderProps {
  field: FormField;
  getComponentProps: (fieldId: string) => any;
  visibility?: Record<string, boolean>;
  spacing?: SpacingConfig;
  parentLayout?: RuntimeLayoutConfig;
}
```

Argument shape passed to `routing.renderField` and `routing.renderStructure`.

#### `FormOrchestratorContext`

```ts
export const FormOrchestratorContext = createContext<FormOrchestratorValue>({});
```

The raw React context holding `FormOrchestratorValue`. Defaults to an empty object, so consumers never throw outside a provider.

#### `FormOrchestratorProvider`

```tsx
export const FormOrchestratorProvider: React.FC<{
  value: FormOrchestratorValue;
  children: React.ReactNode;
}>
```

Publishes a `FormOrchestratorValue` to the tree. Several "patcher" providers (registry, routing, theme, spacing, manifest) re-wrap this provider to merge one key into the parent value instead of creating a separate context.

[Source: FormOrchestratorContext.tsx](../../../src/shared/ui/form/context/FormOrchestratorContext.tsx)

#### `useFormOrchestrator`

```ts
export const useFormOrchestrator = () => useContext(FormOrchestratorContext);
```

Returns the full `FormOrchestratorValue`. Use it when you need the raw merged value; the specialized hooks below are preferred for narrow concerns.

#### `usePrimitiveRuntime`

```ts
export const usePrimitiveRuntime = () => {
  const ctx = useContext(FormOrchestratorContext);
  return {
    getComponentProps: ctx.getComponentProps ?? (() => ({})),
    visibility: ctx.visibility ?? {},
  };
};
```

Returns `{ getComponentProps: (fieldId: string) => any; visibility: Record<string, boolean> }` with safe fallbacks. Primary hook for primitive field drivers; replaces prop drilling of `getComponentProps`/`visibility` through nested layout nodes.

```tsx
import { usePrimitiveRuntime } from "@ui/form";

const { getComponentProps, visibility } = usePrimitiveRuntime();
const props = getComponentProps(field.id);
```

### 1.3 ControlContext

#### `ControlManagerValue`

```ts
export interface ControlManagerValue {
  register: (fieldId: string, el: HTMLElement | null) => void;
  focus: (fieldId: string) => void;
  blur: (fieldId: string) => void;
  scrollIntoView: (fieldId: string, options?: ScrollIntoViewOptions) => void;
}
```

Imperative field control API. `register` is called internally by `useFieldControl`; call `focus`/`blur`/`scrollIntoView` from validators, error summaries, or the accessibility runtime.

#### `ControlProvider`

```tsx
export const ControlProvider: React.FC<{ children: React.ReactNode }>
```

Wraps the form tree with a ref-based registry of field elements. Mounted inside `FormRuntimeProvider`; place it manually only in isolated harnesses.

[Source: ControlContext.tsx](../../../src/shared/ui/form/context/ControlContext.tsx)

#### `useControlManager`

```ts
export const useControlManager = (): ControlManagerValue => { ... }
```

Returns the imperative control API, or a no-op stub when used outside `ControlProvider`.

```tsx
import { useControlManager } from "@ui/form";

const control = useControlManager();
control.focus(firstInvalidFieldId);
control.scrollIntoView(firstInvalidFieldId);
```

#### `useFieldControl`

```ts
export const useFieldControl = (
  fieldId: string
): React.RefCallback<HTMLElement> => { ... }
```

Returns a stable ref callback that registers the field's root element on mount and unregisters it on unmount. Attach it to the DOM node inside a field driver.

### 1.4 FormRegistryContext

#### `FormRegistryProvider`

```tsx
export const FormRegistryProvider: React.FC<{
  value: any;
  children: React.ReactNode;
}>
```

Patches only the `registry` key of the parent `FormOrchestratorValue`, preserving the rest of the orchestrator state. This keeps isolated-field usage (table cells, filters, storybook) working with a registry but without a full form.

[Source: FormRegistryContext.tsx](../../../src/shared/ui/form/context/FormRegistryContext.tsx)

#### `useFormRegistry`

```ts
export const useFormRegistry = () => { ... }
```

Returns `{ registry: RegistryStore; form: Form<any> }`. When no `registry` is present in context it falls back to `defaultRegistry` with a `null` form, so consumers must tolerate `form === null`.

```tsx
import { FormRegistryProvider } from "@ui/form/context/FormRegistryContext";

<FormRegistryProvider value={registryContextValue}>
  {children}
</FormRegistryProvider>
```

### 1.5 FormDIProvider

#### `FormDIProvider`

```tsx
export const FormDIProvider: React.FC<{
  engine: Form<any>;
  children: React.ReactNode;
}>
```

Injects the pure `Form` engine into a custom UI subtree so bespoke components can use standard React structure while still reading atomic engine state. Not mounted by `Form`; add it manually around custom areas.

[Source: FormDIProvider.tsx](../../../src/shared/ui/form/context/FormDIProvider.tsx)

#### `useFormEngine`

```ts
export const useFormEngine = () => { ... }
```

Returns `Form<any>`. Throws `"useFormEngine must be used within a FormDIProvider"` when no engine is injected — this hook intentionally fails fast.

#### `useInjectedField`

```ts
export const useInjectedField = (fieldId: string) => { ... }
```

Returns `{ value, setValue: (val: any) => void, setTouched: () => void, error: engine.validity[fieldId] }`. Subscribes to the single field's atom, so the calling component re-renders only when `fieldId` changes.

```tsx
import { useInjectedField } from "@ui/form/context/FormDIProvider";

const { value, setValue, error } = useInjectedField("email");
```

---

## 2. Data providers

Contexts that expose option sources, injected services, value bindings, and manifest metadata.

### 2.1 DataSourceContext

#### `DataSourceManagerValue`

```ts
export interface DataSourceManagerValue {
  search: (fieldId: string, query: string) => void;
  refresh: (fieldId: string) => void;
  getOptions: (
    fieldId: string
  ) => ReadonlyArray<{ label: string; value: unknown }>;
  isLoading: (fieldId: string) => boolean;
}
```

Context wrapper over FormCore's `RemoteOptionsManager`. Every method is keyed by `fieldId` so any driver can search, refresh, read cached options, or check loading state.

#### `FieldDataSourceResult`

```ts
export interface FieldDataSourceResult {
  search: (query: string) => void;
  refresh: () => void;
  options: ReadonlyArray<{ label: string; value: unknown }>;
  isLoading: boolean;
}
```

Field-scoped projection of the manager with all arguments pre-bound to one field.

#### `DataSourceProvider`

```tsx
export const DataSourceProvider: React.FC<{
  children: React.ReactNode;
  remoteOptions?: {
    executeSearch: (fieldId: string, query: string) => void;
    refresh?: (fieldId: string) => void;
    getOptions?: (
      fieldId: string
    ) => ReadonlyArray<{ label: string; value: unknown }>;
    isLoading?: (fieldId: string) => boolean;
  } | null;
}>
```

Bridges `form.remoteOptions` into context. Missing methods degrade to no-ops / empty arrays, so the provider is safe with no remote configuration.

[Source: DataSourceContext.tsx](../../../src/shared/ui/form/context/DataSourceContext.tsx)

#### `useDataSourceManager`

```ts
export const useDataSourceManager = (): DataSourceManagerValue => { ... }
```

Returns the full manager, or a default no-op manager outside `DataSourceProvider`. Use for cross-field refresh (e.g. after a dependent field changes).

#### `useDataSource`

```ts
export const useDataSource = (fieldId: string): FieldDataSourceResult => { ... }
```

Returns search/refresh/options/isLoading pre-bound to `fieldId`. Use inside select, autocomplete, and multiselect drivers.

```tsx
import { useDataSource } from "@ui/form";

const { search, options, isLoading } = useDataSource(field.id);
```

### 2.2 ServiceContext

#### `ServiceManagerValue`

```ts
export interface ServiceManagerValue {
  getService: <T>(serviceId: string) => T | undefined;
}
```

Lookup surface for externally injected services.

#### `ServiceProviderProps`

```ts
export interface ServiceProviderProps {
  services?: Record<string, any>;
  children: React.ReactNode;
}
```

Props for `ServiceProvider`.

#### `ServiceProvider`

```tsx
export const ServiceProvider: React.FC<ServiceProviderProps>
```

Publishes a `services` map to the tree so schema-driven components can resolve API clients or domain services by id without prop drilling.

[Source: ServiceContext.tsx](../../../src/shared/ui/form/context/ServiceContext.tsx)

#### `useServiceManager`

```ts
export const useServiceManager = (): ServiceManagerValue => { ... }
```

Returns `{ getService }`, or a stub returning `undefined` outside the provider.

#### `useService`

```ts
export const useService = <T,>(serviceId: string): T | undefined => { ... }
```

Convenience wrapper returning the typed service for `serviceId`.

```tsx
import { useService } from "@ui/form";

const api = useService<MyApi>("myApi");
```

### 2.3 BindingContext

#### `BindingManagerValue`

```ts
export interface BindingManagerValue {
  getValue: (bindingId: string) => any;
  setValue: (bindingId: string, value: any) => void;
}
```

Thin abstraction over FormCore value proxies: reads `form.values[bindingId]` and writes via `form.setValue`.

#### `BindingProvider`

```tsx
export const BindingProvider: React.FC<{ children: React.ReactNode }>
```

Wraps children with the binding manager, resolving the `form` instance from `useFormRegistry()`. It is the innermost provider of `FormRuntimeProvider`.

[Source: BindingContext.tsx](../../../src/shared/ui/form/context/BindingContext.tsx)

#### `useBindingManager`

```ts
export const useBindingManager = (): BindingManagerValue => { ... }
```

Returns the manager, or no-op getters/setters outside the provider.

#### `useFieldBinding`

```ts
export const useFieldBinding = (bindingId: string) => { ... }
```

Returns `{ value: any; onChange: (val: any) => void }` for a single binding id.

```tsx
import { useFieldBinding } from "@ui/form";

const { value, onChange } = useFieldBinding("customerName");
```

### 2.4 ManifestRegistryContext

#### `ManifestRegistryProvider`

```tsx
export const ManifestRegistryProvider: React.FC<{
  value?: ManifestRegistry;
  children: React.ReactNode;
}>
```

Merges `manifest: { manifestRegistry }` into the parent `FormOrchestratorValue`, defaulting to the global `manifestRegistry` singleton when `value` is omitted. Mount manually when a subtree needs a non-default manifest registry.

[Source: ManifestRegistryContext.tsx](../../../src/shared/ui/form/context/ManifestRegistryContext.tsx)

#### `useManifestRegistry`

```ts
export const useManifestRegistry = () => { ... }
```

Returns `{ manifestRegistry: ManifestRegistry }`; falls back to the global singleton outside the provider. Consumed by `resolveInstanceDefinition` for manifest-level type defaults.

```tsx
import { ManifestRegistryProvider } from "@ui/form/context/ManifestRegistryContext";

<ManifestRegistryProvider value={registry}>{children}</ManifestRegistryProvider>
```

---

## 3. Governance providers

Permission, action, and expression rule providers.

### 3.1 PermissionContext

#### `FieldPermission`

```ts
export type FieldPermission = "edit" | "view" | "hidden";
```

Per-field access level: `edit` allows modification (default), `view` renders read-only, `hidden` removes the field from the UI.

#### `PermissionMap`

```ts
export interface PermissionMap {
  [fieldId: string]: FieldPermission;
}
```

Field id to permission level mapping.

#### `PermissionManagerValue`

```ts
export interface PermissionManagerValue {
  getPermission: (fieldId: string) => FieldPermission;
  updatePermissions: (updates: PermissionMap) => void;
  setPermissions: (permissions: PermissionMap) => void;
}
```

Full manager API: resolve one field's permission, merge partial updates at runtime, or replace the map wholesale.

#### `FieldPermissionResult`

```ts
export interface FieldPermissionResult {
  permission: FieldPermission;
  canEdit: boolean;
  canView: boolean;
  isHidden: boolean;
}
```

Derived booleans so drivers never compare strings.

#### `PermissionProvider`

```tsx
export const PermissionProvider: React.FC<{
  children: React.ReactNode;
  permissions?: PermissionMap;
}>
```

Seeds the permission state; `getPermission` returns `"edit"` for any field not present in the map. Mounted inside `FormRuntimeProvider` with `FormRuntimeConfig.permissions`.

[Source: PermissionContext.tsx](../../../src/shared/ui/form/context/PermissionContext.tsx)

#### `usePermissionManager`

```ts
export const usePermissionManager = (): PermissionManagerValue => { ... }
```

Returns the manager, or a default manager (`getPermission → "edit"`) outside the provider. Use for dynamic updates such as role changes.

#### `useFieldPermission`

```ts
export const useFieldPermission = (fieldId: string): FieldPermissionResult => { ... }
```

Returns the resolved permission and derived booleans for one field.

```tsx
import { useFieldPermission } from "@ui/form";

const { canEdit, isHidden } = useFieldPermission(field.id);
if (isHidden) return null;
return <input disabled={!canEdit} />;
```

### 3.2 ActionContext

#### `FormActionHandler`

```ts
export type FormActionHandler = (payload?: any) => Promise<any>;
```

Async handler signature for schema-declared action intents.

#### `FormActionManagerValue`

```ts
export interface FormActionManagerValue {
  executeAction: (actionId: string, payload?: any) => Promise<any>;
  registerHandler: (actionId: string, handler: FormActionHandler) => void;
  unregisterHandler: (actionId: string) => void;
}
```

Form-local action manager. `executeAction` warns to the console when no handler is registered for `actionId`.

#### `ActionProvider`

```tsx
export const ActionProvider: React.FC<{
  children: React.ReactNode;
  actions?: Record<string, FormActionHandler>;
}>
```

Registers the initial handler map and refreshes it whenever the `actions` prop reference changes. Mounted inside `FormRuntimeProvider`; `FormRuntimeTree` adds an implicit `submit` handler when `onSubmit` is provided.

[Source: ActionContext.tsx](../../../src/shared/ui/form/context/ActionContext.tsx)

#### `useFormActionManager`

```ts
export const useFormActionManager = (): FormActionManagerValue => { ... }
```

Canonical manager hook. Returns a no-op stub outside `ActionProvider`.

#### `useFormAction`

```ts
export const useFormAction = (actionId: string) => { ... }
```

Returns a stable `(payload?: any) => Promise<any>` bound to `actionId`.

```tsx
import { useFormAction } from "@ui/form";

const save = useFormAction("dispatch:SAVE_DRAFT");
```

> **Retired names:** `useActionManager` and `useAction` were retired to avoid a collision with the platform shell's Zustand `useActionManager`. They are no longer exported from this module; use `useFormActionManager` and `useFormAction`.

### 3.3 ExpressionContext

#### `ExpressionContextValue`

```ts
export interface ExpressionContextValue {
  evaluate: (expression: string, localContext?: Record<string, any>) => any;
  registerGlobal: (key: string, value: any) => void;
}
```

Evaluates a dynamic expression string against merged globals plus a local context, and registers values into the global scope. Evaluation failures log a warning and return `false`.

#### `ExpressionProvider`

```tsx
export const ExpressionProvider: React.FC<{ children: React.ReactNode }>
```

Mounts the expression evaluator with a ref-backed globals store. Innermost-but-one provider inside `FormRuntimeProvider`.

[Source: ExpressionContext.tsx](../../../src/shared/ui/form/context/ExpressionContext.tsx)

#### `useExpressionContext`

```ts
export const useExpressionContext = (): ExpressionContextValue => { ... }
```

Returns the value, or a stub (`evaluate → false`) outside the provider.

```tsx
import { useExpressionContext } from "@ui/form";

const { evaluate, registerGlobal } = useExpressionContext();
```

---

## 4. Routing & shell providers

Providers that own render routing, shell chrome, surface mode, and wizard navigation.

### 4.1 FormRoutingContext

#### `FormRoutingProvider`

```tsx
export function FormRoutingProvider({
  renderField,
  renderStructure,
  children,
}: {
  renderField: any;
  renderStructure: any;
  children: React.ReactNode;
})
```

Merges `routing: { renderField, renderStructure }` into the parent `FormOrchestratorValue`. It is not mounted by `Form`; add it manually when a host supplies custom field/structure renderers.

[Source: FormRoutingContext.tsx](../../../src/shared/ui/form/context/FormRoutingContext.tsx)

#### `useFieldRouter`

```ts
export function useFieldRouter(): FormRoutingContextValue["renderField"]
```

Returns `renderField` — `(props: RoutingRenderProps) => React.ReactNode` — or a function returning `null` when no routing is configured.

#### `useStructureRenderer`

```ts
export function useStructureRenderer(): FormRoutingContextValue["renderStructure"]
```

Returns `renderStructure` with the same `RoutingRenderProps` signature, or a `null`-returning fallback.

```tsx
import { FormRoutingProvider } from "@ui/form/context/FormRoutingContext";

<FormRoutingProvider renderField={renderField} renderStructure={renderStructure}>
  {children}
</FormRoutingProvider>
```

### 4.2 FormShellContext

#### `FormShellProvider`

```tsx
export function FormShellProvider({
  children,
  ...value
}: FormShellProviderProps)
```

Props are the whole shell context value plus `children`: `definition: FormDefinition`, `form: any`, `slots: Record<string, string>`, `className: string`, `debug: boolean`, `isSubmitting: boolean`, `visibility: Record<string, boolean>`, `getComponentProps: (fieldId: string) => any`, `actionClasses: string`, `submitBtnClass: string`, `cancelButtonClass: string`, `onExecuteSubmit: () => Promise<boolean>`, `handleDelegatedChange: (e: React.FormEvent) => void`, `handleDelegatedBlur: (e: React.FocusEvent) => void`, optional `shell?: FormSurfaceShell`, and `secondaryActions?: React.ReactNode`. The provider memoizes the value across all of those fields to avoid re-rendering the shell on every state tick.

[Source: FormShellContext.tsx](../../../src/shared/ui/form/context/FormShellContext.tsx)

#### `useFormShell`

```ts
export function useFormShell(): FormShellContextValue
```

Returns the full shell value. Throws `"useFormShell must be used within a FormShellProvider"` outside a provider — shell components (header, footer, action bar) are only valid inside the mounted form tree.

```tsx
import { useFormShell } from "@ui/form/context/FormShellContext";

const { isSubmitting, onExecuteSubmit } = useFormShell();
```

### 4.3 SurfaceContext

#### `LayoutMode`

```ts
export type LayoutMode =
  | "dashboard"
  | "portal"
  | "fullscreen"
  | "drawer"
  | "modal"
  | "inline";
```

Macro layout mode for the application shell. Re-exported from `LayoutContext`.

#### `SurfaceContextValue`

```ts
export interface SurfaceContextValue {
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  isPageHeaderActive: boolean;
  isPageFooterActive: boolean;
  setFeatures: (features: { header?: boolean; footer?: boolean }) => void;
  pageTitle?: string;
  setPageTitle: (title: string) => void;
  pageDescription?: string;
  setPageDescription: (desc: string) => void;
}
```

Shell-only state: layout mode, page header/footer enrollment, and page metadata hand-offs.

#### `SurfaceProvider`

```tsx
export const SurfaceProvider: React.FC<{
  children: React.ReactNode;
  initialMode?: LayoutMode;
}>
```

Owns shell state with `initialMode = "dashboard"` as the default. Mounted by `LayoutProvider`, which `FormRuntimeProvider` uses.

[Source: SurfaceContext.tsx](../../../src/shared/ui/form/context/SurfaceContext.tsx)

#### `useSurface`

```ts
export const useSurface = (): SurfaceContextValue => { ... }
```

Returns shell state, or a safe dashboard-mode fallback outside the provider (for standalone/Storybook usage).

```tsx
import { useSurface } from "@ui/form";

const { layoutMode, setLayoutMode } = useSurface();
```

### 4.4 WizardContext

#### `WizardContextValue`

```ts
export interface WizardContextValue {
  isWizard: boolean;
  currentStepId: string;
  history: string[];
  navigation: {
    next: (nextId: string | null) => void;
    back: () => void;
    jump: (stepId: string) => void;
    reset: (startStepId: string) => void;
  };
}
```

Multi-step navigation state scoped to one wizard instance. `next` pushes the current step onto `history`, `back` pops it, `jump` changes steps without touching history, and `reset` clears history.

#### `WizardProvider`

```tsx
export const WizardProvider: React.FC<{
  children: React.ReactNode;
  initialStepId?: string;
  isWizard?: boolean;
}>
```

Mounts wizard navigation with `initialStepId = ""` and `isWizard = false` as defaults. Multiple wizards can each mount their own provider without conflicting.

[Source: WizardContext.tsx](../../../src/shared/ui/form/context/WizardContext.tsx)

#### `useWizard`

```ts
export const useWizard = (): WizardContextValue => { ... }
```

Returns wizard state, or an inert fallback (`isWizard: false`, no-op navigation) outside the provider.

```tsx
import { useWizard } from "@ui/form";

const { currentStepId, navigation } = useWizard();
navigation.next("step-2");
```

### 4.5 LayoutContext

#### `LayoutContextValue`

```ts
export interface LayoutContextValue {
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  isPageHeaderActive: boolean;
  isPageFooterActive: boolean;
  setFeatures: (features: { header?: boolean; footer?: boolean }) => void;
  pageTitle?: string;
  setPageTitle: (title: string) => void;
  pageDescription?: string;
  setPageDescription: (desc: string) => void;
  currentStepId: string;
  history: string[];
  isWizard: boolean;
  navigation: {
    next: (nextId: string | null) => void;
    back: () => void;
    jump: (stepId: string) => void;
    reset: (startStepId: string) => void;
  };
}
```

Deprecated merged view of `SurfaceContextValue` and `WizardContextValue`, kept for backward compatibility.

#### `LayoutProvider`

```tsx
export const LayoutProvider: React.FC<{
  children: React.ReactNode;
  initialMode?: LayoutMode;
  initialStepId?: string;
  isWizard?: boolean;
}>
```

Composes `SurfaceProvider` + `WizardProvider`. Defaults: `initialMode = "dashboard"`, `initialStepId = ""`, `isWizard = false`. Mounted inside `FormRuntimeProvider`.

[Source: LayoutContext.tsx](../../../src/shared/ui/form/context/LayoutContext.tsx)

#### `useLayout`

```ts
export const useLayout = (): LayoutContextValue => { ... }
```

Returns the merged shell + wizard value. Deprecated: prefer `useSurface()` for shell concerns and `useWizard()` for navigation.

```tsx
import { LayoutProvider } from "@ui/form/context/LayoutContext";

<LayoutProvider initialMode="modal" isWizard initialStepId="step-1">
  {children}
</LayoutProvider>
```

#### `createLayoutStore`

```ts
export const createLayoutStore = (initProps?: Partial<LayoutState>) => { ... }
```

Creates a Zustand store holding the same shell + wizard state as `LayoutState` (`layoutMode`, `isPageHeaderActive`, `isPageFooterActive`, `currentStepId`, `history`, `isWizard`, `pageTitle`, `pageDescription`) plus the action functions (`setLayoutMode`, `setFeatures`, `setPageTitle`, `setPageDescription`, `navigation`). Returns `LayoutStore = ReturnType<typeof createLayoutStore>` for non-React or cross-tree access.

[Source: createLayoutStore.ts](../../../src/shared/ui/form/context/createLayoutStore.ts)

```ts
import { createLayoutStore } from "@ui/form/context/createLayoutStore";

const store = createLayoutStore({ layoutMode: "modal", isWizard: true });
```

---

## 5. Styling & layout providers

Theme, spacing, imperative layout-node control, and field composition contract.

### 5.1 FormThemeContext

#### `FormThemeProvider`

```tsx
export const FormThemeProvider: React.FC<{
  theme?: FormTheme;
  adapter?: StyleAdapter;
  children: ReactNode;
}>
```

Merges `theme` (default `DEFAULT_FORM_THEME`) and `adapter` (default `defaultTailwindAdapter`, otherwise the parent's adapter) into the orchestrator value. Mounted by `FormRuntimeTree` and `FormRenderer`.

[Source: FormThemeContext.tsx](../../../src/shared/ui/form/context/FormThemeContext.tsx)

#### `useFormTheme`

```ts
export const useFormTheme = () => { ... }
```

Returns the active `FormTheme`, falling back to `DEFAULT_FORM_THEME` when no theme is set in context.

#### `useStyleAdapter`

```ts
export const useStyleAdapter = (): StyleAdapter => { ... }
```

Returns the active `StyleAdapter`, falling back to `defaultTailwindAdapter`. Also re-exported from the `@ui/form` barrel.

```tsx
import { FormThemeProvider, useFormTheme, useStyleAdapter } from "@ui/form";

<FormThemeProvider>{children}</FormThemeProvider>
```

### 5.2 FormSpacingContext

#### `FormSpacingProvider`

```tsx
export const FormSpacingProvider: React.FC<{
  spacing: SpacingConfig;
  children: React.ReactNode;
}>
```

Merges `spacing` into the parent orchestrator value. Not mounted by `Form`; add it manually when a host overrides the computed spacing.

[Source: FormSpacingContext.tsx](../../../src/shared/ui/form/context/FormSpacingContext.tsx)

#### `useFormSpacing`

```ts
export const useFormSpacing = (): SpacingConfig => { ... }
```

Returns the orchestrator spacing, or `SpacingCalculator.getDefaultSpacing()` when none is configured.

#### `withFormSpacing`

```ts
export function withFormSpacing<P extends { spacing?: SpacingConfig }>(
  Component: React.ComponentType<P>
): React.FC<Omit<P, "spacing">>
```

Higher-order component that injects `spacing` as a prop from `useFormSpacing()`, removing it from the external props.

```tsx
import { withFormSpacing } from "@ui/form/context/FormSpacingContext";

const SpacedPanel = withFormSpacing(Panel);
```

### 5.3 LayoutManagerContext

#### `LayoutManagerContextValue`

```ts
export interface LayoutManagerContextValue {
  tabs: TabsManager;
  accordion: AccordionManager;
}
```

Imperative layout-node API. `tabs` exposes `use(nodeId, initialTabId)`, `setActiveTab(nodeId, tabId)`, `getActiveTab(nodeId)`; `accordion` exposes `use(nodeId, defaultOpen)`, `setOpen(nodeId, open)`, `toggle(nodeId)`, `isOpen(nodeId)`. State lives in refs, so one node's change does not re-render the whole tree.

#### `LayoutManagerProvider`

```tsx
export const LayoutManagerProvider: React.FC<{ children: React.ReactNode }>
```

Mounts the tabs and accordion registries. Mounted inside `FormRuntimeProvider`.

[Source: LayoutManagerContext.tsx](../../../src/shared/ui/form/context/LayoutManagerContext.tsx)

#### `useLayoutManager`

```ts
export const useLayoutManager = (): LayoutManagerContextValue => { ... }
```

Returns the imperative API, or a graceful fallback (empty tab id, closed accordion) outside the provider. Use from validators to jump to the tab or accordion containing an error.

#### `useTabsNode`

```ts
export const useTabsNode = (
  nodeId: string,
  initialTabId: string
): TabsEntry => { ... }
```

Returns `{ activeTab: string; setActiveTab: (tabId: string) => void }` and registers the node. Call inside a `TabsField` component.

#### `useAccordionNode`

```ts
export const useAccordionNode = (
  nodeId: string,
  defaultOpen: boolean
): AccordionEntry => { ... }
```

Returns `{ isOpen: boolean; setOpen: (open: boolean) => void; toggle: () => void }` and registers the node. Call inside an `AccordionField` component.

```tsx
import { useLayoutManager, useTabsNode } from "@ui/form";

const { tabs } = useLayoutManager();
tabs.setActiveTab("settings_tabs_id", "security_tab_id");
```

### 5.4 FieldCompositionContext

#### `FieldCompositionMode`

```ts
export type FieldCompositionMode = "standalone" | "managed" | "primitive";
```

Rendering contract for fields: `standalone` (field owns Box/Label/InputWrapper/Surface/Feedback), `managed` (rendered inside an existing `FieldShell`, skips outer chrome), `primitive` (raw input control only).

#### `FieldCompositionContextValue`

```ts
export interface FieldCompositionContextValue {
  mode: FieldCompositionMode;
}
```

Context value shape.

#### `FieldCompositionContext`

```ts
export const FieldCompositionContext =
  createContext<FieldCompositionContextValue>({
    mode: "standalone",
  });
```

Raw context, defaulting to `"standalone"`. There is no `FieldCompositionProvider`; `FieldShell` mounts `FieldCompositionContext.Provider` directly around its children.

[Source: FieldCompositionContext.ts](../../../src/shared/ui/form/context/FieldCompositionContext.ts)

#### `useFieldComposition`

```ts
export function useFieldComposition(): FieldCompositionContextValue
```

Returns `{ mode }` for the nearest `FieldShell`. Use in a field or wrapper to decide whether to render full chrome.

#### `useFieldCompositionContext`

```ts
export const useFieldCompositionContext = useFieldComposition;
```

Alias of `useFieldComposition`, kept for call sites that prefer the longer name.

```tsx
import { useFieldComposition } from "@ui/form/context/FieldCompositionContext";

const { mode } = useFieldComposition();
```

---

## 6. Provider nesting map

`Form` builds its tree through `FormRuntimeTree`, and `FormRenderer` builds a shorter variant for pure layout rendering.

| Order | Provider | Mounted by | Add manually when |
|---|---|---|---|
| 1 | `I18nextProvider` | `FormRuntimeTree` | Rendering outside `Form` |
| 2 | `FormThemeProvider` | `FormRuntimeTree`, `FormRenderer`, stories | Standalone shell/structure stories |
| 3 | `FormRuntimeProvider` (10 nested providers) | `FormRuntimeTree`, `FormRenderer` | Building a custom host |
| 3.1 | `FormOrchestratorProvider` | inside `FormRuntimeProvider` | Patching a single orchestrator key |
| 3.2 | `LayoutProvider` (`SurfaceProvider` + `WizardProvider`) | inside `FormRuntimeProvider` | Shell-only or wizard-only subtrees |
| 3.3 | `LayoutManagerProvider` | inside `FormRuntimeProvider` | Isolated layout-node harness |
| 3.4 | `ControlProvider` | inside `FormRuntimeProvider` | Focus tests without a form |
| 3.5 | `PermissionProvider` | inside `FormRuntimeProvider` | Scoped permission subtrees |
| 3.6 | `DataSourceProvider` | inside `FormRuntimeProvider` | Table filters with remote options |
| 3.7 | `ActionProvider` | inside `FormRuntimeProvider` | Extra handler scopes |
| 3.8 | `ServiceProvider` | inside `FormRuntimeProvider` | Extra service scopes |
| 3.9 | `ExpressionProvider` | inside `FormRuntimeProvider` | Standalone expression evaluation |
| 3.10 | `BindingProvider` | inside `FormRuntimeProvider` | Standalone binding consumers |
| 4 | `FormNavigationGuard` | `FormRuntimeTree` | Never (internal) |
| 5 | `FormShellProvider` | `FormRuntimeTree` | Custom shell hosts |
| 6 | `FormRegistryProvider` | `FormRenderer`, table/filter hosts | Isolated fields with a registry |
| — | `FormRoutingProvider` | not mounted internally | Host supplies `renderField`/`renderStructure` |
| — | `ManifestRegistryProvider` | not mounted internally | Subtree needs a non-default manifest registry |
| — | `FormSpacingProvider` | not mounted internally | Host overrides spacing |
| — | `FormDIProvider` | not mounted internally | Custom UI over the pure engine |
| — | `FieldCompositionContext.Provider` | `FieldShell` | Never (internal) |

Effective order for `Form`:

```tsx
<I18nextProvider>
  <FormThemeProvider>
    <FormRuntimeProvider orchestrator={...} surface={...} permissions={...} actions={...}>
      <FormNavigationGuard />
      <FormShellProvider {...shellContext}>
        <FormShell>{children}</FormShell>
      </FormShellProvider>
    </FormRuntimeProvider>
  </FormThemeProvider>
</I18nextProvider>
```

`FormRenderer` order:

```tsx
<FormThemeProvider theme={activeTheme} adapter={adapter}>
  <FormRuntimeProvider orchestrator={orchestratorValue} surface={{ layoutMode: "inline" }}>
    <FormRegistryProvider value={registryContextValue}>
      {nodes.map((node) => <RenderNode key={node.id} node={node} />)}
    </FormRegistryProvider>
  </FormRuntimeProvider>
</FormThemeProvider>
```

Add providers outside `FormRuntimeProvider` only when you need a scope the form does not create: routing, manifest, spacing, or DI.

---

**See also:**

- [01-ENGINE.md](01-ENGINE.md)
- [02-REGISTRIES.md](02-REGISTRIES.md)
- [03-MODULES.md](03-MODULES.md)
- [06-HOOKS.md](06-HOOKS.md)
- [07-COMPONENTS.md](07-COMPONENTS.md)
- [10-SHARED_UTILS.md](10-SHARED_UTILS.md)
- [11-TYPES_CONTRACTS.md](11-TYPES_CONTRACTS.md)
