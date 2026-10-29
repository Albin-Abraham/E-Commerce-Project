# Zenith Form Components Reference

Component inventory for the Zenith Form Architecture presentation layer. Every symbol below lives under `src/shared/ui/form/` and is listed with its source file, full props contract, key behavior, and a short usage example.

Import convention used throughout: symbols re-exported by the barrel are imported from `@ui/form`. Symbols the barrel does not re-export are imported from a subpath of the same alias (e.g. `@ui/form/shell/FormFooter`, `@ui/form/tools/FormDevTools`, `@ui/form/builder`).

| Section | Scope |
|---|---|
| 1 | Core form components — `Form`, `FormRenderer` |
| 2 | Rendering and display — `DetailRenderer`, `PrintDocumentRenderer` |
| 3 | Field controllers — `Field`, `ControlledField`, `UncontrolledField` |
| 4 | Navigation and guards — `FormNavigationGuard` |
| 5 | Feedback and state components, validation UX helpers |
| 6 | Shell composition — runtime tree, shell parts, shell factories |
| 7 | Routing — `FieldRouter`, `FormComposer` |
| 8 | Debug tooling (brief) |
| 9 | Visual builder (brief) |

---

## 1. Core form components

### `Form`

`Form` is the schema-driven entry point for edit forms. It instantiates the headless engine through `useFormCore`, decides between the simple and wizard render path from `definition.settings.wizard.enabled`, and mounts the provider tree plus the selected shell.

Sources: [Form.tsx](../../../src/shared/ui/form/Form.tsx), [FormProps.ts](../../../src/shared/ui/form/FormProps.ts), [useFormCore.ts](../../../src/shared/ui/form/hooks/useFormCore.ts)

Signature:

```ts
export function Form<T extends Record<string, any> = Record<string, any>>(
  props: FormProps<T>
): React.ReactElement;
```

#### `FormProps<T>` (all props)

| Prop | Type | Default | Description |
|---|---|---|---|
| `ref` | `React.Ref<FormHandle<T>>` | — | React 19 native ref exposing the imperative `FormHandle`. |
| `definition` | `FormDefinition<T>` | — | Required schema: sections, fields, `settings`, `shell`, wizard config. |
| `initialData` | `Partial<T>` | — | Initial and refresh data. Later changes synchronize per `initialDataSyncMode` (see behavior notes). |
| `validationSchema` | `any` | — | Zod or Yup schema handed to the engine as the active validation schema. |
| `onSubmit` | `(data: T) => Promise<Record<string, string> \| void> \| void` | — | Runs after validation passes with `getPayload()`. A returned object is applied as server errors. |
| `actions` | `Record<string, (payload?: any) => Promise<any>>` | — | Named actions published through `ActionProvider`. An `actions.submit` entry overrides `onSubmit`. |
| `shell` | `FormSurfaceShell` | — | Surface shell component receiving `{ header, body, footer }`; replaces the default header/body/footer sequence. |
| `className` | `string` | `""` | Root class name forwarded into the shell context. |
| `debug` | `boolean` | `false` | Mounts `FormDevTools` and `FormDebugOverlay`, and enables `FieldDebugWrapper` outlines. |
| `theme` | `FormTheme` | `DEFAULT_FORM_THEME` | Density, radius, motion, colors, spacing, and border-radius tokens merged over the default theme. |
| `adapter` | `StyleAdapter` | — | Style adapter (`TailwindAdapter`, `SassAdapter`) that builds field, section, and shell class names. |
| `mode` | `"edit" \| "view"` | `definition.settings.mode ?? "edit"` | Orchestrator mode. In `view`, primitives render formatted values instead of inputs. |
| `onChange` | `(values: Partial<T>, field?: FormField) => void \| Partial<T>` | — | Value-change subscription; a returned value overrides the engine update. |
| `onSelectChange` | `(values: Partial<T>, field?: FormField) => void \| Partial<T>` | — | Same contract, emitted for select and multiselect fields. |
| `registry` | `RegistryStore` | `defaultRegistry` | Component registry used to resolve field types to components. |
| `locale` | `string` | — | Locale applied through `setLocale` during mount. |
| `validationMode` | `"onChange" \| "onBlur" \| "onSubmit" \| "manual" \| "lazy"` | `definition.settings.showValidationOnTouch ? "onBlur" : "onBlur"` | Controls when validation runs. |
| `middleware` | `Array<(context: { form: any; fieldId?: string }) => void \| Promise<void>>` | — | Middleware registered through `useFormMiddleware`. |
| `i18nNamespace` | `string` | `"features/forms"` | Translation namespace for labels, messages, and guard copy. |
| `motionConfig` | `{ disabled?: boolean; reduced?: boolean }` | — | Global motion switch published in the registry context; `meta.ui.motion` overrides per field. |
| `navigationGuard` | `boolean \| NavigationGuardConfig` | `definition.settings.navigationGuard ?? false` | Unsaved-changes blocker (see section 4). |
| `permissions` | `Record<string, "edit" \| "view" \| "hidden">` | — | Field-level permission map consumed by `PermissionProvider` / `useFieldPermission`. |
| `secondaryActions` | `React.ReactNode` | — | Extra nodes rendered next to the footer actions. |
| `children` | `React.ReactNode` | — | Replaces the shell's own composition inside the `<form>` element. |

#### `FormHandle<T>` (ref API)

```ts
export interface FormHandle<T extends Record<string, any> = Record<string, any>> {
  submit: () => Promise<boolean>;
  reset: (
    data?: Partial<T>,
    options?: { keepTouched?: boolean | string[]; keepDirty?: boolean | string[]; keepValues?: string[] }
  ) => void;
  setValue: <K extends keyof T>(fieldId: K | string, value: T[K]) => void;
  getValue: <K extends keyof T>(fieldId: K | string) => T[K];
  setTouched: (fieldId: string) => void;
  setErrors: (errors: Record<string, string>) => void;
  validate: (fieldIds?: string[]) => Promise<boolean>;
  getValues: () => T;
  getPayload: () => Partial<T>;
  isValid: boolean;
  isDirty: boolean;
  isDegraded: boolean;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => Promise<boolean>;
  redo: () => Promise<boolean>;
  engine: IFormCore<T>;
}
```

#### Behavior notes

- Generic typing: `T` types `definition`, `initialData`, `onSubmit`, `getValues()`, `getValue()`, and `setValue()`. Defaults to `Record<string, any>`.
- Mode selection: `Form.tsx` reads `props.definition?.settings?.wizard?.enabled` and passes `runtimeMode: "wizard" | "simple"` to `useFormCore`; both modes share one render tree (`FormRuntimeTree`) and differ only in shell and `isWizard` surface flag.
- Provider order: `I18nextProvider` → `FormThemeProvider` → `FormRuntimeProvider` (orchestrator, surface, remote options, permissions, actions) → `FormNavigationGuard` → `FormShellProvider` → shell ([FormRuntimeTree.tsx](../../../src/shared/ui/form/components/FormRuntimeTree.tsx)).
- Engine lifecycle (`schemaSignature`): [useForm.tsx](../../../src/shared/ui/form/hooks/useForm.tsx) computes `buildSchemaStructuralSignature(migratedDefinition)` and memoizes the engine on that signature plus core options. Unstable `initialData` object references never re-instantiate the engine.
- Engine lifecycle (`initialDataSyncMode`): `InitialDataSyncMode = "preserve-dirty" | "force-reset" | "ignore"`, defaulting to `"preserve-dirty"` — pristine fields take the new server data while dirty field values and dirty flags are kept. `"force-reset"` resets everything; `"ignore"` reads `initialData` only on mount. `<Form>` itself does not expose this option; it is a `useForm` option, so `<Form>` always runs `"preserve-dirty"`.
- Submission: `executeSubmit()` validates first; when `actions.submit` is present it takes precedence over `onSubmit`. A returned `Record<string, string>` is pushed through `setServerErrors` and marks the submit as failed.
- Server field errors: `ref.setErrors()` maps directly to `setServerErrors`.

#### Example

```tsx
import { useRef } from "react";
import { Form, type FormHandle } from "@ui/form";
import type { FormDefinition } from "@ui/form";

interface EmployeeValues {
  firstName: string;
  lastName: string;
}

const definition: FormDefinition<EmployeeValues> = {
  id: "employee-form",
  title: "Employee",
  fields: [
    { id: "firstName", name: "firstName", type: "text", label: "First name" },
    { id: "lastName", name: "lastName", type: "text", label: "Last name" },
  ],
} as FormDefinition<EmployeeValues>;

export function EmployeeForm() {
  const ref = useRef<FormHandle<EmployeeValues>>(null);

  return (
    <Form<EmployeeValues>
      ref={ref}
      definition={definition}
      initialData={{ firstName: "Ada" }}
      validationMode="onBlur"
      navigationGuard
      permissions={{ lastName: "view" }}
      onSubmit={async (data) => {
        console.log(data);
      }}
    >
      {/* optional custom children; omit to render header/body/footer */}
    </Form>
  );
}
```

---

### `FormRenderer`

`FormRenderer` renders a `FormDefinition` or `RenderDefinition` as a pure layout tree: no `<form>` element, no footer, no header. It normalizes the schema, mounts a single runtime provider root, and reports per-field changes through `onChange(fieldId, value)`.

Source: [FormRenderer.tsx](../../../src/shared/ui/form/FormRenderer.tsx)

#### `FormRendererProps<T>`

| Prop | Type | Default | Description |
|---|---|---|---|
| `definition` | `FormDefinition<T> \| RenderDefinition<T>` | — | Schema normalized into render nodes by `SchemaNormalizer.normalize`. |
| `value` | `T` | — | Controlled value record supplied to the engine. |
| `onChange` | `(fieldId: string, value: any) => void` | — | Emitted per changed key with the field name (or id) and its new value. |
| `errors` | `Record<string, string>` | — | Declared in the props interface for API compatibility; not consumed by the renderer — errors come from the engine. |
| `slots` | `Record<string, any>` | — | Slot map published through the orchestrator context for `slot` fields. |
| `className` | `string` | `""` | Appended to the root class `form-renderer-root w-full flex flex-col gap-6`. |
| `adapter` | `StyleAdapter` | — | Style adapter passed to `FormThemeProvider`. |

Sibling exports from the same file: `RenderNode` (renders one `FormField` through `FormComposer`) and `RenderChild` (renders a `FormField[]` list). Both accept optional `getComponentProps` and `visibility` props, resolved from context when omitted.

#### Behavior notes

- Frozen fallback: `const EMPTY_DATA = Object.freeze({})` at [FormRenderer.tsx:51](../../../src/shared/ui/form/FormRenderer.tsx) supplies the value when `value` is omitted, so the engine's `initialData` memoization is never defeated by a fresh `{}` literal.
- Change emission: the renderer keeps a `previousValuesRef` baseline. When the engine reports a change, it emits `onChange(fieldKey, value)` for the changed field only; otherwise it diffs all keys and emits each differing key once.
- Theme: `activeTheme` merges `DEFAULT_FORM_THEME` with `settings.density` (default `comfortable`) and `radius: "large"`.
- Provider root: `FormThemeProvider` → `FormRuntimeProvider` (orchestrator + inline surface, `isWizard: false`) → `FormRegistryProvider` with `defaultRegistry`.
- Engine: `useForm(definition, effectiveValue, { onChange })` — the full engine, but rendered without shell chrome.

#### Example

```tsx
import { FormRenderer } from "@ui/form";

export function ProfileBlock({ value, onChange }: {
  value: Record<string, any>;
  onChange: (fieldId: string, value: any) => void;
}) {
  return (
    <FormRenderer
      definition={{
        id: "profile",
        fields: [
          { id: "email", name: "email", type: "text", label: "Email" },
          { id: "bio", name: "bio", type: "textarea", label: "Bio" },
        ],
      }}
      value={value}
      onChange={onChange}
    />
  );
}
```

---

## 2. Rendering and display

### `DetailRenderer`

`DetailRenderer` renders a definition as a formless detail view. In `display` mode with no conditional rules it mounts neither the engine nor a `<form>` element; `interactive` mode (or display schemas carrying conditions) mounts `DetailRuntimeBoundary`, which owns `useForm` and emits one change per user-modified field.

Sources: [DetailRenderer.tsx](../../../src/shared/ui/form/detail/DetailRenderer.tsx), [DetailRenderers.tsx](../../../src/shared/ui/form/detail/DetailRenderers.tsx). Full guide: [DETAIL_RENDERERS.md](../DETAIL_RENDERERS.md)

#### `DetailRendererProps<T>`

| Prop | Type | Default | Description |
|---|---|---|---|
| `definition` | `FormDefinition<T> \| RenderDefinition<T> \| DetailDefinition<T>` | — | Schema normalized into the field node tree. |
| `fields` | `FormField[]` | — | Direct field list; wins over `definition` when non-empty. |
| `data` | `T` | `EMPTY_DATA` | Entity record supplying display or interactive values. |
| `mode` | `"display" \| "interactive"` | `"display"` | `display` renders formatted key-value rows; `interactive` renders live primitives without `<form>` submission. |
| `layoutStyle` | `"cards" \| "key-value" \| "flat"` | `"cards"` | Card elevation grouping, compact two-column list, or bare list. |
| `density` | `"compact" \| "comfortable" \| "spacious"` | `"comfortable"` | Spacing token; `definition.settings.density` overrides it. |
| `slots` | `DetailRendererSlots<T>` | `{}` | Structural slots and field-level overrides (see 2.2). |
| `onChange` | `(fieldId: string, value: any) => void` | — | Change handler for interactive mode; emitted once per differing field. |
| `className` | `string` | `""` | Root class on the `<article data-detail-renderer>` element. |
| `adapter` | `StyleAdapter` | — | Style adapter for theme overrides. |

`DetailRendererSlots<T>`:

| Slot | Type | Purpose |
|---|---|---|
| `headerSlot` | `React.ReactNode \| React.ComponentType<{ data?: T }>` | Replaces the auto-generated header (built from `title`, `subtitle`, `description`, `badgeIcon`). |
| `mediaSlot` | `React.ReactNode \| React.ComponentType<{ data?: T }>` | Hero/media region between header and fields. |
| `actionSlot` | `React.ReactNode \| React.ComponentType<{ data?: T }>` | Bottom action bar, wrapped in `DetailRenderers.BottomActionSlot`. |
| `footerSlot` | `React.ReactNode \| React.ComponentType<{ data?: T }>` | Trailing footer region. |
| `[slotName: string]` | `any` | Field-level overrides addressed by field `name` or `id`. |

#### Behavior notes

- Engine gating: `needsEngine = mode === "interactive" || hasConditionalRules(nodes)`. Display definitions without conditions render through `DetailRendererView` alone.
- Emission baseline: `DetailRuntimeBoundary` re-anchors a value baseline whenever the engine identity changes (schema signature change or new `data` identity), so `onChange` never re-emits stale diffs.
- Stable fallback: `const EMPTY_DATA: Record<string, any> = {}` at [DetailRenderer.tsx:111](../../../src/shared/ui/form/detail/DetailRenderer.tsx) keeps uncontrolled usage from re-instantiating the engine on every render.
- Order: header slot → media slot → field content → action slot → footer slot inside a single `<article>`.
- Prop resolution in display mode: a data-backed projection `{ value, data, onChange }`; in interactive mode the engine's `getComponentProps`.

### 2.1 Compound subcomponents

Attached at [DetailRenderer.tsx:178-182](../../../src/shared/ui/form/detail/DetailRenderer.tsx); each also exists as a standalone export.

| Compound | Standalone | Props (full) | Source |
|---|---|---|---|
| `DetailRenderer.Header` | `DetailHeader` | `title: string`; `subtitle?: string`; `badgeIcon?: string \| React.ReactNode`; `status?: { label: string; variant?: "primary" \| "success" \| "warning" \| "danger" \| "default" }`; `tags?: string[]`; `className?: string`; `children?: React.ReactNode` | [DetailRenderers.tsx](../../../src/shared/ui/form/detail/DetailRenderers.tsx) |
| `DetailRenderer.KeyDetailsCard` | `DetailKeyDetailsCard` | `title?: string`; `subtitle?: string`; `action?: React.ReactNode`; `children: React.ReactNode`; `className?: string` | [DetailRenderers.tsx](../../../src/shared/ui/form/detail/DetailRenderers.tsx) |
| `DetailRenderer.BottomActions` | `DetailBottomActions` | `children: React.ReactNode`; `className?: string`; `sticky?: boolean` | [DetailRenderers.tsx](../../../src/shared/ui/form/detail/DetailRenderers.tsx) |
| `DetailRenderer.KeyValueRow` | `DetailKeyValueRow` | `label: React.ReactNode`; `value: React.ReactNode`; `description?: string`; `orientation?: "horizontal" \| "vertical"`; `className?: string` | [DetailRenderers.tsx](../../../src/shared/ui/form/detail/DetailRenderers.tsx) |
| `DetailRenderer.ValueDisplay` | `DetailValueDisplay` | `value: any`; `type?: string`; `options?: readonly any[]`; `format?: string`; `currency?: string`; `emptyPlaceholder?: string`; `className?: string` | [DetailRenderers.tsx](../../../src/shared/ui/form/detail/DetailRenderers.tsx) |

`DetailRenderers` (the object dictionary of the same renderers) is a deprecated alias; prefer the compound properties or standalone symbols.

### 2.2 Schema slot injection (`component: "slot"`)

In display mode, field content resolves slots in this order:

1. Slot fields (`type === "slot"` or `routing === "slot"`): `field.meta.ui.component` first, then `slots[field.name]`, then `slots[field.id]`.
2. All other fields: `slots[field.name]`, then `slots[field.id]`.
3. String candidates resolve through `defaultRegistry.get(...)` so a registry key can never be rendered as a native DOM element.
4. A resolved component receives `{ field, value, data, onChange }`.

Schema-authored usage:

```tsx
import { DetailRenderer } from "@ui/form";

const definition = {
  id: "order-detail",
  title: "Order 1042",
  fields: [
    { id: "status", name: "status", type: "text", label: "Status" },
    {
      id: "map",
      name: "map",
      type: "slot",
      meta: { ui: { component: "order-map" } },
    },
  ],
};

export function OrderDetail({ data, onStatusChange }: {
  data: Record<string, any>;
  onStatusChange: (fieldId: string, value: any) => void;
}) {
  return (
    <DetailRenderer
      definition={definition}
      data={data}
      mode="display"
      layoutStyle="cards"
      onChange={onStatusChange}
      slots={{ footerSlot: <div>Printed from ERP</div> }}
    />
  );
}
```

---

### `PrintDocumentRenderer`

`PrintDocumentRenderer` renders a printable HTML document from a `ContentDefinition` and form data, independent of interactive field components. It emits inline-styled markup sized to the configured paper.

Source: [PrintDocumentRenderer.tsx](../../../src/shared/ui/form/surfaces/PrintDocumentRenderer.tsx)

| Prop | Type | Default | Description |
|---|---|---|---|
| `content` | `ContentDefinition` | — | Document title, description, sections, and field metadata. |
| `data` | `Record<string, any>` | — | Values looked up by `field.name ?? field.id`; missing values render as `-`. |
| `printConfig` | `PrintSurface` | — | `paper` (`"A4"` default), `orientation` (`"portrait"` default), `header`, `footer`, `hideFields`. |

Behavior notes:

- `hideFields` is matched against `field.id` or `field.name`.
- Sections render as a two-column grid; a `ContentDefinition` without `sections` falls back to its root `fields` list.
- Container width: `210mm` portrait, `297mm` landscape, centered.

```tsx
import { PrintDocumentRenderer } from "@ui/form";

<PrintDocumentRenderer
  content={{ id: "payslip", title: "Payslip — March", sections: [] } as any}
  data={{ employee: "Ada Lovelace", netPay: "29,500" }}
  printConfig={{ paper: "A4", header: "Acme Corp", hideFields: ["internalNote"] } as any}
/>
```

---

## 3. Field controllers

All three controllers resolve a field definition from the active form context (or synthesize one from inline props) and delegate to the field rendering pipeline. They are re-exported from the barrel.

### `Field`

Unified controller: delegates to `ControlledField` when a `render` prop is present, otherwise to `UncontrolledField`.

Source: [WrapperFields.tsx](../../../src/shared/ui/form/fields/WrapperFields.tsx) (re-exported by [Field.tsx](../../../src/shared/ui/form/fields/Field.tsx))

| Prop | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | — | State binding key and payload key. Required. |
| `render` | `(fieldState) => React.ReactElement` | — | Present ⇒ controlled rendering (see `ControlledField`). |
| `type` | `string` | — | Semantic data type (`"textarea"`, `"string"`, …). |
| `component` | `string \| React.ComponentType<any>` | — | Presentation component override. |
| `label` | `any` | — | Field label. |
| `…rest` | `Record<string, any>` | — | Forwarded to the delegated controller. |

```tsx
import { Field } from "@ui/form";

<Field name="email" />
<Field name="bio" type="string" component="textarea" label="Bio" />
<Field
  name="role"
  render={({ value, onChange }) => (
    <RoleSelect value={value} onChange={onChange} />
  )}
/>
```

### `ControlledField`

Render-prop controller for third-party inputs. It binds the field to the engine through `useController(name)`, composes consumer callbacks with the controller callbacks, and wraps the result in `FieldShell`.

| Prop | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | — | State binding key. Required. |
| `render` | `(fieldState: ControlledFieldState) => React.ReactElement` | — | Receives the field state described below. Required. |
| `label` | `any` | — | Label forwarded to `FieldShell`. |
| `onChange` | `(val: any) => void` | — | Consumer callback invoked after `controller.onChange`. |
| `onBlur` | `(e?: any) => void` | — | Consumer callback invoked after `controller.onBlur`. |
| `onFocus` | `(e?: any) => void` | — | Consumer callback invoked after `controller.onFocus`. |
| `…rest` | `Record<string, any>` | — | Synthesized into the field definition and forwarded to `FieldShell`. |

`ControlledFieldState` passed to `render`:

```ts
{
  value: any;
  onChange: (val: any) => void;
  onBlur: () => void;
  onFocus: () => void;
  error: boolean;
  errorMessage?: string;
  vitality: any;
  field: any;
}
```

Notes: the field defaults to `type: "custom"` when the context has no definition for `name`; handlers are `useCallback`-stable, so the render output only re-renders on state changes.

### `UncontrolledField`

Schema-bound controller for registered fields. It resolves `form.resolveField(name)`, merges inline props through `synthesizeFormField`, and delegates to `FieldRenderer` (micro-subscriptions plus registry component resolution inside the shell).

| Prop | Type | Default | Description |
|---|---|---|---|
| `name` | `string` | — | State binding key. Required. |
| `type` | `string` | — | Data type used when no schema field exists. |
| `component` | `string \| React.ComponentType<any>` | — | Component override used when no schema field exists. |
| `label` | `any` | — | Label override. |
| `…rest` | `[key: string]: any` | — | Merged into the synthesized field definition and forwarded to `FieldRenderer`. |

Notes: memoized with `React.memo`; the definition is memoized on `existingField`, `name`, `type`, `component`, `label`, and props.

```tsx
import { UncontrolledField } from "@ui/form";

<UncontrolledField name="email" className="my-layout-class" />
<UncontrolledField name="notes" type="textarea" component="textarea" label="Notes" />
```

---

## 4. Navigation and guards

### `FormNavigationGuard`

Headless blocker for unsaved changes. It renders `null` and subscribes to router navigation; when a guarded navigation is attempted it opens a confirmation dialog and either proceeds or resets the blocker.

Source: [FormNavigationGuard.tsx](../../../src/shared/ui/form/components/FormNavigationGuard.tsx)

| Prop | Type | Default | Description |
|---|---|---|---|
| `guardConfig` | `boolean \| NavigationGuardConfig` | — | Enable flag or full copy/config object. `enabled` defaults to `true` when an object is given without `enabled`. |
| `formTitle` | `string \| TranslatedText` | — | Fallback domain name for the prompt copy. |
| `i18nNamespace` | `string` | `"features/forms"` | Namespace used by `resolveTranslation` for title, message, confirm, cancel, and toast strings. |
| `isDirty` | `boolean` | — | Unsaved-changes signal; blocking requires `true`. |
| `isSubmitting` | `boolean` | — | While `true`, navigation is not blocked. |

`NavigationGuardConfig` fields: `enabled`, `domainName`, `title`, `message`, `confirmLabel`, `confirm`, `cancelLabel`, `cancel`, `toastTitle`, `toastDescription`, `params` ([definition.ts](../../../src/core/form-core/domain/definition.ts)).

### 4.1 `navigationGuard` prop behavior

- Resolution: `useFormCore` computes `navigationGuard ?? definition.settings.navigationGuard ?? false`; the runtime passes it to `guardConfig` inside `FormRuntimeTree`.
- Blocking predicate: `enabled && isDirty && !isSubmitting`, and only when `currentLocation.pathname !== nextLocation.pathname`.
- Mount guard: the component returns `null` unless `useInRouterContext()` and `UNSAFE_DataRouterContext` are both present, or the guard is disabled — a data router (`useBlocker`) is required.
- Prompt priority: `useOptionalAlertDialog().confirm(...)` → `window.confirm(...)` → proceed without prompting (no dialog available).
- On confirm: a toast with `toastTitle` / `toastDescription` is shown, then `blocker.proceed()`; on cancel, `blocker.reset()`.
- Copy interpolation: `domain_name` and `form_name` are resolved from `cfg.domainName` or `formTitle`, merged with `cfg.params`.

```tsx
import { Form, type FormHandle } from "@ui/form";
import { useRef } from "react";

export function GuardedForm() {
  const ref = useRef<FormHandle>(null);

  return (
    <Form
      ref={ref}
      definition={{ id: "settings", title: "Settings", fields: [] } as any}
      navigationGuard={{
        enabled: true,
        domainName: "Settings",
        confirmLabel: "Leave",
        cancelLabel: "Stay",
      }}
    />
  );
}
```

Standalone usage:

```tsx
import { FormNavigationGuard } from "@ui/form";

<FormNavigationGuard guardConfig isDirty={isDirty} isSubmitting={isSubmitting} formTitle="Settings" />
```

---

## 5. Feedback and state components

### `FormSkeleton`

Pulse placeholder for a whole form (title bar, description, field rows, action buttons) with `role="status"` and an accessible label.

Source: [FormSkeleton.tsx](../../../src/shared/ui/form/components/FormSkeleton.tsx)

| Prop | Type | Default | Description |
|---|---|---|---|
| `fieldCount` | `number` | `4` | Number of label/control placeholder rows. |
| `columns` | `number` | `2` | Row width alternates (`w-3-5` / `w-2-5`) every `columns` rows. |

### `FormErrorState`

Centered error panel with `role="alert"` and an optional retry action.

| Prop | Type | Default | Description |
|---|---|---|---|
| `message` | `string` | `"Something went wrong loading this form."` | Error copy. |
| `onRetry` | `() => void` | — | When provided, renders a Retry button. |

### `FormEmptyState`

Centered empty panel with `role="status"`.

| Prop | Type | Default | Description |
|---|---|---|---|
| `message` | `string` | `"No form data available."` | Empty copy. |

### `FieldSkeleton`

Type-aware placeholder used as the `Suspense` fallback inside `FieldRenderer`, or explicitly for fine-grained loading states. Unknown types fall back to a generic input placeholder, so it never renders blank.

Source: [FieldSkeleton.tsx](../../../src/shared/ui/form/components/FieldSkeleton.tsx)

| Prop | Type | Default | Description |
|---|---|---|---|
| `type` | `string` | — | Schema type (`text`, `select`, `card`, `accordion`, `repeater`, `divider`, …) selecting the placeholder shape. |
| `component` | `string` | — | Component override refining the shape (`textarea`, `switch`, `date`, `range`, …). |
| `rows` | `number` | `3` | Child placeholder count for containers and cards. |
| `className` | `string` | — | Root class on the `role="status"` wrapper. |
| `"data-skeleton"` | `string` | — | Extra data attribute forwarded to the root. |

Also exported from the file: `FieldRowSkeleton` (`labelWidth`, `controlClassName`).

### `CardSkeleton`

Structure-level skeleton mirroring `CardField` chrome (optional header, `rows` body placeholders, optional footer action bar).

| Prop | Type | Default | Description |
|---|---|---|---|
| `header` | `boolean` | `true` | Renders the title/description bar. |
| `footer` | `boolean` | `false` | Renders the action bar. |
| `rows` | `number` | `3` | Body placeholder rows. |
| `className` | `string` | — | Root class. |
| `type`, `component`, `"data-skeleton"` | `string` | — | Inherited from `FieldSkeletonProps` and forwarded as data attributes. |

Note: `@ui/common` exports a separate `CardSkeleton`; the form subsystem variant is the one listed here.

### `FormValidationSummary`

Alert banner shown above the body when the form is invalid and has been touched. `FormShell` renders it automatically before fields and children.

Source: [FormValidationSummary.tsx](../../../src/shared/ui/form/components/FormValidationSummary.tsx)

| Prop | Type | Default | Description |
|---|---|---|---|
| `valid` | `boolean` | — | When `true`, nothing renders. |
| `touched` | `boolean` | — | When `false`, nothing renders. |

Renders `role="alert"` with `aria-live="polite"` and translated `validation.summary_title` / `validation.summary_description` copy.

### 5.1 Validation UX helpers

Brief references; contracts live in [05-ADAPTERS_UTILS.md](05-ADAPTERS_UTILS.md) and [06-HOOKS.md](06-HOOKS.md).

| Helper | Kind | Behavior |
|---|---|---|
| `useValidationJump` | hook (exported from the barrel) | Finds the first invalid field, walks the parent chain, expands ancestor accordions via `layoutManager.accordion.setOpen`, activates the owning tab via `layoutManager.tabs.setActiveTab`, then scrolls and focuses the control. Invoked by `FormShell` when submit validation fails. |
| `focusFirstInvalidField` | function ([accessibility-runtime.ts](../../../src/shared/ui/form/utils/accessibility-runtime.ts)) | Queries `[data-field-id][aria-invalid="true"]`, scrolls it into view, and focuses the inner control. |
| `enhanceFieldProps` | function (re-export from `@form-core/utils/accessibility`) | Adds the field role and ARIA attributes (`buildAriaAttributes`, `auditField`, `FIELD_ROLES`) to raw props. |
| `createAnnouncement` | function | Creates/updates the `#form-announcer` live region with `polite` or `assertive` priority. |

```tsx
import { FormValidationSummary, focusFirstInvalidField } from "@ui/form";

<FormValidationSummary valid={isValid} touched={wasTouched} />
<button type="button" onClick={() => focusFirstInvalidField()}>Jump to error</button>
```

---

## 6. Shell composition

### `FormRuntimeTree`

Shared render tree for both form components. `Form` passes `Shell = FormShell` with `isWizard = false`; a wizard flow passes its own shell with `isWizard = true`. Everything else — providers, navigation guard, orchestration — is identical.

Source: [FormRuntimeTree.tsx](../../../src/shared/ui/form/components/FormRuntimeTree.tsx)

| Prop | Type | Default | Description |
|---|---|---|---|
| `runtime` | `FormRuntime<T>` | — | Result of `useFormCore`; supplies orchestrator, surface, permissions, actions, guard config, and shell context. |
| `Shell` | `React.ComponentType<FormShellComponentProps>` | — | Shell to render (`children`, `onStepChange`). |
| `isWizard` | `boolean` | — | Surface flag published through `FormRuntimeProvider`. |
| `children` | `React.ReactNode` | — | Passed through to the shell. |

Behavior: merges `runtime.actions` with a synthetic `submit` action when `onSubmit` is present and no `actions.submit` exists; wraps everything in `I18nextProvider` → `FormThemeProvider` → `FormRuntimeProvider` → `FormNavigationGuard` + `FormShellProvider`.

```tsx
import { useFormCore } from "@ui/form";
import { FormRuntimeTree } from "@ui/form/components/FormRuntimeTree";
import { FormShell } from "@ui/form";

const runtime = useFormCore({ ...props, runtimeMode: "simple" });

<FormRuntimeTree runtime={runtime} Shell={FormShell} isWizard={false} />
```

### `FormShell`

Unified shell dispatcher: resolves the shell node tree (`definition.shell`, or a factory-generated wizard/split tree), renders `FormValidationSummary`, `FormHeader`, `FormBody`, `FormFooter`, `FormStepper`, and the field content, and owns the native `<form>` element with delegated `onChange` / `onBlur`.

Sources: [FormShell.tsx](../../../src/shared/ui/form/components/FormShell.tsx), barrel export from `@ui/form`

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `React.ReactNode` | — | Replaces the standard header/body/footer composition (still wrapped by `FormValidationSummary` inside `<form>`). |
| `onStepChange` | `(stepId: string, stepIndex: number) => void` | — | Fires whenever `currentStepId` changes in wizard mode. |

Behavior notes: wizard-ness is read from `definition.settings.wizard.enabled`; submit runs `onExecuteSubmit()` and calls `handleValidationJump()` when validation fails; `debug` mounts `FormDevTools` and `FormDebugOverlay`; `settings.hideFooter`, `settings.stickyHeader`, `settings.stickyFooter`, `settings.maxHeight`, and `settings.density` adjust chrome and spacing.

### 6.1 Shell parts

| Component | Props | Notes | Source |
|---|---|---|---|
| `FormHeader` | `definition: FormDefinition`; `sticky?: boolean`; `className?: string`; `slots?: Record<string, string>`; `children?: React.ReactNode`; `prefix?: React.ReactNode`; plus `HTMLAttributes<HTMLDivElement>` minus `children`/`className` | Renders title/description/icons from the definition and enrolls them in the page layout context. | [FormHeader.tsx](../../../src/shared/ui/form/shell/FormHeader.tsx) |
| `FormBody` | `definition: FormDefinition`; `children: React.ReactNode`; `className?: string`; `useInternalScroll?: boolean`; `slots?: Record<string, string>`; plus `HTMLAttributes<HTMLDivElement>` minus `children`/`className` | Body region; `useInternalScroll` applies `settings.maxHeight` scrolling. | [FormBody.tsx](../../../src/shared/ui/form/shell/FormBody.tsx) |
| `FormFooter` | `definition: FormDefinition`; `form: any`; `sticky?: boolean`; `isSubmitting?: boolean`; `actionClasses?: string`; `submitBtnClass?: string`; `cancelBtnClass?: string`; `className?: string`; `secondaryActions?: React.ReactNode`; `slots?: Record<string, string>`; `onExecuteSubmit?: () => Promise<boolean>`; plus `HTMLAttributes<HTMLDivElement>` minus `className` | Submit/cancel/next-step actions; wizard-aware (`Next` / `Submit` on the last step), mode-aware (`view` hides actions), and action-manager driven. | [FormFooter.tsx](../../../src/shared/ui/form/shell/FormFooter.tsx) |
| `FormStepper` | `definition: FormDefinition`; `type?: "sidebar" \| "top" \| "none"`; `visibility?: Record<string, boolean>`; `className?: string`; `linear?: boolean`; plus `HTMLAttributes<HTMLElement>` minus `className`/`type` | Wizard navigation chassis; returns `null` outside wizard mode or when `type` is `"none"`. Filters steps by visibility. | [FormStepper.tsx](../../../src/shared/ui/form/shell/FormStepper.tsx) |
| `FormContentRenderer` | `content?: ContentNode` | Renders non-field content nodes (image and other content types) from the shell tree; `null` without `content`. | [FormContentRenderer.tsx](../../../src/shared/ui/form/shell/FormContentRenderer.tsx) |
| `ModalShell` | `FormSurfaceShellProps` — `header?: ReactNode`; `body: ReactNode`; `footer?: ReactNode` | Modal surface implementation of `FormSurfaceShell`, rendered when `FormProps.shell` is set. | [ModalShell.tsx](../../../src/shared/ui/form/shell/ModalShell.tsx) |

`FormSurfaceShell` and `FormSurfaceShellProps` are defined in [surface-shell.ts](../../../src/shared/ui/form/shell/surface-shell.ts) and re-exported from the barrel:

```ts
export interface FormSurfaceShellProps {
  header?: ReactNode;
  body: ReactNode;
  footer?: ReactNode;
}
export type FormSurfaceShell = ComponentType<FormSurfaceShellProps>;
```

### 6.2 Shell factories

| Factory | Signature | Behavior |
|---|---|---|
| `generateDefaultWizardShell` | `(definition: FormDefinition) => ShellNode[]` | Builds a 12-column grid shell: sidebar stepper (`colSpan { base: 12, lg: 3 }`) plus form content (`{ base: 12, lg: 9 }`), or a top stepper when `settings.wizard.stepperType` is not `"sidebar"`. Source: [wizard-shell-factory.ts](../../../src/shared/ui/form/shell/wizard-shell-factory.ts) |
| `generateDefaultSplitShell` | `(definition: FormDefinition) => ShellNode[]` | Reads the `split` container config (`splitRatio`, `topContent`, `leftContent`, `rightContent`) and maps `40/60`, `50/50`, `30/70` to grid spans; returns `[]` when no split container exists. Source: [split-shell-factory.ts](../../../src/shared/ui/form/shell/split-shell-factory.ts) |

`FormShell` picks the tree in this order: `definition.shell` if non-empty → wizard factory when `settings.wizard.enabled` → split factory when `definition.layout === "split"` or a `split` container exists → otherwise renders `StepRenderer` directly.

```tsx
import { ModalShell } from "@ui/form";

<Form shell={ModalShell} definition={definition} onSubmit={handleSubmit} />
```

---

## 7. Routing

### `FieldRouter`

Routes one normalized field to the correct renderer using manifest metadata — no hardcoded type sets.

Source: [FieldRouter.tsx](../../../src/shared/ui/form/FieldRouter.tsx)

| Prop | Type | Default | Description |
|---|---|---|---|
| `field` | `FormField` | — | Field definition to render. Required. |
| `getComponentProps` | `(fieldId: string) => any` | — | Deprecated; resolved from `usePrimitiveRuntime()` when omitted. |
| `visibility` | `Record<string, boolean>` | — | Deprecated; resolved from context when omitted. |
| `spacing` | `SpacingConfig` | — | Spacing configuration passed to child renderers. |
| `parentLayout` | `RuntimeLayoutConfig` | — | Parent layout config used for responsive column sizing and wrapper classes. |

Decision flow:

1. `manifestRegistry.getField(field.type)` → `category`, `routing` (default `"leaf"`).
2. Hidden fields (`visibility[field.id] === false`) render `null`.
3. `routing === "slot"` or `type === "slot"` → slot component from `field.meta.ui.component`, then orchestrator `slots[name]` / `slots[id]`, receiving `{ field, value, data, onChange, ...componentProps }`.
4. `category === "container" | "composite"` (or `field.isExpandedComposite`) → `renderStructure(...)` (`SectionComposer`).
5. `routing === "repeater"` → `RepeaterField`.
6. Otherwise → `FieldRenderer` with `getComponentProps(field.id)`.
7. Wrapper: `data-testid={`field-router-${field.id}`}` plus `data-field-id`, `data-field-name`, `data-field-type`; framer-motion enter/exit animation when motion is enabled and the field is not a repeater; `FieldDebugWrapper` when `debug` is on.

```tsx
import { FieldRouter } from "@ui/form/FieldRouter";

<FieldRouter field={node} spacing={spacing} parentLayout={{ type: "grid", columns: 12 }} />
```

### `FormComposer`

Composition layer that measures fields (`FormMetricsAnalyzer`, `SpacingCalculator`), provides spacing/orchestrator context, and wires `FieldRouter` ↔ `SectionComposer` through `FormRoutingContext`.

Source: [FormComposer.tsx](../../../src/shared/ui/form/FormComposer.tsx) (barrel export from `@ui/form`)

| Prop | Type | Default | Description |
|---|---|---|---|
| `fields` | `FormField[]` | — | Nodes to render. Required. |
| `getComponentProps` | `(fieldId: string) => any` | — | Deprecated; context values take precedence. |
| `parentLayout` | `RuntimeLayoutConfig` | — | Layout config forwarded to children. |
| `visibility` | `Record<string, boolean>` | — | Deprecated; context values take precedence. |
| `fillVertical` | `boolean` | `false` | Fills the parent pane height, spreading fields evenly. |

```tsx
import { FormComposer } from "@ui/form";

<FormComposer fields={nodes} fillVertical />
```

---

## 8. Debug tooling (brief)

Detailed inspection workflows live in [TOOLING.md](../TOOLING.md).

| Component | Props | Behavior | Source |
|---|---|---|---|
| `FormDevTools` | `form: FormCore<any>`; `open?: boolean` (default `false`) | Dockable inspector subscribing to engine state: values, validity, visibility, view, vitality tabs, search, expand/collapse, copy, and style debugging. Toggles through the `PlatformCommand.ToggleFormDevTools` command bus with focus memory. Mounted by `FormShell` when `debug` is `true`. | [FormDevTools.tsx](../../../src/shared/ui/form/tools/FormDevTools.tsx) |
| `FormStyleDebugger` | `field: FormField` | Prints the class trace produced by `buildHeroUIClasses(field, false, false, theme, true)` with per-source attribution from `trace.metadata.sources`. | [FormStyleDebugger.tsx](../../../src/shared/ui/form/tools/FormStyleDebugger.tsx) |
| `FormDebugOverlay` | `enabled: boolean` | Fixed 12-column grid overlay plus a "Debug Mode: Active" label; renders nothing when disabled. | [FormDebugOverlay.tsx](../../../src/shared/ui/form/tools/FormDebugOverlay.tsx) |
| `FieldDebugWrapper` | `children: React.ReactNode`; `id: string`; `type: string`; `enabled?: boolean` | Dashed outline with a hover label `id \| type` around one field; transparent passthrough when disabled. Used by `FieldRouter`. | [FormDebugOverlay.tsx](../../../src/shared/ui/form/tools/FormDebugOverlay.tsx) |

```tsx
import { useForm } from "@ui/form";
import { FormDevTools } from "@ui/form/tools/FormDevTools";
import { FormDebugOverlay } from "@ui/form/tools/FormDebugOverlay";

const { form } = useForm(definition, values);

<FormDevTools form={form.engine as any} open />
<FormDebugOverlay enabled />
```

---

## 9. Visual builder (brief)

Builder symbols are not re-exported by the `@ui/form` barrel; they are imported from `@ui/form/builder`.

| Symbol | Kind | Contract | Source |
|---|---|---|---|
| `FormBuilder` | React component (`() => ReactElement`) | Full drag-and-drop builder UI: toolbar (preview/JSON view modes, board/canvas modes), `ComponentPanel` palette, `FormCanvas`/`Board`, `PropertiesModal`, and live `FormComposer` preview. State comes from `useBoardAsViewModel`. Rendered by `FormBuilderPage`. | [FormBuilder.tsx](../../../src/shared/ui/form/builder/FormBuilder.tsx) |
| `FormSchemaBuilder` | class (declared as `class FormBuilder<TFormData>`) | Fluent builder pattern for `FormDefinition`: `setDescription`, `setSubmitLabel`, `addSection`, `addField`, `enableWizardMode`, plus the remaining chainable mutators. Exported under the `FormSchemaBuilder` alias from the builder index. | [FormSchemaBuilder.ts](../../../src/shared/ui/form/builder/FormSchemaBuilder.ts) |
| `useBuilderStore` | zustand store (`immer` middleware) | Editor state: `formDefinition`, `selection`, `isModalOpen`, `history` (max 50) with `undo`/`redo`, section actions (`addSection`, `updateSection`, `removeSection`, `moveSection`), field actions (`addField`, `addSectionWithField`, `updateField`, `removeField`, `moveField`, `moveFieldToSection`), validation-rule and condition-group actions, and `updateForm`. | [builder.store.ts](../../../src/shared/ui/form/builder/store/builder.store.ts) |

```tsx
import { FormBuilder, useBuilderStore, FormSchemaBuilder } from "@ui/form/builder";

const definition = new FormSchemaBuilder("invoice", "Invoice")
  .addSection({ id: "main", title: "Main" } as any)
  .addField({ id: "total", type: "number" } as any)
  .build();

<FormBuilder />
```

Builder index: [index.ts](../../../src/shared/ui/form/builder/index.ts).

---

**See also:**

- [01-ENGINE.md](01-ENGINE.md) — headless engine, `FormCore`, 5V state matrix, and `IFormCore`
- [02-REGISTRIES.md](02-REGISTRIES.md) — schema, manifest, validation, and condition registries
- [03-MODULES.md](03-MODULES.md) — engine modules (resolution, visibility, validation, execution)
- [04-DOMAIN_TYPES.md](04-DOMAIN_TYPES.md) — `FormDefinition`, `FormField`, and canonical domain types
- [05-ADAPTERS_UTILS.md](05-ADAPTERS_UTILS.md) — accessibility, style, and layout utilities used by components
- [06-HOOKS.md](06-HOOKS.md) — hooks bound to the engine (`useForm`, `useValidationJump`, `useController`)
- [07-COMPONENTS.md](07-COMPONENTS.md) — this file
- [08-FIELD_CATALOG.md](08-FIELD_CATALOG.md) — field components, wrapped fields, shell, registries, routing
- [09-PROVIDERS.md](09-PROVIDERS.md) — runtime, registry, permission, and action providers
- [10-SHARED_UTILS.md](10-SHARED_UTILS.md) — shared helpers across the form subsystem
- [11-TYPES_CONTRACTS.md](11-TYPES_CONTRACTS.md) — shared types and cross-module contracts
