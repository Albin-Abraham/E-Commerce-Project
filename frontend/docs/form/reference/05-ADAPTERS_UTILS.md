# Zenith Form Adapters & Core Utilities Reference

Adapters and pure utility modules of the Zenith Form Architecture. Adapters translate external schema libraries into the engine's `ValidationAdapter` contract; the utilities in `src/core/form-core/utils/` are framework-free functions with no React dependency.

| Section | File | Exported symbols |
|---|---|---|
| 1 | `src/core/form-core/adapters/zod-adapter.ts` | `ZodValidationAdapter`, `createZodValidator` |
| 2 | `src/shared/ui/form/utils/zod-adapter.ts`, `src/shared/ui/form/utils/yup-adapter.ts` | `validateZodSchema`, `validateYupSchema` |
| 3 | `src/core/form-core/utils/accessibility.ts` | `FIELD_ROLES`, `buildAriaAttributes`, `auditField`, `enhanceFieldProps` |
| 4 | `src/core/form-core/utils/expression-evaluator.ts` | `ExpressionEvaluator` |
| 5 | `src/core/form-core/utils/normalization-utils.ts` | `hashString`, `getDeterministicId`, `resolveFieldIdentity` |
| 6 | `src/core/form-core/utils/i18n-resolver.ts` | `resolveTranslation` |
| 7 | `src/core/form-core/utils/schema-compat.ts`, `field-layout-utils.ts` | `toCanonicalMetadataEvents`, `resolveEffectiveFieldType` |
| 8 | `src/core/form-core/adapters/index.ts`, `src/core/form-core/utils/index.ts` | barrel re-exports |

---

## 1. Core Zod adapter

### 1.1 `src/core/form-core/adapters/zod-adapter.ts`

[zod-adapter.ts](../../../src/core/form-core/adapters/zod-adapter.ts)

Implements the `ValidationAdapter` port with Zod schemas for the headless engine. The module imports only `zod` and core domain types, so it is usable outside React and outside the browser. It supports keystroke, blur, and submission validation while preserving cross-field `.refine()` rules.

#### `ZodValidationAdapter`

```ts
export class ZodValidationAdapter<
  TValues extends Record<string, unknown> = Record<string, unknown>,
> implements ValidationAdapter<TValues> {
  constructor(public readonly schema: z.ZodType<TValues>) {}

  public validateField(
    field: FormField,
    value: unknown,
    values: TValues
  ): DetailedError[]

  public validateForm(values: TValues): Record<string, DetailedError[]>
}
```

Pluggable `ValidationAdapter` that runs a `z.ZodType<TValues>` against form state. The schema is exposed as the readonly `schema` property.

- `constructor(public readonly schema: z.ZodType<TValues>)` — stores the schema instance used by both validation methods.
- `validateField(field, value, values)` — builds a candidate value object by merging `values` with the candidate value at `field.name || field.id`, calls `schema.safeParse`, then filters issues whose dotted `issue.path` equals the field path, equals `field.id`, or starts with `<fieldPath>.`. Returns `[]` when parsing succeeds; each returned error is `{ code, message, fieldId, details }`.
- `validateForm(values)` — calls `schema.safeParse(values)` once and groups every issue into `Record<fieldId, DetailedError[]>`, keying each entry by `issue.path.join(".")` with the fallback key `"root"`. Returns `{}` when parsing succeeds.

The engine constructs this adapter itself: when `FormCoreOptions.schema` is set, exposes `safeParse`, and no `validatorAdapter` is given, `FormCore` instantiates `ZodValidationAdapter` internally; a non-Zod schema falls back to the built-in `ValidationProxy` ([engine.ts](../../../src/core/form-core/engine.ts)).

```ts
import { z } from "zod";
import { createZodValidator } from "@form-core/adapters";

const schema = z.object({
  email: z.email(),
  confirmPassword: z.string(),
});

const adapter = createZodValidator(schema);
```

#### `createZodValidator`

```ts
export function createZodValidator<T extends Record<string, unknown>>(
  schema: z.ZodType<T>
): ZodValidationAdapter<T>
```

Factory helper that returns `new ZodValidationAdapter<T>(schema)` with the data shape inferred from the schema. Equivalent to calling the constructor directly; it exists for inference ergonomics.

---

## 2. Validation function helpers (shared)

Shared-level adapters pair with `useForm`'s `validationSchema` option. They are plain async functions rather than `ValidationAdapter` implementations and are invoked once per submission attempt by `useForm().submit()`.

### 2.1 `src/shared/ui/form/utils/zod-adapter.ts`

[zod-adapter.ts](../../../src/shared/ui/form/utils/zod-adapter.ts)

Validates a complete value object against a Zod schema and converts Zod issues into the engine's `DetailedError` shape. Imported by `useForm` as `@ui/form/utils/zod-adapter`.

#### `validateZodSchema`

```ts
export async function validateZodSchema(
  schema: z.ZodType<any>,
  values: any
): Promise<DetailedError[]>
```

Runs `schema.safeParse(values)` and returns `[]` on success. On failure it maps every issue to `{ code, message, fieldId: issue.path.join("."), details: issue }`.

### 2.2 `src/shared/ui/form/utils/yup-adapter.ts`

[yup-adapter.ts](../../../src/shared/ui/form/utils/yup-adapter.ts)

Validates a complete value object against a Yup schema and converts `ValidationError.inner` entries into `DetailedError`. Marked `@deprecated` in source; retained for backwards compatibility with existing Yup schemas.

#### `validateYupSchema`

```ts
export async function validateYupSchema(
  schema: yup.AnyObjectSchema,
  values: any
): Promise<DetailedError[]>
```

Awaits `schema.validate(values, { abortEarly: false })` and returns `[]` when valid. For a `yup.ValidationError` it maps `err.inner` to `{ code: e.type || "yup-validation", message: e.message, fieldId: e.path || "", details: e.params }`; any other error is rethrown.

### 2.3 Choosing an adapter

| Criterion | `ZodValidationAdapter` (core) | `validateZodSchema` (shared) | `validateYupSchema` (shared) |
|---|---|---|---|
| Kind | class implementing `ValidationAdapter` | async function | async function |
| Location | `src/core/form-core/adapters/` | `src/shared/ui/form/utils/` | `src/shared/ui/form/utils/` |
| Caller | `FormCore` via `validatorAdapter` or a Zod `options.schema` | `useForm().submit()` | `useForm().submit()` |
| Trigger | per-event, honoring `validationMode` | once, before `form.submit()` | once, before `form.submit()` |
| Result | `DetailedError[]` or `Record<string, DetailedError[]>` | `DetailedError[]` | `DetailedError[]` |
| Library | Zod | Zod | Yup (deprecated path) |

Rules:

- Pass a schema to `useForm` through `validationSchema` (or its alias `schema`). The engine then runs field-level validation through `ZodValidationAdapter` when the schema is Zod, and `submit()` runs `validateZodSchema` or `validateYupSchema` first, choosing Yup when the object has no `safeParse` function ([useForm.tsx](../../../src/shared/ui/form/hooks/useForm.tsx)).
- Construct a `ValidationAdapter` directly when driving `FormCore`/`Form` without `useForm`, or when swapping adapters at runtime through `form.setValidator()`.
- The pluggable contract itself is `ValidationAdapter` in [validation-adapter.ts](../../../src/core/form-core/validation-adapter.ts). Custom adapters (server-side checks, other libraries) implement that interface; registration and lookup are covered in [02-REGISTRIES.md](02-REGISTRIES.md).

---

## 3. Accessibility utilities

### 3.1 `src/core/form-core/utils/accessibility.ts`

[accessibility.ts](../../../src/core/form-core/utils/accessibility.ts)

Builds ARIA attribute sets from a `FormField` definition plus its validation state, and audits fields for missing accessible labels in development builds. Pure functions; no React or DOM access.

#### `FIELD_ROLES`

```ts
export const FIELD_ROLES: Record<string, string>
```

Static map from field type to ARIA role, used when a field does not declare its own role.

| Field type | Role |
|---|---|
| `text`, `textarea`, `email`, `password`, `phone`, `url`, `date`, `time` | `textbox` |
| `number` | `spinbutton` |
| `search_input` | `searchbox` |
| `select`, `autocomplete` | `combobox` |
| `multiselect` | `listbox` |
| `checkbox` | `checkbox` |
| `radio` | `radio` |
| `switch` | `switch` |
| `slider`, `rating` | `slider` |

#### `buildAriaAttributes`

```ts
export function buildAriaAttributes(
  field: FormField,
  error?: string | boolean,
  errorMessage?: string
): Record<string, string | boolean | undefined>
```

Derives `role`, `aria-label`, `aria-required`, `aria-disabled`, `aria-describedby`, `aria-invalid`, `aria-errormessage`, and (for `accordion` fields) `aria-expanded` from the field definition. When `error` or `errorMessage` is truthy the result carries `aria-invalid: true` and `aria-errormessage` of the form `<field.id>-error`; otherwise `aria-invalid` is `false`.

#### `auditField`

```ts
export function auditField(field: FormField)
```

Development-only console audit. Returns immediately unless `process.env.NODE_ENV === "development"`; otherwise it warns when a role-bearing field has no label and when an `image` field has no `properties.alt`.

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

Merges `baseProps` with schema-declared accessibility metadata (`field.meta.accessibility`: `ariaLabel`, `description`, `role`, `liveRegion`, `atomic`) and with the runtime attributes from `buildAriaAttributes`. Calls `auditField` first, then returns `baseProps` overridden by schema ARIA, runtime ARIA, and `aria-describedby` when the field has a description.

---

## 4. Expression evaluation

### 4.1 `src/core/form-core/utils/expression-evaluator.ts`

[expression-evaluator.ts](../../../src/core/form-core/utils/expression-evaluator.ts)

Evaluates condition strings and template placeholders against a data object. Used for conditional visibility expressions and for URL/label interpolation in remote option handling.

#### `ExpressionEvaluator`

```ts
export class ExpressionEvaluator {
  static evaluate(
    expression: string | boolean | undefined,
    context: any
  ): boolean

  static interpolate(template: string, data: any): string

  static get(obj: any, path: string)
}
```

Static-only utility class; no instances are created. Evaluation failures are logged and coerced to `false`.

##### `ExpressionEvaluator.evaluate`

```ts
static evaluate(
  expression: string | boolean | undefined,
  context: any
): boolean
```

Returns a boolean `expression` unchanged and returns `true` for an empty/falsy expression (an absent condition means "no constraint"). Otherwise it evaluates `expression` as a function body with a `data` parameter via `new Function("data", ...)`; a throw is caught, logged with the expression text, and yields `false`.

##### `ExpressionEvaluator.interpolate`

```ts
static interpolate(template: string, data: any): string
```

Replaces `{path}` and `{{path}}` tokens with values resolved through `ExpressionEvaluator.get`, trimming the captured path. Missing or nullish values are replaced by an empty string; a falsy template returns `""`.

##### `ExpressionEvaluator.get`

```ts
static get(obj: any, path: string)
```

Splits `path` on `.` and reduces over the object to read deep properties (`"user.name"`). Returns `undefined` when `obj` or `path` is falsy or when an intermediate segment is nullish.

---

## 5. Normalization & identity

### 5.1 `src/core/form-core/utils/normalization-utils.ts`

[normalization-utils.ts](../../../src/core/form-core/utils/normalization-utils.ts)

Shared identity helpers used by both the render-tree normalizer and the engine's flat-map normalization so id/name generation cannot drift between the two paths. Pure functions over plain objects.

#### `hashString`

```ts
export function hashString(input: string): string
```

Computes a djb2-style hash (`5381`, `hash * 33 ^ charCode`) and returns it as an absolute base-36 string. Deterministic for a given input; used only for stable id derivation.

#### `getDeterministicId`

```ts
export function getDeterministicId(seed: string): string
```

Returns `fld_${hashString(seed)}`. The same seed always produces the same id, which keeps normalization stable across re-renders and server/client passes.

#### `resolveFieldIdentity`

```ts
export function resolveFieldIdentity(
  field: {
    id?: string;
    name?: string;
    key?: string;
    type?: string;
    label?: string;
  },
  pathSeed: string,
  counter: { value: number }
): { id: string; name: string }
```

Applies a fixed priority: existing `id`/`name`, then `key` (fills either missing member), then `name`, then `"<type>_<counter>"` from the shared mutable `counter`, and finally a deterministic id seeded with `pathSeed`, `type`, and `label`. Returns both members, defaulting `name` to the resolved `id`.

---

## 6. i18n resolution

### 6.1 `src/core/form-core/utils/i18n-resolver.ts`

[i18n-resolver.ts](../../../src/core/form-core/utils/i18n-resolver.ts)

Resolves `TranslatedText` objects and raw i18n keys to display strings using the global `i18n` instance from `@i18n/i18n`. Handles namespace selection, language fallback chains, and `{{param}}` interpolation.

#### `resolveTranslation`

```ts
export function resolveTranslation(
  value: string | TranslatedText | any,
  defaultNamespace: string = "features/forms",
  params?: Record<string, any>
): string
```

Returns `""` for a falsy input. For an array it resolves each item and joins the results with a space. For a string it calls `i18n.t` — treating values containing `:` as fully-qualified keys and others as keys in `defaultNamespace`, with the input as `defaultValue` — then interpolates `params`. For a language map it picks `i18n.language`, then the base language segment (`"en"` from `"en-US"`), then each configured `fallbackLng`, and finally the first string-valued entry. Interpolation replaces `{{key}}` tokens, leaving the token intact when the parameter is absent.

---

## 7. Schema compatibility & layout utils

### 7.1 `src/core/form-core/utils/schema-compat.ts`

[schema-compat.ts](../../../src/core/form-core/utils/schema-compat.ts)

Normalizes legacy root-level `events` declarations into the canonical `metadata.events` location. Pure and synchronous; used by both the engine and `useForm`.

#### `toCanonicalMetadataEvents`

```ts
export function toCanonicalMetadataEvents(
  definition: FormDefinition,
  overrides?: Partial<FormMetadataEvents>
): FormDefinition
```

Merges `definition.events` (legacy), `definition.metadata.events`, and `overrides` in that precedence order, then returns a new definition carrying the result in both `events` and `metadata.events`. Outside production it logs a migration warning when only root `events.onChange` / `events.onSelectChange` are present. The input definition is not mutated.

### 7.2 `src/core/form-core/utils/field-layout-utils.ts`

[field-layout-utils.ts](../../../src/core/form-core/utils/field-layout-utils.ts)

Separates a field's logical domain type from its presentation override for renderer and style decisions.

#### `resolveEffectiveFieldType`

```ts
export function resolveEffectiveFieldType(
  field: Pick<FormField, "type" | "meta">
): string
```

Returns `field.meta.ui.component` when it is a non-empty string, otherwise `field.type`. The parameter is narrowed to `type` and `meta`, so partial field objects qualify.

---

## 8. Barrel exports

### 8.1 `src/core/form-core/adapters/index.ts`

[adapters/index.ts](../../../src/core/form-core/adapters/index.ts)

Public entry point for core-level adapters.

```ts
export * from "./zod-adapter";
```

Re-exports `ZodValidationAdapter` and `createZodValidator`. The core root barrel ([index.ts](../../../src/core/form-core/index.ts)) forwards it with `export * from "./adapters"`, so both are available from `@form-core`.

### 8.2 `src/core/form-core/utils/index.ts`

[utils/index.ts](../../../src/core/form-core/utils/index.ts)

Barrel for the six pure utility modules.

```ts
export * from "./normalization-utils";
export * from "./schema-compat";
export * from "./expression-evaluator";
export * from "./accessibility";
export * from "./field-layout-utils";
export * from "./i18n-resolver";
```

Imports resolve through the `@form-core/*` path alias, for example `import { resolveTranslation } from "@form-core/utils";` or a single module with `import { hashString } from "@form-core/utils/normalization-utils";`. The core root barrel does not re-export `./utils`; shared-level modules re-export selected utilities under `src/shared/ui/form/utils/` (covered in [10-SHARED_UTILS.md](10-SHARED_UTILS.md)).

---

**See also:**

- [01-ENGINE.md](01-ENGINE.md) — `FormCore`, `ValidationMode`, and `FormCoreOptions.schema` / `validatorAdapter`
- [02-REGISTRIES.md](02-REGISTRIES.md) — `ValidationAdapter` SPI, `ValidationRegistry`, and adapter registration
- [04-DOMAIN_TYPES.md](04-DOMAIN_TYPES.md) — `FormField`, `FormDefinition`, `FormMetadataEvents`, `TranslatedText`
- [06-HOOKS.md](06-HOOKS.md) — `useForm` consumers of `validateZodSchema` / `validateYupSchema`
- [10-SHARED_UTILS.md](10-SHARED_UTILS.md) — shared-level re-exports of these core utilities
- [11-TYPES_CONTRACTS.md](11-TYPES_CONTRACTS.md) — `DetailedError` and other shared contracts
