# Zenith Form Engine Reference

## 1. Overview & layering

The Zenith Form Architecture separates a framework-agnostic engine from React-specific binding code. [`FormCore`](../../../src/core/form-core/engine.ts) is the headless composition root: it normalizes a `FormDefinition` schema, wires nine single-responsibility modules, and exposes a unified public API with zero React dependency. [`Form`](../../../src/core/form-core/form.ts) is the React-facing facade — it holds a `FormCore` instance and a [`ReactFormAdapter`](../../../src/core/form-core/react-adapter.ts) via composition (not inheritance) and delegates every `IFormCore` method to the engine.

| Layer | File | Role |
|---|---|---|
| Engine | [engine.ts](../../../src/core/form-core/engine.ts) | `FormCore` — headless composition root, 5V state accessors, full mutation/validation/subscription API |
| Facade | [form.ts](../../../src/core/form-core/form.ts) | `Form` — implements `IFormCore` by explicit delegation; adds adapter-backed `getComponentProps()` |
| Contract | [form-interface.ts](../../../src/core/form-core/form-interface.ts) | `IFormCore` / `IFormQuery` / `IFormMutation` / `IFormLifecycle` — the stable public contract |
| React bridge | [react-adapter.ts](../../../src/core/form-core/react-adapter.ts) | `ReactFormAdapter` — anti-corruption layer translating engine state into React component props |
| Internal types | [int-types.ts](../../../src/core/form-core/int-types.ts) | Normalization entities, render nodes, resolved props, `InternalFormState<T>` (the 5V matrix) |
| Barrel | [index.ts](../../../src/core/form-core/index.ts) | Re-exports of the facade, engine, contracts, registries, and domain modules |

The 5V state matrix read through `FormCore`:

```ts
form.values      // V1: ValuesState<T>   — current data
form.validity    // V2: ValidityState    — errors per field
form.visibility  // V3: VisibilityState  — visible fields
form.view        // V4: ViewState        — dynamic display props
form.vitality    // V5: VitalityState    — touched/dirty/focused/version
```

---

## 2. FormCore (engine.ts)

### `src/core/form-core/engine.ts`

Composition root of the form engine. Wires `FieldRegistry`, `FieldResolver`, `StateManager`, `ErrorManager`, `DebugManager`, `FormRuntime`, `FormValidator`, `FormVisibility`, and `FormExecution` (plus `CircuitBreaker`, `FormHistory`, `RemoteOptionsManager`, `RepeaterRowFactory`, and optional `FormPersistenceManager`) behind a single public API. The file also defines the engine option types and re-exports normalization helpers and internal state types.

#### `ValidationMode`

```ts
export type ValidationMode =
  | "onChange"
  | "onBlur"
  | "onSubmit"
  | "manual"
  | "lazy";
```

Controls when validation fires during user interaction: on every change, on blur (default), on submit, only via explicit `validateFields()` calls, or `onBlur` until the first submit then `onChange`.

#### `FormCoreOptions<T>`

```ts
export interface FormCoreOptions<
  T extends Record<string, any> = Record<string, any>,
> {
  validationMode?: ValidationMode;
  validateOnMount?: boolean;
  validationDebounceMs?: number;
  disableDeferredValidation?: boolean;
  validatorAdapter?: ValidationAdapter<T>;
  schema?: import("zod").ZodType<T>;
  zodSchema?: import("zod").ZodType<T>;
  messageConfig?: ValidationMessageConfig;
  i18nNamespace?: string;
  facade?: IFormCore<any>;
  density?: "compact" | "comfortable" | "spacious";
  circuitBreakerThreshold?: number;
  circuitBreakerResetTimeoutMs?: number;
  circuitBreakerMaxHalfOpenProbes?: number;
  persistence?: PersistenceConfig;
}
```

Engine configuration. Notable options: `validationMode` (default `"onBlur"`), `validateOnMount` (default `false`), `validationDebounceMs` (default 300), `disableDeferredValidation` (screen and validate values before they are written to state), `validatorAdapter` / `schema` / `zodSchema` (pluggable validation backends), `messageConfig` (per-field, per-rule message overrides), `facade` (object passed as `form` in middleware callbacks), `density`, circuit-breaker tuning, and `persistence` (draft autosave/rehydration).

#### `normalizeFormDefinition`

```ts
export function normalizeFormDefinition(def: FormDefinition): NormalizedForm
```

Re-exported from [modules/field-registry.ts](../../../src/core/form-core/modules/field-registry.ts). Flattens the hierarchical `FormDefinition` tree into O(1) lookup maps (`fields`, `sections`, `renderNodes`, dependency graphs). Called once during `FormCore` construction; the raw definition is not mutated.

#### `denormalizeForm`

```ts
export function denormalizeForm(norm: NormalizedForm): FormDefinition
```

Re-exported from [modules/field-registry.ts](../../../src/core/form-core/modules/field-registry.ts). Inverse of `normalizeFormDefinition` — rebuilds a nested `FormDefinition` from the flat `NormalizedForm`.

#### Type re-exports

`engine.ts` re-exports (type-only) `InternalFormState`, `NormalizedForm`, `ValuesState`, `ValidityState`, `VisibilityState`, `ViewState`, `VitalityState`, `DetailedError`, `SectionEntity`, `FieldEntity`, and `PersistenceConfig` so consumers can import 5V and persistence types from the engine module directly.

#### `FormCore`

```ts
export class FormCore<T extends Record<string, any> = Record<string, any>> {
  constructor(
    definition: FormDefinition,
    initialValues?: Partial<T>,
    options?: FormCoreOptions<T>
  )
  static tryCreate<T extends Record<string, any>>(
    definition: FormDefinition,
    initialValues?: Partial<T>,
    options?: FormCoreOptions<T>
  ): FormCore<T> | null
}
```

The headless form engine. The constructor normalizes the definition, registers all fields, runs the initial visibility pass, initializes computed fields and remote options, and — when `options.validateOnMount` is set — validates every field. `tryCreate` is a static factory that returns `null` on failure instead of throwing.

Public module fields (reachable for advanced consumers and tests):

```ts
public circuitBreaker!: CircuitBreaker;
public history!: FormHistory<T>;
public registry!: FieldRegistry;
public resolver!: FieldResolver;
public stateManager!: StateManager<T>;
public errorManager!: ErrorManager<T>;
public debugManager!: DebugManager<T>;
public runtime!: FormRuntime<T>;
public validator!: FormValidator<T>;
public visibilityEngine!: FormVisibility<T>;
public execution!: FormExecution<T>;
public remoteOptions!: RemoteOptionsManager<T>;
public repeaterFactory!: RepeaterRowFactory<T>;
public persistence?: FormPersistenceManager<T>;
public options: FormCoreOptions<T>;
```

##### Public getters

| Signature | Description |
|---|---|
| `get definition()` | The flat `NormalizedForm` (shorthand for `registry.definition`). |
| `get state()` | The live `InternalFormState<T>` containing all five V-slices. |
| `get nameToIdMap()` | `Record<string, string>` map of field `name` → field `id`. |
| `get valueProxy()` | `ValueProxy` for direct path-based reads/writes (bypasses the pipeline). |
| `get conditionProxy()` | `ConditionProxy` evaluating visibility/enable conditions. |
| `get flow()` | `FlowProxy` wizard/multi-step navigation helper. |
| `get coordinator()` | The reactive transaction coordinator (`execution.coordinator`). |
| `get values(): T` | **V1** — current form data keyed by field `name`. Dev builds wrap it in a warning `Proxy` against direct assignment. |
| `get validity(): Readonly<ValidityState>` | **V2** — per-field `{ valid, errors }` map. |
| `get visibility(): Readonly<VisibilityState>` | **V3** — per-field boolean visibility flag. |
| `get renderTree(): import("./int-types").RenderNode[]` | Static intermediate render representation computed at normalization. |
| `get view(): Readonly<ViewState>` | **V4** — per-field dynamic display properties. |
| `get vitality(): Readonly<VitalityState>` | **V5** — per-field `{ touched, dirty, focused, version }`. |
| `get uiState(): Readonly<import("./int-types").UIState> \| undefined` | Interactive UI state (active tab/section, modal, loading). |
| `get businessState(): Readonly<import("./int-types").BusinessState> \| undefined` | Entity lifecycle state (Draft, Submitted, Approved, …). |
| `get isDirty(): boolean` | `true` when any visible field is dirty. |
| `get isValid(): boolean` | `true` when every visible field is valid. |
| `get isDegraded(): boolean` | `true` when the circuit breaker is open. |
| `get version(): number` | Monotonic state version, incremented on every mutation. |
| `get structuralVersion(): number` | Version incremented only on global notifications — O(1) snapshot key for `useSyncExternalStore`. |
| `get canUndo(): boolean` | Whether undo is available. |
| `get canRedo(): boolean` | Whether redo is available. |

##### Public methods

| Signature | Description |
|---|---|
| `public resolveField(identifier: string): FormField \| undefined` | Resolves a field by ID, name, or repeater path (e.g. `"users[0].email"`). |
| `getPayload(): Partial<T>` | Current values with `ephemeral` fields stripped — use for submission payloads. |
| `public setUIState(uiState: Partial<import("./int-types").UIState>): void` | Merges partial UI state into `state.uiState`. |
| `public setBusinessStage(stage: string): void` | Advances `businessState.lifecycleStage`, preserving the previous stage. |
| `public reset(initialValues?: Partial<T>, options?: { keepTouched?: boolean \| string[]; keepDirty?: boolean \| string[]; keepValues?: string[] })` | Resets state, re-evaluates visibility, clears history. |
| `public async setLocale(_locale: string)` | Bumps the state version and re-validates touched/invalid fields in the new locale. |
| `getValue<P extends FieldPath<T>>(path: P): PathValue<T, P>` / `getValue(path: string): unknown` | Path-based value read via `ValueProxy`. |
| `setValue<P extends FieldPath<T>>(fieldIdentifier: P, value: PathValue<T, P>): Promise<void>` / `setValue(fieldIdentifier: string, value: unknown): Promise<void>` | Full update pipeline: write → dirty/version → validation → middleware → visibility → notify. Guarded by the circuit breaker. |
| `setTouched(fieldId: string, touched = true): void` | Sets the `touched` flag in the vitality slice. |
| `setVitality(fieldId: string, vitality: Partial<VitalityState[string]>): void` | Sets arbitrary vitality fields (focused, dirty, pinned, …). |
| `public pinField(fieldId: string, pinned: boolean = true)` | Pins a field's state so it is not purged on unmount. |
| `public async batch(fn: () => void \| Promise<void>): Promise<void>` | Batches multiple operations into a single notification pass. |
| `public appendRow(repeaterPath: string, initialRowData: Record<string, any> = {}): string` | Appends a repeater row, assigns an immutable `_rowId`, re-evaluates visibility. |
| `public removeRow(repeaterPath: string, indexOrRowId: number \| string): void` | Removes a row by index or `_rowId`, cleaning only that row's 5V state. |
| `public moveRow(repeaterPath: string, fromIndex: number, toIndex: number): void` | Reorders rows without altering per-row state slices. |
| `public register(name: string, options?: import("./form-interface").RegisterOptions): import("./form-interface").RegisterReturn` | RHF-compatible native-input registration returning `{ name, defaultValue, onChange, onBlur, ref }`. |
| `public focusField(fieldIdentifier: string): boolean` | Focuses the DOM element registered via `register()`; `false` if none. |
| `public initConcurrency(baseVersion: number, etag?: string)` | Initializes optimistic locking metadata. |
| `public reportConflict(fieldId: string, serverValue: any, clientValue: any)` | Records a server-side conflict for a field. |
| `public async clearDraft(): Promise<void>` | Clears the saved draft from storage. |
| `public async restoreDraft(): Promise<boolean>` | Restores draft values/UI state from storage. |
| `public async saveDraft(): Promise<void>` | Immediately persists current state, bypassing the autosave debounce. |
| `public destroy()` | Destroys engine subscriptions and timers (e.g. persistence autosave). |
| `public getComponentProps(fieldId: string): import("./int-types").ResolvedFieldProps` | Runs the Resolution Pipeline for a field (builds a synthetic node for repeater rows). |
| `setError(fieldId: string, error: DetailedError): void` | Injects a single programmatic (typically server-side) error, replacing existing errors on the field. |
| `setErrors(errors: DetailedError[]): void` | Injects errors across multiple fields, routed via `error.fieldId`. |
| `setValidator(validator: ValidationAdapter): void` | Swaps the active validation adapter at runtime. |
| `async submit(): Promise<boolean>` | Marks all active fields touched, validates them in parallel (skipping review-only sections), clears the draft on success when configured. |
| `async validateFields(fieldIds: string[]): Promise<boolean>` | Force-validates a subset of field IDs in parallel without marking them touched. |
| `use(fn: (context: { form: FormCore<T>; fieldId?: string }) => void \| Promise<void>): void` | Registers post-`setValue` middleware, run sequentially in registration order. |
| `getValidationMode(): ValidationMode` | Returns the active validation mode (always defined; defaults to `"onBlur"`). |
| `isDeferredValidationDisabled(): boolean` | Whether `setValue` screens and validates candidates pre-write (option, falling back to `definition.metadata.validation`). |
| `resetCircuitBreaker()` | Resets the circuit breaker so a degraded form can recover. |
| `async undo(): Promise<boolean>` | Reverts to the previous history snapshot. |
| `async redo(): Promise<boolean>` | Re-applies a previously undone snapshot. |
| `subscribe(listener: (state: InternalFormState<T>) => void): () => void` | Global state subscription; returns an unsubscribe function. |
| `subscribeToField(fieldId: string, listener: (state: InternalFormState<T>) => void): () => void` | Atomic per-field subscription. |
| `toSyncExternalStore(): { subscribe: (callback: () => void) => () => void; getSnapshot: () => number; getServerSnapshot: () => number; }` | `useSyncExternalStore` tuple over `structuralVersion`. |
| `toFieldSyncExternalStore(fieldId: string): { subscribe: (callback: () => void) => () => void; getSnapshot: () => ResolvedFieldProps; getServerSnapshot: () => ResolvedFieldProps; }` | `useSyncExternalStore` tuple for one field's resolved props. |
| `toSliceSyncExternalStore<TSlice>(selector: (state: InternalFormState<T>) => TSlice): { subscribe: (callback: () => void) => () => void; getSnapshot: () => TSlice; getServerSnapshot: () => TSlice; }` | `useSyncExternalStore` tuple for a derived slice; re-renders only on identity change. |

##### Key methods in detail

#### `constructor(definition, initialValues?, options?)`

```ts
constructor(
  definition: FormDefinition,
  initialValues?: Partial<T>,
  options?: FormCoreOptions<T>
)
```

Constructs the engine and wires all internal modules. `initialValues` takes precedence over `field.initialValue` in the schema. The definition is converted to its canonical form (`toCanonicalMetadataEvents`) and normalized; construction failures are logged via `console.error` rather than thrown.

#### `setValue`

```ts
setValue<P extends FieldPath<T>>(fieldIdentifier: P, value: PathValue<T, P>): Promise<void>;
setValue(fieldIdentifier: string, value: unknown): Promise<void>;
```

Runs the full update pipeline: write via `ValueProxy`, mark dirty and bump version, validate (subject to `validationMode`), run `use` middleware sequentially, re-evaluate visibility (clearing errors/values of newly hidden fields), push an undo snapshot, and notify subscribers. Accepts a field name, ID, or repeater path.

#### `submit`

```ts
async submit(): Promise<boolean>
```

Marks all active fields as touched, force-validates them in parallel (hidden fields' errors are cleared; fields inside `layout.reviewOnly` sections are excluded), and returns `true` only when every validity entry passes. On success it clears the persisted draft unless `persistence.clearOnSubmit === false`.

#### `validateFields`

```ts
async validateFields(fieldIds: string[]): Promise<boolean>
```

Validates the given field IDs in parallel through the current `ValidationAdapter` without marking them touched. Returns `true` only if every listed field is valid afterward — used for per-step wizard validation.

#### `use`

```ts
use(
  fn: (context: {
    form: FormCore<T>;
    fieldId?: string;
  }) => void | Promise<void>
): void
```

Registers a middleware function that runs after every `setValue`, between validation and the final notification. Multiple middleware functions run in registration order, each fully awaited. There is no unregister mechanism — middleware lives for the form's lifetime.

#### `subscribe` / `subscribeToField`

```ts
subscribe(listener: (state: InternalFormState<T>) => void): () => void
subscribeToField(
  fieldId: string,
  listener: (state: InternalFormState<T>) => void
): () => void
```

`subscribe` fires synchronously after every state mutation and receives the same mutated `InternalFormState<T>` reference (shallow-spread it to force a React re-render). `subscribeToField` restricts notifications to a single field's changes. Both return unsubscribe functions.

#### `toSyncExternalStore` / `toFieldSyncExternalStore` / `toSliceSyncExternalStore`

```ts
toSyncExternalStore(): {
  subscribe: (callback: () => void) => () => void;
  getSnapshot: () => number;
  getServerSnapshot: () => number;
}
toFieldSyncExternalStore(fieldId: string): {
  subscribe: (callback: () => void) => () => void;
  getSnapshot: () => ResolvedFieldProps;
  getServerSnapshot: () => ResolvedFieldProps;
}
toSliceSyncExternalStore<TSlice>(
  selector: (state: InternalFormState<T>) => TSlice
): {
  subscribe: (callback: () => void) => () => void;
  getSnapshot: () => TSlice;
  getServerSnapshot: () => TSlice;
}
```

Bridges for `useSyncExternalStore`. The global variant snapshots `structuralVersion`; the field variant snapshots the cached `ResolvedFieldProps` for one field (server snapshot is a minimal fallback shell); the slice variant memoizes a selector and only invokes the callback when the selected slice's identity changes.

#### `undo` / `redo`

```ts
async undo(): Promise<boolean>
async redo(): Promise<boolean>
```

Walk the `FormHistory` snapshot stack. Snapshots are restored by replaying each `[name, value]` entry through the execution pipeline inside a batch. Return `false` when no history (or no future) exists.

#### `clearDraft` / `restoreDraft` / `saveDraft`

```ts
public async clearDraft(): Promise<void>
public async restoreDraft(): Promise<boolean>
public async saveDraft(): Promise<void>
```

Thin delegates to the optional `FormPersistenceManager` (present only when `options.persistence` is configured): delete the stored draft, rehydrate it into form state (returns `false` when absent), or force an immediate save.

#### `setError` / `setErrors`

```ts
setError(fieldId: string, error: DetailedError): void
setErrors(errors: DetailedError[]): void
```

Inject programmatic errors (typically from a failed API call) into the validity slice through `ErrorManager`. `setError` replaces the field's existing errors; `setErrors` routes each entry by its `error.fieldId`.

#### `reset`

```ts
public reset(
  initialValues?: Partial<T>,
  options?: {
    keepTouched?: boolean | string[];
    keepDirty?: boolean | string[];
    keepValues?: string[];
  }
)
```

Resets the form to its initial configuration with optional preservation of touched/dirty flags or specific field values, then re-evaluates visibility and clears the undo history.

#### `register`

```ts
public register(
  name: string,
  options?: import("./form-interface").RegisterOptions
): import("./form-interface").RegisterReturn
```

React-Hook-Form-style registration for raw native inputs. Returns `{ name, defaultValue, onChange, onBlur, ref }`; `onChange` unwraps DOM events and applies `valueAsNumber` / `valueAsDate` coercion, `onBlur` marks the field touched and triggers blur validation, and `ref` stores the element for `focusField()`.

#### `destroy`

```ts
public destroy()
```

Tears down long-lived resources — currently the persistence manager's subscriptions and autosave timer. Safe to call on unmount.

##### Non-exported helpers

- `private elementRefs = new Map<string, any>()` — DOM element store backing `register()`/`focusField()`.
- `private initialize(definition, initialValues?): Error | null` — full module wiring executed by the constructor; returns (never throws) an `Error` on failure.
- `private async restoreSnapshot(snapshot: Record<string, any>): Promise<boolean>` — replays a history snapshot through `execution.setValue` inside a batch (used by `undo`/`redo`).

---

## 3. Form facade (form.ts)

### `src/core/form-core/form.ts`

Primary entry point for React applications. `Form<T>` implements `IFormCore<T>` by holding a `FormCore` instance and a `ReactFormAdapter` via composition — the adapter receives the inner engine directly, so `getComponentProps()` never recurses. The public API surface is identical to the previous inheritance-based shape.

#### `Form`

```ts
export class Form<
  T extends Record<string, any> = Record<string, any>,
> implements IFormCore<T> {
  public readonly engine: FormCore<T>;
  constructor(
    definition: FormDefinition,
    initialValues?: Partial<T>,
    options?: FormCoreOptions & { messageConfig?: ValidationMessageConfig }
  )
}
```

Constructs the inner `FormCore`, wraps it in a `ReactFormAdapter`, and sets `engine.options.facade = this` so middleware callbacks receive the `Form` instance. `engine` is public for advanced consumers; the adapter field is private.

Every `IFormCore` member is a one-line delegate to `this.engine` — getters `values`, `validity`, `visibility`, `view`, `vitality`, `isDirty`, `isValid`, `version`, `structuralVersion`, `isDegraded`, `canUndo`, `canRedo`, `state`, `valueProxy`, `definition`, `renderTree`, `flow`, `persistence`; methods `getPayload`, `resolveField`, `getValue`, `setValue`, `setTouched`, `setError`, `setErrors`, `setVitality`, `setUIState`, `setBusinessStage`, `reset`, `submit`, `validateFields`, `batch`, `appendRow`, `removeRow`, `moveRow`, `register`, `focusField`, `subscribe`, `subscribeToField`, `use`, `setLocale`, `pinField`, `initConcurrency`, `reportConflict`, `getValidationMode`, `resetCircuitBreaker`, `undo`, `redo`, `clearDraft`, `restoreDraft`, `saveDraft`, `destroy`, `toSyncExternalStore`, `toFieldSyncExternalStore`, `toSliceSyncExternalStore`.

Facade-only behavior and accessors:

| Member | Signature | Description |
|---|---|---|
| `getComponentProps` | `getComponentProps(fieldId: string): import("./int-types").ResolvedFieldProps` | Routes through `adapter.getComponentProps()` — returns the cached, React-enhanced props rather than the engine's raw pipeline output. |
| `core` | `get core(): FormCore<T>` | Direct access to the headless engine (testing, custom adapters). |
| `resolver` | `get resolver()` | The engine's `FieldResolver`. |
| `stateManager` | `get stateManager()` | The engine's `StateManager`. |
| `validator` | `get validator()` | The engine's `FormValidator`. |
| `execution` | `get execution()` | The engine's `FormExecution`. |
| `repeaterFactory` | `get repeaterFactory()` | The engine's `RepeaterRowFactory`. |
| `remoteOptions` | `get remoteOptions()` | The engine's `RemoteOptionsManager`. |
| `visibilityEngine` | `get visibilityEngine()` | The engine's `FormVisibility`. |
| `registry` | `get registry()` | The engine's `FieldRegistry`. |

`form.ts` also re-exports `FormCore`, `ReactFormAdapter`, the `IFormCore` type, and the 5V state types (`InternalFormState`, `ValuesState`, `ValidityState`, `VisibilityState`, `ViewState`, `VitalityState`, `DetailedError`).

---

## 4. Contracts (form-interface.ts)

### `src/core/form-core/form-interface.ts`

The stable public contract of the form engine. Consumers (hooks, adapters, tests) depend on `IFormCore` rather than the concrete `FormCore` class, enforcing interface segregation, dependency inversion, and substitutability of the `Form` facade.

#### `IFormQuery<T>`

```ts
export interface IFormQuery<
  T extends Record<string, any> = Record<string, any>,
> {
  readonly values: T;
  readonly validity: Readonly<ValidityState>;
  readonly visibility: Readonly<VisibilityState>;
  readonly view: Readonly<ViewState>;
  readonly vitality: Readonly<VitalityState>;
  readonly uiState?: Readonly<import("./int-types").UIState>;
  readonly businessState?: Readonly<import("./int-types").BusinessState>;
  readonly isDirty: boolean;
  readonly isValid: boolean;
  readonly version: number;
  readonly state: InternalFormState<T>;
  readonly definition: NormalizedForm;
  getPayload(): Partial<T>;
  getComponentProps(fieldId: AutocompletePath<T>): ResolvedFieldProps;
  resolveField(identifier: AutocompletePath<T>): FormField | undefined;
  getValue<P extends FieldPath<T>>(path: P): PathValue<T, P>;
  getValue(path: string): unknown;
}
```

Read-only access to the 5V state matrix plus derived flags, the normalized definition, payload construction, and path-based reads. Safe to expose to components that must not mutate form state.

#### `RegisterOptions`

```ts
export interface RegisterOptions {
  valueAsNumber?: boolean;
  valueAsDate?: boolean;
}
```

Value coercion options for `register()`: parse the DOM value as a number, or construct a `Date`.

#### `RegisterReturn`

```ts
export interface RegisterReturn {
  name: string;
  onChange: (event: any) => Promise<void> | void;
  onBlur: (event: any) => void;
  ref: (el: any) => void;
  defaultValue?: any;
}
```

The props object returned by `register()`, spreadable onto native `<input>` / `<select>` / `<textarea>` elements.

#### `IFormMutation<T>`

```ts
export interface IFormMutation<
  T extends Record<string, any> = Record<string, any>,
> {
  setValue<P extends FieldPath<T>>(name: P, value: PathValue<T, P>): Promise<void>;
  setValue(name: string, value: unknown): Promise<void>;
  setTouched(fieldId: AutocompletePath<T>): void;
  setError(fieldId: AutocompletePath<T>, error: DetailedError): void;
  setErrors(errors: DetailedError[]): void;
  setVitality(
    fieldId: AutocompletePath<T>,
    vitality: Partial<InternalFormState<T>["vitality"][string]>
  ): void;
  setUIState(uiState: Partial<import("./int-types").UIState>): void;
  setBusinessStage(stage: string): void;
  reset(
    initialValues?: Partial<T>,
    options?: {
      keepTouched?: boolean | string[];
      keepDirty?: boolean | string[];
      keepValues?: string[];
    }
  ): void;
  submit(): Promise<boolean>;
  validateFields(fieldIds: string[]): Promise<boolean>;
  batch(fn: () => void | Promise<void>): Promise<void>;
  appendRow(
    repeaterPath: AutocompletePath<T> | string,
    initialRowData?: Record<string, any>
  ): string;
  removeRow(
    repeaterPath: AutocompletePath<T> | string,
    indexOrRowId: number | string
  ): void;
  moveRow(
    repeaterPath: AutocompletePath<T> | string,
    fromIndex: number,
    toIndex: number
  ): void;
  register(
    name: AutocompletePath<T> | string,
    options?: RegisterOptions
  ): RegisterReturn;
}
```

State-mutating operations: value writes, error injection, vitality/UI/business state updates, reset, submission, subset validation, batching, repeater row management, and native-input registration.

#### `IFormLifecycle<T>`

```ts
export interface IFormLifecycle<
  T extends Record<string, any> = Record<string, any>,
> {
  subscribe(listener: (state: InternalFormState<T>) => void): () => void;
  subscribeToField(fieldId: AutocompletePath<T>, listener: () => void): () => void;
  use(
    fn: (ctx: { form: IFormCore<T>; fieldId?: string }) => void | Promise<void>
  ): void;
  setLocale(locale: string): Promise<void>;
  pinField(fieldId: AutocompletePath<T>, pinned?: boolean): void;
  initConcurrency(baseVersion: number, etag?: string): void;
  reportConflict(fieldId: AutocompletePath<T>, serverValue: unknown, clientValue: unknown): void;
  clearDraft?(): Promise<void>;
  restoreDraft?(): Promise<boolean>;
  saveDraft?(): Promise<void>;
  destroy?(): void;
}
```

Subscriptions, middleware registration, locale switching, and ERP-oriented lifecycle extensions (field pinning, optimistic concurrency, draft persistence — the draft and destroy members are optional).

#### `IFormCore<T>`

```ts
export interface IFormCore<T extends Record<string, any> = Record<string, any>>
  extends IFormQuery<T>, IFormMutation<T>, IFormLifecycle<T> {
  getValidationMode(): string;
  readonly valueProxy: {
    getValue<P extends FieldPath<T>>(values: T, path: P): PathValue<T, P>;
    getValue(values: unknown, path: string): unknown;
    setValue(values: unknown, path: string, value: unknown): void;
  };
  readonly isDegraded: boolean;
  resetCircuitBreaker(): void;
}
```

The full engine contract, composed from the three sub-interfaces plus validation-mode introspection, the proxied value accessor, degraded-mode status, and circuit-breaker recovery. `FormCore`, `Form`, and any test double must implement this.

---

## 5. React adapter (react-adapter.ts)

### `src/core/form-core/react-adapter.ts`

Bridges the headless engine to React component props. `ReactFormAdapter` is the single point of framework coupling: it caches per-field props against `core.version`, wraps `onChange`/`onBlur`/`onFocus` handlers with engine calls, and enhances the result with accessibility defaults.

#### `FieldComponentProps`

```ts
export interface FieldComponentProps {
  id: string;
  name?: string;
  field: FormField;
  value: unknown;
  error?: boolean;
  errorMessage?: string;
  errors?: ReadonlyArray<{ code: string; message: string; fieldId: string }>;
  touched?: boolean;
  dirty?: boolean;
  focused?: boolean;
  valid?: boolean;
  version?: number;
  conflict?: boolean;
  onChange?: (value: unknown) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  disabled?: boolean;
  placeholder?: string;
  required?: boolean;
  options?: ReadonlyArray<{ label: string; value: unknown }>;
  isLoading?: boolean;
  layout?: Record<string, any>;
  styles?: Record<string, string | undefined>;
  showPassword?: boolean;
  tabIndex?: number;
  ref?: ((element: any) => void) | { current: any } | null;
}
```

The merged props object produced by `getComponentProps()`, spreadable directly onto a field component. Carries identity (`id`, `name`, `field`), value/error state, vitality flags, handlers, presentation props (`layout`, `styles`, `placeholder`), options, and an imperative `ref` slot.

#### `ReactFormAdapter`

```ts
export class ReactFormAdapter<
  T extends Record<string, any> = Record<string, any>,
> {
  constructor(public core: IFormCore<T>) {}
  getComponentProps(fieldId: string): FieldComponentProps
}
```

Depends on the `IFormCore` abstraction rather than the concrete class. `getComponentProps(fieldId)` returns a version-keyed cached props object (reference-stable between renders unless the form version changed), delegating base resolution to `core.getComponentProps()` and enriching it via `enhanceFieldProps`. Unknown or hidden fields yield an empty object shell without attached handlers.

| Signature | Description |
|---|---|
| `constructor(public core: IFormCore<T>)` | Accepts any `IFormCore` implementation — engine, facade, or test double. |
| `getComponentProps(fieldId: string): FieldComponentProps` | Cached, React-ready props for one field. |
| `private buildComponentProps(fieldId: string): FieldComponentProps` | Builds fresh props: resolve field, call `core.getComponentProps`, wrap handlers, enhance. |
| `private async handleValueChangePipeline(field: any, val: unknown, preValues: T)` | Runs `onSelectChange`/`onChange` transforms (field-level then global metadata events), then `core.setValue`. |
| `private propCache` | `Map<string, { version: number; props: FieldComponentProps }>` invalidated implicitly by version bumps. |

---

## 6. Internal state types (int-types.ts)

### `src/core/form-core/int-types.ts`

Internal runtime types shared by all engine modules: normalization entities produced by `FieldRegistry`, the render-engine IR, the resolved prop contract, and the consolidated `InternalFormState<T>` (5V matrix plus UI/business/debug/performance state). The canonical 5V slice types themselves are re-exported here from `@form-core/domain/state`.

#### `SectionEntity`

```ts
export interface SectionEntity extends Omit<
  FormSection,
  "sections" | "fields"
> {
  fieldIds: string[];
  subSectionIds: string[];
  parentId?: string;
}
```

Flattened `FormSection`: nested arrays replaced with ID lists (`fieldIds`, `subSectionIds`) plus a `parentId` link, enabling O(1) section lookup.

#### `FieldEntity`

```ts
export interface FieldEntity extends FormField {
  sectionId: string;
  parentId?: string;
  isTemplate?: boolean;
  repeaterConfig?: RepeaterConfig;
  capabilities: FieldCapabilities;
}
```

Flattened `FormField` augmented during normalization with owning `sectionId`, optional `parentId`, an `isTemplate` flag marking repeater template children (skipped by state initialization), optional `repeaterConfig`, and the resolved `capabilities` contract.

#### `NormalizedForm`

```ts
export interface NormalizedForm {
  metadata: Omit<FormDefinition, "sections">;
  sections: Record<string, SectionEntity>;
  fields: Record<string, FieldEntity>;
  rootSections: string[];
  dependencyGraph: Record<string, string[]>;
  fieldDependencyGraph: FieldDependencyGraph;
  renderTree: RenderNode[];
  renderNodes: Record<string, RenderNode>;
}
```

The flat internal runtime format produced once by `normalizeFormDefinition` and never mutated: form metadata, O(1) maps of sections and fields, ordered `rootSections` for wizard navigation, a name-keyed dependency graph plus a categorized `FieldDependencyGraph` for targeted cascades, and the static render tree/map.

#### `RenderNode`

```ts
export interface RenderNode {
  stateKey: string;
  dataPath: string;
  id: string;
  fieldType: string;
  category: string;
  capabilities: FieldCapabilities;
  depth: number;
  parentId: string | null;
  children: RenderNode[];
  rowGroup: number | null;
  visibilityKey: string;
}
```

Intermediate representation for rendering a field: `stateKey` is the stable engine key for V2–V5 slices, `dataPath` is the external value path (e.g. `"users[0].email"`), `id` is deprecated, plus tree position (`depth`, `parentId`, `children`), layout grouping (`rowGroup`), and the V3 subscription key.

#### `ResolvedFieldProps<TValue>`

```ts
export interface ResolvedFieldProps<TValue = unknown> {
  dataPath: string;
  stateKey: string;
  id: string;
  label?: string;
  description?: string;
  placeholder?: string;
  rowGroup: number | null;
  density: "compact" | "comfortable" | "spacious";
  disabled?: boolean;
  inputProps?: {
    value: TValue;
    valid: boolean;
    errors: DetailedError[];
    touched: boolean;
    dirty: boolean;
    focused: boolean;
    version: number;
    conflict?: { serverValue: TValue; clientValue: TValue; fieldId: string } | null;
    onChange?: (value: TValue) => void;
    onBlur?: () => void;
    onFocus?: () => void;
  };
  componentProps: Record<string, unknown>;
  options?: ReadonlyArray<{ label: string; value: unknown }>;
  isLoading?: boolean;
}
```

The final resolved prop set emitted by the Resolution Pipeline: identity paths, display metadata, density, capability-gated `inputProps` (value, validity, vitality, handlers, conflict record), forwarded static `componentProps`, and dynamic options/loading state.

#### `UIState`

```ts
export interface UIState {
  activeSectionId?: string;
  activeTabId?: string;
  focusedFieldId?: string;
  expandedPanels?: Record<string, boolean>;
  modalOpen?: boolean;
  isSubmitting?: boolean;
  isLoading?: boolean;
  customUI?: Record<string, unknown>;
}
```

Interactive UX state kept separate from submitted business data: active section/tab, focused field, expanded panels, modal and loading/submitting flags, plus an open-ended `customUI` bag.

#### `BusinessState`

```ts
export interface BusinessState {
  lifecycleStage:
    | "Draft"
    | "Submitted"
    | "Reviewed"
    | "Approved"
    | "Completed"
    | "Archived"
    | (string & {});
  previousStage?: string;
  allowedTransitions?: string[];
  ownerId?: string;
  assigneeId?: string;
  approvals?: Array<{ role: string; approvedBy: string; approvedAt: string }>;
  metadata?: Record<string, unknown>;
}
```

Entity lifecycle and workflow state: the current `lifecycleStage` (known stages plus open string), previous stage, allowed transitions, ownership/assignment, approvals, and free-form metadata.

#### `PerformanceState`

```ts
export interface PerformanceState {
  lastSubmissionDurationMs?: number;
  lastValidationDurationMs?: number;
  averageLatencyMs?: number;
  lastOptionsFetchDurationMs?: number;
}
```

Runtime performance metrics collected during interaction (last submission, last validation pass, average field-update latency, last remote-options fetch).

#### `DebugState`

```ts
export interface DebugState {
  isEnabled: boolean;
  logs: { timestamp: number; message: string; data?: unknown }[];
  renderCount: number;
  lastAction?: string;
}
```

Development diagnostics managed by `DebugManager`: an enable flag, an ordered timestamped log, a publish counter, and the label of the most recent mutating action.

#### `InternalFormState<T>`

```ts
export interface InternalFormState<T> {
  values: ValuesState<T>;
  validity: ValidityState;
  visibility: VisibilityState;
  view: ViewState;
  vitality: VitalityState;
  uiState?: UIState;
  businessState?: BusinessState;
  debug: DebugState;
  performance: PerformanceState;
  metadata?: Record<string, unknown>;
  concurrency?: {
    version: number;
    baseVersion?: number;
    etag?: string;
    conflicts?: Record<
      string,
      { serverValue: unknown; clientValue: unknown; fieldId: string }
    >;
  };
}
```

The complete internal state object published to subscribers on every mutation: the five V-slices (`values`, `validity`, `visibility`, `view`, `vitality`), optional `uiState`/`businessState`, `debug` and `performance`, form-level `metadata`, and optimistic-locking `concurrency` data.

#### 5V slice re-exports

`int-types.ts` re-exports (type-only) the canonical 5V slice types and event types from `./domain`: `ValuesState`, `DetailedError`, `ValidityState`, `VisibilityState`, `ViewState`, `VitalityState`, `FormState`, `ValidationResult`, `SubmissionPayload`, `FormEvent`, `FormEventType`.

---

## 7. Barrel exports (index.ts)

### `src/core/form-core/index.ts`

Single import surface for the form subsystem. Re-exports the React facade, the headless engine and its types, the contract interface, registries, validation/normalization utilities, and the `modules`, `adapters`, and `domain` sub-trees.

| Export | Source |
|---|---|
| `Form`, `ReactFormAdapter` | `./form` |
| `FormCoreOptions`, `ValidationMode` (types) | `./engine` |
| `IFormCore` (type) | `./form-interface` |
| `FormCore` | `./engine` |
| `InternalFormState`, `NormalizedForm`, `ValuesState`, `ValidityState`, `VisibilityState`, `ViewState`, `VitalityState`, `DetailedError`, `SectionEntity`, `FieldEntity` (types) | `./engine` |
| `UIState`, `BusinessState` (types) | `./int-types` |
| `normalizeFormDefinition`, `denormalizeForm` | `./engine` |
| `SchemaRegistry`, `schemaRegistry` | `./SchemaRegistry` |
| `ManifestRegistry`, `manifestRegistry` | `./ManifestRegistry` |
| `ValidationRegistry`, `registerValidationStrategy` | `./validation-registry` |
| `ConditionRegistry`, `conditionRegistry` | `./condition-registry` |
| `InjectionRegistry`, `injectionRegistry` | `./injection-registry` |
| `ValidationAdapter` (type), `ValidationProxy`, `ValidationMessageConfig` (type) | `./validation-adapter` / `./validation-proxy` |
| `BackendMetadataNormalizer`, `BackendFieldMetadata`/`BackendSchemaMetadata` (types) | `./backend-normalizer` |
| star exports | `./modules`, `./adapters`, `./domain` |

---

**See also:**

- [02-REGISTRIES.md](02-REGISTRIES.md) — registries, proxies, and adapters at the form-core root
- [03-MODULES.md](03-MODULES.md) — engine modules (registry, state, validator, execution, persistence)
- [04-DOMAIN_TYPES.md](04-DOMAIN_TYPES.md) — domain entities and canonical schema types
- [06-HOOKS.md](06-HOOKS.md) — React hooks bound to `IFormCore`
- [09-PROVIDERS.md](09-PROVIDERS.md) — React context providers
- [11-TYPES_CONTRACTS.md](11-TYPES_CONTRACTS.md) — shared types and cross-module contracts
