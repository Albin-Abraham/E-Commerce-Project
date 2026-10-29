# Form Validation Guide

How to wire validation into Zenith Form Architecture forms: modes, schema adapters, declarative field rules, the error model, programmatic control, UX surfaces, and resilience. All APIs below are verified against the engine and shared UI sources.

---

## 1. Validation modes

### 1.1 The `ValidationMode` type

Defined in [engine.ts](../../src/core/form-core/engine.ts) (exported as `ValidationMode` from `@form-core/engine`):

```ts
export type ValidationMode =
  | "onChange"
  | "onBlur"
  | "onSubmit"
  | "manual"
  | "lazy";
```

| Mode | When validation fires | Typical use |
|---|---|---|
| `onChange` | After every value change, debounced by `validationDebounceMs` (default `300`) | Short, low-latency fields |
| `onBlur` | When a field loses focus (via the React adapter's `onBlur` → `FormExecution.handleFieldBlur`) | **Default** for `FormCore` and `useForm` |
| `onSubmit` | Only inside `form.submit()` | Least intrusive; long forms |
| `manual` | Only via explicit `form.validateFields([...])` calls | Fully controlled flows |
| `lazy` | `onBlur` until the first submit attempt, then `onChange` thereafter | Progressive tightening of feedback |

Mode gating lives in [execution.ts](../../src/core/form-core/modules/execution.ts):

- `onChange`: `processFieldChange` schedules validation after a value write (debounced).
- `onBlur` / `lazy`: `handleFieldBlur` validates on blur.
- `onSubmit` / `manual`: nothing validates on interaction; `FormCore.submit()` / `FormCore.validateFields()` drive validation directly.

Additional change-time triggers that override the mode for a single field:

- A field that is currently **invalid** re-validates on every change regardless of mode (so errors clear as soon as the user fixes them).
- A field with `validation.validateOn` containing `"change"` validates on change; containing `"blur"` validates on blur. The `"submit"` member exists on the type but submit always validates active fields anyway.

`lazy` switch detail: the engine detects "first submit happened" by checking `state.performance.lastSubmissionDurationMs !== undefined`. The `useForm` submit action sets this metric on every submit attempt. If you drive a raw `FormCore` without setting it, `lazy` remains blur-only.

### 1.2 Where the mode is set

| Surface | How |
|---|---|
| Engine options | `new FormCore(definition, values, { validationMode: "onChange" })` or `new Form(definition, values, { validationMode })` ([engine.ts](../../src/core/form-core/engine.ts), [form.ts](../../src/core/form-core/form.ts)) |
| `useForm` hook | `useForm(definition, initialData, { validationMode })` — defaults to `"onBlur"` ([useForm.tsx](../../src/shared/ui/form/hooks/useForm.tsx)) |
| `<Form>` component | `validationMode` prop ([FormProps.ts](../../src/shared/ui/form/FormProps.ts)). If omitted and `definition.settings.showValidationOnTouch` is `true`, `useFormCore` resolves it to `"onBlur"` ([useFormCore.ts](../../src/shared/ui/form/hooks/useFormCore.ts)) |
| Query at runtime | `form.getValidationMode()` |

```tsx
import { useForm } from "@ui/form";

const { form, submit } = useForm(definition, initialValues, {
  validationMode: "lazy",
});
```

### 1.3 Mount validation, debouncing, and pre-write screening

| Option | Default | Behavior |
|---|---|---|
| `validateOnMount` | `false` | Runs `validateFields` for every field ID right after engine construction (useful for server-prefilled data). Passed through `useForm` options; engine-only otherwise. |
| `validationDebounceMs` | `300` | Debounce applied to change-triggered validation in `FormExecution`. Set `0` to validate synchronously on every change. Engine option only. |
| `disableDeferredValidation` | `false` | When `true`, `setValue` screens every candidate value **before** it is written: the field's character-class sanitizers run first, then full rule validation. A failing gate keeps the previous value and records the error — illegal input never reaches `form.values` or `getPayload()`. Set via engine option, or form-level via `definition.metadata.validation.disableDeferredValidation` (resolved by `FormCore.isDeferredValidationDisabled()`). |

```ts
import { Form } from "@form-core/form";

const form = new Form(definition, initialValues, {
  validationMode: "onChange",
  validationDebounceMs: 150,
  validateOnMount: true,
  disableDeferredValidation: true,
});
```

Under the hood, pre-write screening calls `FormValidator.screenCandidate` (see [validator.ts](../../src/core/form-core/modules/validator.ts)), which invokes the active adapter's optional `screenValue` method plus a full `validateField` pass against the candidate.

---

## 2. Schema adapters

Three integration paths exist. Pick the shallowest one that fits.

### 2.1 Shared helpers via `validationSchema` (React path)

`useForm` accepts `schema` or `validationSchema` (both typed `any`, either a Zod object schema or a Yup schema). A schema passed as `validationSchema` is used twice:

1. **Engine adapter** — if the schema has `safeParse` (i.e., it is Zod), the engine constructs a `ZodValidationAdapter` from it, giving per-field validation on every normal validation trigger ([engine.ts](../../src/core/form-core/engine.ts) constructor logic). (`schema` alone also feeds this path.)
2. **Submit-time check** — the `useForm` submit action runs `validateZodSchema` or `validateYupSchema` against the whole value object before `form.submit()`, injecting any issues with `form.setErrors` and focusing the first invalid field ([useForm.tsx](../../src/shared/ui/form/hooks/useForm.tsx)). This step runs only for `validationSchema`.

Helpers live in [zod-adapter.ts](../../src/shared/ui/form/utils/zod-adapter.ts) and [yup-adapter.ts](../../src/shared/ui/form/utils/yup-adapter.ts) (Yup helper is deprecated):

```ts
validateZodSchema(schema: z.ZodType<any>, values: any): Promise<DetailedError[]>
validateYupSchema(schema: yup.AnyObjectSchema, values: any): Promise<DetailedError[]>
```

Note the field ID mapping: these helpers set `fieldId` to `issue.path.join(".")` (the schema key path), whereas the engine adapter maps issues to `field.id`. Schema keys should match field names/IDs for errors to land on the right inputs.

```tsx
import { z } from "zod";
import { useForm } from "@ui/form";

const signupSchema = z
  .object({
    email: z.email(),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    age: z.number().min(18, "Must be at least 18"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupValues = z.output<typeof signupSchema>;

const { values, validity, isValid, submit } = useForm<SignupValues>(
  definition,
  { email: "", password: "", confirmPassword: "", age: 0 },
  { validationMode: "onBlur", validationSchema: signupSchema }
);

const onSubmit = async () => {
  if (!(await submit())) return;
  await api.signup(values);
};
```

A Yup schema passed as `validationSchema` does **not** become the engine's per-field adapter (the engine only auto-wraps schemas with `safeParse`); it is enforced at submit time only, while the internal `ValidationProxy` keeps handling per-field rules.

### 2.2 Engine-native Zod adapter

`ZodValidationAdapter` in [zod-adapter.ts](../../src/core/form-core/adapters/zod-adapter.ts) implements the `ValidationAdapter` port with Zod. Pass the schema as `FormCoreOptions.schema` (or its alias `zodSchema`), or build the adapter explicitly with `createZodValidator`:

```ts
import { z } from "zod";
import { Form } from "@form-core/form";
import { createZodValidator } from "@form-core/adapters";

const profileSchema = z.object({
  fullName: z.string().min(4, "At least 4 characters"),
  email: z.email("Enter a valid email address"),
  department: z.enum(["engineering", "design", "finance"]),
});

type ProfileValues = z.output<typeof profileSchema>;

// Path A — declarative: engine instantiates the adapter for you
const form = new Form<ProfileValues>(definition, initialValues, {
  schema: profileSchema,
  validationMode: "onBlur",
});

// Path B — explicit adapter, e.g. to swap later via setValidator
const formB = new Form<ProfileValues>(definition, initialValues, {
  validatorAdapter: createZodValidator(profileSchema),
});
```

Per-field validation runs `schema.safeParse` against the full values object with the candidate value substituted in, then keeps only issues whose path matches the field (this is what preserves `.refine` cross-field rules). See [./reference/05-ADAPTERS_UTILS.md](./reference/05-ADAPTERS_UTILS.md).

### 2.3 Custom `ValidationAdapter` SPI

The engine depends only on the port in [validation-adapter.ts](../../src/core/form-core/validation-adapter.ts):

```ts
interface ValidationAdapter<TValues extends Record<string, unknown>> {
  validateField(
    field: FormField,
    value: unknown,
    values: TValues
  ): Promise<DetailedError[]> | DetailedError[];
  validateForm(
    values: TValues
  ): Promise<Record<string, DetailedError[]>> | Record<string, DetailedError[]>;
  screenValue?(
    field: FormField,
    value: unknown,
    values?: TValues
  ): { value: unknown; errors: DetailedError[] };
}
```

- `validateField` is what the engine calls (per field, per trigger). Returning a `Promise` enables async/server-side checks.
- `validateForm` is not called by the engine loop; implement it for whole-object libraries that validate faster in one pass, or return `{}`.
- `screenValue` is only consulted when `disableDeferredValidation` is on.

```ts
import type { FormField } from "@form-core/domain";
import type { DetailedError } from "@form-core/int-types";
import type { ValidationAdapter } from "@form-core/validation-adapter";

type Values = Record<string, unknown>;

class RequiredWhenPrimarySetAdapter implements ValidationAdapter<Values> {
  validateField(field: FormField, value: unknown, values: Values): DetailedError[] {
    if (field.name === "backupEmail" && values.primaryEmail && !value) {
      return [
        {
          code: "required",
          message: "Backup email is required when a primary email is set",
          fieldId: field.id,
        },
      ];
    }
    return [];
  }

  validateForm(): Record<string, DetailedError[]> {
    return {};
  }
}

// At construction:
const form = new Form(definition, values, {
  validatorAdapter: new RequiredWhenPrimarySetAdapter(),
});

// Or at runtime (takes effect on the next validate/submit; existing errors are kept):
form.setValidator(new RequiredWhenPrimarySetAdapter());
```

Registry mechanics for adapters and the built-in strategy registry are documented in [./reference/02-REGISTRIES.md](./reference/02-REGISTRIES.md).

---

## 3. Declarative field rules

### 3.1 `ValidationSettings` on a field

Each `FormField` may carry `validation?: ValidationSettings` ([validation.ts](../../src/core/form-core/domain/validation.ts)):

| Key | Type | Effect |
|---|---|---|
| `rules` | `ValidationRule[]` | Executed by the internal `ValidationProxy` (see 3.2) |
| `async` | `AsyncValidation` | Declared contract for API-backed validation (see 3.3) |
| `crossField` | `CrossFieldValidation[]` | Registers revalidation dependencies (see 3.3) |
| `dependsOn` | `string[]` | Source fields whose changes retrigger this field's validation |
| `validateOn` | `("change" \| "blur" \| "submit")[]` | Per-field trigger override (`change`/`blur` are honored by `FormExecution`) |
| `groups` | `{ name, fields, validateTogether?, triggerOn? }[]` | Declared validation groups |
| `debounceMs` | `number` | Declared per-field debounce (declared on the type; the engine currently applies only the global `validationDebounceMs`) |
| `disableDeferredValidation` | `boolean` | Form-level equivalent lives on `definition.metadata.validation` |

### 3.2 Rule kinds

`ValidationRule.type` members ([validation.ts](../../src/core/form-core/domain/validation.ts)):

| Rule | `value` | Checks |
|---|---|---|
| `required` | — | Non-empty value (also available as the top-level `field.required` shorthand) |
| `min` / `max` | number | Numeric bounds |
| `minLength` / `maxLength` | number | String/array length (`min`/`max` strategies are aliased for both) |
| `pattern` | named pattern key or raw regex string | Format regex |
| `email` | — | Email syntax |
| `url` | — | URL syntax |
| `phone` | — | Phone number (async `libphonenumber-js` check) |
| `date` / `time` | — | Date/time formats |
| `creditCard` | — | Card number checksum |
| `uuid` | — | UUID format |
| `fileSize` | max bytes | Upload size |
| `fileType` | allowed MIME types | Upload type |
| `alphanumeric` | — | Letters and digits only (strategy also sanitizes) |
| `digitsOnly` | — | Digits only |
| `alphaOnly` | optional extra allowed chars | Letters only |
| `ip` | — | IP address |
| `postalCode` | optional country hint | Postal code format |
| `matches` / `match` | target field name, or `RegExp` | Value equals another field's value, or regex |
| `custom` | — | Uses the rule's `fn` |
| `keyof CustomValidationTypes` | — | Consumer-registered strategies via `registerValidationStrategy` |

Rule modifiers:

| Field | Type | Effect |
|---|---|---|
| `value` | `any` | Rule parameter (bound, length, pattern, target field, ...) |
| `fn` | `(value, form) => boolean \| string` | For `custom` rules; a returned string becomes the message |
| `message` | `string` | Overrides the strategy default message |
| `severity` | `"error" \| "warning" \| "info"` | Declared on the rule; the built-in strategies emit blocking errors only — `ValidityState.warning` is reserved but not populated by `ValidationProxy` |
| `when` | `ConditionExpression` | Conditional rule: skipped when the condition is false |

```ts
const field = {
  id: "email_id",
  name: "email",
  type: "email",
  label: "Work email",
  required: true,
  validation: {
    rules: [
      { type: "required", message: "Email is required" },
      { type: "email" },
      {
        type: "pattern",
        value: "^[^@]+@company\\.com$",
        message: "Use your company email address",
        when: { /* ConditionExpression: e.g. employmentType equals "full-time" */ },
      },
    ],
    validateOn: ["change", "blur"],
    dependsOn: ["employmentType"],
  },
} as const;
```

The built-in proxy runs three passes ([validation-proxy.ts](../../src/core/form-core/validation-proxy.ts)): the top-level `required` shorthand (boolean or reactive expression), the explicit `rules` array, then implicit type-based rules (`type: "email"` etc. validate automatically; `date`, `time`, `text`, `password`, `textarea` are excluded, and empty optional values are skipped).

### 3.3 Async and cross-field validation

**`AsyncValidation`** ([validation.ts](../../src/core/form-core/domain/validation.ts)) declares the shape `{ url, method?, payloadFields?, responsePath?, validationExpr?, message?, retryCount?, timeoutMs?, cacheTTL?, headers? }`. It is a domain contract — no engine module currently executes `validation.async` over HTTP. For API-backed checks, use one of:

- an async `ValidationAdapter.validateField` (2.3),
- `field.remoteOptions` for option-list fetching,
- middleware (`form.use`) plus `setError` after an API round-trip,
- `field.validation.timeoutMs` — this one **is** honored: `FormValidator` uses it (default `5000`) as the timeout for any async `validateField` promise.

**`CrossFieldValidation`** is `{ fields: string[]; validator: (values) => boolean | string; message: string; severity?: "error" | "warning" }`. The field registry reads `validation.crossField[].fields` (and `dependsOn`, and `match`/`matches` rules) to build the **validation dependency graph** ([field-registry.ts](../../src/core/form-core/modules/field-registry.ts)). When a source field changes, the transaction coordinator re-validates each dependent field — but only if that dependent field is dirty, touched, or currently invalid ([transaction-coordinator.ts](../../src/core/form-core/modules/transaction-coordinator.ts)). The `validator` functions themselves are not evaluated by `ValidationProxy`; express the actual check with one of:

1. A `match`/`matches` rule (equality against another field):

```ts
validation: {
  rules: [
    { type: "required" },
    { type: "match", value: "password", message: "Passwords must match" },
  ],
}
```

2. A `custom` rule whose `fn` reads sibling values:

```ts
validation: {
  dependsOn: ["startDate"],
  rules: [
    {
      type: "custom",
      message: "End date must be after start date",
      fn: (value, form) => !value || !form.startDate || value > form.startDate,
    },
  ],
}
```

3. Middleware + `setError` (see 5.4) — the canonical pattern for guards that need async data or live outside the schema.

### 3.4 Built-in strategy registry keys

`ValidationRegistry` in [validation-registry.ts](../../src/core/form-core/validation-registry.ts) ships these keys, mapped from rule types (and reused for implicit field-type validation):

`required`, `min`, `minLength`, `max`, `maxLength`, `email`, `phone`, `pattern`, `alphanumeric`, `digitsOnly`, `alphaOnly`, `url`, `ip`, `postalCode`, `date`, `time`, `uuid`, `fileSize`, `fileType`, `matches`, `match`, `custom`.

Extend it with `registerValidationStrategy(name, strategy)` at app startup — strategies provide `validate`, optional `sanitize`, and `defaultMessage`. Full mechanics in [./reference/02-REGISTRIES.md](./reference/02-REGISTRIES.md).

---

## 4. Error model

### 4.1 `DetailedError`

Defined in [state.ts](../../src/core/form-core/domain/state.ts):

| Field | Type | Meaning |
|---|---|---|
| `code` | `string` | Machine-readable key (`"required"`, `"email"`, `"taken"`, ...) |
| `message` | `string` | Human-readable text shown in the UI |
| `fieldId` | `string` | The field this error belongs to |
| `details?` | `unknown` | Extra context (e.g., the raw Zod issue) |

### 4.2 Where errors live

`ValidityState` — the V2 slice, keyed by field ID:

```ts
interface ValidityState {
  [fieldId: string]: {
    valid: boolean;
    errors?: DetailedError[];
    warning?: string;   // non-blocking; not populated by built-in strategies
    pending?: boolean;  // true while an async validator is in flight
  };
}
```

Read it via `form.validity` (engine/facade), the `validity` returned by `useForm`, or `form.state.validity` inside middleware. `form.isValid` aggregates all **visible** fields (`visibility[id] === true`).

### 4.3 Reading errors in components

`form.getComponentProps(fieldId)` resolves a `ResolvedFieldProps` ([int-types.ts](../../src/core/form-core/int-types.ts)) whose `inputProps` carries `value`, `valid`, `errors`, `touched`, `dirty`, `focused`, and the change/blur/focus handlers. The React adapter flattens these onto the top level as `error` (boolean), `errorMessage` (first message), `errors` (full list), and `touched` ([react-adapter.ts](../../src/core/form-core/react-adapter.ts)):

```tsx
const props = form.getComponentProps("email_id");
// props.inputProps.errors: DetailedError[]
// props.inputProps.touched: boolean
```

With `useForm`, server errors from a different shape can be mapped in one call: `setServerErrors(record)` runs `ErrorParser.parse` against `nameToIdMap` before calling `form.setErrors`.

### 4.4 `touched` semantics

- `vitality[fieldId].touched` flips to `true` when a field blurs (the React adapter sets it in `onBlur`) or when `form.submit()` runs — submit marks **all active fields** touched so errors appear even for untouched inputs.
- `form.setTouched(fieldId)` sets it manually.
- `form.validateFields(ids)` does **not** set `touched`; call `setTouched` yourself if you want errors displayed after a partial validation.
- UI shells generally render `FieldFeedback` errors only in edit mode; gating by `touched` is a component-level decision driven by the `touched` prop from `getComponentProps`.

---

## 5. Programmatic control

### 5.1 Injecting errors

```ts
// Single error — replaces any existing errors on that field
form.setError("email_id", {
  code: "taken",
  message: "This email is already registered",
  fieldId: "email_id",
});

// Batch — each entry routes via its own fieldId (server 422 mapping)
form.setErrors([
  { code: "taken", message: "Email already in use", fieldId: "email_id" },
  { code: "invalid", message: "Phone number is invalid", fieldId: "phone_id" },
]);
```

Both delegate to `ErrorManager` ([engine.ts](../../src/core/form-core/engine.ts)). Use `form.resolver.nameToIdMap["email"]` (facade) or `form.engine.nameToIdMap` (raw engine) to translate a field name to its ID.

### 5.2 Validating and submitting

```ts
// Subset (wizard step): validates in parallel, does NOT set touched
const stepOk = await form.validateFields(["name_id", "email_id", "dob_id"]);

// Full form: marks every active field touched, validates in parallel (bypassing
// pending debounces), clears the draft on success when persistence is configured,
// and runs inside the circuit breaker (fallback: false while degraded)
const ok = await form.submit();
```

Notes on `submit()`:

- Hidden fields (`visibility[id] === false`) are skipped; repeater template fields (no vitality entry) and fields inside `reviewOnly` sections are excluded from the active set.
- The whole call is wrapped in `form.circuitBreaker.guard(..., false)` — while the breaker is open, `submit()` resolves `false` without validating (see 7.1).
- With `useForm`, the `submit()` action additionally runs the external `validationSchema` check and focuses the first invalid field.

### 5.3 Swapping validators

```ts
import { createZodValidator } from "@form-core/adapters";

// e.g., tighten rules after a wizard step completes
form.setValidator(createZodValidator(strictSchema));
```

The swap affects the next `setValue`/`submit`; existing errors are not auto-cleared.

### 5.4 Cross-field guard pattern

When a guard cannot be expressed as a schema rule (e.g., two columns of an inline-edit grid), subscribe to the source fields and inject a `DetailedError` (pattern from [INLINE_EDITING.md](../table/v1/INLINE_EDITING.md)):

```tsx
import { useEffect } from "react";

import type { Form } from "@form-core/form";

type RangeValues = { startDate: string; endDate: string };

function DateRangeGuard({ form }: { form: Form<RangeValues> }) {
  useEffect(() => {
    const apply = () => {
      const { startDate, endDate } = form.values;
      if (!endDate || !startDate) return;

      const ok = new Date(endDate) > new Date(startDate);
      if (!ok) {
        form.setError("endDate", {
          code: "after_start",
          message: "End date must be after start date.",
          fieldId: "endDate",
        });
      } else {
        // Guard passes — drop the injected error so the field recovers.
        // Form exposes the headless engine via `.engine` for module access.
        form.engine.errorManager.clearErrors("endDate");
      }
    };

    apply();
    const unsubStart = form.subscribeToField("startDate", apply);
    const unsubEnd = form.subscribeToField("endDate", apply);
    return () => {
      unsubStart();
      unsubEnd();
    };
  }, [form]);

  return null;
}
```

`setError` replaces the field's error list; to clear errors programmatically use `form.engine.errorManager.clearErrors(fieldId)` (or `setErrors(fieldId, [])`) or re-run validation against a passing value. Middleware (`form.use(({ form, fieldId }) => ...)`) is the engine-supported hook point for prefill/reset side effects that accompany such guards.

---

## 6. Validation UX

### 6.1 `FormValidationSummary`

[FormValidationSummary.tsx](../../src/shared/ui/form/components/FormValidationSummary.tsx) renders a form-level alert (`role="alert"`, `aria-live="polite"`) when `valid === false` and `touched === true`. Props are exactly `{ valid: boolean; touched: boolean }`. `FormShell` mounts it automatically; mount your own when building a custom shell:

```tsx
import { FormValidationSummary } from "@ui/form";

// e.g., from useForm state — show once the user has interacted or submitted
const anyTouched = Object.values(vitality).some((v) => v.touched);
<FormValidationSummary valid={isValid} touched={anyTouched} />
```

### 6.2 `useValidationJump`

[useValidationJump.ts](../../src/shared/ui/form/hooks/useValidationJump.ts) returns `jumpToFirstError()`. It finds the first invalid field in `form.validity`, walks the ancestor chain, expands enclosing accordions and activates the enclosing tab via the layout manager, then scrolls to and focuses the invalid control (280ms settle delay). Requires `FormRegistryContext` and `LayoutManagerContext` (i.e., call it inside a form surface).

```tsx
import { useValidationJump } from "@ui/form";

const jump = useValidationJump();
// after a failed submit:
jump();
```

### 6.3 `focusFirstInvalidField` and `createAnnouncement`

From [accessibility-runtime.ts](../../src/shared/ui/form/utils/accessibility-runtime.ts) (exported by `@ui/form`):

- `focusFirstInvalidField()` — DOM-level: queries `[data-field-id][aria-invalid="true"]`, scrolls it into view, focuses its inner input.
- `createAnnouncement(message, "polite" | "assertive")` — writes into a shared `#form-announcer` live region for screen-reader announcements (validation summaries, submit confirmations).

`useForm`'s submit action performs its own equivalent focus/scroll pass (scoped to `[data-overlay-body]` when present).

### 6.4 `enhanceFieldProps`

[accessibility.ts](../../src/core/form-core/utils/accessibility.ts) exports `enhanceFieldProps(field, baseProps, config?)`, which merges schema-declared ARIA (`field.meta.accessibility`) with runtime ARIA built from the field type, `required`, `enabled`, `description`, and the error state:

- `aria-invalid` (`true` when an error is present, otherwise `false`)
- `aria-errormessage` → `${field.id}-error`
- `aria-describedby` → `${field.id}-description`
- role from `FIELD_ROLES` (`textbox`, `combobox`, `spinbutton`, ...)

```tsx
import { enhanceFieldProps } from "@ui/form";

const props = enhanceFieldProps(field, baseProps, {
  error: !valid,
  errorMessage: errors[0]?.message,
});
```

### 6.5 Error display via `FieldFeedback`

[FieldFeedback.tsx](../../src/shared/ui/form/structure/FieldFeedback.tsx) is the standard error/help renderer used inside `FieldShell`. It accepts `errors?: DetailedError[]` (multi-error list) plus `errorMessage`/`error` (single message), renders helper text above and a `role="alert"` / `aria-live="assertive"` error block below, and hides errors in view mode. Field wrappers wire it automatically from `getComponentProps` — custom fields should pass `errors={props.inputProps.errors}` explicitly.

---

## 7. Resilience

### 7.1 Circuit breaker

[CircuitBreaker.ts](../../src/core/form-core/modules/circuit-breaker.ts) isolates failures so a broken path degrades instead of crashing the form.

| State | Behavior |
|---|---|
| `CLOSED` | Normal operation |
| `OPEN` | Calls short-circuit and return the fallback value |
| `HALF_OPEN` | After `resetTimeoutMs`, a limited number of probes are allowed through |

Engine wiring ([engine.ts](../../src/core/form-core/engine.ts)):

| Option | Default | Meaning |
|---|---|---|
| `circuitBreakerThreshold` | `3` | Consecutive failures before the circuit opens |
| `circuitBreakerResetTimeoutMs` | `30000` | Wait before attempting recovery |
| `circuitBreakerMaxHalfOpenProbes` | `2` | Max probes during `HALF_OPEN` |

`form.submit()` runs inside `circuitBreaker.guard(fn, false)` — while open, submit resolves `false`. `form.isDegraded` reflects `circuitBreaker.isOpen()`. Recover explicitly with `form.resetCircuitBreaker()` (clears all field and global entries). Breakers are also **per-field** for custom field components; see the shared singleton `formCircuitBreaker` exported from `@ui/form`.

### 7.2 Validation timeouts and staleness

`FormValidator.executeWithTimeout` ([validator.ts](../../src/core/form-core/modules/validator.ts)) wraps every adapter promise:

- Timeout: `field.validation.timeoutMs` or `5000` ms. On timeout the call resolves with `[]` (treated as valid) and logs a warning.
- Rejection: caught, logged, resolved with `[]` — a failing async validator never throws into `setValue`.
- Staleness: each field keeps a monotonically increasing transaction counter; when a newer keystroke supersedes an in-flight validation, the older result is discarded instead of writing errors.
- While an async validation is in flight, `validity[fieldId].pending` is `true` (use it to render spinners).

---

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Errors never appear while typing | Mode is `onBlur`/`onSubmit`/`manual` | Set `validationMode: "onChange"` (or per-field `validateOn: ["change"]`); for `lazy`, submit once to flip modes |
| Errors appear on first keystroke | `validateOnMount: true` on a form with empty required fields | Set `validateOnMount: false` (default) |
| Change validation lags behind typing | Default 300ms debounce | Lower `validationDebounceMs` (e.g., `0`) on the engine options |
| Zod/Yup errors injected but not shown on inputs | Helper `fieldId` is the schema path, not the engine field ID | Name schema keys exactly as field names, or rely on the engine `ZodValidationAdapter` which maps to `field.id` |
| Yup schema never fires per-field | Engine only auto-wraps schemas with `safeParse` | Expect submit-time enforcement only, or implement a `ValidationAdapter` (2.3) |
| `validation.async` does nothing | Contract type only — no engine executor | Use an async `ValidationAdapter`, `remoteOptions`, or middleware + `setError` |
| `crossField[].validator` does nothing | Dependency graph is wired; the function is not executed by `ValidationProxy` | Use a `match` rule, a `custom` rule `fn`, or middleware + `setError` (3.3) |
| Wizard step validates the whole form | Calling `form.submit()` for step gating | Use `form.validateFields(stepFieldIds)` per step |
| Partial validation shows no errors | `validateFields` does not set `touched` | Call `form.setTouched(fieldId)` for the validated fields |
| Hidden field blocks submission | Stale injected error on a now-hidden field | Hidden fields are skipped by the validator; clear leftovers via `form.engine.errorManager.clearErrors(id)` or re-run visibility |
| Submit always returns `false` with no errors | Circuit breaker is open (degraded) | Call `form.resetCircuitBreaker()`; inspect `form.isDegraded` |
| Async validation resolves valid despite failures | Timeout (`timeoutMs`, default 5000ms) or rejection swallowed by design | Check network/console logs; raise `field.validation.timeoutMs`; render `validity[id].pending` |
| Custom strategy never runs | Rule type not registered | Register via `registerValidationStrategy` before form construction |
| Warning severity renders as a blocking error | Built-in strategies emit `DetailedError`s only | Treat `severity` as advisory metadata; render warnings yourself from `ValidityState` |

---

**See also:**

- [QUICK_START.md](./QUICK_START.md) — form patterns including headless `useForm`
- [FORM_ARCHITECTURE.md](./FORM_ARCHITECTURE.md) — engine composition and the 5V state
- [PERSISTENCE_AND_URL_SYNC.md](./PERSISTENCE_AND_URL_SYNC.md) — draft persistence and URL synchronization
- [./reference/01-ENGINE.md](./reference/01-ENGINE.md) — `FormCore` / `Form` API reference
- [./reference/02-REGISTRIES.md](./reference/02-REGISTRIES.md) — validation strategy registry and adapter port
- [./reference/05-ADAPTERS_UTILS.md](./reference/05-ADAPTERS_UTILS.md) — Zod/Yup adapters and shared validation helpers
- [./reference/06-HOOKS.md](./reference/06-HOOKS.md) — `useForm`, `useValidationJump`, and URL sync hooks
- [../table/v1/INLINE_EDITING.md](../table/v1/INLINE_EDITING.md) — cross-column guard pattern in table cells
