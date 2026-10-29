# Zenith Form Shared Utilities Reference

**Path:** `frontend/src/shared/ui/form/utils/`

This file documents the exported utility surface of the Zenith Form Architecture: draft persistence, accessibility runtime, focus management, SSR compatibility, MDAP schema fusion/factories, and field option resolution. Signatures are copied verbatim from the source files named under each symbol.

---

## 1. Draft persistence

LocalStorage draft helpers exported from the `@ui/form` barrel. They are independent of the engine's own persistence module (see the pairing note at the end of this section).

### 1.1 Types

#### `FormDraft`

```ts
export interface FormDraft<T = Record<string, any>> {
  values: T;
  timestamp: number;
  definitionId: string;
}
```

A saved form draft: the persisted values, the save timestamp, and the definition id the draft belongs to.

#### `PersistenceConfig`

```ts
export interface PersistenceConfig {
  storage?: Storage;
  debounceMs?: number;
  maxAgeMs?: number;
  excludeFields?: string[];
}
```

Draft helper configuration. Defaults: `localStorage`, `debounceMs: 500`, `maxAgeMs: 24h`, `excludeFields: ["password", "confirmPassword", "currentPassword"]`.

[Source: form-persistence.ts](../../../src/shared/ui/form/utils/form-persistence.ts)

Storage keys used by the helpers:

| Key | Value |
|---|---|
| `form_draft:{formId}` | JSON `{ values, timestamp, definitionId }` |
| `form_draft_meta:{formId}` | JSON `{ savedAt, fieldCount }` |

### 1.2 Functions

#### `createPersistenceMiddleware`

```ts
export function createPersistenceMiddleware(
  formId: string,
  config?: PersistenceConfig
)
```

Returns a middleware `({ form }: { form: any }) => void` that debounces a write of `form.values` (minus `excludeFields`) into `form_draft:{formId}` and refreshes the meta key. Returns a no-op function with a console warning when storage is unavailable.

```tsx
import { createPersistenceMiddleware } from "@ui/form";

<Form definition={def} middleware={[createPersistenceMiddleware("checkout-form")]} />
```

#### `recoverDraft`

```ts
export function recoverDraft<T = Record<string, any>>(
  formId: string,
  config?: PersistenceConfig
): FormDraft<T> | null
```

Reads and parses a saved draft, returning `null` when nothing is stored, storage is unavailable, or the draft is older than `maxAgeMs` (an expired draft is cleared as a side effect). Call it before initializing the form to seed initial values.

#### `clearDraft`

```ts
export function clearDraft(formId: string, config?: PersistenceConfig)
```

Removes both the draft and the draft meta keys for `formId`. Failures are swallowed.

#### `getDraftMeta`

```ts
export function getDraftMeta(
  formId: string,
  config?: PersistenceConfig
): { savedAt: number; fieldCount: number } | null
```

Returns draft metadata without loading the full value payload, or `null` when absent or unreadable.

```tsx
import { recoverDraft, getDraftMeta, clearDraft } from "@ui/form";

const draft = recoverDraft("checkout-form");
const meta = getDraftMeta("checkout-form");
clearDraft("checkout-form");
```

### 1.3 Pairing with the engine

`useForm` accepts a `persistence?: PersistenceConfig` option, but its type is the engine's `PersistenceConfig` imported from `@form-core/engine` (`modules/persistence-manager`), not the helper type in this file. The engine variant is keyed differently — `{ key, storage?: "session" | "local" | "memory" | StorageAdapter, debounceMs?, includeFields?, excludeFields?, version?, autoRestore?, clearOnSubmit?, onSave?, onRestore?, ... }` — and drives `FormPersistenceManager`.

| Concern | Helper API (this file) | Engine API |
|---|---|---|
| Type | `PersistenceConfig` (`storage`, `debounceMs`, `maxAgeMs`, `excludeFields`) | `PersistenceConfig` (`key`, `storage`, `autoRestore`, `clearOnSubmit`, ...) |
| Attach via | `middleware={[createPersistenceMiddleware(formId)]}` | `useForm(definition, data, { persistence })` |
| Read/clear | `recoverDraft`, `clearDraft`, `getDraftMeta` | `form.saveDraft()`, `form.restoreDraft()`, `form.clearDraft()` |
| Scope | `form_draft:{formId}` in `localStorage` | storage chosen by `key` / `storage` strategy |

See [01-ENGINE.md](01-ENGINE.md) for the engine draft methods (`saveDraft`, `restoreDraft`, `clearDraft`) and the `FormPersistenceManager` lifecycle.

---

## 2. Accessibility runtime

Barrel exports for runtime accessibility enforcement.

#### `enhanceFieldProps`

```ts
export function enhanceFieldProps(
  field: FormField,
  baseProps: Record<string, any>,
  config?: {
    error?: string | boolean;
    errorMessage?: string;
  }
): Record<string, any>
```

Audits the field in development, then merges schema-declared ARIA attributes (`field.meta.accessibility`), runtime ARIA built from the current error state, and the field description over `baseProps`. Re-exported from `@form-core/utils/accessibility` by `accessibility-runtime.ts`.

[Source: accessibility-runtime.ts](../../../src/shared/ui/form/utils/accessibility-runtime.ts)

```tsx
import { enhanceFieldProps } from "@ui/form";

const a11yProps = enhanceFieldProps(field, inputProps, { error: fieldError });
```

#### `createAnnouncement`

```ts
export function createAnnouncement(
  message: string,
  priority: "polite" | "assertive" = "polite"
)
```

Creates (or reuses) a `#form-announcer` live region with `aria-atomic="true"`, clears it, then writes the message on the next animation frame so repeated identical text is re-announced. No-ops on the server.

#### `focusFirstInvalidField`

```ts
export function focusFirstInvalidField()
```

Queries the first `[data-field-id][aria-invalid="true"]`, scrolls it into the viewport, and focuses its inner `input`/`select`/`textarea`/`[tabindex="0"]`/`[role="textbox"]` with `preventScroll`.

```tsx
import { createAnnouncement, focusFirstInvalidField } from "@ui/form";

createAnnouncement("3 fields need attention", "assertive");
focusFirstInvalidField();
```

The same module also re-exports `FIELD_ROLES`, `buildAriaAttributes(field, error?, errorMessage?)`, and `auditField(field)` from `@form-core/utils/accessibility`; only `enhanceFieldProps`, `createAnnouncement`, and `focusFirstInvalidField` are on the `@ui/form` barrel.

---

## 3. Focus management

Keyboard focus utilities for modals, drawers, and wizard steps.

#### `FocusTrap`

```ts
export interface FocusTrap {
  activate: () => void;
  deactivate: () => void;
  isActive: () => boolean;
}
```

Control surface returned by `createFocusTrap`.

[Source: focus-trap.ts](../../../src/shared/ui/form/utils/focus-trap.ts)

#### `createFocusTrap`

```ts
export function createFocusTrap(
  container: () => HTMLElement | null
): FocusTrap
```

Attaches a document-level `keydown` listener that cycles Tab/Shift+Tab between the first and last focusable element of the container. `activate()` also moves initial focus into the container when focus is outside it; `deactivate()` removes the listener.

#### `getFocusableElements`

```ts
export function getFocusableElements(container: HTMLElement): HTMLElement[]
```

Returns visible focusable descendants (`a[href]`, enabled form controls, non-negative `tabindex`, `[contenteditable="true"]`), filtering out elements with a null `offsetParent`.

#### `focusFirstFocusable`

```ts
export function focusFirstFocusable(container: HTMLElement): boolean
```

Focuses the first focusable element in the container; returns `true` when an element received focus.

#### `getTabOrder`

```ts
export function getTabOrder(
  container: HTMLElement
): Array<{ element: HTMLElement; tabIndex: number; label: string }>
```

Debug helper listing focusable elements with their resolved tab index and accessible label. Exported from the file but not from the `@ui/form` barrel.

```tsx
import { createFocusTrap, focusFirstFocusable } from "@ui/form";

const trap = createFocusTrap(() => dialogRef.current);
trap.activate();
focusFirstFocusable(dialogRef.current!);
```

---

## 4. SSR compatibility

Guards for browser-only APIs (motion, `localStorage`, browser-only field types).

#### `isSSR`

```ts
export function isSSR(): boolean
```

Returns `true` when `window` is undefined.

#### `isClient`

```ts
export function isClient(): boolean
```

Returns `true` when `window` is defined.

#### `isMotionSupported`

```ts
export function isMotionSupported(): boolean
```

Returns `false` on the server and otherwise checks for `IntersectionObserver` and `requestAnimationFrame`.

[Source: ssr-compat.tsx](../../../src/shared/ui/form/utils/ssr-compat.tsx)

#### `SSRSafe`

```tsx
export function SSRSafe({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
})
```

Renders `fallback` until the component mounts on the client, then renders `children`. Use around components that touch browser APIs during render.

#### `createMotionWrapper`

```ts
export function createMotionWrapper<
  T extends keyof React.JSX.IntrinsicElements,
>(_tag: T)
```

Returns a forward-ref component for `tag` that renders a plain element on the server or when motion is unsupported, and otherwise lazily imports `framer-motion`'s `m[tag]` behind `React.Suspense`. Motion-specific props are stripped from the plain-element path. `displayName` is set to `MotionWrapper(tag)`.

#### `BROWSER_ONLY_FIELD_TYPES`

```ts
export const BROWSER_ONLY_FIELD_TYPES = [
  "signature",
  "file",
  "qr-code",
  "rich-text",
  "rating",
  "autocomplete",
];
```

Field types that require browser APIs and must be SSR-guarded or dynamically imported.

```tsx
import { SSRSafe, isClient, BROWSER_ONLY_FIELD_TYPES } from "@ui/form";

<SSRSafe fallback={<div className="h-10 bg-muted rounded" />}>
  <SignatureField />
</SSRSafe>;
```

---

## 5. Schema fusion & factories (MDAP)

Data-centric styling: fuse a logical skeleton with a UI overlay, then register the result.

#### `UIConfiguration`

```ts
export type UIConfiguration = FormUIConfig;
```

Deprecated alias of `FormUIConfig`, kept so existing `fuseSchema` call sites type-check.

[Source: schema-fusion.ts](../../../src/shared/ui/form/utils/schema-fusion.ts)

#### `normalizeUIConfig`

```ts
export function normalizeUIConfig(uiConfig: FormUIConfig): FormUIConfig
```

Rewrites legacy overlays (`fieldConfig` entries, CSS `gridColumn: "span 6"` tokens) into the canonical `{ fields, sections, layout, settings }` contract, converting column spans onto the canonical 12-column grid and merging legacy + canonical field maps.

#### `fuseSchema`

```ts
export function fuseSchema<T extends Record<string, any> = Record<string, any>>(
  skeleton: FormDefinition<T>,
  uiConfig: UIConfiguration
): FormDefinition<T>
```

Merges the UI overlay into the skeleton: section layout/meta, field `layout`/`properties`/`meta` (recursively for nested fields), plus top-level `layout`, `containers`, `shell`, `settings`, and `style`. Section lookup is by `section.id`, field lookup by `field.name || field.id || field.key`.

```tsx
import { fuseSchema, normalizeUIConfig } from "@ui/form";

const schema = fuseSchema(skeleton, {
  settings: { density: "compact" },
  sections: { personal: { layout: { type: "card" } } },
});
```

#### `createFormDefinition`

```ts
export function createFormDefinition<
  T extends Record<string, any> = Record<string, any>,
>(
  skeleton: FormDefinition<T>,
  uiConfig: FormUIConfig = {},
  options: { formId?: string } = {}
): FormDefinition<T>
```

One-shot `fuseSchema` call that also stamps `definition.id` and registers the definition in `schemaRegistry` when `options.formId` is supplied. Preferred entry point for view models.

[Source: schema-factory.ts](../../../src/shared/ui/form/utils/schema-factory.ts)

#### `createSchemaFactory`

```ts
export function createSchemaFactory<
  T extends Record<string, any>,
  P extends unknown[] = [],
>(
  skeleton: FormDefinition<T>,
  ui: (...args: P) => UIConfiguration,
  options: {
    formId?: string;
    transform?: (skeleton: FormDefinition<T>) => FormDefinition<T>;
  } = {}
): (...args: P) => FormDefinition
```

Returns a builder function that applies an optional pre-fusion `transform`, fuses with `ui(...args)`, and registers itself in `schemaRegistry` when `formId` is given. Collapses the per-form fuse + cast + register boilerplate into one call.

#### `compileEntityToFormDef`

```ts
export function compileEntityToFormDef<T extends Record<string, any>>(
  entity: EntityDefinition<T>,
  formId: string,
  submitLabel: string
): FormDefinition<T>
```

MDAP compiler exported by the barrel: flattens Content + Behavior + Surface + Presentation into a runtime `FormDefinition`, sets `id`/`submitLabel`, and wires `behavior.pipeline.middleware` sequentially into `events.onSubmit`.

[Source: mdap-compiler.ts](../../../src/shared/ui/form/utils/mdap-compiler.ts)

Note: `schema-factory.ts` also declares a file-local `compileEntityToFormDef(entity, options: { formId, submitLabel?, cancelLabel?, register? })` with an options-object signature; it is not re-exported by the `@ui/form` barrel. Import from the specific file if that variant is required.

#### `SimpleFormField`

```ts
export interface SimpleFormField<
  T extends Record<string, any> = Record<string, any>,
> {
  name: keyof T | string;
  type?: FieldType | string;
  component?: string;
  label?: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  options?: Array<{ label: string; value: any }>;
  defaultValue?: any;
  columnSpan?: number;
  validation?: any;
  properties?: Record<string, any>;
  meta?: Record<string, any>;
}
```

Field entry for `createSimpleForm`. Each field becomes a `FormField` with `layout.columnSpan` defaulting to `12`.

#### `SimpleFormOptions`

```ts
export interface SimpleFormOptions<
  T extends Record<string, any> = Record<string, any>,
> {
  id: string;
  title?: string;
  description?: string;
  submitLabel?: string;
  cancelLabel?: string;
  density?: "compact" | "comfortable" | "spacious";
  shell?: "card" | "modal" | "plain";
  variant?: "outlined" | "filled" | "underlined";
  intent?: "primary" | "secondary" | "danger" | "subtle";
  fields: SimpleFormField<T>[];
  validationSchema?: any;
  validationMode?: "onChange" | "onBlur" | "onSubmit" | "manual" | "lazy";
  onSubmit?: (data: T) => Promise<void | Record<string, string>> | void;
}
```

Options for `createSimpleForm`; defaults are `submitLabel: "Submit"`, `cancelLabel: "Cancel"`, `density: "comfortable"`, `shell: "card"`, `variant: "outlined"`, `intent: "primary"`, `validationMode: "onBlur"`.

[Source: createSimpleForm.ts](../../../src/shared/ui/form/utils/createSimpleForm.ts)

#### `createSimpleForm`

```ts
export function createSimpleForm<
  T extends Record<string, any> = Record<string, any>,
>(options: SimpleFormOptions<T>): FormDefinition<T>
```

Builds a complete single-section `FormDefinition` for small forms (dialogs, rename panels): normalizes fields, attaches `presentation.style` and `surface.ui`, and maps `validationSchema`/`validationMode` into `validation` when a schema is provided.

```tsx
import { createSimpleForm } from "@ui/form";

const renameForm = createSimpleForm<{ fileName: string }>({
  id: "rename-file-form",
  title: "Rename File",
  fields: [{ name: "fileName", label: "New File Name", required: true }],
});
```

#### `HeaderMetaSchemaField`

```ts
export interface HeaderMetaSchemaField {
  name: string;
  type:
    | "text"
    | "number"
    | "email"
    | "password"
    | "textarea"
    | "select"
    | "checkbox"
    | "switch"
    | "date"
    | "string"
    | "boolean"
    | "slot"
    | string;
  label?: string;
  title?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: any;
  options?: { label: string; value: any }[] | string[];
  validation?: any;
  gridCols?: number;
  width?: string | number;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  visible?: boolean;
  disabled?: boolean;
  group?: string;
}
```

Shape of one field/column in an API-provided metaSchema. `group` assigns the field to a logical form section.

#### `HeaderMetaSchema`

```ts
export interface HeaderMetaSchema {
  id?: string;
  title?: string;
  description?: string;
  fields:
    | HeaderMetaSchemaField[]
    | Record<string, Omit<HeaderMetaSchemaField, "name">>;
  settings?: any;
  layout?: any;
}
```

Dynamic metadata schema returned by databases or APIs; `fields` may be an array or a name-keyed record.

#### `MetaSchemaBridge`

```ts
export class MetaSchemaBridge { ... }
```

Bridges a `HeaderMetaSchema` to renderable artifacts. Static methods:

```ts
static compileToFields<T extends Record<string, any>>(
  metaSchema: HeaderMetaSchema,
  uiOverrides?: any,
  slots?: Record<string, any>
): RawFormField<any, any, T>[]
```

Normalizes dynamic types (`string` → `text`, `boolean` → `checkbox`), normalizes options to `{ label, value }`, merges `uiOverrides.fields[name]`, and converts matching `slots` entries into `type: "slot"` fields.

```ts
static compileToSections<T extends Record<string, any>>(
  metaSchema: HeaderMetaSchema,
  uiOverrides?: any,
  slots?: Record<string, any>
): RawFormSection<T>[]
```

Groups compiled fields by `group` into sections with a default 12-column grid layout.

```ts
static compileToRenderDefinition<T extends Record<string, any>>(
  metaSchema: HeaderMetaSchema,
  uiOverrides?: any,
  slots?: Record<string, any>
): RenderDefinition<T>
```

Layout-only definition (sections, layout, settings, style) without form identity.

```ts
static compileToFormDefinition<T extends Record<string, any>>(
  metaSchema: HeaderMetaSchema,
  uiOverrides?: any,
  slots?: Record<string, any>
): FormDefinition<T>
```

Canonical `FormDefinition` with generated id when `metaSchema.id` is absent.

```ts
static compileToTableColumns<T>(
  metaSchema: HeaderMetaSchema,
  uiOverrides?: any
): TableColumn<T>[]
```

Maps fields to table columns (`id`, `header`, `accessor`, `width`, `sortable`, `align`) with `uiOverrides.columns[name]` merging.

```ts
static compileToZenithColumns(
  metaSchema: HeaderMetaSchema,
  uiOverrides?: any
): TableColumnMeta[]
```

Maps visible fields to `TableColumnMeta[]`, binding a `fieldSchema` for inline editing.

[Source: MetaSchemaBridge.ts](../../../src/shared/ui/form/utils/MetaSchemaBridge.ts)

```tsx
import { MetaSchemaBridge } from "@ui/form";

const def = MetaSchemaBridge.compileToFormDefinition(metaSchema);
```

**Validation adapters:** `yup-adapter.ts` (`validateYupSchema`, deprecated) and `zod-adapter.ts` (`validateZodSchema`) live next to these utilities; see [05-ADAPTERS_UTILS.md](05-ADAPTERS_UTILS.md) for their signatures and usage.

---

## 6. Field options resolution

#### `getFieldOptions`

```ts
export function getFieldOptions(
  field?: Partial<FormField> | Record<string, any>,
  props?: Record<string, any>
): any[]
```

Canonical options resolution across schema definitions, nested metadata, and runtime props. It evaluates the documented fallback chain in order and returns the first array it finds:

| Step | Source |
|---|---|
| 1 | `props.options` (runtime prop) |
| 2 | `field.options` (schema-level) |
| 3 | `field.properties.options` |
| 4 | `field.meta.options.options` |
| 5 | `[]` (empty array) |

Step 4 (`field.meta.options.options`) is still honored as part of the canonical fallback chain — this is correct current behavior, not a legacy accident. Callers that must distinguish a missing options list from an empty one should check the source themselves.

[Source: form-layout-utils.ts](../../../src/shared/ui/form/utils/form-layout-utils.ts)

```ts
import { getFieldOptions } from "@ui/form/utils/form-layout-utils";

const options = getFieldOptions(field, props);
```

`getFieldOptions` is exported from the module but not from the `@ui/form` barrel; import it by path as shown above.

The same module exports:

| Symbol | Signature | Purpose |
|---|---|---|
| `resolveEffectiveFieldType` | re-export `from "@form-core/utils/field-layout-utils"` | Effective UI type (`meta.ui.component` over `field.type`) |
| `getFormFields` | `getFormFields<T>(definition: FormDefinition \| null, data: T, errors: Record<string, string>, setValue: (name: keyof T, value: any) => void): RenderField[]` | Flat render list for simple hosts |
| `getFieldLayout` | `getFieldLayout<T>(field: RawFormField<T>): FieldLayout` | Layout/visual metadata extraction |
| `getFormLayoutTree` | `getFormLayoutTree(definition: FormDefinition \| null): FormField[]` | Sections mapped to `section`/`card` structure fields |
| `getFieldPlaceholder` | `getFieldPlaceholder(field?: Partial<FormField> \| Record<string, any>, props?: Record<string, any>, layout?: FieldLayout): string \| undefined` | Placeholder fallback chain |
| `getFieldIcon` | `getFieldIcon(field?: Partial<FormField> \| Record<string, any>, props?: Record<string, any>, _layout?: FieldLayout): { startIcon?: string \| React.ReactNode; endIcon?: string \| React.ReactNode; rightIcon?: string \| React.ReactNode }` | Icon fallback chain |

---

## 7. Internal utilities index

Not exported by the `@ui/form` barrel but imported directly across the system:

| Path | Purpose |
|---|---|
| `utils/FormAutoGenerator.ts` | Generates form definitions from domain field metadata (`FormAutoGenerator`, `DomainFormConfig`) |
| `utils/SchemaMigrator.ts` | Sequential version migrations for form definitions (`SchemaMigrator.migrate`) |
| `utils/SchemaNormalizer.ts` | Normalizes raw schemas into a clean `FormField[]` tree for the renderer |
| `utils/create-field.ts` | `createField` factory for authoring `FormField` objects concisely |
| `utils/field-utils.ts` | `classNames`, `getI18nString`, `getOptionLabel` helpers |
| `utils/form-metrics.ts` | `FormMetricsAnalyzer` — single-pass complexity metrics for spacing |
| `utils/form-styles.ts` | Class builders: `buildHeroUIClasses`, `buildSectionClasses`, `buildFormShellClasses`, `buildFormActionClasses`, `getFieldVariantClasses`, `stripVerticalMargins` |
| `utils/layout-generator.tsx` | Pure class/JSX generation for box model and layout containers (`buildBoxModelClasses`, `parseLayoutConfig`, `renderBoxModel`) |
| `utils/project-layers.ts` | Projects effective MDAP runtime layers from an authoring source |
| `utils/resolve-instance-def.ts` | `resolveInstanceDefinition` / `useInstanceDefinition` — manifest defaults merged with schema field config |
| `utils/row-layout.ts` | 12-column row grouping (`groupFieldsIntoRows`, `getFieldSpan`, `getGridClassName`) |
| `utils/schema-signature.ts` | `buildSchemaStructuralSignature` — structural signature used to decide engine recreation |
| `utils/spacing-calculator.ts` | `SpacingCalculator` + `SpacingConfig` / `FormMetrics` — density-aware spacing |
| `utils/tokens.ts` | `ZENITH_TOKENS` semantic token registry and `ZenithToken` type |
| `utils/typography.ts` | `buildTypographyClasses` for field text styling |
| `utils/icon-registry.tsx` | Re-exports `getIcon` / `ICON_MAP` for field icons |
| `utils/ErrorParser.ts` | Parses engine/adapter validation output into display errors |
| `utils/schema-compat.ts` | Re-export shim for `@form-core/utils/schema-compat` |
| `utils/normalization-utils.ts` | Re-export shim for `@form-core/utils/normalization-utils` |
| `utils/i18n.utils.ts` | Re-export shim for `resolveTranslation` |
| `utils/ExpressionEvaluator.ts` | Re-export shim for `@form-core/utils/expression-evaluator` |
| `utils/tailwind-safelist.ts` | `SAFELIST` of generated utility classes |

Schema validation adapters: `validateYupSchema` (`utils/yup-adapter.ts`, deprecated) and `validateZodSchema` (`utils/zod-adapter.ts`) — see [05-ADAPTERS_UTILS.md](05-ADAPTERS_UTILS.md).

---

**See also:**

- [01-ENGINE.md](01-ENGINE.md)
- [04-DOMAIN_TYPES.md](04-DOMAIN_TYPES.md)
- [05-ADAPTERS_UTILS.md](05-ADAPTERS_UTILS.md)
- [07-COMPONENTS.md](07-COMPONENTS.md)
- [08-FIELD_CATALOG.md](08-FIELD_CATALOG.md)
- [09-PROVIDERS.md](09-PROVIDERS.md)
- [11-TYPES_CONTRACTS.md](11-TYPES_CONTRACTS.md)
