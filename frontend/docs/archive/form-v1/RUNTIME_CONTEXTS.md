# Runtime Contexts Architecture

The v1 Form Engine uses a **Context Composition Architecture** with 10 specialized contexts composed into a single `FormRuntimeProvider`. This eliminates provider nesting hell while preserving domain boundaries.

---

## The Provider Hell Problem

**Before (manual nesting):**
```tsx
<FormOrchestratorProvider>
  <LayoutProvider>
    <LayoutManagerProvider>
      <ControlProvider>
        <PermissionProvider>
          <DataSourceProvider>
            <ActionProvider>
              <ServiceProvider>
                <ExpressionProvider>
                  <BindingProvider>
                    {children}
```

**After (single root):**
```tsx
<FormRuntimeProvider
  orchestrator={orchestratorValue}
  surface={{ layoutMode: "dashboard", isWizard: false }}
  remoteOptions={form.remoteOptions}
  permissions={{ salary: "view" }}
>
  {children}
</FormRuntimeProvider>
```

---

## FormRuntimeProvider

**Location:** `src/shared/ui/form/context/FormRuntimeProvider.tsx`

**Single composition root** that internally composes all 10 contexts in order:

```typescript
interface FormRuntimeConfig {
  // Global Runtime (Phase 1)
  orchestrator: FormOrchestratorValue;  // theme, registry, getComponentProps, visibility
  
  // Surface Runtime (Phase 2)
  surface: {
    layoutMode?: LayoutMode;      // "dashboard" | "portal" | "fullscreen" | "drawer" | "modal" | "inline"
    isWizard?: boolean;
    initialStepId?: string;
  };
  
  // Primitive Runtime (Phases 1-3)
  remoteOptions?: RemoteOptionsManager;  // DataSourceContext
  permissions?: PermissionMap;           // PermissionContext
  actions?: Record<string, Action>;      // ActionContext
  services?: Record<string, any>;        // ServiceContext
  
  // Children
  children: React.ReactNode;
}
```

**Internal Composition Order:**
```
1. FormOrchestratorProvider  → Global: theme, registry, getComponentProps, visibility, routing, manifest
2. SurfaceProvider           → Shell: layoutMode, pageTitle, header/footer enrollment
3. WizardProvider            → Navigation: currentStepId, history, goNext/goPrev
3. LayoutManagerProvider     → Layout: Tabs/Accordion imperative control
4. ControlProvider           → Primitive: focus, blur, scrollIntoView
5. PermissionProvider        → Primitive: edit/view/hidden per field
6. DataSourceProvider        → Primitive: remote options search/refresh
7. ActionProvider            → Primitive: execute string-based actions
8. ServiceProvider           → Primitive: inject API services
9. ExpressionProvider        → Primitive: evaluate dynamic conditions
10. BindingProvider          → Primitive: value binding abstraction
```

---

## Context Reference

### 1. FormOrchestratorContext (Global Runtime)

**Purpose:** Global form runtime - theme, registry, component props factory, visibility map, routing, manifest.

**Provider:** `FormOrchestratorProvider` (internal)

**Key Hooks:**
```typescript
// Primary hook for field drivers - eliminates prop drilling
const { getComponentProps, visibility } = usePrimitiveRuntime();

// Theme & styling
const theme = useFormTheme();
const adapter = useStyleAdapter();

// Registry access
const registry = useFormRegistry();
const manifest = useManifestRegistry();

// Routing
const { renderField } = useFieldRouter();
const { renderStructure } = useStructureRenderer();
```

**Value Shape:**
```typescript
interface FormOrchestratorValue {
  theme: FormTheme;
  registry: FieldRegistry;
  manifest: ManifestRegistry;
  getComponentProps: (fieldId: string) => ComponentProps;
  visibility: Record<string, boolean>;
  routing: FieldRoutingConfig;
  spacing: SpacingConfig;
  spacingAuthority?: "gap" | "none";  // For SectionContent vertical spacing control
  i18nNamespace?: string;
}
```

---

### 2. SurfaceContext (Shell Concerns)

**Purpose:** Application shell - layout mode, page metadata, header/footer enrollment.

**Provider:** `SurfaceProvider` (internal via FormRuntimeProvider)

**Hooks:**
```typescript
const { layoutMode, pageTitle, pageDescription, enrollHeader, enrollFooter } = useSurface();
```

**Value:**
```typescript
interface SurfaceContextValue {
  layoutMode: LayoutMode;
  pageTitle?: string;
  pageDescription?: string;
  enrollHeader: (content: ReactNode) => void;
  enrollFooter: (content: ReactNode) => void;
  yieldHeader: boolean;  // Form yields header to page shell
  yieldFooter: boolean;
}
```

**Layout Modes:**
| Mode | Use Case | Chrome |
|------|----------|--------|
| `dashboard` | Admin panels, data dense | Full chrome, sticky header/footer |
| `portal` | Customer-facing, auth | Minimal, branded |
| `fullscreen` | Immersive editors | No chrome |
| `drawer` | Side panels | Overlay, fixed width |
| `modal` | Dialogs | Overlay, centered |
| `inline` | Embedded in page | No chrome, inherits layout |

---

### 3. WizardContext (Step Navigation)

**Purpose:** Multi-step wizard navigation - scoped per wizard instance.

**Provider:** `WizardProvider` (internal via FormRuntimeProvider)

**Hooks:**
```typescript
const { 
  currentStepId, 
  stepHistory, 
  goNext, 
  goPrev, 
  goToStep, 
  canGoNext, 
  canGoPrev,
  registerStep,
  unregisterStep,
} = useWizard();
```

**Value:**
```typescript
interface WizardContextValue {
  currentStepId: string;
  stepHistory: string[];
  initialStepId: string;
  linear: boolean;
  goNext: () => void;
  goPrev: () => void;
  goToStep: (stepId: string) => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  registerStep: (stepId: string, config: StepConfig) => void;
  unregisterStep: (stepId: string) => void;
}
```

**Step Config (from section `nextStep`):**
```typescript
interface StepConfig {
  id: string;
  title: string;
  nextStep?: string | ((values) => string | null);
  validation?: ValidationSettings; // Step-level validation
}
```

---

### 4. LayoutManagerContext (Imperative Layout Control)

**Purpose:** Imperative control of Tabs, Accordion, SplitPane nodes without prop drilling.

**Provider:** `LayoutManagerProvider` (internal via FormRuntimeProvider)

**Hooks:**
```typescript
// Inside layout drivers (TabsField, AccordionField)
const { activeTab, setActiveTab } = useTabsNode(nodeId, initialTabId);
const { isOpen, setOpen, toggle } = useAccordionNode(nodeId, defaultOpen);

// Imperative (e.g., FormValidator on error)
const { tabs, accordion } = useLayoutManager();
tabs.setActiveTab("settings_tabs", "security_tab");
accordion.setOpen("advanced_accordion", true);
```

**Value:**
```typescript
interface LayoutManagerContextValue {
  tabs: {
    use: (nodeId: string, initialTabId: string) => { activeTab: string; setActiveTab: (id: string) => void };
    setActiveTab: (nodeId: string, tabId: string) => void;
    getActiveTab: (nodeId: string) => string | undefined;
  };
  accordion: {
    use: (nodeId: string, defaultOpen: boolean) => { isOpen: boolean; setOpen: (v: boolean) => void; toggle: () => void };
    setOpen: (nodeId: string, open: boolean) => void;
    toggle: (nodeId: string) => void;
    isOpen: (nodeId: string) => boolean;
  };
}
```

---

### 5. ControlContext (Imperative Field Control)

**Purpose:** Focus, blur, scrollIntoView for any field from anywhere.

**Provider:** `ControlProvider` (internal via FormRuntimeProvider)

**Hooks:**
```typescript
// Inside field driver - registers DOM ref
const controlRef = useFieldControl(field.id);
return <input ref={controlRef} ... />;

// Imperative (e.g., FormValidationSummary on submit error)
const { focus, blur, scrollIntoView } = useControlManager();
focus("email_field");
scrollIntoView("email_field", { behavior: "smooth", block: "center" });
```

**Value:**
```typescript
interface ControlManagerValue {
  register: (fieldId: string, el: HTMLElement | null) => void;
  focus: (fieldId: string) => void;
  blur: (fieldId: string) => void;
  scrollIntoView: (fieldId: string, options?: ScrollIntoViewOptions) => void;
}
```

---

### 6. PermissionContext (Field-Level Access Control)

**Purpose:** Per-field permission resolution: `edit` | `view` | `hidden`.

**Provider:** `PermissionProvider` (internal via FormRuntimeProvider)

**Hooks:**
```typescript
// Inside field driver - automatic
const { canEdit, canView, isHidden } = useFieldPermission(field.id);
if (isHidden) return null;
return <input disabled={!canEdit} ... />;

// Dynamic updates (e.g., role change)
const { updatePermissions } = usePermissionManager();
updatePermissions({ salary_field: "edit" }); // Was "view"
```

**Value:**
```typescript
interface PermissionManagerValue {
  getPermission: (fieldId: string) => "edit" | "view" | "hidden";
  updatePermissions: (updates: PermissionMap) => void;
  setPermissions: (permissions: PermissionMap) => void;
}
```

**Permission Map:**
```typescript
const permissions = {
  salary_field: "view",      // Read-only
  ssn_field: "hidden",       // Invisible
  delete_button: "hidden",   // Action hidden
  // Default: "edit"
};
```

---

### 7. DataSourceContext (Remote Options)

**Purpose:** Context wrapper over `RemoteOptionsManager` for field drivers.

**Provider:** `DataSourceProvider` (internal via FormRuntimeProvider)

**Hooks:**
```typescript
// Inside AutocompleteField, SelectField
const { search, getOptions, isLoading } = useDataSource(field.id);
search("query");           // Trigger search
const options = getOptions(); // Get cached
// isLoading() → boolean

// Programmatic refresh (dependent fields)
const { refresh } = useDataSourceManager();
refresh("city_field");     // After country changes
```

**Value:**
```typescript
interface DataSourceManagerValue {
  search: (fieldId: string, query: string) => void;
  refresh: (fieldId: string) => void;
  getOptions: (fieldId: string) => ReadonlyArray<{ label: string; value: unknown }>;
  isLoading: (fieldId: string) => boolean;
}
```

---

### 8. ActionContext (String-Based Actions)

**Purpose:** Execute external/form actions via string intents from schema.

**Provider:** `ActionProvider` (internal via FormRuntimeProvider)

**Hooks:**
```typescript
// Canonical names (use these)
const { execute } = useFormActionManager();
await execute("dispatch:SAVE_DRAFT", { data });

const { execute: executeAction } = useFormAction();
await executeAction("navigate:next", { stepId: "review" });

// Deprecated aliases (backward compat)
const { execute: executeLegacy } = useActionManager();
```

**Value:**
```typescript
interface FormActionManagerValue {
  execute: (actionId: string, payload?: any) => Promise<any>;
  register: (actionId: string, handler: (payload) => Promise<any>) => void;
  unregister: (actionId: string) => void;
}
```

**Schema Usage:**
```typescript
{
  type: "button",
  properties: {
    action: "dispatch:SAVE_DRAFT",  // String intent
    variant: "secondary",
  },
}
```

---

### 9. ServiceContext (Dependency Injection)

**Purpose:** Inject API services and external dependencies.

**Provider:** `ServiceProvider` (internal via FormRuntimeProvider)

**Hooks:**
```typescript
// Inside field driver or behavior middleware
const api = useService("userApi");
const users = await api.getUsers();

// Or full manager
const { get, set } = useServiceManager();
set("analytics", analyticsInstance);
```

**Value:**
```typescript
interface ServiceManagerValue {
  get: <T>(key: string) => T | undefined;
  set: <T>(key: string, service: T) => void;
  has: (key: string) => boolean;
}
```

**Registration:**
```tsx
<FormRuntimeProvider
  services={{
    userApi: userApiClient,
    analytics: analyticsClient,
  }}
>
  <Form definition={schema} />
</FormRuntimeProvider>
```

---

### 10. ExpressionContext (Dynamic Conditions)

**Purpose:** Evaluate dynamic expressions/conditions in UI.

**Provider:** `ExpressionProvider` (internal via FormRuntimeProvider)

**Hooks:**
```typescript
const { evaluate, evaluateBoolean } = useExpressionContext();

const visible = evaluateBoolean("user.role === 'admin' && form.values.showAdvanced");
const computed = evaluate("`Hello, ${form.values.firstName}!`");
```

**Value:**
```typescript
interface ExpressionContextValue {
  evaluate: (expression: string, context?: Record<string, any>) => any;
  evaluateBoolean: (expression: string, context?: Record<string, any>) => boolean;
  registerFunction: (name: string, fn: (...args: any[]) => any) => void;
}
```

**Context Available in Expressions:**
- `form.values` - current form data
- `form.validity` - validation state
- `form.visibility` - visibility state
- `user` - current user (from services)
- `env` - environment variables

---

### 11. BindingContext (Value Binding Abstraction)

**Purpose:** Abstract form value bindings for custom integrations.

**Provider:** `BindingProvider` (internal via FormRuntimeProvider)

**Hooks:**
```typescript
// Field-scoped binding
const { value, setValue, bind } = useFieldBinding(field.id);

// Manager
const { getBinding, createBinding } = useBindingManager();
```

**Value:**
```typescript
interface BindingManagerValue {
  getBinding: (fieldId: string) => Binding | undefined;
  createBinding: (fieldId: string, options: BindingOptions) => Binding;
}
```

---

## Migration: Old LayoutContext → New Contexts

### Before (Deprecated)
```tsx
import { useLayout } from "@/shared/ui/form/context/LayoutContext";

const { layoutMode, currentStepId, goNext, pageTitle } = useLayout();
```

### After (Separated Concerns)
```tsx
// Shell concerns
import { useSurface } from "@/shared/ui/form/context/SurfaceContext";
const { layoutMode, pageTitle, enrollHeader } = useSurface();

// Navigation concerns
import { useWizard } from "@/shared/ui/form/context/WizardContext";
const { currentStepId, goNext, goPrev } = useWizard();
```

**Backward Compatibility:**
```tsx
// Still works but deprecated
import { useLayout } from "@/shared/ui/form/context/LayoutContext";
// Returns merged view of SurfaceContext + WizardContext
```

---

## Usage in Form.tsx

The `Form` component sets up `FormRuntimeProvider` automatically:

```tsx
export const Form = ({ definition, onSubmit, ...props }) => {
  const form = useFormCore(definition); // Creates FormCore
  
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
      <FormComposer field={definition} />
      <FormFooter onSubmit={onSubmit} />
    </FormRuntimeProvider>
  );
};
```

---

## Custom Composition

For advanced use cases (e.g., FormRenderer without full Form shell):

```tsx
import { FormRuntimeProvider, useFormCore } from "@/shared/ui/form";

function CustomFormRenderer({ definition, children }) {
  const form = useFormCore(definition);
  
  return (
    <FormRuntimeProvider
      orchestrator={{
        theme: defaultTheme,
        registry: customRegistry,
        manifest: customManifest,
        getComponentProps: form.getComponentProps.bind(form),
        visibility: form.visibility,
        routing: form.routing,
        spacing: customSpacing,
      }}
      surface={{ layoutMode: "inline" }}
      remoteOptions={form.remoteOptions}
    >
      {children}
    </FormRuntimeProvider>
  );
}
```

---

## Testing Contexts

Each context can be tested in isolation:

```tsx
// Test PermissionContext
const { result } = renderHook(() => useFieldPermission("salary"), {
  wrapper: ({ children }) => (
    <PermissionProvider permissions={{ salary: "view" }}>
      {children}
    </PermissionProvider>
  ),
});
expect(result.current.canEdit).toBe(false);
expect(result.current.canView).toBe(true);
```

---

## Related Docs

- [Contract Authoring](./CONTRACT_AUTHORING.md) - Form definition
- [State & Engine](./STATE_AND_ENGINE.md) - FormCore internals
- [Rendering & Routing](./RENDERING_AND_ROUTING.md) - UI resolution pipeline
- [Getting Started](./GETTING_STARTED.md) - Full example with FormRuntimeProvider