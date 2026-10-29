# Zenith Form Hooks Reference

React hooks exported from `src/shared/ui/form/hooks/`. The barrel [index.ts](../../../src/shared/ui/form/hooks/index.ts) re-exports most hooks through `@ui/form`; hooks marked *path-only* below are not in the barrel and must be imported from their own file.

| Section | Area |
|---|---|
| 1 | Quick index of every documented hook |
| 2 | `useForm` — engine creation, options, return contract |
| 3 | Engine access hooks |
| 4 | Field hooks |
| 5 | URL sync hooks |
| 6 | Array hooks |
| 7 | Permission hooks |
| 8 | Lifecycle and event hooks |
| 9 | Deprecated aliases |

---

## 1. Quick index

| Hook | One-line purpose | Section |
|---|---|---|
| `useForm` | Creates the form engine instance and exposes state plus actions | [2](#2-useform) |
| `useFormContext` | Typed access to the live `FormCore` inside a `<Form>` tree | [3](#3-engine-access-hooks) |
| `useFormCore` | Shared runtime wiring for `<Form>` and `<FormFlow>` | [3](#3-engine-access-hooks) |
| `useFormFacade` | Compiles entity/contract/definition into `<Form>` props and a submit mutation | [3](#3-engine-access-hooks) |
| `useField` | Atomic subscription to one field's resolved component props | [4](#4-field-hooks) |
| `useFieldAtom` | Per-field value/validity/vitality subscription with stable handlers | [4](#4-field-hooks) |
| `useFormField` | Manual render props for one field derived from a `useForm` result | [4](#4-field-hooks) |
| `useController` | Full controlled-field state and handlers addressed by key/name/id | [4](#4-field-hooks) |
| `useWatch` | Re-renders only when one field's value changes | [4](#4-field-hooks) |
| `useWatchFields` | Subscribes to several field values and returns a partial object | [4](#4-field-hooks) |
| `useFieldViewModel` | Flattened view-model props for atomic field components | [4](#4-field-hooks) |
| `useFormUrlSync` | Bi-directional form ↔ URL query synchronization through `PlatformUrlPort` | [5](#5-sync-hooks-url) |
| `useFilterUrlSync` | Filter-scoped delegate of `useFormUrlSync` | [5](#5-sync-hooks-url) |
| `useFormArray` | Row operations (`append`, `remove`, `move`, `swap`, `replace`) for repeaters | [6](#6-array-hooks) |
| `useFieldPermission` | Resolves `"edit"` / `"view"` / `"hidden"` for one field | [7](#7-permission-hooks) |
| `usePermissionManager` | Reads or updates the form's permission map at runtime | [7](#7-permission-hooks) |
| `useFormEventDelegation` | Native change/blur delegation handlers for the `<form>` element | [8](#8-lifecycleevent-hooks) |
| `useFormMiddleware` | Registers middleware functions on the engine | [8](#8-lifecycleevent-hooks) |
| `useValidationJump` | Expands ancestor tabs/accordions and focuses the first invalid field | [8](#8-lifecycleevent-hooks) |
| `useDynamicForm` | Resolves a `FormDefinition` from `schemaRegistry` by `formId` | [8](#8-lifecycleevent-hooks) |
| `usePreloadFormFields` | Preloads lazy field components for one or more definitions | [8](#8-lifecycleevent-hooks) |
| `useFormExternalStore` | `useSyncExternalStore` subscription to global structural form state | [8](#8-lifecycleevent-hooks) |
| `useFieldExternalStore` | `useSyncExternalStore` subscription to a single field's props | [8](#8-lifecycleevent-hooks) |
| `useFormSlice` | `useSyncExternalStore` subscription to a selected state slice | [8](#8-lifecycleevent-hooks) |
| `useFormTheme` | Resolves the active theme, style slots, and action classes | [8](#8-lifecycleevent-hooks) |
| `useFormI18n` | Keeps the i18n language in sync with the definition locale | [8](#8-lifecycleevent-hooks) |
| `useFocusTrap` | Traps Tab cycling inside the form container | [8](#8-lifecycleevent-hooks) |
| `useStyleAdapter` | Returns the active `StyleAdapter` (re-exported through the hooks barrel) | [8](#8-lifecycleevent-hooks) |
| `useMDAPForm` | Deprecated alias of `useFormFacade` | [9](#9-deprecated-aliases) |
| `useEntityForm` | Deprecated alias of `useFormFacade` | [9](#9-deprecated-aliases) |

---

## 2. useForm

### 2.1 `src/shared/ui/form/hooks/useForm.tsx`

[useForm.tsx](../../../src/shared/ui/form/hooks/useForm.tsx)

The flagship hook: migrates a `FormDefinition`, instantiates the headless `Form` engine, subscribes the shell to structural state, and exposes typed state and actions. It owns `initialData` synchronization, external schema validation on submit, and persistence teardown.

#### `InitialDataSyncMode`

```ts
export type InitialDataSyncMode = "preserve-dirty" | "force-reset" | "ignore";
```

Selects how later changes to the `initialData` argument affect the live form instance. See the `initialDataSyncMode` option below.

#### `UseFormOptions`

```ts
export interface UseFormOptions<T> {
  /** External validation schema. Pass a Zod schema (preferred) or Yup schema. */
  schema?: any;
  validationSchema?: any;
  validationMode?: ValidationMode;
  validateOnMount?: boolean;
  /**
   * Defines how subsequent changes to `initialData` affect the active form instance.
   * - `"preserve-dirty"` (default): Updates pristine fields with new server data while preserving active user edits on dirty fields.
   * - `"force-reset"`: Resets the entire form with new data, clearing dirty state.
   * - `"ignore"`: Only uses `initialData` on mount; subsequent changes are ignored.
   */
  initialDataSyncMode?: InitialDataSyncMode;
  /**
   * @param values - Current form values after the change.
   * @param field - The field that triggered the change.
   * @returns Optionally return a transformed value to override the engine's update.
   */
  onChange?: (values: T, field?: FormField) => void | any;
  /**
   * @param values - Current form values after the change.
   * @param field - The select/multiselect field that triggered the change.
   * @returns Optionally return a transformed value to override the engine's update.
   */
  onSelectChange?: (values: T, field?: FormField) => void | any;
  i18nNamespace?: string;
  /** Draft persistence configuration. */
  persistence?: PersistenceConfig;
}
```

| Option | Type | Default | Behavior |
|---|---|---|---|
| `schema` | `any` | — | Alias for `validationSchema` when it is the only one passed; forwarded to the engine as `FormCoreOptions.schema`, which makes `FormCore` build a `ZodValidationAdapter` for field-level validation when the schema exposes `safeParse` |
| `validationSchema` | `any` | — | Zod or Yup schema run by `submit()` before `form.submit()`; Zod is detected by the presence of `safeParse` |
| `validationMode` | `ValidationMode` | `"onBlur"` | Validation trigger: `"onChange"` / `"onBlur"` / `"onSubmit"` / `"manual"` / `"lazy"` |
| `validateOnMount` | `boolean` | `false` | Validates all fields immediately after engine construction |
| `initialDataSyncMode` | `InitialDataSyncMode` | `"preserve-dirty"` | Controls how later `initialData` changes are applied |
| `onChange` | `(values, field?) => void \| any` | — | Called after each change; a non-`undefined` return value overrides the engine's stored value |
| `onSelectChange` | `(values, field?) => void \| any` | — | Same contract, raised for `select` / `multiselect` fields |
| `i18nNamespace` | `string` | — | i18n namespace passed to the engine and to `useFormI18n` |
| `persistence` | `PersistenceConfig` | — | Enables draft autosave/rehydration; listeners and timers are destroyed on unmount via `form.destroy?.()` |

`validationMode`, `validateOnMount`, `i18nNamespace`, `schema`, `validationSchema`, `persistence`, and `definition.settings.density` participate in the engine's memo key together with the schema structural signature, so a new `initialData` object reference alone never recreates the engine.

#### `useForm`

```ts
export function useForm<T extends Record<string, any> = Record<string, any>>(
  definition: FormDefinition,
  initialData?: Partial<T>,
  options?: UseFormOptions<T>
)
```

Runs `SchemaMigrator.migrate(definition, "1.0.0")`, merges `metadata.events` through `toCanonicalMetadataEvents`, and constructs `new Form<T>(mergedDefinition, initialData, ...)`. The return object has no explicit annotation; its fields are:

```ts
return {
  form,
  // State
  values: form.values,
  validity: form.validity,
  view: form.view,
  vitality: form.vitality,
  visibility,
  isDirty,
  isValid,
  // Actions
  ...actions,
};
```

| Field | Kind | Behavior |
|---|---|---|
| `form` | `Form<T>` | The live engine facade; full engine API (reset, validateFields, undo/redo, rows, …) |
| `values` | `T` | Current form values |
| `validity` | `Readonly<ValidityState>` | Per-field validation state keyed by field id |
| `view` | `Readonly<ViewState>` | Presentation state (labels, placeholders, options) |
| `vitality` | `Readonly<VitalityState>` | `touched` / `dirty` / `focused` flags per field |
| `visibility` | `Record<string, boolean>` | Field visibility, re-read on each structural version change |
| `isDirty` | `boolean` | Any visible field carries `dirty` |
| `isValid` | `boolean` | No field holds a validation error |
| `setValue` | `(fieldId: string, val: any) => void` | Writes a value through the engine |
| `setTouched` | `(fieldId: string) => void` | Marks a field touched |
| `submit` | `() => Promise<boolean>` | Runs external `validationSchema` validation, then `form.submit()`; on failure it scrolls to and focuses the first `[data-error="true"]` / `[aria-invalid="true"]` element and records `lastSubmissionDurationMs` |
| `setServerErrors` | `(errors: Record<string, any>) => void` | Parses backend error payloads through `ErrorParser.parse` against `form.resolver.nameToIdMap` and applies them |
| `setLocale` | `(locale: string) => void` | Delegates to `form.setLocale` |
| `getComponentProps` | `(fieldId: string) => ResolvedFieldProps` | Delegates to `form.getComponentProps` |
| `getPayload` | `() => Partial<T>` | Delegates to `form.getPayload` |

The shell subscribes with `useSyncExternalStore` against `form.structuralVersion`, so the component re-renders only on visibility/dirty/validity changes; per-keystroke updates stay in field-level subscriptions.

```tsx
import { z } from "zod";
import { useForm, type FormDefinition } from "@ui/form";

const signInSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(8, "Minimum 8 characters"),
});

function SignInForm({ definition }: { definition: FormDefinition }) {
  const {
    values,
    isDirty,
    isValid,
    validity,
    submit,
    setServerErrors,
    getComponentProps,
  } = useForm(
    definition,
    { email: "", password: "" },
    {
      validationSchema: signInSchema,
      validationMode: "onBlur",
      validateOnMount: false,
      initialDataSyncMode: "preserve-dirty",
      onChange: (next) => console.log("email:", next.email),
      i18nNamespace: "features/forms",
    }
  );

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const ok = await submit();
        if (!ok) return;
      }}
    >
      <button type="submit" disabled={!isValid || !isDirty}>
        Sign in
      </button>
      <pre>{JSON.stringify(values, null, 2)}</pre>
      <pre>{JSON.stringify(validity, null, 2)}</pre>
      <pre>{JSON.stringify(getComponentProps("email"), null, 2)}</pre>
      <button
        type="button"
        onClick={() => setServerErrors({ email: "Already registered" })}
      >
        Simulate server error
      </button>
    </form>
  );
}
```

---

## 3. Engine access hooks

### 3.1 `src/shared/ui/form/hooks/useFormContext.ts`

[useFormContext.ts](../../../src/shared/ui/form/hooks/useFormContext.ts)

Reads the live `FormCore` instance from the form registry context, for use anywhere inside a `<Form>` tree.

#### `useFormContext`

```ts
export function useFormContext<
  T extends Record<string, any> = Record<string, any>,
>(): FormCore<T>
```

Returns the engine stored on `FormRegistryContext`, narrowed to `T` at compile time. Throws an explicit error when called outside a `<Form>` / `<FormRegistryProvider>`.

```tsx
import { useFormContext } from "@ui/form";

const form = useFormContext<{ email: string }>();
const isValid = form.isValid;
```

### 3.2 `src/shared/ui/form/hooks/useFormCore.ts`

[useFormCore.ts](../../../src/shared/ui/form/hooks/useFormCore.ts)

Shared runtime wiring for the `Form` and `FormFlow` components: engine, middleware, theme, i18n, event delegation, imperative handle, normalized nodes, and provider values.

#### `FormMode`

```ts
export type FormMode = "simple" | "wizard";
```

Selects the render path: `simple` (`Form`) or `wizard` (`FormFlow`).

#### `UseFormCoreOptions`

```ts
export interface UseFormCoreOptions<
  T extends Record<string, any> = Record<string, any>,
> extends FormProps<T> {
  /** Which render path this runtime powers: `simple` (Form) or `wizard` (FormFlow). */
  runtimeMode: FormMode;
  /** Step change callback forwarded to `FormFlowShell` (wizard mode only). */
  onStepChange?: (stepId: string, stepIndex: number) => void;
}
```

Extends `FormProps<T>` (documented in [11-TYPES_CONTRACTS.md](11-TYPES_CONTRACTS.md)) with `runtimeMode` (required) and `onStepChange`. `FormProps` supplies `ref`, `definition`, `initialData`, `validationSchema`, `onSubmit`, `className`, `debug`, `theme`, `adapter`, `onChange`, `onSelectChange`, `registry`, `locale`, `validationMode`, `i18nNamespace`, `middleware`, `motionConfig`, `mode`, `permissions`, `actions`, `shell`, `secondaryActions`, and `navigationGuard`.

#### `FormRuntime`

```ts
export interface FormRuntime<
  T extends Record<string, any> = Record<string, any>,
> {
  definition: FormDefinition<T>;
  /** Raw engine instance (drives intent/flow APIs). */
  form: any;
  isSubmitting: boolean;
  visibility: Record<string, boolean>;
  isDirty: boolean;
  /** Normalized render nodes (sections → steps in wizard mode). */
  nodes: any[];
  layoutMode: any;
  initialStepId: string;
  /** Values ready for `<FormShellProvider {...shellContext}>`. */
  shellContext: Record<string, any>;
  orchestratorValue: any;
  permissions: Record<string, "edit" | "view" | "hidden"> | undefined;
  actions: Record<string, (payload?: any) => Promise<any>> | undefined;
  guardConfig: boolean | NavigationGuardConfig;
  formTitle: any;
  i18nNamespace?: string;
  /**
   * Legacy `onSubmit` prop. Consumed by `executeSubmit`, and also merged into the
   * `ActionProvider` actions as a `submit` fallback (kept for behavior parity).
   */
  onSubmit?: (data: T) => Promise<Record<string, string> | void> | void;
  /** Effective active theme (used by NavigationGuard consumers). */
  theme: any;
  styleAdapter: any;
  registry: RegistryStore;
  mode: "edit" | "view";
  /** Which render path this runtime powers. */
  runtimeMode: FormMode;
  /** Step change callback forwarded to `FormFlowShell`. */
  onStepChange?: (stepId: string, stepIndex: number) => void;
}
```

#### `useFormCore`

```ts
export function useFormCore<
  T extends Record<string, any> = Record<string, any>,
>({
  ref,
  definition,
  initialData,
  validationSchema,
  onSubmit,
  className = "",
  debug = false,
  theme,
  adapter,
  onChange,
  onSelectChange,
  registry = defaultRegistry,
  locale,
  validationMode,
  i18nNamespace,
  middleware,
  motionConfig,
  mode,
  permissions,
  actions,
  shell,
  secondaryActions,
  navigationGuard,
  onStepChange,
  runtimeMode,
}: UseFormCoreOptions<T>): FormRuntime<T>
```

Composes `useForm`, `useFormMiddleware`, `useFormTheme`, `useFormI18n`, `useFormEventDelegation`, and `SchemaNormalizer.normalize` into one runtime object. It also installs the imperative handle (`submit`, `reset`, `setValue`, `getValue`, `setTouched`, `setErrors`, `validate`, `getValues`, `getPayload`, `isValid`, `isDirty`, `isDegraded`, `canUndo`, `canRedo`, `undo`, `redo`, `engine`) via `useImperativeHandle`, and derives `guardConfig` from `navigationGuard ?? definition.settings?.navigationGuard ?? false`.

### 3.3 `src/shared/ui/form/hooks/useFormFacade.ts`

[useFormFacade.ts](../../../src/shared/ui/form/hooks/useFormFacade.ts)

Entity-native facade for authoring forms from a 6-layer `EntityDefinition`, a typed `FormDefinitionContract`, or an already-compiled `FormDefinition`, paired with a TanStack Query submit mutation.

#### `UseFormFacadeOptions`

```ts
export interface UseFormFacadeOptions<T extends Record<string, any>> {
  /** 6-layer MDAP entity (preferred). */
  entity?: EntityDefinition<T>;
  /** Strongly-typed contract (see `defineFormContract` / `withWizard`). */
  contract?: FormDefinitionContract<any>;
  /** Already-compiled definition. */
  definition?: FormDefinition<T>;
  formId?: string;
  submitLabel?: string;
  initialData?: Partial<T>;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}
```

Exactly one of `entity`, `contract`, or `definition` must be supplied; the hook throws `"useFormFacade requires one of: \`entity\`, \`contract\`, or \`definition\`."` otherwise. `formId` defaults to `"mdap_form"` and `submitLabel` to `"Submit"`; both are used when compiling an entity.

#### `UseFormFacadeResult`

```ts
export interface UseFormFacadeResult<T extends Record<string, any>> {
  /** Spread onto `<Form {...formProps} />` (or `<FormFlow>`, etc.). */
  formProps: {
    definition: FormDefinition<T>;
    initialData?: Partial<T>;
    actions: {
      submit: (payload: T) => Promise<{ root: string } | undefined>;
    };
  };
  /** Effective MDAP runtime layers (anti-flattened public boundary). */
  layers: FormLayerModel<T>;
  isSubmitting: boolean;
  submissionError: string | null;
  mutation: UseMutationResult<T, Error, T, unknown>;
}
```

#### `useFormFacade`

```ts
export function useFormFacade<T extends Record<string, any>>({
  entity,
  contract,
  definition,
  formId = "mdap_form",
  submitLabel = "Submit",
  initialData,
  onSuccess,
  onError,
}: UseFormFacadeOptions<T>): UseFormFacadeResult<T>
```

Projects the effective layers (compiling the entity, compiling the contract, or calling `projectLayers` for a definition), then wires a `useMutation` whose `mutationFn` runs the authoring source's `onSubmit` event. On success it invalidates `entity.behavior.mutations.invalidateKeys`, runs `afterSubmit`, and calls `onSuccess`; on error it stores `submissionError` and calls `onError`. `formProps.actions.submit` maps failures to a `{ root: message }` object for server-error display.

```tsx
import { Form, useFormFacade } from "@ui/form";

function EntityForm({ entity }: { entity: any }) {
  const { formProps, isSubmitting, submissionError } = useFormFacade({ entity });
  return (
    <>
      <Form {...formProps} />
      {isSubmitting && <p>Saving…</p>}
      {submissionError && <p role="alert">{submissionError}</p>}
    </>
  );
}
```

---

## 4. Field hooks

### 4.1 `src/shared/ui/form/hooks/useField.tsx`

[useField.tsx](../../../src/shared/ui/form/hooks/useField.tsx)

Atomic per-field subscription built on `useSyncExternalStore` and the engine's per-field subscriber set.

#### `useField`

```ts
export function useField(fieldId: string)
```

Subscribes to `form.subscribeToField(fieldId, ...)` and returns the snapshot from `form.getComponentProps(fieldId)` — a reference-stable props object from the React adapter cache. Throws when rendered outside a `<FormRegistryProvider>`.

### 4.2 `src/shared/ui/form/hooks/useFieldAtom.ts`

[useFieldAtom.ts](../../../src/shared/ui/form/hooks/useFieldAtom.ts)

Subscribes to one field's value, validity, and vitality slice and exposes stable input handlers.

#### `useFieldAtom`

```ts
export function useFieldAtom(fieldId: string, fieldName?: string)
```

Initializes local state from the engine snapshot, then listens on `form.stateManager.subscribeToField`, updating state only when the resolved value, validity entry, or vitality entry differs from the previous reference. `fieldName` is the optional dot-notation path used for value resolution (defaults to `fieldId`).

Returns:

| Field | Behavior |
|---|---|
| `value` | Value read through `form.valueProxy.getValue(form.values, fieldName ?? fieldId)` |
| `error` | `form.validity[fieldId]` entry |
| `vitality` | `form.vitality[fieldId]` entry |
| `errorMessage` | First error message when `error.valid === false`, otherwise `undefined` |
| `onChange` | `(val) => form.setValue(fieldName ?? fieldId, val)` |
| `onBlur` | `() => form.setTouched(fieldId)` |
| `onFocus` | `() => form.setVitality(fieldId, { focused: true })` |

### 4.3 `src/shared/ui/form/hooks/useFormFields.tsx`

[useFormFields.tsx](../../../src/shared/ui/form/hooks/useFormFields.tsx)

Manual rendering support outside `FormComposer`, delegating entirely to `form.getComponentProps`.

#### `useFormField`

```ts
export function useFormField(
  formHook: ReturnType<typeof useForm>,
  name: string // Simplified to string for dynamic field IDs or names
)
```

Takes the result object of `useForm` and a field id/name/key, then returns the engine's `ResolvedFieldProps` spread with semantic aliases for custom components.

Returns: every member of `ResolvedFieldProps`, plus `value` (`props.inputProps?.value`), `error` (`Boolean(props.inputProps?.errors?.length)`), `onChange`, `onBlur`, `onFocus` from `inputProps`, and `field` (`form.resolveField(name)`).

```tsx
import { useForm, useFormField } from "@ui/form";

function ManualEmail({ definition }: { definition: any }) {
  const formHook = useForm(definition);
  const { value, error, onChange, onBlur } = useFormField(formHook, "email");
  return (
    <input
      value={String(value ?? "")}
      onChange={(e) => onChange?.(e.target.value)}
      onBlur={onBlur}
      aria-invalid={error}
    />
  );
}
```

### 4.4 `src/shared/ui/form/hooks/useController.ts`

[useController.ts](../../../src/shared/ui/form/hooks/useController.ts)

Controlled-input hook combining `useFormContext` with the `useFieldAtom` micro-subscription.

#### `useController`

```ts
export function useController<T = any>(fieldKey: string)
```

Resolves the field once through `form.resolveField(fieldKey)` (accepting `key`, `name`, or `id`), then subscribes atomically through `useFieldAtom`.

Returns:

| Field | Behavior |
|---|---|
| `value` | `atom.value as T` |
| `error` | Validity entry for the field |
| `errorMessage` | First error message, or `undefined` |
| `vitality` | Touched/dirty/focused flags |
| `onChange`, `onBlur`, `onFocus` | Stable handlers from `useFieldAtom` |
| `field` | Resolved `FormField` definition, or `undefined` when not found |
| `fieldId` | The `fieldKey` argument as passed |
| `fieldName` | `field?.name ?? fieldKey` |
| `componentProps` | Memoized `form.getComponentProps(fieldKey)`; spread onto a UI component |

```tsx
import { useController } from "@ui/form";

function CustomEmailInput() {
  const { value, error, errorMessage, onChange, onBlur, field } =
    useController<string>("email");
  return (
    <input
      value={value ?? ""}
      onChange={(e) => onChange?.(e.target.value)}
      onBlur={onBlur}
      aria-invalid={!!error}
      aria-describedby={error ? `${field?.id}-error` : undefined}
      title={errorMessage}
    />
  );
}
```

### 4.5 `src/shared/ui/form/hooks/useWatch.ts`

[useWatch.ts](../../../src/shared/ui/form/hooks/useWatch.ts)

Value-level subscriptions over the engine's per-field notification channel.

#### `useWatch`

```ts
export function useWatch<T = any>(fieldKey: string): T
```

Re-renders the calling component only when this field's value changes. Resolves `fieldKey` as `key`, `name`, or `id`, subscribes to `form.subscribeToField` for both the id and the data path, and snapshots through `form.valueProxy.getValue(form.values, valuePath)`.

```tsx
import { useWatch } from "@ui/form";

function RoleAwarePanel() {
  const role = useWatch<string>("role");
  return role === "admin" ? <AdminPanel /> : null;
}
```

#### `useWatchFields`

```ts
export function useWatchFields<
  T extends Record<string, any> = Record<string, any>,
>(fieldKeys: string[]): Partial<T>
```

Returns a stable partial object keyed by the requested field keys. Key identity is tracked as a joined string so a new array reference with the same contents does not resubscribe; the snapshot object only changes identity when a watched value changes.

### 4.6 `src/shared/ui/form/hooks/useFieldViewModel.ts`

[useFieldViewModel.ts](../../../src/shared/ui/form/hooks/useFieldViewModel.ts)

Produces flattened, UI-ready props for atomic field components. *Path-only*: not re-exported by `hooks/index.ts` — import with `import { useFieldViewModel } from "@ui/form/hooks/useFieldViewModel";`.

#### `FieldViewModelProps`

```ts
export interface FieldViewModelProps extends FieldComponentProps {
  value: unknown;
  onChange?: (value: unknown) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: boolean;
  errorMessage?: string;
  errors?: ReadonlyArray<DetailedError>;
  isInvalid: boolean;
  isEmpty: boolean;
  options?: ReadonlyArray<{ label: string; value: unknown }>;
  isLoading?: boolean;
  onSearch?: (query: string) => void;
}
```

#### `adaptEnginePropsToViewModel`

```ts
export function adaptEnginePropsToViewModel(
  fieldId: string,
  fieldProps: unknown,
  form?: {
    remoteOptions?: {
      executeSearch: (fieldId: string, query: string) => void;
    };
  } | null
): FieldViewModelProps
```

Pure, React-free mapping function: it spreads the resolved props, lifts `inputProps` members to the top level, derives `error` / `errorMessage` / `errors`, forwards `options` and `isLoading` from the resolution pipeline, binds `onSearch` to `form.remoteOptions.executeSearch`, and computes `isInvalid` (`errors.length > 0`) and `isEmpty` (value is `undefined`, `null`, or `""`).

#### `useFieldViewModel`

```ts
export function useFieldViewModel(fieldId: string): FieldViewModelProps
```

Combines `useField(fieldId)` with the engine from `useFormRegistry()` and memoizes `adaptEnginePropsToViewModel`. It is the data source used by `withViewModel` for custom field drivers.

---

## 5. Sync hooks (URL)

### 5.1 `src/shared/ui/form/hooks/useFormUrlSync.ts`

[useFormUrlSync.ts](../../../src/shared/ui/form/hooks/useFormUrlSync.ts)

Bi-directional synchronization between a form engine and URL search parameters through the `PlatformUrlPort` port, without touching browser history directly.

#### `UseFormUrlSyncOptions`

```ts
export interface UseFormUrlSyncOptions<T extends Record<string, any>> {
  /** The form engine instance to synchronize with URL. */
  form: Form<T>;
  /** Optional namespace scope (e.g. "filters", "products"). Prevents param collisions. */
  scope?: string;
  /** Injected URL adapter port. Defaults to PlatformUrlAdapters.useReactRouter(scope). */
  port?: PlatformUrlPort;
  /** Debounce delay in ms for input synchronization. Defaults to 300ms. */
  debounceMs?: number;
  /** Custom serializer mapping form values to URL entries. */
  serialize?: (values: T) => Record<string, string | string[]>;
  /** Custom deserializer mapping URLSearchParams back to form state. */
  deserialize?: (params: URLSearchParams) => Partial<T>;
  /** If true, uses history.replaceState (default: true). */
  replaceHistory?: boolean;
  /**
   * Wizard step synchronization.
   * If true (or custom string param key like "step"), keeps the active wizard step in sync with URL.
   */
  syncStep?: boolean | string;
  /** Active wizard context step ID if synchronizing multi-step flows. */
  currentStepId?: string;
  /** Wizard step jump callback to navigate steps when browser back/forward is used. */
  onStepChange?: (stepId: string) => void;
}
```

#### `useFormUrlSync`

```ts
export function useFormUrlSync<T extends Record<string, any>>({
  form,
  scope,
  port: injectedPort,
  debounceMs = 300,
  serialize,
  deserialize,
  replaceHistory = true,
  syncStep = false,
  currentStepId,
  onStepChange,
}: UseFormUrlSyncOptions<T>)
```

Three effects drive the loop: inbound hydration on mount/popstate (reading `port.snapshot()`, stripping the `scope` prefix, parsing primitives/arrays, and calling `form.setValue`), outbound writes on `form.subscribe` (marking empty values `null` for deletion), and wizard step writes keyed by `syncStep` (param name defaults to `"step"`). An `isHydrating` ref released on the next animation frame prevents echo loops, and only form-owned keys are touched, so unrelated query parameters are preserved. Returns `{ port }` — the injected port or `PlatformUrlAdapters.useReactRouter({ scope, replace, debounceMs })`.

```tsx
import { useForm, useFormUrlSync } from "@ui/form";

function SearchFilters({ definition }: { definition: any }) {
  const { form } = useForm(definition);
  useFormUrlSync({ form, scope: "filters", debounceMs: 300 });
  return null;
}
```

### 5.2 `src/shared/ui/form/hooks/useFilterUrlSync.ts`

[useFilterUrlSync.ts](../../../src/shared/ui/form/hooks/useFilterUrlSync.ts)

Filter-oriented delegate of `useFormUrlSync`; identical behavior without wizard step options.

#### `UseFilterUrlSyncOptions`

```ts
export interface UseFilterUrlSyncOptions<T extends Record<string, any>> {
  form: Form<T>;
  /** Optional namespace scope (e.g. "filters", "products"). Prevents param collisions. */
  scope?: string;
  /** Injected URL adapter port for decoupling from router. */
  port?: PlatformUrlPort;
  /**
   * How long to wait after the last keystroke before writing to the URL.
   * Defaults to 300ms to prevent flooding the browser history API.
   */
  debounceMs?: number;
  /**
   * Transforms Engine Data (e.g. Dates, Arrays) into simple string records for the URL.
   * Omitting undefined or empty strings keeps the URL clean.
   */
  serialize?: (values: T) => Record<string, string | string[]>;
  /**
   * Transforms raw URL strings back into strongly-typed Engine Data (e.g. "18" -> 18).
   */
  deserialize?: (params: URLSearchParams) => Partial<T>;
  /**
   * If true, uses history.replaceState (doesn't add to back-button history).
   * Defaults to true for inline typing.
   */
  replaceHistory?: boolean;
}
```

#### `useFilterUrlSync`

```ts
export function useFilterUrlSync<T extends Record<string, any>>({
  form,
  scope,
  port,
  debounceMs = 300,
  serialize,
  deserialize,
  replaceHistory = true,
}: UseFilterUrlSyncOptions<T>)
```

Forwards every option to `useFormUrlSync` and returns its result (`{ port }`). Engine → URL writes are debounced and non-destructive; URL → engine hydration is back-button safe.

---

## 6. Array hooks

### 6.1 `src/shared/ui/form/hooks/useFormArray.ts`

[useFormArray.ts](../../../src/shared/ui/form/hooks/useFormArray.ts)

RHF-compatible operations for repeater/array fields, with stable row identity keys and engine-side row mutation.

#### `UseFormArrayReturn`

```ts
export interface UseFormArrayReturn<TItem = Record<string, any>> {
  /** Array of row items, each guaranteed to have a stable `id` for React `key` props. */
  fields: Array<TItem & { id: string }>;
  /** Appends a new row to the array, auto-assigning an immutable row identity. */
  append: (item?: Partial<TItem>) => string;
  /** Removes a row by index or stable identity ID. */
  remove: (indexOrRowId: number | string) => void;
  /** Moves a row from `fromIndex` to `toIndex`, preserving all state slices. */
  move: (fromIndex: number, toIndex: number) => void;
  /** Swaps two rows by index. */
  swap: (indexA: number, indexB: number) => void;
  /** Replaces the entire array of values. */
  replace: (items: TItem[]) => void;
}
```

#### `useFormArray`

```ts
export function useFormArray<TItem = Record<string, any>>(
  name: string
): UseFormArrayReturn<TItem>
```

Resolves the field through `useFormContext().resolveField(name)`, subscribes to the field id, the data path, and the global channel, and maps each row to expose `id` (preferring `_rowId`, then a business `id`, then `row_<index>`) for React list keys. `append`/`remove`/`move` delegate to `form.appendRow` / `form.removeRow` / `form.moveRow`; `swap` validates indices and composes two `moveRow` calls inside `form.batch` when the distance is greater than 1; `replace` writes the whole array through `form.setValue`. Rows are never serialized into payloads under the synthetic id key.

```tsx
import { useFormArray } from "@ui/form";

function Rows() {
  const { fields, append, remove } = useFormArray<{ label: string }>("items");
  return (
    <ul>
      {fields.map((row) => (
        <li key={row.id}>
          {row.label}
          <button type="button" onClick={() => remove(row.id)}>x</button>
        </li>
      ))}
      <button type="button" onClick={() => append({ label: "New" })}>add</button>
    </ul>
  );
}
```

---

## 7. Permission hooks

### 7.1 `src/shared/ui/form/context/PermissionContext.tsx`

[PermissionContext.tsx](../../../src/shared/ui/form/context/PermissionContext.tsx)

Field-level access control for the form runtime. The hooks live in `context/` but are exported from `@ui/form` alongside the hooks barrel.

#### `FieldPermission`

```ts
export type FieldPermission = "edit" | "view" | "hidden";
```

`"edit"` allows viewing and modifying, `"view"` is read-only, `"hidden"` removes the field from the user's view.

#### `FieldPermissionResult`

```ts
export interface FieldPermissionResult {
  permission: FieldPermission;
  /** True if the field can be edited (permission === "edit"). */
  canEdit: boolean;
  /** True if the field is visible (permission !== "hidden"). */
  canView: boolean;
  /** True if the field is completely hidden. */
  isHidden: boolean;
}
```

#### `PermissionManagerValue`

```ts
export interface PermissionManagerValue {
  /** Resolve the permission for a given field ID. Defaults to "edit" if not set. */
  getPermission: (fieldId: string) => FieldPermission;
  /** Update permissions at runtime (e.g., when user role changes). */
  updatePermissions: (updates: PermissionMap) => void;
  /** Replace the entire permission map. */
  setPermissions: (permissions: PermissionMap) => void;
}
```

#### `useFieldPermission`

```ts
export const useFieldPermission = (fieldId: string): FieldPermissionResult
```

Reads the permission from `PermissionContext` (falling back to a default manager that reports `"edit"` for every field) and memoizes the four result members. Call it inside a field driver: `if (isHidden) return null;` and `disabled={!canEdit}`.

```tsx
import { useFieldPermission } from "@ui/form";

function SalaryField({ id, value }: { id: string; value: number }) {
  const { canEdit, isHidden } = useFieldPermission(id);
  if (isHidden) return null;
  return <input value={value} readOnly={!canEdit} />;
}
```

#### `usePermissionManager`

```ts
export const usePermissionManager = (): PermissionManagerValue
```

Returns the full manager API so permission maps can be updated at runtime (`updatePermissions({ salary_field: "edit" })`) or replaced wholesale (`setPermissions`). Outside a `PermissionProvider` it returns a no-op default manager.

---

## 8. Lifecycle/event hooks

### 8.1 `src/shared/ui/form/hooks/useFormEventDelegation.ts`

[useFormEventDelegation.ts](../../../src/shared/ui/form/hooks/useFormEventDelegation.ts)

Builds handlers for the `<form>` element that consume bubbling native DOM events instead of per-input React listeners.

#### `useFormEventDelegation`

```ts
export function useFormEventDelegation(form: FormCore<any>)
```

Returns `{ handleDelegatedChange, handleDelegatedBlur }`. `handleDelegatedChange(e: React.ChangeEvent<HTMLFormElement>)` resolves the field from `target.name` or `target.dataset.fieldId`, skips blur-sync fields and fields with their own `onChange`/`meta.events.onChange`, and writes a value extracted by `extractNativeDOMValue` only when it differs from the current one. `handleDelegatedBlur(e: React.FocusEvent<HTMLFormElement>)` calls `form.setTouched` and `form.validateFields([fieldId])` for natively delegable types.

### 8.2 `src/shared/ui/form/hooks/useFormMiddleware.ts`

[useFormMiddleware.ts](../../../src/shared/ui/form/hooks/useFormMiddleware.ts)

Registers engine middleware. *Path-only*: import with `import { useFormMiddleware } from "@ui/form/hooks/useFormMiddleware";`.

#### `FormMiddlewareFn`

```ts
export type FormMiddlewareFn = (context: {
  form: any;
  fieldId?: string;
}) => void | Promise<void>
```

#### `useFormMiddleware`

```ts
export function useFormMiddleware(
  form: IFormCore<any>,
  middleware?: Array<FormMiddlewareFn>
)
```

Registers each function once per engine instance via `form.use(fn)`, tracking registrations in a `Set` ref so a re-render does not duplicate them. Returns nothing.

### 8.3 `src/shared/ui/form/hooks/useValidationJump.ts`

[useValidationJump.ts](../../../src/shared/ui/form/hooks/useValidationJump.ts)

Finds the first invalid field, opens the layout containers that hold it, and moves focus to it.

#### `useValidationJump`

```ts
export const useValidationJump = () => {
  // returns jumpToFirstError: () => void
};
```

Returns `jumpToFirstError: () => void` (a `useCallback`). The callback reads `form.validity`, locates the field node in the normalized registry, walks the `parentId`/`sectionId` chain, opens `accordion` parents via `layoutManager.accordion.setOpen`, activates the containing tab pane via `layoutManager.tabs.setActiveTab`, then after 280 ms scrolls to and focuses the first `[data-error="true"]` / `[aria-invalid="true"]` element inside `[data-overlay-body]` (or `document.body`). It no-ops when no invalid field or registry definition is available.

```tsx
import { useValidationJump } from "@ui/form";

const jumpToFirstError = useValidationJump();
// <button type="submit" onClick={jumpToFirstError}>Check</button>
```

### 8.4 `src/shared/ui/form/hooks/useDynamicForm.ts`

[useDynamicForm.ts](../../../src/shared/ui/form/hooks/useDynamicForm.ts)

Resolves a form definition from the core `schemaRegistry` by id, replacing per-form controller hooks.

#### `UseDynamicFormOptions`

```ts
export interface UseDynamicFormOptions {
  /**
   * If true, the hook will load the schema synchronously and skip the loading state.
   * Only use this if you know the schema builder registered is synchronous.
   */
  sync?: boolean;
}
```

#### `useDynamicForm`

```ts
export function useDynamicForm(
  formId: string,
  options?: UseDynamicFormOptions
)
```

With `sync: true` it calls `schemaRegistry.resolveSync(formId)` during state initialization and logs failures as `loadError`; otherwise it resolves asynchronously in an effect with mount guarding. It also exposes `handleFieldChange`, which invokes `field.meta.events.onChange(field, value, values)` and returns a `{ [field.name]: result }` override when the handler returns a value, and `submitAction`, a placeholder submission that simulates a 1500 ms request and reports `schema.customData.successMessage` or a default message.

Returns `{ schema, isLoading, error, isSubmitting, handleFieldChange, submitAction }`, where `error` is `loadError?.message || submitError`.

### 8.5 `src/shared/ui/form/hooks/usePreloadFields.ts`

[usePreloadFields.ts](../../../src/shared/ui/form/hooks/usePreloadFields.ts)

Warms the lazy field-component cache from the route level so the first render does not show a loading skeleton.

#### `usePreloadFormFields`

```ts
export function usePreloadFormFields(
  definitions: FormDefinition | FormDefinition[],
  registry?: LazyRegistryStore
)
```

Flattens `definitions[].sections[].fields[]`, deduplicates the `type` values, and calls `registry.preloadMany(types)` in an effect. It returns nothing and does nothing when no registry with `preloadMany` is passed.

```tsx
import { usePreloadFormFields } from "@ui/form";
import { createSplitRegistry } from "@ui/form/fields/lazy-registry-builder";

function ProductPage() {
  usePreloadFormFields(productFormDef, createSplitRegistry());
  return <Form definition={productFormDef} registry={createSplitRegistry()} />;
}
```

### 8.6 `src/shared/ui/form/hooks/useFormExternalStore.ts`

[useFormExternalStore.ts](../../../src/shared/ui/form/hooks/useFormExternalStore.ts)

`useSyncExternalStore` bindings over the engine's store factories. *Path-only*: import with `import { useFormExternalStore } from "@ui/form/hooks/useFormExternalStore";`.

#### `useFormExternalStore`

```ts
export function useFormExternalStore(form: FormCore<any>): number
```

Returns the current `structuralVersion` (a monotonic counter). Re-renders on structural changes such as visibility, `isDirty`, and `isValid`, and not on per-field keystrokes.

#### `useFieldExternalStore`

```ts
export function useFieldExternalStore(
  form: FormCore<any>,
  fieldId: string
): ResolvedFieldProps
```

Returns the cached `FieldComponentProps` for one field via `form.toFieldSyncExternalStore(fieldId)`, re-rendering only when that field changes.

#### `useFormSlice`

```ts
export function useFormSlice<TSlice>(
  form: FormCore<any>,
  selector: (state: InternalFormState<any>) => TSlice
): TSlice
```

Returns the selected slice from `form.toSliceSyncExternalStore(selector)`, re-rendering only when the selected value fails the identity check.

```tsx
import { useFormSlice } from "@ui/form/hooks/useFormExternalStore";

const validity = useFormSlice(form, (state) => state.validity);
```

### 8.7 `src/shared/ui/form/hooks/useFormTheme.ts`

[useFormTheme.ts](../../../src/shared/ui/form/hooks/useFormTheme.ts)

Resolves theme and style classes for a definition through the active `StyleAdapter`.

#### `ThemeResult`

```ts
export interface ThemeResult {
  activeTheme: FormTheme;
  adapter: StyleAdapter;
  slots: ReturnType<StyleAdapter["buildShellStyles"]>;
  actionClasses: string;
  submitBtnClass: string;
  cancelButtonClass: string;
}
```

#### `useFormTheme`

```ts
export function useFormTheme(
  definition: FormDefinition<any>,
  theme?: FormTheme,
  adapterOverride?: StyleAdapter
): ThemeResult
```

Adapter precedence is `adapterOverride` → orchestrator context adapter → `defaultTailwindAdapter`. The active theme merges `theme` (or `DEFAULT_FORM_THEME`) with the definition's settings, forcing `density: "compact"` for `layoutMode: "drawer"` and defaulting `radius` to `"large"`; `slots`, `actionClasses`, `submitBtnClass`, and `cancelButtonClass` come from `buildShellStyles` and `buildActionStyles`.

Note: [context/FormThemeContext.tsx](../../../src/shared/ui/form/context/FormThemeContext.tsx) also exports a zero-argument `useFormTheme()` that returns only the orchestrator's `FormTheme`. The hooks barrel exports the three-parameter version documented here.

### 8.8 `src/shared/ui/form/hooks/useFormI18n.ts`

[useFormI18n.ts](../../../src/shared/ui/form/hooks/useFormI18n.ts)

Keeps the react-i18next language aligned with the definition's locale. *Path-only*: import with `import { useFormI18n } from "@ui/form/hooks/useFormI18n";`.

#### `useFormI18n`

```ts
export function useFormI18n(
  definition: FormDefinition<any>,
  setLocale: (locale: string) => void,
  locale?: string,
  i18nNamespace?: string
)
```

Uses `useTranslation(i18nNamespace || "features/forms")`, then in an effect changes the language to `definition.metadata?.locale || locale` when it differs from the current one and calls `setLocale(i18nInstance.language)`. Returns `{ i18nInstance }`.

### 8.9 `src/shared/ui/form/hooks/useFocusTrap.ts`

[useFocusTrap.ts](../../../src/shared/ui/form/hooks/useFocusTrap.ts)

Confines keyboard focus to the form container for modals, drawers, and wizard dialogs.

#### `useFocusTrap`

```ts
export function useFocusTrap({
  enabled,
  containerSelector = "[data-form-shell]",
  autoFocus = true,
}: UseFocusTrapOptions)
```

The options object type is module-local (`UseFocusTrapOptions`, not exported): `enabled: boolean` activates the trap, `containerSelector?: string` selects the container element (defaults to `'[data-form-shell]'`), and `autoFocus?: boolean` focuses the first focusable element when enabled. The hook activates `createFocusTrap` while `enabled`, deactivates on unmount or when disabled, and returns nothing.

### 8.10 `src/shared/ui/form/context/FormThemeContext.tsx` (`useStyleAdapter`)

[FormThemeContext.tsx](../../../src/shared/ui/form/context/FormThemeContext.tsx)

Re-exported through the hooks barrel (`export { useStyleAdapter } from "../context/FormThemeContext";`).

#### `useStyleAdapter`

```ts
export const useStyleAdapter = (): StyleAdapter
```

Returns the `StyleAdapter` currently provided by the orchestrator context, used by `useFormTheme` and styling components to resolve class strings.

---

## 9. Deprecated aliases

### 9.1 `src/shared/ui/form/hooks/useMDAPForm.ts`

[useMDAPForm.ts](../../../src/shared/ui/form/hooks/useMDAPForm.ts)

Alias module for `useFormFacade`, retained for source compatibility. The JSDoc marks it `@deprecated` in favor of `useFormFacade` (or `useFormFlow` for flow forms). Not re-exported by `hooks/index.ts`; import by path.

#### `useMDAPForm`

```ts
export const useMDAPForm = useFormFacade;
```

Identical implementation and signature to `useFormFacade` — same options, same result, reasoned about in terms of `EntityDefinition<T>`.

#### `UseMDAPFormOptions` / `UseMDAPFormResult`

```ts
export type UseMDAPFormOptions<T extends Record<string, any>> =
  UseFormFacadeOptions<T>;
export type UseMDAPFormResult<T extends Record<string, any>> =
  UseFormFacadeResult<T>;
```

Type aliases over the facade contracts; migrating requires no type changes.

#### `useEntityForm`

```ts
export const useEntityForm = useFormFacade;
```

Second deprecated alias of `useFormFacade` for code that reasons in terms of `EntityDefinition<T>`.

#### `UseEntityFormOptions` / `UseEntityFormResult`

```ts
export type UseEntityFormOptions<T extends Record<string, any>> =
  UseFormFacadeOptions<T>;
export type UseEntityFormResult<T extends Record<string, any>> =
  UseFormFacadeResult<T>;
```

---

**See also:**

- [01-ENGINE.md](01-ENGINE.md) — `FormCore`, `ValidationMode`, `FormCoreOptions`, and the engine methods these hooks delegate to
- [02-REGISTRIES.md](02-REGISTRIES.md) — `schemaRegistry` used by `useDynamicForm` and the `ValidationAdapter` SPI
- [03-MODULES.md](03-MODULES.md) — persistence and history modules behind `persistence` and undo/redo
- [05-ADAPTERS_UTILS.md](05-ADAPTERS_UTILS.md) — `validateZodSchema` / `validateYupSchema` used by `useForm().submit()`
- [07-COMPONENTS.md](07-COMPONENTS.md) — `<Form>`, `<FormFlow>`, and the shells that consume `FormRuntime`
- [09-PROVIDERS.md](09-PROVIDERS.md) — `FormRegistryProvider`, `PermissionProvider`, and the other contexts these hooks read
- [11-TYPES_CONTRACTS.md](11-TYPES_CONTRACTS.md) — `FormProps`, `ResolvedFieldProps`, and `DetailedError`
