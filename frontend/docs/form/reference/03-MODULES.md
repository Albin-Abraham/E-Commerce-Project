# Zenith Form Modules Reference

Every runtime manager of the Zenith Form Architecture lives under
`src/core/form-core/modules/`. Each module owns one responsibility and receives
its collaborators through constructor injection; no module instantiates another
module except `FormRuntime`, `FormExecution`, and the coordinator, which build
their internal delegates at construction.

Module dependency overview (arrows point at dependencies):

| Module | Depends on |
|---|---|
| [state-manager.ts](../../../src/core/form-core/modules/state-manager.ts) | `FieldResolver` (optional), `int-types` |
| [field-registry.ts](../../../src/core/form-core/modules/field-registry.ts) | domain types, `capability-registry`, `injection-registry`, `composite-registry` |
| [resolver.ts](../../../src/core/form-core/modules/resolver.ts) | `FieldRegistry`, `capability-registry`, `field-adapter-registry` |
| [validator.ts](../../../src/core/form-core/modules/validator.ts) | `FieldResolver`, `StateManager`, `ErrorManager`, `FormRuntime`, `DebugManager` |
| [error-manager.ts](../../../src/core/form-core/modules/error-manager.ts) | `StateManager`, `FieldResolver` (optional) |
| [circuit-breaker.ts](../../../src/core/form-core/modules/circuit-breaker.ts) | none |
| [execution.ts](../../../src/core/form-core/modules/execution.ts) | `FieldResolver`, `StateManager`, `FormRuntime`, `FormValidator`, `FormVisibility`, `DebugManager`, `ReactiveTransactionCoordinator` |
| [transaction-coordinator.ts](../../../src/core/form-core/modules/transaction-coordinator.ts) | `FieldResolver`, `StateManager`, `FormRuntime`, `FormValidator`, `FormVisibility`, `DebugManager`, `RemoteOptionsManager` (via callback) |
| [visibility.ts](../../../src/core/form-core/modules/visibility.ts) | `FieldRegistry`, `FieldResolver`, `StateManager`, `ErrorManager`, `FormRuntime` |
| [reactive-engine.ts](../../../src/core/form-core/modules/reactive-engine.ts) | domain `ReactiveValue` / `ComputedField` |
| [runtime.ts](../../../src/core/form-core/modules/runtime.ts) | `FieldRegistry`, `StateManager`, `ValueProxy`, `ConditionProxy`, `FlowProxy`, `ReactiveEngine` |
| [resolution-pipeline.ts](../../../src/core/form-core/modules/resolution-pipeline.ts) | `capability-registry`, `int-types` |
| [remote-options.ts](../../../src/core/form-core/modules/remote-options.ts) | `StateManager`, `FieldResolver`, `FormRuntime`, `DebugManager`, HTTP client |
| [persistence-manager.ts](../../../src/core/form-core/modules/persistence-manager.ts) | `StateManager` |
| [repeater-factory.ts](../../../src/core/form-core/modules/repeater-factory.ts) | `StateManager` |
| [history.ts](../../../src/core/form-core/modules/history.ts) | none |
| [capability-registry.ts](../../../src/core/form-core/modules/capability-registry.ts) | domain `FieldCapabilities` |
| [debug-manager.ts](../../../src/core/form-core/modules/debug-manager.ts) | `StateManager` |

---

## 1. State & identity

### 1.1 `src/core/form-core/modules/state-manager.ts`

Holds the single `InternalFormState<T>` object — the one source of truth for
the five V-slices (values, validity, visibility, view, vitality) plus debug and
performance slices. All mutations funnel through typed setter methods that call
`notify()`, and a development-only deep Proxy warns against direct mutation of
`form.values`.

Source: [state-manager.ts](../../../src/core/form-core/modules/state-manager.ts)

#### `StateManager<T>`

```ts
export class StateManager<T extends Record<string, any> = Record<string, any>>
```

Public fields and properties:

| Member | Signature |
|---|---|
| state | `public state: InternalFormState<T>` |
| version | `public version = 0` |
| structuralVersion | `public structuralVersion = 0` |
| batch | `public batch = async (fn: () => void \| Promise<void>) => { ... }` |
| notify | `public notify = () => { ... }` |
| notifyField | `public notifyField = (fieldId: string) => { ... }` |

Constructor:

```ts
constructor(
  private definition: NormalizedForm,
  initialValues?: Partial<T>,
  public resolver: FieldResolver | null = null
)
```

Builds the initial `InternalFormState<T>` via `initializeState(initialValues)`.
The private `initializeState(initialValues?: Partial<T>): InternalFormState<T>`
skips repeater template fields (`isTemplate`), allocates each state slice
according to the field's `capabilities`, defaults visibility to
`field.visible !== false`, seeds values from `initialValue` (or `[]` for
repeaters), and initializes vitality to
`{ touched: false, dirty: false, focused: false, version: 0 }`.

Method table (all public members):

| Signature | Description |
|---|---|
| `reset(initialValues?: Partial<T>, options: { keepTouched?: boolean \| string[]; keepDirty?: boolean \| string[]; keepValues?: string[] } = {}): void` | Rebuilds state from the definition, optionally preserving touched, dirty, and named values, then notifies global and field subscribers. |
| `get values(): T` | Returns a deep mutation-warn Proxy in development; the raw `state.values` object in production. |
| `get validity(): Readonly<ValidityState>` | Read-only access to the V2 slice. |
| `get visibility(): Readonly<VisibilityState>` | Read-only access to the V3 slice. |
| `get view(): Readonly<ViewState>` | Read-only access to the V4 slice. |
| `get vitality(): Readonly<VitalityState>` | Read-only access to the V5 slice. |
| `setRawValue(path: string \| string[], value: any): void` | Low-level lodash `set` write into `state.values` followed by `notify()`; triggers no validation, visibility, or vitality side effects. |
| `setVitality(fieldId: string, updates: Partial<VitalityState[string]>): void` | Merges vitality updates for a field, lazy-initializing the entry (with a dev warning if the field's capabilities excluded vitality), then notifies. |
| `setPerformance(updates: Partial<InternalFormState<T>["performance"]>): void` | Merges performance metrics into state and notifies. |
| `update(updater: (prev: InternalFormState<T>) => InternalFormState<T>): void` | Applies a functional whole-state update; notifies only when the returned object differs from the current state. |
| `subscribe(listener: (state: InternalFormState<T>) => void): () => void` | Registers a global listener invoked after every unbatched mutation; returns an unsubscribe function. |
| `subscribeToField(fieldId: string, listener: (state: InternalFormState<T>) => void): () => void` | Registers a per-field listener for the O(1) atomic subscription stream; returns an unsubscribe function that deletes empty listener sets. |
| `registerRowState(fieldId: string, initialValue?: any): void` | Allocates validity, vitality, and visibility slices for a dynamic repeater field instance based on its capabilities. |
| `pinField(fieldId: string, pinned?: boolean): void` | Pins or unpins a field's state slices so they survive virtualized unmounts; implemented as a vitality update. |
| `isFieldPinned(fieldId: string): boolean` | Returns `!!state.vitality[fieldId]?.pinned`. |
| `deregisterRowState(fieldId: string): void` | Deletes the four per-field slices; no-op when the field is pinned. |
| `appendRow(repeaterPath: string, initialRowData?: Record<string, any>): string` | Pushes a new row onto the array at `repeaterPath` with a non-enumerable `_rowId`, notifies the field, and returns the generated row ID. |
| `removeRow(repeaterPath: string, indexOrRowId: number \| string): void` | Removes a row by index or `_rowId`/`id`, deregisters every state slice whose key is prefixed `${repeaterPath}__${rowId}__`, and notifies. |
| `moveRow(repeaterPath: string, fromIndex: number, toIndex: number): void` | Splices a row to a new index without touching any row state slices, then notifies. |
| `getRawValue(path: string): any` | Reads a nested dot path (supporting `name[idx]` segments) from `state.values`. |
| `initConcurrency(baseVersion: number, etag?: string): void` | Initializes the optimistic-locking slice `{ version: 0, baseVersion, etag, conflicts: {} }`. |
| `reportConflict(fieldId: string, serverValue: any, clientValue: any): void` | Records a server/client value conflict for a field in `state.concurrency.conflicts` and notifies. |

Private helpers:

- `createDeepProxy<O extends object>(target: O, onChange: (path: string[], value: any) => void, path?: string[]): O` — recursive development-only Proxy that warns on `set` and wraps array mutators (`push`, `pop`, `splice`, …) to fire the change callback.
- `notify()` and `batch()` implement the batching contract: while `batchCount > 0`, global notifications are deferred until the outermost batch settles; atomic `notifyField` calls always fire immediately.
- `notify()` also increments `state.concurrency.version` when locking is enabled.

---

### 1.2 `src/core/form-core/modules/field-registry.ts`

Flattens the hierarchical `FormDefinition` into a `NormalizedForm` of flat
`fields` and `sections` maps with `sectionId` / `parentId` enrichment, a render
tree, and a categorized dependency graph, giving the rest of the engine O(1)
lookups. Normalization runs once at construction; the result is immutable at
runtime.

Source: [field-registry.ts](../../../src/core/form-core/modules/field-registry.ts)

#### `FieldRegistry`

```ts
export class FieldRegistry
```

| Signature | Description |
|---|---|
| `public definition: NormalizedForm` | The fully normalized (flat) form definition; read-only after construction. |
| `constructor(definition: FormDefinition)` | Normalizes the raw hierarchical definition via `normalizeFormDefinition`. |
| `public getAllFields(): FormField[]` | Returns all registered fields as a flat array (`Object.values(definition.fields)`). |
| `public getDependenciesForField(fieldIdentifier: string): FieldDependencyNode` | Returns the categorized dependency node for a field looked up by name or ID, merging by-name and by-ID nodes when both exist; returns an empty node when the field has no dependents. |

#### `normalizeFormDefinition`

```ts
export function normalizeFormDefinition(def: FormDefinition): NormalizedForm
```

Records every field and section into flat maps, captures `rootSections` as
ordered top-level section IDs, injects `sectionId` / `parentId` / `isTemplate`
/ `capabilities` into each field, expands `slot` fields from the
`InjectionRegistry` and composite types from the composite registry, merges
`def.injections` (validations, ui, conditions) into fields, builds both the
legacy `dependencyGraph` and the categorized `fieldDependencyGraph`, assigns
row groups to render nodes, and finally detects dependency cycles — logging a
dev error in development and throwing in production when a cycle is found.

Important private helpers inside the function (not exported):
`extractCategorizedDependencies(field)` pulls `{{field}}` tokens from
`visible` / `enabled` expressions, condition schemas, `dependsOn`,
`computed.formula` / `computed.dependsOn`, validation `match` rules and
`crossField` entries, and `remoteOptions.watch`; `detectCycle(graph)` runs a
DFS cycle check over the legacy string[] graph; `registerField` and
`traverse` perform the recursive walks.

#### `denormalizeForm`

```ts
export function denormalizeForm(norm: NormalizedForm): FormDefinition
```

Rebuilds a hierarchical `FormDefinition` from a `NormalizedForm` by restoring
`fields` arrays from `fieldIds` and recursively rebuilding sub-sections from
`subSectionIds`. Throws if a referenced section ID is missing. Inverse of
`normalizeFormDefinition`, used for serialization, debugging, and round-trip
testing.

---

### 1.3 `src/core/form-core/modules/resolver.ts`

Bridges the gap between field identifiers used by consumers (IDs, names, and
dynamic repeater paths such as `users[0].name` or `users__rowId__name`) and the
flat normalized fields map. Resolution tries direct ID lookup, then the
pre-built name-to-ID map, then constructs virtual field instances for repeater
children.

Source: [resolver.ts](../../../src/core/form-core/modules/resolver.ts)

#### `FieldResolver`

```ts
export class FieldResolver
```

| Signature | Description |
|---|---|
| `public nameToIdMap: Record<string, string>` | Pre-built map from field name (and schema-level aliases) to field ID for input and repeater fields only. |
| `constructor(public readonly registry: FieldRegistry, private getState?: () => InternalFormState<any>)` | Stores the registry and optional state getter, then builds `nameToIdMap` via the private `initializeMap()`. |
| `public resolveField(identifier: string): FormField \| undefined` | Resolves a field by ID (O(1)), by name via `nameToIdMap` (O(1)), by positional repeater path `parent[idx].child` (creates a virtual field with `id`/`stateKey`/`name` set to the path), or by identity path `parent__rowId__child` (also computes a positional `dataPath` when state is available); returns `undefined` when nothing matches. |
| `public getFieldType(fieldId: string): ResolvedFieldType \| undefined` | Returns the registered `fieldTypeRegistry` entry for a field; when the type is absent from the type registry but present in `fieldAdapterRegistry`, synthesizes a `ResolvedFieldType` with input-category capabilities, `handleChange` from `adapter.parse`, and `validate` from `adapter.validate`. |

Private helper `initializeMap()` runs once during construction, mapping only
`input`-category and `repeater` fields (structural fields hold no values) plus
any `aliases` / `meta.aliases` entries.

---

## 2. Validation & errors

### 2.1 `src/core/form-core/modules/validator.ts`

Coordinates when and which fields get validated and delegates rule execution to
an injected `ValidationAdapter`. It never implements rules itself; results are
written to `ErrorManager`. Repeater template fields (no vitality entry, or
`isTemplate`) are excluded, and hidden fields have their errors cleared rather
than failing.

Source: [validator.ts](../../../src/core/form-core/modules/validator.ts)

#### `FormValidator<T>`

```ts
export class FormValidator<T extends Record<string, any>>
```

Constructor:

```ts
constructor(
  private validator: ValidationAdapter,
  private resolver: FieldResolver,
  private stateManager: StateManager<T>,
  private errorManager: ErrorManager<T>,
  private runtime: FormRuntime<T>,
  private debugManager?: DebugManager<T>
)
```

Method table:

| Signature | Description |
|---|---|
| `setValidator(validator: ValidationAdapter): void` | Replaces the active validation adapter at runtime. |
| `async validateField(fieldId: string): Promise<void>` | Validates one field: skips templates, clears errors and returns for hidden fields, reads the value through `runtime.valueProxy`, runs the adapter's `validateField` plus the field type's custom `validate` in parallel-capable fashion, marks `pending` for async work, applies a per-field timeout (`validation.timeoutMs` or 5000 ms) with `[]` fallback on timeout or rejection, drops stale results via a per-field transaction ID, and writes errors through `ErrorManager`. |
| `async screenCandidate(fieldId: string, candidate: any): Promise<{ value: any; accepted: boolean }>` | Screens a not-yet-stored value for `disableDeferredValidation` flows through two gates — the adapter's `screenValue` character gate, then full `validateField` rule validation. Any error records errors on the field and returns `accepted: false` with the original candidate (the previous value stays in state); on acceptance it clears stale errors only when they existed. |
| `async validateFields(fieldIds: string[]): Promise<boolean>` | Runs `validateField` for all IDs via `Promise.all`, records `lastValidationDurationMs` in performance state, and returns whether every ID is currently valid. |
| `async submit(): Promise<boolean>` | Full-form gate for submission: computes active field IDs (those with vitality entries), marks them all `touched: true`, validates them in parallel, and returns true only if every active field is valid — deliberately ignoring validity entries for fields outside the active set. |

Private helper `executeWithTimeout<R>(promise: Promise<R> | R, timeoutMs: number, fallback: R, fieldId: string): Promise<R>` resolves a promise within a window, substituting `fallback` and warning on timeout or failure. The `pendingValidations` map stores per-field transaction IDs so superseded keystrokes are dropped.

---

### 2.2 `src/core/form-core/modules/error-manager.ts`

The single write path for `ValidityState`. Every error mutation in the engine
must pass through this class, which lazy-initializes validity entries, marks
fields touched, notifies both atomic and global subscribers, and rolls child
errors up to deriving parents.

Source: [error-manager.ts](../../../src/core/form-core/modules/error-manager.ts)

#### `ErrorManager<T>`

```ts
export class ErrorManager<T extends Record<string, any>>
```

Constructor:

```ts
constructor(
  private stateManager: StateManager<T>,
  private resolver?: FieldResolver
)
```

Method table:

| Signature | Description |
|---|---|
| `public setError(fieldId: string, error: DetailedError): void` | Sets `valid: false` and replaces the errors array with the single error, marks the field touched, and notifies field + global subscribers. |
| `public setErrors(fieldId: string, errors: DetailedError[]): void` | Replaces the field's errors, sets `valid` to `errors.length === 0`, marks touched when errors exist, runs parent-validity rollup for dynamic child paths (`parent[0].child` and `parent__id__child`), then notifies. |
| `public clearErrors(fieldId: string): void` | Sugar for `setErrors(fieldId, [])`; called by `FormVisibility` when a field transitions to hidden. |
| `public setPending(fieldId: string, pending: boolean): void` | Sets the async-validation pending flag on the validity entry and notifies. |
| `public getErrors(fieldId: string): DetailedError[]` | Returns the field's current errors, or `[]` when no entry exists. |
| `public isValid(fieldId: string): boolean` | Returns the field's `valid` flag, defaulting to `true` for never-validated fields. |

Private helper `syncParentValidity(parentIdOrName: string)` resolves the parent
field and, when its type declares `derivesValidityFromChildren`, recomputes the
parent's `valid` flag from its own errors plus any invalid positional or
identity-keyed children, notifying the parent when the flag flips.

---

### 2.3 `src/core/form-core/modules/circuit-breaker.ts`

Per-field and global fault isolation for engine operations. A field whose
handler repeatedly fails opens only its own breaker, degrading that field to
fallback values instead of failing the form.

Source: [circuit-breaker.ts](../../../src/core/form-core/modules/circuit-breaker.ts)

#### `BreakerState`

```ts
export type BreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";
```

`CLOSED` is normal operation, `OPEN` short-circuits calls to the fallback, and
`HALF_OPEN` admits a bounded number of probe calls after the reset timeout.

#### `BreakerEntry`

```ts
export interface BreakerEntry {
  state: BreakerState;
  failureCount: number;
  lastFailureTime: number;
}
```

#### `CircuitBreakerOptions`

```ts
export interface CircuitBreakerOptions {
  threshold?: number;        // default 3
  resetTimeoutMs?: number;   // default 30000
  maxHalfOpenProbes?: number; // default 2
}
```

#### `CircuitBreaker`

```ts
export class CircuitBreaker
```

| Signature | Description |
|---|---|
| `constructor(options?: CircuitBreakerOptions)` | Merges caller options over the defaults (`threshold: 3`, `resetTimeoutMs: 30000`, `maxHalfOpenProbes: 2`). |
| `getState(fieldId?: string): BreakerState` | Returns the entry state for a field or the global entry, reporting `HALF_OPEN` once `resetTimeoutMs` has elapsed since the last failure while OPEN. |
| `isOpen(fieldId?: string): boolean` | True when calls should be short-circuited: OPEN always, and HALF_OPEN only once the probe budget is exhausted. |
| `recordSuccess(fieldId?: string): void` | Deletes the field entry on field-level success (leaving global untouched), or fully resets the global entry and probe counter on global success. |
| `recordFailure(fieldId?: string): void` | Increments the failure count, stamps `lastFailureTime`, and transitions the entry to `OPEN` at the threshold. |
| `async guard<T>(fn: () => Promise<T>, fallback: T, fieldId?: string): Promise<T>` | Runs `fn` unless the breaker is open (returns `fallback`); records success or failure and returns `fallback` on thrown errors. |
| `reset(): void` | Clears all field entries and resets the global breaker to CLOSED. |

Private helpers: `getOrCreateFieldEntry`, `shouldAttemptReset(entry)`, and
`probeAllowed(_fieldId?)` (consumes the shared `halfOpenProbes` budget).

#### `formCircuitBreaker`

```ts
export const formCircuitBreaker = new CircuitBreaker();
```

Singleton global circuit breaker for the form system.

---

## 3. Reactivity & execution

### 3.1 `src/core/form-core/modules/execution.ts`

The action coordinator: processes everything that ripples from a single
`setValue` call — normalizer hooks, optional pre-write screening, the
synchronous value + vitality write, middleware, debounced validation, and the
multi-tier reactive transaction. `FormCore` itself is received through a
late-binding `coreContext` callback to break the construction cycle.

Source: [execution.ts](../../../src/core/form-core/modules/execution.ts)

#### `FormExecution<T>`

```ts
export class FormExecution<T extends Record<string, any>>
```

Constructor:

```ts
constructor(
  private resolver: FieldResolver,
  private stateManager: StateManager<T>,
  private runtime: FormRuntime<T>,
  private validator: FormValidator<T>,
  private visibility: FormVisibility<T>,
  private debug: DebugManager<T>,
  private coreContext: () => FormCore<T>,
  validationDebounceMs?: number
)
```

The constructor also creates `this.coordinator = new ReactiveTransactionCoordinator<T>(...)`,
exposed as `public readonly coordinator: ReactiveTransactionCoordinator<T>`.

Method table:

| Signature | Description |
|---|---|
| `async setValue(fieldIdentifier: string \| keyof T, value: any): Promise<void>` | Resolves the field (accepting ID or name), runs the field type's `handleChange` normalizer, optionally screens the candidate when deferred validation is disabled (rejecting without throwing), writes the value synchronously through `valueProxy`, updates dirty/version vitality, calls `notifyField`, then runs `processFieldChange` inside `stateManager.batch`. |
| `async handleFieldBlur(fieldId: string): Promise<void>` | Triggers `forceValidateField` when the mode is `onBlur` or `lazy`, or when the field's `validation.validateOn` includes `"blur"`. |
| `async forceValidateField(fieldId: string): Promise<void>` | Cancels any pending debounce timer for the field, validates immediately, and notifies the field's subscribers. |
| `use(fn: (context: { form: FormCore<T>; fieldId?: string }) => void \| Promise<void>): void` | Registers a middleware function that runs on every field value change, awaited in insertion order. |

Private helpers:

- `processFieldChange(changedFieldId: string)` — decides whether onChange validation applies (mode `onChange`, `lazy` after first submit, currently-invalid field, or explicit `validateOn: ["change"]`), runs the middleware chain, schedules validation on the shared 300 ms debounce timer (`validationDebounceMs`, overridable in the constructor) when applicable, then awaits `coordinator.executeTransaction(changedFieldId, { validateChangedField })` and notifies every affected field.
- `runMiddleware(fieldId?: string)` — sequentially awaits each registered middleware with `{ form, fieldId }`.
- `recomputeSingleComputedField(fieldId, visited?)` and `recomputeComputedFields(changedFieldName)` — fallback computed sweeps that delegate to the coordinator or iterate all computed fields when the dependency graph is empty.

---

### 3.2 `src/core/form-core/modules/transaction-coordinator.ts`

Runs the four dependency tiers of a field mutation in strict order inside one
batch window: computed → visibility → async remote options → validation. This
prevents glitch states and validation against intermediate values.

Source: [transaction-coordinator.ts](../../../src/core/form-core/modules/transaction-coordinator.ts)

#### `TransactionOptions`

```ts
export interface TransactionOptions {
  validateChangedField?: boolean;
}
```

#### `ReactiveTransactionCoordinator<T>`

```ts
export class ReactiveTransactionCoordinator<
  T extends Record<string, any> = Record<string, any>,
>
```

Constructor:

```ts
constructor(
  private resolver: FieldResolver,
  private stateManager: StateManager<T>,
  private runtime: FormRuntime<T>,
  private validator: FormValidator<T>,
  private visibility: FormVisibility<T>,
  private debug: DebugManager<T>,
  private getRemoteOptions: () => RemoteOptionsManager<T> | undefined
)
```

Method table:

| Signature | Description |
|---|---|
| `public async executeTransaction(changedFieldId: string, options?: TransactionOptions): Promise<Set<string>>` | Looks up the changed field's categorized dependencies, then runs Tier 1 computed recompute to convergence, Tier 2 `visibility.evaluateVisibility`, Tier 3 `remoteOptions.handleValueChange` (when dependents exist), and Tier 4 validation of the changed field (if requested), mutated computed fields with validation, and active cross-field dependents (dirty, touched, or already invalid). Returns the set of mutated field IDs. |
| `public recomputeSingleComputedField(fieldId: string, visited?: Set<string>, affectedFields?: Set<string>, mutatedFields?: Set<string>): void` | Evaluates one computed field via `runtime.reactiveEngine.evaluateComputedField`; when the value changes, writes it through `valueProxy`, bumps vitality dirty/version, records the field as affected and mutated, and recursively cascades to downstream computed dependents, guarded by `visited`. |
| `public async validateDependents(sourceFieldIdentifier: string): Promise<string[]>` | Validates every field in the source field's `validation` dependency set and notifies each; returns the validated IDs. |

---

### 3.3 `src/core/form-core/modules/visibility.ts`

Computes field visibility, disabled state, and `setValue` condition side
effects from the current values. Applies cascading parent hiding, section-level
conditions that force-hide all section fields, and change detection so state
and notifications fire only when something actually changed.

Source: [visibility.ts](../../../src/core/form-core/modules/visibility.ts)

#### `FormVisibility<T>`

```ts
export class FormVisibility<T extends Record<string, any>>
```

Constructor:

```ts
constructor(
  private registry: FieldRegistry,
  private resolver: FieldResolver,
  private stateManager: StateManager<T>,
  private errorManager: ErrorManager<T>,
  private runtime: FormRuntime<T>
)
```

| Signature | Description |
|---|---|
| `public evaluateVisibility(values: T, changedFieldName?: string): void` | Refreshes the condition proxy with values/validity/vitality/metadata, evaluates section conditions first (a hidden section force-hides its `fieldIds`), computes each field's visibility with memoization and parent cascade, writes `disabled` flags into the view slice, applies `setValue` effects with a depth guard, and finally — only when something changed — replaces `state.visibility` / `state.view` and notifies. Fields that transitioned visible → hidden have errors cleared (unless `visibilityBehavior: "suspend"`) and, under the default `"purge"` behavior, their values set to `null`. |

Private helper `applySetValueEffects(depth: number)` collects
`conditionProxy.getSetValueEffects(field)` for all fields, writes differing
values, and recurses; at `depth >= MAX_SET_VALUE_DEPTH` (module constant, 5)
it aborts with a console error describing the setValue cycle.

#### `hasConditionalRules`

```ts
export function hasConditionalRules(nodes: unknown[]): boolean
```

Returns true when any node in the (recursive `fields` / `children` /
`subSections`) tree carries `conditions`, `meta.conditions`, or an explicit
`visible` flag. Renderers such as `DetailRenderer` use it to skip engine
instantiation for purely static definitions.

---

### 3.4 `src/core/form-core/modules/reactive-engine.ts`

Evaluates `{{field}}` template expressions for `ReactiveValue` and
`ComputedField` definitions by interpolating field paths and evaluating the
result with `new Function` against registered helper functions. Only trusted
schemas should be passed; this module is intentionally not exported through the
modules barrel.

Source: [reactive-engine.ts](../../../src/core/form-core/modules/reactive-engine.ts)

#### `ReactiveEngine`

```ts
export class ReactiveEngine
```

| Signature | Description |
|---|---|
| `constructor(initialValues?: Record<string, any>)` | Stores the initial values snapshot and registers the default helpers. |
| `updateValues(values: Record<string, any>): void` | Replaces the internal values reference used by expression evaluation. |
| `registerHelper(name: string, fn: (...args: any[]) => any): void` | Registers a named helper callable from inside expressions. |
| `evaluateReactiveValue<T = any>(reactive: ReactiveValue<T>): T` | Evaluates `reactive.expression` and coerces the result to `reactive.returnType`. |
| `evaluateComputedField(computed: ComputedField): any` | Evaluates `computed.formula` and coerces to `computed.returnType`. |

Private helpers: `registerDefaultHelpers()` installs `today`, `now`,
`addDays`, `addMonths`, `addYears`, `addHours`, `addMinutes`, `min`, and `max`;
`evaluateExpression(expression: string, returnType: string = "string"): any`
performs `{{path}}` substitution via lodash `get`, escapes string values,
executes the strict-mode function body with helpers injected as parameters,
and falls back to the raw (or coerced) string when evaluation throws. Boolean
return types coerce with `!!`, number types with `Number(...)`.

Note: `ReactiveEngine` is re-exported only through [runtime.ts](../../../src/core/form-core/modules/runtime.ts)
consumers; it is absent from [index.ts](../../../src/core/form-core/modules/index.ts).

---

### 3.5 `src/core/form-core/modules/runtime.ts`

Container that constructs the shared proxies once per form so every module
reads values, conditions, and flow state through identical instances.

Source: [runtime.ts](../../../src/core/form-core/modules/runtime.ts)

#### `FormRuntime<T>`

```ts
export class FormRuntime<T extends Record<string, any>>
```

Public properties:

| Property | Type | Description |
|---|---|---|
| `valueProxy` | `ValueProxy` | Stateless path-based value getter/setter. |
| `conditionProxy` | `ConditionProxy` | Condition evaluator holding an internal values snapshot that must be refreshed via `updateValues` before each pass. |
| `reactiveEngine` | `ReactiveEngine` | Formula/expression evaluator for reactive values and computed fields. |
| `flowProxy` | `FlowProxy` | Wizard navigation helper reading values and visibility through lazy callbacks. |

| Signature | Description |
|---|---|
| `constructor(private registry: FieldRegistry, private stateManager: StateManager<T>)` | Builds all four delegates; `FlowProxy` receives `() => state.values` and `() => state.visibility` so it never captures stale snapshots. |
| `public getValues(): T` | Returns `stateManager.state.values` — the raw values object without the dev-mode mutation proxy. |

---

### 3.6 `src/core/form-core/modules/resolution-pipeline.ts`

Layer 2 of the render engine: pure static resolution of a `RenderNode` plus the
5V state matrix into final component props, gated by visibility and field-type
capabilities.

Source: [resolution-pipeline.ts](../../../src/core/form-core/modules/resolution-pipeline.ts)

#### `IFieldTypeRegistry`

```ts
export interface IFieldTypeRegistry {
  get(type: string): {
    resolveProps?: (
      resolved: any,
      state: any,
      context: any
    ) => Record<string, any>;
  } | null;
}
```

Minimal structural interface allowing the pipeline to be decoupled from the
concrete field type registry (dependency inversion).

#### `ResolutionContext`

```ts
export interface ResolutionContext {
  cache: Map<string, unknown>;
  signal?: AbortSignal;
  form?: any;
}
```

Carries a shared per-render-pass cache, an optional cancellation signal, and an
optional `FormCore` reference for `resolveProps` handlers.

#### `ResolutionPipeline`

```ts
export class ResolutionPipeline
```

| Signature | Description |
|---|---|
| `public static resolve(node: RenderNode, state: InternalFormState<any>, density?: "compact" \| "comfortable" \| "spacious", registry?: IFieldTypeRegistry, context?: ResolutionContext): ResolvedFieldProps \| null` | Returns `null` when `state.visibility[node.stateKey]` is false (V3 gate). Otherwise assembles base props from the node and the V4 view slice, adds capability-gated input props (value read from `dataPath` via lodash `get`, validity/errors/touched/dirty/focused/version/conflict read by `stateKey`), then merges the field type's custom `resolveProps(props, fieldState, context)` output when registered. |

---

## 4. Data & persistence

### 4.1 `src/core/form-core/modules/remote-options.ts`

Fetches dynamic option lists for fields declaring `remoteOptions`. Supports
debounced refetch on watched-field changes, dependency-key deduplication,
per-field sequence epochs and `AbortController` cancellation so stale responses
are dropped, and debug/performance instrumentation.

Source: [remote-options.ts](../../../src/core/form-core/modules/remote-options.ts)

#### `RemoteOptionsManager<T>`

```ts
export class RemoteOptionsManager<T extends Record<string, any>>
```

Constructor:

```ts
constructor(
  private stateManager: StateManager<T>,
  private resolver: FieldResolver,
  private runtime: FormRuntime<T>,
  private debugManager?: DebugManager<T>
)
```

Method table:

| Signature | Description |
|---|---|
| `async initialize(): Promise<void>` | Scans all registered fields and triggers an initial fetch for each field with a `remoteOptions` configuration. |
| `handleValueChange(changedFieldId: string, dependentFieldIds?: Iterable<string>): void` | Determines dependent field IDs (from the provided iterable, the categorized dependency graph, or a scan of `remoteOptions.watch`) and schedules a debounced fetch per dependent using `remoteOptions.debounceMs` (default 300 ms, trailing, maxWait = 3x). |
| `public executeSearch(fieldId: string, query: string): void` | Debounced autocomplete search: reuses a per-field search debounce timer to call the fetch with `searchQuery`, which is forwarded as a `search` query parameter. |
| `public cancelPending(fieldId: string): void` | Aborts the in-flight request, bumps the field's epoch, cancels both debounce timers, and drops the pending-fetch entry. |
| `dispose(): void` | Aborts all controllers, clears epochs, timers, pending fetches, and the dedupe key map; call on form unmount. |

Private helpers:

- `fetchOptions(fieldId: string, searchQuery?: string)` — verifies every watched dependency has a value (otherwise cancels and clears options), builds a `search:…#watch:…` dedupe key, aborts the previous controller, increments the field epoch, sets `isLoading`, and awaits `executeFetch` while tracking the pending promise.
- `executeFetch(fieldId, remoteOptions, values, startTime, epoch, signal, searchQuery?)` — interpolates the URL and params via `ExpressionEvaluator.interpolate`, performs the HTTP request through the dynamic `@services/http.instance` client with the abort signal, drops the response when the epoch is stale or the signal aborted, unwraps the envelope via `ResponseFactory.UnWrap`, maps raw items through `remoteOptions.mapping` (with `name`/`label` and `iso2`/`id`/`value`/`name` fallbacks), records fetch duration in performance state, logs via `DebugManager`, and writes `{ options, isLoading: false }` into the view slice. Abort/cancel errors are swallowed; other failures clear options.
- `updateViewState(fieldId: string, patch: Partial<any>)` — merges a view-slice patch and notifies the field plus global subscribers.

---

### 4.2 `src/core/form-core/modules/persistence-manager.ts`

Pluggable storage port and draft persistence engine: debounced autosave of
filtered values, schema-version-checked rehydration, and cleanup on submission.
The `StorageAdapter` SPI allows session, local, memory, or custom backends.

Source: [persistence-manager.ts](../../../src/core/form-core/modules/persistence-manager.ts)

#### `StorageAdapter`

```ts
export interface StorageAdapter {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}
```

#### `MemoryStorageAdapter`

```ts
export class MemoryStorageAdapter implements StorageAdapter
```

| Signature | Description |
|---|---|
| `getItem(key: string): string \| null` | Reads from the internal `Map`. |
| `setItem(key: string, value: string): void` | Writes to the internal `Map`. |
| `removeItem(key: string): void` | Deletes the key. |
| `clear(): void` | Clears the entire map (test isolation helper). |

#### `SessionStorageAdapter`

```ts
export class SessionStorageAdapter implements StorageAdapter
```

Wraps `window.sessionStorage` with try/catch; `getItem` returns `null` and
writes warn on failure. Isolates drafts to the active tab session.

#### `LocalStorageAdapter`

```ts
export class LocalStorageAdapter implements StorageAdapter
```

Same contract over `window.localStorage`, persisting drafts across browser
restarts.

#### `PersistedDraftData`

```ts
export interface PersistedDraftData {
  version?: string;
  timestamp: number;
  values: Record<string, any>;
  uiState?: Record<string, any>;
}
```

Serialized envelope: optional schema version, save timestamp in milliseconds,
the filtered values, and optional UI state (active section/tab).

#### `PersistenceConfig`

```ts
export interface PersistenceConfig {
  key: string;
  storage?: "session" | "local" | "memory" | StorageAdapter;
  debounceMs?: number;          // default 500
  includeFields?: string[];
  excludeFields?: string[];
  version?: string;
  autoRestore?: boolean;        // default true
  clearOnSubmit?: boolean;      // default true
  onSave?: (data: PersistedDraftData) => void;
  onRestore?: (data: PersistedDraftData) => void;
  onError?: (error: unknown) => void;
}
```

#### `FormPersistenceManager<T>`

```ts
export class FormPersistenceManager<
  T extends Record<string, any> = Record<string, any>,
>
```

| Signature | Description |
|---|---|
| `constructor(public readonly config: PersistenceConfig, private stateManager: StateManager<T>)` | Resolves the concrete adapter from `config.storage` (defaulting to session storage, falling back to memory in non-browser runtimes), creates the debounced save (default 500 ms), and subscribes to `stateManager` for autosave. |
| `public async save(): Promise<void>` | Filters values through `filterValues`, serializes a `PersistedDraftData` envelope (including `uiState.activeSectionId` / `activeTabId` when present), writes it via the adapter, and calls `onSave`; re-entrant calls are skipped via the `isSaving` flag and failures route to `onError`. |
| `public async restore(): Promise<boolean>` | Reads and parses the draft, rejects invalid or version-mismatched drafts (dev warning), applies each value through `stateManager.setRawValue`, merges `uiState` via `stateManager.update`, calls `onRestore`, and returns whether a draft was applied. |
| `public async clear(): Promise<void>` | Cancels the pending debounced save and removes the draft key via the adapter. |
| `public destroy(): void` | Cancels the debounce and unsubscribes from the state manager. |

Private helpers: `resolveAdapter(storage?)` maps the config string to a
concrete adapter (objects pass through), and `filterValues(rawValues: T)` deep
clones values then applies the include whitelist and exclude blacklist by top-level key.

---

## 5. Structure & history

### 5.1 `src/core/form-core/modules/repeater-factory.ts`

Materializes and destroys dynamic repeater rows, giving each row instance a
stable identity-keyed state key (`repeaterId__rowId__leaf`) and a
lodash-compatible data path, and registering/deregistering the row's state
slices through `StateManager`.

Source: [repeater-factory.ts](../../../src/core/form-core/modules/repeater-factory.ts)

#### `RepeaterRowFactory<T>`

```ts
export class RepeaterRowFactory<
  T extends Record<string, any> = Record<string, any>,
>
```

| Signature | Description |
|---|---|
| `constructor(private stateManager: StateManager<T>)` | Stores the state manager used for row state registration. |
| `public getOrAssignRowId(rowData: any, idField?: string): string` | Returns `rowData[idField]` when present, else an existing `_rowId`, else generates `row_<counter>_<rand>`, caches it in a `WeakMap`, and defines a non-enumerable `_rowId` (excluded from `JSON.stringify`). Non-object input falls back to `row_<counter>`. |
| `public resolveStateKey(repeaterId: string, rowIndex: number, rowData: any, config: RepeaterConfig \| undefined, leafName: string): string` | Uses the identity strategy (default, or when `config.rowStateStrategy === "identity"`) to build `repeaterId__rowId__leafName`; falls back to positional `repeaterId[rowIndex].leafName` when `"positional"` is requested. |
| `public createRowNodes(repeaterId: string, rowIndex: number, template: RenderNode[], rowData?: any): RenderNode[]` | Clones each template node with the resolved `stateKey` and `dataPath` (via the private `resolveDataPath`, which honors `config.rowPathFormat.template` tokens `[idx]` / `[id]`), sets `id`/`visibilityKey` to the state key and `parentId` to the repeater, and calls `stateManager.registerRowState(stateKey)` for every node. |
| `public destroyRow(repeaterId: string, rowIndex: number, template: RenderNode[], rowData?: any): void` | Recomputes each template node's state key and calls `stateManager.deregisterRowState` to prevent leaks and ghost validation errors. |

Private helper `resolveDataPath(repeaterId, rowIndex, rowData, format, leafName)`
defaults to `${repeaterId}[${rowIndex}].${leafName}` and otherwise expands the
configured template.

---

### 5.2 `src/core/form-core/modules/history.ts`

Capacity-bound undo/redo stack of deep-cloned value snapshots with a
coalescing window so rapid keystrokes collapse into one undo step.

Source: [history.ts](../../../src/core/form-core/modules/history.ts)

#### `HistorySnapshot<T>`

```ts
export interface HistorySnapshot<T = Record<string, any>> {
  values: T;
  timestamp: number;
}
```

#### `HistoryOptions`

```ts
export interface HistoryOptions {
  capacity?: number;          // default 50
  coalesceWindowMs?: number;  // default 300
}
```

#### `FormHistory<T>`

```ts
export class FormHistory<T extends Record<string, any> = Record<string, any>>
```

| Signature | Description |
|---|---|
| `constructor(initialValues: T, options?: HistoryOptions)` | Stores a deep clone of the initial values as the current state and applies capacity/coalesce options. |
| `push(values: T): void` | Snapshots the previous current values; if the newest past snapshot is younger than `coalesceWindowMs` it is overwritten instead of appended; otherwise the snapshot is pushed, the oldest is dropped past `capacity`, and the redo stack is cleared. |
| `undo(): T \| null` | Pops the newest past snapshot (pushing current values to the future stack) and returns the restored deep-cloned values, or `null` when the past is empty. |
| `redo(): T \| null` | Pops the newest future snapshot (pushing current values to the past stack) and returns the restored values, or `null` when the future is empty. |
| `get canUndo(): boolean` | True when the past stack is non-empty. |
| `get canRedo(): boolean` | True when the future stack is non-empty. |
| `get undoCount(): number` | Number of past snapshots. |
| `get redoCount(): number` | Number of future snapshots. |
| `clear(): void` | Empties both stacks. |
| `peekUndo(): HistorySnapshot<T> \| null` | Returns the newest past snapshot without consuming it. |
| `peekRedo(): HistorySnapshot<T> \| null` | Returns the newest future snapshot without consuming it. |

Module-private helper `deepClone<T>(obj: T): T` prefers `structuredClone` and
falls back to a manual recursive copy.

---

### 5.3 `src/core/form-core/modules/capability-registry.ts`

Closed-world registries for field categories and field types. Each type
resolves its capabilities by merging category defaults with per-type
overrides; unknown types throw. Bootstraps the standard categories and all
built-in types at module load.

Source: [capability-registry.ts](../../../src/core/form-core/modules/capability-registry.ts)

#### `CategoryDefinition`

```ts
export interface CategoryDefinition {
  name: string;
  defaultCapabilities: FieldCapabilities;
  allowedInRepeater?: boolean;
  allowedAsRoot?: boolean;
}
```

#### `FieldTypeConfig`

```ts
export interface FieldTypeConfig {
  category: string;
  capabilities?: Partial<FieldCapabilities>;
  defaultProps?: Record<string, any>;
  resolveProps?: (resolved: any, state: any, context: any) => Record<string, any>;
  handleChange?: (rawValue: any, context: any) => any;
  validate?: (value: any, context: any) => any | Promise<any>;
}
```

#### `ResolvedFieldType`

```ts
export interface ResolvedFieldType extends FieldTypeConfig {
  type: string;
  category: string;
  capabilities: FieldCapabilities;
}
```

#### `CategoryRegistry`

```ts
class CategoryRegistry
```

Exported as a class value (constructed once as the `categoryRegistry`
singleton). Methods:

| Signature | Description |
|---|---|
| `public register(key: string, definition: CategoryDefinition): void` | Registers a category; throws when the key is already registered. |
| `public get(key: string): CategoryDefinition` | Returns the category or throws `"Unknown category …"`. |

#### `FieldTypeRegistry`

```ts
class FieldTypeRegistry
```

| Signature | Description |
|---|---|
| `register(type: string, config: FieldTypeConfig): void` | Resolves the category (throwing if unknown), merges `category.defaultCapabilities` with `config.capabilities`, and stores a `ResolvedFieldType`. |
| `get(type: string): ResolvedFieldType` | Returns the resolved type or throws for unregistered types. |
| `getCapabilities(type: string): FieldCapabilities` | Shorthand for `get(type).capabilities`. |
| `has(type: string): boolean` | Membership check. |

#### Singletons and bootstrap

```ts
export const categoryRegistry = new CategoryRegistry();
export const fieldTypeRegistry = new FieldTypeRegistry(categoryRegistry);
```

At import time the module registers the four categories — `input` (full 5V
capabilities), `static` (visibility + view only), `structure` (visibility +
view only, allowed as root), and `repeater` (value, visibility, view,
vitality, plus `derivesValidityFromChildren`) — and registers every built-in
type: ~38 input types, 13 static types, 11 structure types, and `repeater`.

---

### 5.4 `src/core/form-core/modules/debug-manager.ts`

Opt-in structured logging into the `state.debug.logs` slice. Logging is off by
default; `log()` deliberately does not notify subscribers so debug tracing does
not trigger re-renders.

Source: [debug-manager.ts](../../../src/core/form-core/modules/debug-manager.ts)

#### `DebugManager<T>`

```ts
export class DebugManager<T extends Record<string, any>>
```

| Signature | Description |
|---|---|
| `constructor(private stateManager: StateManager<T>)` | Stores the state manager used to read `debug.isEnabled` and write `debug.logs`. |
| `public log(message: string, data?: any): void` | Appends `{ timestamp, message, data }` when `state.debug.isEnabled` is true; early-exits otherwise. Does not call `notify()`. |
| `public enable(enable = true): void` | Sets `state.debug.isEnabled` and calls `stateManager.notify()` so debug panels can react. |

---

## 6. Barrel

### 6.1 `src/core/form-core/modules/index.ts`

Source: [index.ts](../../../src/core/form-core/modules/index.ts)

Re-exports every public engine module via `export *`:

| Export source | Symbols surfaced |
|---|---|
| `./field-registry` | `FieldRegistry`, `normalizeFormDefinition`, `denormalizeForm` |
| `./resolver` | `FieldResolver` |
| `./state-manager` | `StateManager` |
| `./validator` | `FormValidator` |
| `./visibility` | `FormVisibility`, `hasConditionalRules` |
| `./error-manager` | `ErrorManager` |
| `./debug-manager` | `DebugManager` |
| `./runtime` | `FormRuntime` |
| `./execution` | `FormExecution` |
| `./remote-options` | `RemoteOptionsManager` |
| `./capability-registry` | `CategoryRegistry`, `FieldTypeRegistry`, `CategoryDefinition`, `FieldTypeConfig`, `ResolvedFieldType`, `categoryRegistry`, `fieldTypeRegistry` |
| `./resolution-pipeline` | `ResolutionPipeline`, `ResolutionContext`, `IFieldTypeRegistry` |
| `./repeater-factory` | `RepeaterRowFactory` |
| `./circuit-breaker` | `CircuitBreaker`, `formCircuitBreaker`, `BreakerState`, `BreakerEntry`, `CircuitBreakerOptions` |
| `./history` | `FormHistory`, `HistorySnapshot`, `HistoryOptions` |
| `./persistence-manager` | `FormPersistenceManager`, `StorageAdapter`, `MemoryStorageAdapter`, `SessionStorageAdapter`, `LocalStorageAdapter`, `PersistedDraftData`, `PersistenceConfig` |
| `./transaction-coordinator` | `ReactiveTransactionCoordinator`, `TransactionOptions` |

`reactive-engine.ts` is intentionally absent from the barrel — `ReactiveEngine`
is consumed internally through `FormRuntime`.

---

**See also:**

- [01-ENGINE.md](01-ENGINE.md) — `FormCore` wiring and lifecycle
- [02-REGISTRIES.md](02-REGISTRIES.md) — schema, manifest, condition, and injection registries
- [04-DOMAIN_TYPES.md](04-DOMAIN_TYPES.md) — domain entities referenced by every module
- [05-ADAPTERS_UTILS.md](05-ADAPTERS_UTILS.md) — value/condition/flow proxies and normalization utils
- [10-SHARED_UTILS.md](10-SHARED_UTILS.md) — expression evaluator and shared helpers
- [11-TYPES_CONTRACTS.md](11-TYPES_CONTRACTS.md) — `InternalFormState`, `NormalizedForm`, and render contracts
