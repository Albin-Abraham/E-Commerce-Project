# Zenith Form Registries & Proxies Reference

## 1. Schema code-splitting (SchemaRegistry)

### `src/core/form-core/SchemaRegistry.ts`

Central authority for form schemas. Supports synchronous registration, lazy code-split loading via dynamic `import()`, background preloading, and memoized caching of resolved `FormDefinition` objects.

#### `SchemaBuilderFactory`

```ts
export type SchemaBuilderFactory = () =>
  | FormDefinition
  | Promise<FormDefinition>;
```

A factory that returns a `FormDefinition` directly or as a promise. Registered with `SchemaRegistry.register`.

#### `LazySchemaLoader`

```ts
export type LazySchemaLoader = () => Promise<
  | FormDefinition
  | { default: FormDefinition }
  | { buildSchema: () => FormDefinition }
  | { [key: string]: any }
>;
```

A dynamic-import loader (e.g. `() => import('./employee-schema')`). The registry extracts the definition from the module namespace via `default`, a `buildSchema()` function, a direct `id`/`sections` object, or the first suitable export.

#### `SchemaRegistry`

```ts
export class SchemaRegistry {
  public register(formId: string, factory: SchemaBuilderFactory): void
  public registerLazy(formId: string, loader: LazySchemaLoader): void
  public has(formId: string): boolean
  public async resolve(formId: string): Promise<FormDefinition>
  public resolveSync(formId: string): FormDefinition
  public async preload(formId: string): Promise<FormDefinition>
  public async preloadMany(formIds: string[]): Promise<FormDefinition[]>
  public clearCache(formId?: string): void
}
```

Registry of eager factories and lazy loaders keyed by form ID, with a `FormDefinition` cache. Re-registering an ID evicts its cache entry. `resolve` awaits either source and memoizes; `resolveSync` throws for lazy or async schemas, directing callers to `resolve()`/`preload()`.

| Signature | Description |
|---|---|
| `register(formId, factory)` | Registers a sync/promise factory; evicts any cached definition for the ID. |
| `registerLazy(formId, loader)` | Registers a code-split dynamic import loaded on demand. |
| `has(formId): boolean` | `true` if cached, eagerly registered, or lazily registered. |
| `resolve(formId): Promise<FormDefinition>` | Builds (awaiting factory or loader) and caches; throws if unregistered. |
| `resolveSync(formId): FormDefinition` | Cache-or-factory only; throws for lazy/async entries. |
| `preload(formId)` | Alias of `resolve` for background prefetching. |
| `preloadMany(formIds)` | Concurrent `Promise.all` of `resolve`. |
| `clearCache(formId?)` | Evicts one form's cache, or the entire cache when no ID is given. |

Non-exported helper: `extractFormDefinition(mod)` — pulls a `FormDefinition` out of an imported module namespace (handles `default`, `buildSchema`, direct objects, and first-suitable-export fallbacks); throws when nothing matches.

#### `schemaRegistry`

```ts
export const schemaRegistry = new SchemaRegistry();
```

Singleton instance used across the form system.

---

## 2. Unified manifest (ManifestRegistry)

### `src/core/form-core/ManifestRegistry.ts`

Single registry for field-type metadata, layout renderers, eager component overrides, per-type `InstanceDefinition` defaults, and `FieldAdapter` registration. Replaces five previously scattered registries (`FIELD_REGISTRY`, `fieldRegistry`, `FIELD_METADATA`, `layoutRendererRegistry`, `RegistryStore.definitions`). `React.ComponentType` appears only in type positions (`resolveFieldComponent`, `getIcon` return types) — the module has no React runtime dependency.

#### `ManifestRegistry`

```ts
export class ManifestRegistry {
  registerField(manifest: FieldManifest): void
  registerFieldComponent(type: string, component: any): void
  registerInstanceDefaults(
    type: string,
    factory: (schemaField: any) => InstanceDefinition
  ): void
  registerAdapter<T = unknown>(adapter: FieldAdapter<T>): void
  getAdapter<T = unknown>(type: string): FieldAdapter<T> | undefined
  registerLayout(manifest: LayoutRendererManifest): void
  getField(type: string): FieldManifest | undefined
  getLayout(type: string): LayoutRendererManifest | undefined
  getFieldComponent(type: string): any
  async resolveFieldComponent(
    type: string
  ): Promise<React.ComponentType<any> | undefined>
  getCategory(type: string): ManifestFieldCategory
  getRouting(type: string): FieldRouting
  getCapabilities(type: string)
  isContainer(type: string): boolean
  isStructural(type: string): boolean
  acceptsChildren(type: string): boolean
  getInstanceDefaults(
    type: string
  ): ((schemaField: any) => InstanceDefinition) | undefined
  getWrapper(
    type: string
  ):
    | { enabled: boolean; showLabel?: boolean; wrapOuter?: boolean }
    | undefined
  getLabel(type: string): string
  getIcon(type: string): React.ComponentType<{ size?: number }> | undefined
  getAllFields(): FieldManifest[]
  getAllPrimaryFields(): FieldManifest[]
  getAllLayouts(): LayoutRendererManifest[]
  hasField(type: string): boolean
  hasLayout(type: string): boolean
  registerFields(manifests: FieldManifest[]): void
  registerLayouts(manifests: LayoutRendererManifest[]): void
}
```

Backing stores (all private): `fields` (type → `FieldManifest`, including alias entries), `layouts` (type → `LayoutRendererManifest`), `fieldComponents` (eager component overrides), and `instanceDefaults` (type → factory).

Registration:

| Signature | Description |
|---|---|
| `registerField(manifest: FieldManifest): void` | Registers one field manifest and creates alias entries for `manifest.aliases` (marked `_isAlias: true`). |
| `registerFieldComponent(type: string, component: any): void` | Registers an eager component override for a type (syncs legacy `registry.tsx` / `LazyRegistryStore` registrations). |
| `registerInstanceDefaults(type: string, factory: (schemaField: any) => InstanceDefinition): void` | Registers a factory producing per-type `InstanceDefinition` defaults, receiving the schema field. |
| `registerAdapter<T = unknown>(adapter: FieldAdapter<T>): void` | Delegates to `fieldAdapterRegistry.register` for type-specific parse/serialize/format/validate. |
| `registerLayout(manifest: LayoutRendererManifest): void` | Registers a layout renderer manifest (CardRenderer, TabsRenderer, …). |
| `registerFields(manifests: FieldManifest[]): void` | Bulk `registerField` over an array. |
| `registerLayouts(manifests: LayoutRendererManifest[]): void` | Bulk `registerLayout` over an array. |

Queries:

| Signature | Description |
|---|---|
| `getField(type: string): FieldManifest \| undefined` | The manifest for a type/alias, or `undefined`. |
| `getLayout(type: string): LayoutRendererManifest \| undefined` | The layout renderer manifest for a layout type. |
| `getFieldComponent(type: string): any` | The eager component override, or `undefined`. |
| `async resolveFieldComponent(type: string): Promise<React.ComponentType<any> \| undefined>` | Resolves the component with priority: `manifest.loader()` (async import) → eager override → `manifest.component`. |
| `getCategory(type: string): ManifestFieldCategory` | Manifest category; defaults to `"input"`. |
| `getRouting(type: string): FieldRouting` | Routing strategy; defaults to `"leaf"`. |
| `getCapabilities(type: string)` | The `FieldCapabilities` contract, or `undefined`. |
| `isContainer(type: string): boolean` | `true` when category is `"container"` or `"composite"`. |
| `isStructural(type: string): boolean` | `true` when container/composite or routing is `"repeater"`. |
| `acceptsChildren(type: string): boolean` | `true` when `manifest.layout.acceptsChildren` is `true`. |
| `getInstanceDefaults(type: string): ((schemaField: any) => InstanceDefinition) \| undefined` | The registered defaults factory. |
| `getWrapper(type: string): { enabled: boolean; showLabel?: boolean; wrapOuter?: boolean } \| undefined` | The withAtom wrapper configuration. |
| `getLabel(type: string): string` | Human-readable label; falls back to the type string. |
| `getIcon(type: string): React.ComponentType<{ size?: number }> \| undefined` | Icon component for the type. |
| `getAllFields(): FieldManifest[]` | All manifests including aliases. |
| `getAllPrimaryFields(): FieldManifest[]` | Non-alias manifests only (for builder palettes). |
| `getAllLayouts(): LayoutRendererManifest[]` | All layout renderer manifests. |
| `hasField(type: string): boolean` | Whether the type (or an alias) is registered. |
| `hasLayout(type: string): boolean` | Whether the layout type is registered. |

#### `manifestRegistry`

```ts
export const manifestRegistry = new ManifestRegistry();
```

Singleton instance used across the form system.

---

## 3. Validation stack

The validation stack is layered: the **adapter** SPI defines the boundary contract, the **registry** holds built-in rule strategies, and the **proxy** is the default adapter that evaluates field rules through the registry.

### `src/core/form-core/validation-adapter.ts`

Port interface between the engine and any external validation library. The engine depends only on this interface — concrete libraries (Yup, Zod) are plugged in via `FormCoreOptions.validatorAdapter`.

#### `ValidationAdapter<TValues>`

```ts
export interface ValidationAdapter<
  TValues extends Record<string, unknown> = Record<string, unknown>,
> {
  validateField(
    field: FormField,
    value: unknown,
    values: TValues
  ): Promise<DetailedError[]> | DetailedError[];
  screenValue?(
    field: FormField,
    value: unknown,
    values?: TValues
  ): { value: unknown; errors: DetailedError[] };
  validateForm(
    values: TValues
  ): Promise<Record<string, DetailedError[]>> | Record<string, DetailedError[]>;
}
```

| Member | Description |
|---|---|
| `validateField(field, value, values)` | Validates one field; returns `DetailedError[]` (empty = valid). May be async. `values` enables cross-field rules. |
| `screenValue?(field, value, values?)` | Optional pre-write screen: returns the value normalized to the allowed character set plus an error per character-class violation (used when `disableDeferredValidation` is enabled). |
| `validateForm(values)` | Optional whole-form validation returning `fieldId → DetailedError[]`. The engine drives per-field validation itself; adapters like Yup may implement this for efficiency. |

### `src/core/form-core/validation-registry.ts`

Strategy + registry pattern for built-in field validation rules. Each rule type maps to a stateless `ValidationStrategy`; new rules are added at runtime via `registerValidationStrategy` without modifying the file (Open/Closed Principle).

#### `ValidationStrategy`

```ts
export interface ValidationStrategy {
  validate: (
    value: any,
    rule: ValidationRule,
    field: FormField,
    values?: any
  ) => boolean | Promise<boolean>;
  defaultMessage: (rule: ValidationRule, field: FormField) => string;
  sanitize?: (value: any, rule: ValidationRule, field: FormField) => any;
}
```

| Member | Description |
|---|---|
| `validate(value, rule, field, values?)` | Returns `true` when the value satisfies the rule; may be async. `values` is the full form snapshot for cross-field strategies. |
| `defaultMessage(rule, field)` | Human-readable error string for a violation (typically interpolates `field.label`). |
| `sanitize?(value, rule, field)` | Optional pre-write sanitizer for character-class rules (`alphanumeric`, `digitsOnly`, `alphaOnly`); applied when deferred validation is disabled. Arbitrary-regex rules omit it. |

#### `ValidationRegistry`

```ts
export const ValidationRegistry: Record<string, ValidationStrategy> = {
  required: RequiredStrategy,
  min: MinStrategy,
  minLength: MinStrategy,
  max: MaxStrategy,
  maxLength: MaxStrategy,
  email: EmailStrategy,
  phone: PhoneStrategy,
  pattern: PatternStrategy,
  alphanumeric: AlphanumericStrategy,
  digitsOnly: DigitsOnlyStrategy,
  alphaOnly: AlphaOnlyStrategy,
  url: UrlStrategy,
  ip: IpStrategy,
  postalCode: PostalCodeStrategy,
  date: DateStrategy,
  time: TimeStrategy,
  uuid: UuidStrategy,
  fileSize: FileSizeStrategy,
  fileType: FileTypeStrategy,
  matches: MatchesStrategy,
  match: MatchesStrategy,
  custom: CustomStrategy,
};
```

Plain object map from rule type string to strategy. Built-in keys: `required`, `min`, `minLength` (alias of `min`), `max`, `maxLength` (alias of `max`), `email`, `phone`, `pattern`, `alphanumeric`, `digitsOnly`, `alphaOnly`, `url`, `ip`, `postalCode`, `date`, `time`, `uuid`, `fileSize`, `fileType`, `matches` / `match` (sibling-field comparison), and `custom` (escape hatch running `rule.fn`). Looked up by `ValidationProxy` for both validation and default messages.

#### `registerValidationStrategy`

```ts
export function registerValidationStrategy(
  name: string,
  strategy: ValidationStrategy
)
```

Registers a custom strategy under a new or existing rule key. Call once at app initialization; the rule type then becomes available in `field.validation.rules[]` schemas.

Non-exported helper: `hasValue(value)` — the shared "present" check (`!== null`, `!== undefined`, `!== ""`) used consistently across built-in strategies.

### `src/core/form-core/validation-proxy.ts`

The engine's built-in `ValidationAdapter`. Evaluates the top-level `required` shorthand, the explicit `validation.rules[]` array (with `rule.when` conditional skipping and cross-field `values` access), and implicit type-based rules, resolving messages through config → i18n → strategy default.

#### `ValidationMessageConfig`

```ts
export interface ValidationMessageConfig {
  [fieldId: string]: {
    [ruleCode: string]: string;
  };
}
```

Per-field, per-rule message overrides: `{ [fieldId]: { [ruleCode]: "custom message" } }`. Supplied via `FormCoreOptions.messageConfig`; only used by the internal proxy.

#### `ValidationProxy`

```ts
export class ValidationProxy implements ValidationAdapter {
  constructor(
    config?: ValidationMessageConfig,
    reactiveEngine?: ReactiveEngine,
    i18nNamespace: string = "features:forms"
  )
}
```

Default validator used when no external adapter is provided. Message resolution priority: rule-level `rule.message` → `messageConfig[fieldId][code]` → i18n key `validation.<code>` in `i18nNamespace` → strategy `defaultMessage()` → `"Invalid value"`.

| Signature | Description |
|---|---|
| `constructor(config?, reactiveEngine?, i18nNamespace = "features:forms")` | Seeds the message map, optional reactive engine (for reactive `required` expressions), and the i18n namespace. |
| `public getMessage(code: string, field: FormField, rule?: any): string` | Resolves the error message for a rule failure on a field through the priority chain above. |
| `public async validateField(field: FormField, value: any, values: any): Promise<DetailedError[]>` | Adapter entry point; delegates to `validate`. |
| `public screenValue(field: FormField, value: any): { value: any; errors: DetailedError[] }` | Pure pre-write screen: runs `sanitize` on each applicable rule (respecting `rule.when`); a sanitizer that changes the input reports a violation instead of silently rewriting. |
| `public validateForm(_values: any): Record<string, DetailedError[]>` | No-op stub returning `{}` — the engine drives per-field validation. |
| `public async validate(field: FormField, value: any, values: Record<string, any> = {}): Promise<DetailedError[]>` | Three-pass runner: (1) top-level `required` shorthand (reactive-aware), (2) `validation.rules[]` with `rule.when` skipping and full `values` for cross-field strategies, (3) implicit type-based rules (e.g. `type: "email"`), excluding `date`/`time`/`text`/`password`/`textarea` and empty optional fields. |

Non-exported helper: `private formatMessage(template, field, params)` — replaces `{key}` / `{{key}}` tokens (including `{label}` and friendly aliases `min`/`max`/`limit`/`length` for `rule.value`) in message templates.

---

## 4. Condition stack

### `src/core/form-core/condition-registry.ts`

Plugin registry of comparison operators used by condition rules. New operators are registered at runtime without touching `ConditionProxy` evaluation logic.

#### `ConditionOperatorFn`

```ts
export type ConditionOperatorFn = (
  fieldValue: any,
  targetValue: any
) => boolean;
```

A stateless binary predicate comparing a resolved field value against a rule target.

#### `ConditionOperatorRegistry`

```ts
export class ConditionOperatorRegistry {
  public static getInstance(): ConditionOperatorRegistry
  public register(name: string, fn: ConditionOperatorFn)
  public evaluate(name: string, fieldValue: any, targetValue: any): boolean
}
```

Singleton (private constructor, accessed via `getInstance`). `register` adds or replaces an operator; `evaluate` looks up the operator and returns `false` with a dev-mode warning for unknown names. Exported under the alias `ConditionRegistry` (`export { ConditionOperatorRegistry, ConditionOperatorRegistry as ConditionRegistry }`).

Default operators registered on construction:

| Group | Keys | Behaviour |
|---|---|---|
| Equality | `equals`, `eq`, `notEquals`, `ne`, `neq` | Loose `==` / `!=` |
| Comparison | `greaterThan`, `gt`, `lessThan`, `lt`, `greaterThanOrEqual`, `gte`, `lessThanOrEqual`, `lte` | Numeric `>`, `<`, `>=`, `<=` |
| Range | `between`, `notBetween` | Numeric within/outside `[min, max]` array target |
| Membership | `contains`, `in`, `notIn` | Array `includes` or string substring; target-array membership |
| String | `startsWith`, `endsWith`, `regex` | String prefix/suffix; `new RegExp(pattern).test(String(val))` |
| Emptiness | `empty`, `notEmpty` | null / undefined / empty string checks |

#### `conditionRegistry`

```ts
export const conditionRegistry = ConditionOperatorRegistry.getInstance();
```

Singleton operator registry; also re-exported from the barrel as `ConditionRegistry` / `conditionRegistry`.

### `src/core/form-core/condition-proxy.ts`

Pure evaluator for conditional logic: field visibility, enabled state, `setValue` effects, and `rule.when` checks. Holds a values snapshot plus a context object and never mutates form state.

#### `ConditionContext`

```ts
export interface ConditionContext {
  validity: Record<string, any>;
  vitality: Record<string, any>;
  metadata: Record<string, any>;
  fieldId?: string;
}
```

Context handed to functional predicates (`field.visible` / `field.enabled` as functions): current validity, vitality, metadata, and the evaluating field's ID.

#### `ConditionProxy`

```ts
export class ConditionProxy {
  constructor(
    initialValues: Record<string, any> = {},
    initialContext?: Partial<ConditionContext>
  )
}
```

Stateless computation engine over a snapshot of values. Condition expressions are structured as `ConditionExpression → groups: ConditionGroup[] → rules: { field, operator, value }[]`, with group actions `show`, `hide`, `enable`, `disable`, `setValue`, and `validate`.

| Signature | Description |
|---|---|
| `constructor(initialValues = {}, initialContext?)` | Seeds the values snapshot and optional context. |
| `updateValues(values: Record<string, any>, context?: Partial<ConditionContext>)` | Refreshes the values/context used by subsequent evaluations. |
| `isVisible(field: FormField): boolean` | Resolution order: functional `field.visible` → `field.conditions` (or deprecated `meta.conditions`) evaluated with actions `["show", "hide"]` → static boolean → default `true`. |
| `isEnabled(field: FormField): boolean` | Functional `field.enabled` → static `disabled === true` → `field.conditions` with actions `["enable", "disable"]` → default `true`. |
| `getSetValueEffects(field: FormField): Array<{ fieldName: string; value: any }>` | Collects `targetField`/`targetValue` pairs from passing `action: "setValue"` groups. |
| `public evaluateExpression(expression: ConditionExpression, actionFilter?: string[], contextId?: string): boolean` | Reduces an expression's groups under `expression.logic` (`"AND"` default, or `"OR"`), optionally filtered to specific actions; empty/applicable-less groups are transparent (`true`). Public so `ValidationProxy` can evaluate `rule.when`. |

Non-exported helpers: `private evaluateGroup(group, contextId?)` — combines a group's rules by its `logic` and maps the action to a visible/enabled verdict (`hide`/`disable` are inverted); `private evaluateRule(rule, ruleContextId?)` — resolves the rule path via lodash `get`, interpolates repeater indices, auto-targets `.value` on object values, and delegates to `conditionRegistry.evaluate`; `private interpolateIndex(path, contextId?)` — replaces `[index]` / `{{index}}` tokens with the row index extracted from the context ID.

---

## 5. Injection & composite registries

### `src/core/form-core/injection-registry.ts`

Global registry of reusable schema fragments (prefabs) for the Data Component System approach: define common field groups once and inject them into forms.

#### `InjectionFragment`

```ts
export type InjectionFragment = FormField[] | ((metadata: any) => FormField[]);
```

A fragment is either a static field array or a factory receiving metadata and returning fields.

#### `InjectionRegistry`

```ts
export class InjectionRegistry {
  public static getInstance(): InjectionRegistry
  public register(name: string, fragment: InjectionFragment)
  public get(name: string, metadata: any = {}): FormField[] | undefined
}
```

Singleton with a private constructor. `register` stores a named fragment; `get` retrieves it, invoking the factory with `metadata` when the fragment is a function. Returns `undefined` for unknown names.

#### `injectionRegistry`

```ts
export const injectionRegistry = InjectionRegistry.getInstance();
```

Singleton instance used across the form system.

### `src/core/form-core/composite-registry.ts`

Static catalog of composite schema fragments. These are engine-level templates (not React components) that the engine expands at runtime.

#### `COMPOSITE_DCS`

```ts
export const COMPOSITE_DCS: Record<string, Partial<FormField>[]> = {
  "address-group": [/* street, city, zip */],
  "branch-address-group": [/* line1, city, state */],
  "table-filter-section": [/* search, status, dateRange */],
};
```

Data Component Specification map from composite name to partial field arrays. Built-ins: `address-group` (street/city/zip layout block), `branch-address-group` (required line1/city/state block with icons), and `table-filter-section` (search, status select, date range filter block).

#### `getCompositeFields`

```ts
export function getCompositeFields(
  type: string
): Partial<FormField>[] | undefined
```

Resolves a composite type name to its DCS field template array, or `undefined` when unregistered.

---

## 6. Value & flow proxies

### `src/core/form-core/value-proxy.ts`

Thin, mockable wrapper around lodash `get`/`set` providing consistent path-based value access. Instantiated once per `FormRuntime` and shared across modules; stateless (holds no data).

#### `ValueProxy`

```ts
export class ValueProxy {
  public getValue(target: any, path: string | string[]): any
  public setValue(target: any, path: string | string[], value: any): void
}
```

| Signature | Description |
|---|---|
| `public getValue(target: any, path: string \| string[]): any` | Reads via lodash `get` — handles nested paths (`"address.city"`), array indices (`"users[0].name"`), and missing paths (`undefined`, never throws). Returns `undefined` for a falsy target. |
| `public setValue(target: any, path: string \| string[], value: any): void` | Writes via lodash `set`, creating intermediate objects/arrays and mutating the target in place (immutability is managed at the `StateManager` notification layer). No-op for a falsy target. |

### `src/core/form-core/flow-proxy.ts`

Wizard/multi-step navigation: computes the next step from the current section, supporting static `nextStep` strings, dynamic `nextStep` functions over current values, and sequential fallback through `rootSections`.

#### `FlowProxy`

```ts
export class FlowProxy {
  constructor(
    private definition: NormalizedForm,
    private getValues: () => any,
    private getVisibility?: () => Record<string, boolean>
  )
}
```

Pure computation unit with no state mutation and no React dependency. Values are read lazily through the `getValues` callback to avoid stale snapshots; the optional `getVisibility` callback enables hidden-step skipping.

| Signature | Description |
|---|---|
| `constructor(definition, getValues, getVisibility?)` | Binds the normalized definition and lazy values/visibility readers. |
| `public getNextStep(currentStepId: string): string \| null` | Resolution order: function `section.nextStep(values)` → string `nextStep` → next entry in `rootSections` → `null`. Hidden and review-only (submit-landing) targets are skipped recursively. |
| `public isLastStep(currentStepId: string): boolean` | `true` when `getNextStep` returns `null` (exact for linear flows). |

Non-exported helper: `private isSubmitLanding(sectionId)` — `true` when the section carries `layout.reviewOnly === true`; such sections are never navigation targets.

---

## 7. Backend normalization

### `src/core/form-core/backend-normalizer.ts`

Transforms heterogeneous backend schema metadata (REST, SAP, Oracle, GraphQL sources normalized into a common shape) into canonical Zenith MetaSchema `ContentDefinition` / `FormDefinition` objects.

#### `BackendFieldMetadata`

```ts
export interface BackendFieldMetadata {
  name: string;
  type: string;
  label?: string;
  description?: string;
  nullable?: boolean;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  min?: number;
  max?: number;
  options?: Array<{ label: string; value: any }>;
  defaultValue?: any;
  validationRule?: string;
}
```

One backend column/field: logical `name`, raw backend `type` string (e.g. `"varchar"`, `"int"`, `"boolean"`, `"date"`, `"select"`), display metadata, nullability/required flags, length and numeric bounds, select `options`, and a default value.

#### `BackendSchemaMetadata`

```ts
export interface BackendSchemaMetadata {
  entity: string;
  title?: string;
  description?: string;
  fields: BackendFieldMetadata[];
}
```

Whole-schema envelope: entity name plus optional title/description and the field list.

#### `BackendMetadataNormalizer`

```ts
export class BackendMetadataNormalizer {
  public static normalizeToContent(
    backendSchema: BackendSchemaMetadata
  ): ContentDefinition
  public static normalizeToFormDefinition(
    backendSchema: BackendSchemaMetadata
  ): FormDefinition
}
```

Stateless static utility.

| Signature | Description |
|---|---|
| `public static normalizeToContent(backendSchema: BackendSchemaMetadata): ContentDefinition` | Maps each backend field to a `ContentFieldDefinition`: backend type → canonical form type, `required` derived from `required ?? nullable === false`, and generated validation rules (`required`, `maxLength`, `minLength`, `min`, `max`) with messages; preserves the raw backend type and options under `metadata`. |
| `public static normalizeToFormDefinition(backendSchema: BackendSchemaMetadata): FormDefinition` | Wraps `normalizeToContent` output into a `FormDefinition` (`id` = entity, fields attached both under `content` and top-level `fields`). |

Non-exported helper: `private static mapType(backendType: string): string` — substring mapping of backend types to canonical field types: `char`/`string`/`text` → `"text"`, `int`/`decimal`/`number`/`float` → `"number"`, `bool` → `"checkbox"`, `date`/`time` → `"date"`, `select`/`enum` → `"select"`, default `"text"`.

---

## 8. Test utilities

### `src/core/form-core/test-utils.ts`

Vitest-oriented helpers for constructing engine instances and asserting form state in tests.

| Export | Description |
|---|---|
| `interface FormCoreTestOptions` | Options bag: `definition?`, `initialData?`, `onSubmit?`. |
| `createFormCore(definition, initialData?, _onSubmit?)` | Constructs a `new FormCore(definition, initialData)`. |
| `createTestFormCore(options: FormCoreTestOptions = {})` | Builds a minimal one-section, one-text-field form merged with `options.definition`. |
| `createMockFormDefinition(overrides: Partial<FormDefinition> = {}): FormDefinition` | Standard mock form with required `name` (text) and `email` (email) fields. |
| `createAsyncMockFormDefinition(overrides: Partial<FormDefinition> = {}): FormDefinition` | Mock form containing a `select` field with `remoteOptions` pointing at `/api/options`. |
| `mockOnSubmit` | `vi.fn` mock resolving `{ success: true, data }`. |
| `mockOnChange` | `vi.fn` echo mock recording `(fieldName, value)`. |
| `mockOnBlur` | `vi.fn` echo mock recording `(fieldName, value)`. |
| `resetFormMocks()` | Resets all three vi mocks. |
| `waitForFormState(formCore, predicate, timeout = 5000): Promise<void>` | Polls `formCore.state` every 10 ms until `predicate` passes; throws on timeout. |
| `expectFormValid(formCore, expected = true)` | Throws with the validity dump when `formCore.isValid !== expected`. |
| `expectFieldValue(formCore, fieldName, expectedValue)` | Throws when the named value differs from `expectedValue`. |
| `expectFieldError(formCore, fieldName, expectedMessage?)` | Resolves the field via `formCore.resolver.resolve`, asserts an error exists, and optionally that the joined messages contain `expectedMessage`. |

---

**See also:**

- [01-ENGINE.md](01-ENGINE.md) — `FormCore`, `Form` facade, contracts, and React adapter
- [03-MODULES.md](03-MODULES.md) — engine modules (FieldRegistry, StateManager, FormValidator, persistence)
- [04-DOMAIN_TYPES.md](04-DOMAIN_TYPES.md) — `FieldManifest`, `ConditionExpression`, and domain entities
- [05-ADAPTERS_UTILS.md](05-ADAPTERS_UTILS.md) — Zod adapter and schema-compat utilities
- [08-FIELD_CATALOG.md](08-FIELD_CATALOG.md) — registered field types and layouts
- [10-SHARED_UTILS.md](10-SHARED_UTILS.md) — shared utility modules
- [11-TYPES_CONTRACTS.md](11-TYPES_CONTRACTS.md) — shared types and cross-module contracts
