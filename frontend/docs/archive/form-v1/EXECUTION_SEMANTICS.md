# Execution Semantics Specification

This document formally specifies the execution lifecycle of the FormCore engine. It serves as the authoritative reference for implementation, testing, and debugging.

---

## 1. Overview

The FormCore engine processes field value changes through a **deterministic, phased pipeline**:

```
setValue(fieldId, value)
    │
    ├── Phase 0: Pre-processing (sync)
    │     • Custom handleChange normalizers
    │     • Deferred validation screening (opt-in)
    │
    ├── Phase 1: Synchronous Write (sync, O(1))
    │     • Value written to ValueProxy
    │     • Vitality updated (dirty=true, version++)
    │     • Immediate notifyField() for controlled input responsiveness
    │
    ├── Phase 2: Asynchronous Batch (async, batched)
    │     • Validation (per validationMode)
    │     • Middleware chain (sequential, awaited)
    │     • Computed field recomputation (recursive)
    │     • Visibility evaluation (with cascading)
    │     • Remote options trigger
    │     • Final notify() + notifyField()
    │
    └── Phase 3: Completion
          • State consistent
          • Subscribers notified
```

---

## 2. Phase Details

### Phase 0: Pre-processing

**Trigger**: Every `setValue()` call

**Steps**:
1. **Custom `handleChange`**: If field type defines `handleChange`, apply it
   - Input: raw value, context `{ form, fieldId, fieldName }`
   - Output: normalized value
   - Must be pure (no side effects)

2. **Deferred Validation Screening** (opt-in via `disableDeferredValidation`):
   - Run `validator.screenCandidate(fieldId, value)` before write
   - If rejected: value NOT written, error recorded, return early
   - Never throws; previous value preserved

**Timing**: Synchronous, before any state mutation

---

### Phase 1: Synchronous Write

**Trigger**: After Phase 0 passes

**Operations** (atomic, in order):
```typescript
// 1. Write value
valueProxy.setValue(state.values, fieldName, finalValue);

// 2. Update vitality
const isDirty = vitality?.initialValue !== finalValue;
stateManager.setVitality(fieldId, {
  dirty: isDirty,
  version: (vitality?.version || 0) + 1,
});

// 3. Immediate notification (critical for controlled inputs)
stateManager.notifyField(fieldId);
```

**Guarantees**:
- Completes in < 1ms (O(1) operations)
- No async operations
- React receives new value in same tick or next microtask
- Vitality reflects *actual* dirtiness (compares to initialValue, not previous)

---

### Phase 2: Asynchronous Batch

**Trigger**: After Phase 1 notify

**Execution**: Wrapped in `stateManager.batch()` for coalesced notifications

**Sub-phases** (sequential, each awaited):

#### 2A: Validation
```typescript
const shouldValidateOnChange =
  mode === "onChange" ||
  (mode === "lazy" && hasSubmitted) ||
  fieldHasError(fieldId) ||
  fieldRequestsValidationOnChange(field);

if (shouldValidateOnChange) {
  // Debounced
  if (debounceMs > 0) {
    setTimeout(() => validateField(fieldId), debounceMs);
  } else {
    await validateField(fieldId);
  }
}
```

**Validation Modes**:
| Mode | Immediate | On Blur | On Submit | Debounced |
|------|-----------|---------|-----------|-----------|
| `onChange` | ✅ | ❌ | ✅ | Configurable |
| `onBlur` | ❌ | ✅ | ✅ | N/A |
| `onSubmit` | ❌ | ❌ | ✅ | N/A |
| `manual` | ❌ | ❌ | ❌ | N/A |
| `lazy` | ❌* | ✅ | ✅* | Configurable |

*After first submit, `lazy` becomes `onChange`

#### 2B: Middleware Chain
```typescript
for (const mw of middlewareFns) {
  await mw({ form: coreContext(), fieldId: changedFieldId });
}
```

**Contract**:
- Registered in order via `execution.use(fn)`
- Each receives `{ form: FormCore, fieldId?: string }`
- **Must not** call `setValue` on same field (causes re-entrancy)
- **May** call `setValue` on other fields (triggers nested pipeline)
- Errors propagate, stop chain
- Execution order = registration order

**Known Behavior**: Nested `setValue` causes multiple `notify()` calls → multiple React renders. Acceptable for now; batching mechanism planned.

#### 2C: Computed Field Recomputation
```typescript
// For each field with computed.expression depending on changedFieldName:
const newValue = reactiveEngine.evaluateComputedField(computed);
if (newValue !== currentValue) {
  valueProxy.setValue(values, fieldName, newValue);
  recomputeComputedFields(fieldName); // Recursive
}
```

**Guarantees**:
- Dependency graph determines affected fields (O(D) not O(N))
- Recursive with cycle detection (max depth = field count)
- Runs within batch, single notify at end

#### 2D: Visibility Evaluation
```typescript
visibilityEngine.evaluateVisibility(values, changedFieldName);
```

**Algorithm**:
1. Update `ConditionProxy` with current values + validity + vitality
2. Evaluate section conditions first (2G: section hide overrides field show)
3. For each field:
   - Check forced hidden by parent section
   - Evaluate own conditions via `ConditionProxy.isVisible()`
   - Check reactive `visible`/`enabled` overrides
   - Cascade: if parent hidden, child hidden
   - Memoized per pass
4. Build new `ViewState` for disabled fields
5. Apply `setValue` effects (2B) with cycle guard (MAX_DEPTH = 5)
6. Compare new vs old visibility; only notify if changed

**Side Effects on Hide** (per field `visibilityBehavior`):
- `purge` (default): Clear errors, null value
- `preserve`: Clear errors, keep value
- `suspend`: Keep errors, keep value

#### 2E: Remote Options Trigger
```typescript
await form.remoteOptions.handleValueChange(changedFieldId);
```

**Behavior**:
- For fields with `remoteOptions` watching `changedFieldName`
- Debounced (default 300ms)
- Cached (TTL 5min)
- Updates `ViewState` with loading/options

#### 2F: Final Notification
```typescript
stateManager.notifyField(changedFieldId); // Errors, visibility, view
stateManager.notify(); // Global: isDirty, isValid, etc.
```

---

### Phase 3: Blur Handling

**Trigger**: Field `onBlur` event (via `ReactFormAdapter`)

```typescript
async handleFieldBlur(fieldId) {
  const shouldValidateOnBlur =
    mode === "onBlur" ||
    mode === "lazy" ||
    fieldRequestsValidationOnBlur(field);

  if (shouldValidateOnBlur) {
    await forceValidateField(fieldId); // Bypass debounce
  }
}
```

**Note**: `forceValidateField` clears any pending debounce timer for immediate feedback.

---

## 3. Validation Mode State Machine

```
Initial: onBlur (default)
    │
    ├── User types → no validation (onBlur/onSubmit/manual/lazy)
    │
    ├── User blurs field → validate field (onBlur/lazy)
    │
    ├── User submits → validate all (all modes)
    │       │
    │       └─ onSubmit/lazy: after submit, mode becomes onChange
    │
    └── Programmatic:
            validateFields([ids]) → immediate (manual)
            validateFields() → all fields
```

**State persisted in**: `stateManager.state.performance.lastSubmissionDurationMs` (for `lazy` mode transition)

---

## 4. Middleware Contract

### Registration
```typescript
form.use(async ({ form, fieldId }) => {
  // form: full FormCore API
  // fieldId: changed field (undefined for manual triggers)
});
```

### Execution Guarantees
| Property | Guarantee |
|----------|-----------|
| Order | Registration order (FIFO) |
| Async | Each `await`ed sequentially |
| Errors | Uncaught → logged, chain stops |
| Context | `form` is full FormCore (late-bound) |
| Re-entrancy | Nested `setValue` allowed, causes re-render |

### Built-in Middleware Points
| Point | Trigger |
|-------|---------|
| `pipeline.middleware` | Every `setValue` |
| `events.onSubmit` | `form.submit()` |
| `events.onChange` | Every value change (after batch) |
| `events.onInit` | Engine construction |
| `events.onError` | Uncaught error in pipeline |

---

## 5. Visibility Evaluation Contract

### Inputs
- Current `ValuesState` (all field values)
- Current `ValidityState` (for `validity.fieldId.valid` in expressions)
- Current `VitalityState` (for `touched`, `dirty` in expressions)
- Optional `changedFieldName` for targeted evaluation

### Outputs
- `VisibilityState`: `{ [fieldId]: boolean }`
- `ViewState`: `{ [fieldId]: { disabled: boolean } }`
- Side effects: error clearing, value nulling, setValue chains

### Condition Expression Grammar
```
expression := comparison | logical | function | path
comparison := path op literal
logical := expression ('&&' | '||') expression
function := identifier '(' path? ')'
path := identifier ('.' identifier)*
literal := string | number | boolean | null
op := '===' | '!==' | '==' | '!=' | '>' | '>=' | '<' | '<='
```

### Built-in Functions
| Function | Args | Returns |
|----------|------|---------|
| `today()` | none | ISO date string |
| `sum(path)` | array path | number |
| `uppercase(path)` | string path | string |
| `lowercase(path)` | string path | string |
| `currency(path)` | number path | formatted string |
| `hasrole(role)` | string | boolean |

### Section Override (2G)
Section `visible`/`conditions` evaluated **before** fields. If section hidden:
- All direct `fieldIds` forced hidden
- Field-level "show" rules ignored
- Errors cleared, values nulled per `visibilityBehavior`

### Cycle Guard (2B)
- `MAX_SET_VALUE_DEPTH = 5`
- Each `setValue` effect increments depth
- At depth ≥ 5: abort with console.error
- Prevents infinite loops: A→B→A→B...

---

## 6. Concurrency & Batching

### `stateManager.batch(fn)`
```typescript
await stateManager.batch(async () => {
  await processFieldChange(fieldId);
  notifyField(fieldId);
  notify();
});
```

**Behavior**:
- Accumulates `notifyField` calls
- Single `notify()` at end
- Prevents intermediate renders
- Nested `batch()` calls merge (counter-based)

### Subscription Model
```typescript
const unsub = form.subscribe((state) => {
  // Receives full InternalFormState
  // Called after each batch completes
});
```

**Guarantees**:
- Called after Phase 2 completes
- Not called during Phase 1 (sync write)
- Receives immutable snapshot

---

## 7. Error Handling

### Pipeline Errors
| Error Source | Behavior |
|--------------|----------|
| `handleChange` | Caught, logged, original value used |
| `screenCandidate` | Rejected → value not written, error set |
| Validation | Errors recorded in `ValidityState`, pipeline continues |
| Middleware | Uncaught → logged, chain stops, pipeline continues |
| Visibility | Errors logged, evaluation continues for other fields |
| Remote Options | Errors logged, cached options preserved |

### `events.onError`
```typescript
events: {
  onError: (error: Error, formData: TFormData) => void;
}
```
Called for **uncaught** errors in pipeline. Does not catch validation errors.

---

## 8. Determinism Guarantees

Given identical:
- Initial `FormDefinition`
- Initial values
- Sequence of `setValue(fieldId, value)` calls
- External async resolutions (remote options, middleware)

**The engine produces identical**:
- Final `ValuesState`
- Final `ValidityState`
- Final `VisibilityState`
- Final `ViewState`
- Final `VitalityState`
- Notification sequence

**Non-deterministic sources** (must be controlled in tests):
- `Date.now()` in expressions → use `today()`
- `Math.random()` → not allowed in expressions
- Network timing → mock `RemoteOptionsManager`
- Middleware order → registration order is deterministic

---

## 9. Testing Contracts

### Conformance Tests Required
| Test | Description |
|------|-------------|
| `setValue` sync write | Value visible in `form.values` immediately after call |
| `setValue` vitality | `dirty=true`, `version` incremented |
| `onChange` validation | Runs immediately (debounced) on change |
| `onBlur` validation | Runs on blur, not on change |
| `onSubmit` validation | Runs only on submit |
| `lazy` mode | `onBlur` until submit, then `onChange` |
| Middleware order | Executes in registration order |
| Nested setValue | Triggers full pipeline, multiple notifies |
| Visibility cascade | Parent hide → child hide |
| Section override | Section hide → field hide (override) |
| setValue effects | Applied, cascade, cycle guard at depth 5 |
| Computed fields | Recomputed when dependencies change |
| Remote options | Triggered on watch field change |
| Blur handling | Validates on blur for onBlur/lazy |
| Force validate | Bypasses debounce |

---

## 10. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-10-12 | Initial specification |

---

## Appendix: Key Interfaces

```typescript
// From execution.ts
interface FormExecution<T> {
  setValue(fieldIdentifier: string | keyof T, value: any): Promise<void>;
  handleFieldBlur(fieldId: string): Promise<void>;
  forceValidateField(fieldId: string): Promise<void>;
  use(fn: (ctx: { form: FormCore<T>; fieldId?: string }) => void | Promise<void>): void;
}

// From visibility.ts
interface FormVisibility<T> {
  evaluateVisibility(values: T, changedFieldName?: string): void;
}

// From state-manager.ts
interface StateManager<T> {
  batch(fn: () => Promise<void>): Promise<void>;
  notify(): void;
  notifyField(fieldId: string): void;
  subscribe(listener: (state: InternalFormState) => void): () => void;
}
```