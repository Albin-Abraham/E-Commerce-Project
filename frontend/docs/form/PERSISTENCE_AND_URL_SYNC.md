# Form Persistence and URL Sync

How to keep form drafts durable across reloads and keep form state mirrored in the URL. Two independent mechanisms ship with Zenith Form Architecture: the engine's `FormPersistenceManager` (typed `PersistenceConfig` from `@form-core/engine`) and the shared `form-persistence` middleware helpers, plus the `useFormUrlSync` / `useFilterUrlSync` React hooks. All APIs below are verified against source.

---

## 1. Draft persistence concepts

### 1.1 What gets persisted

A draft is a JSON envelope (`PersistedDraftData` in [persistence-manager.ts](../../src/core/form-core/modules/persistence-manager.ts)):

| Field | Type | Meaning |
|---|---|---|
| `version` | `string?` | Schema/definition version stamped from `PersistenceConfig.version` |
| `timestamp` | `number` | Unix ms when the draft was written |
| `values` | `Record<string, any>` | Serialized V1 values, after include/exclude filtering |
| `uiState` | `{ activeSectionId?, activeTabId? }?` | Minimal UI slice (wizard tab/section) when present |

Validity (V2), visibility (V3), and vitality (V5) are **not** persisted — only data and the active UI location. On restore, values are written with `StateManager.setRawValue` per key and the UI slice is merged back.

### 1.2 Storage adapters

`StorageAdapter` is the storage port:

```ts
interface StorageAdapter {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}
```

| Adapter | Backend | Notes |
|---|---|---|
| `SessionStorageAdapter` | `window.sessionStorage` | **Default**; isolated per tab session; swallows storage errors |
| `LocalStorageAdapter` | `window.localStorage` | Survives browser restarts |
| `MemoryStorageAdapter` | in-process `Map` | Tests, SSR, Node; also the fallback when `window`/storage is unavailable |
| Custom | anything | Pass an object implementing `StorageAdapter` as `config.storage` (e.g., a server draft API) |

### 1.3 `PersistenceConfig` reference

| Field | Type | Default | Effect |
|---|---|---|---|
| `key` | `string` | required | Unique storage key for the draft |
| `storage` | `"session" \| "local" \| "memory" \| StorageAdapter` | `"session"` | Backend selection |
| `debounceMs` | `number` | `500` | Inactivity window before autosave fires |
| `includeFields` | `string[]` | all fields | Whitelist of top-level value keys to persist |
| `excludeFields` | `string[]` | none | Blacklist of top-level value keys (passwords, SSNs) |
| `version` | `string` | none | Expected version; mismatched drafts are ignored on restore |
| `autoRestore` | `boolean` | `true` | Restore the draft during engine construction |
| `clearOnSubmit` | `boolean` | `true` | Clear the draft after a **successful** `submit()` |
| `onSave` | `(data: PersistedDraftData) => void` | none | Post-write hook |
| `onRestore` | `(data: PersistedDraftData) => void` | none | Post-rehydrate hook |
| `onError` | `(error: unknown) => void` | none | Persistence failure hook |

The manager subscribes to `StateManager` changes and debounces `save()`; `clear()` also cancels any pending debounced write.

---

## 2. Enabling persistence via `useForm`

`UseFormOptions.persistence?: PersistenceConfig` ([useForm.tsx](../../src/shared/ui/form/hooks/useForm.tsx)) is forwarded into the `Form` engine constructor. When present, the engine creates a `FormPersistenceManager` and — unless `autoRestore === false` — kicks off `restore()` during initialization ([engine.ts](../../src/core/form-core/engine.ts)). `useForm` calls `form.destroy()` on unmount, which cancels the autosave debounce and unsubscribes.

```tsx
import { useMemo } from "react";
import { useForm } from "@ui/form";
import type { PersistenceConfig } from "@form-core/engine";

const persistence: PersistenceConfig = useMemo(
  () => ({
    key: "employee-onboarding:v1",
    storage: "local",
    debounceMs: 800,
    excludeFields: ["password", "ssn"],
    version: "1.0.0",
    clearOnSubmit: true,
    onRestore: (draft) => console.info("draft restored", draft.timestamp),
    onError: (err) => console.warn("draft save failed", err),
  }),
  []
);

const { form, values, submit } = useForm<EmployeeDraft>(
  definition,
  initialValues,
  { validationMode: "onBlur", persistence }
);
```

Notes:

- The `<Form>` component's `FormProps` does not include `persistence` ([FormProps.ts](../../src/shared/ui/form/FormProps.ts)). To use engine persistence with a rendered form, either drive `useForm` directly, or construct `new Form(definition, values, { persistence })` yourself.
- `persistence` is part of the engine-construction memo in `useForm`. Pass a stable reference (the `useMemo` above) or the engine — and thus the draft — is recreated on every render.
- Draft restore writes values via `setRawValue`, so it does not replay the full `setValue` pipeline (no validation storm on load).

---

## 3. Shared helpers (`utils/form-persistence.ts`)

A second, middleware-based persistence layer lives in [form-persistence.ts](../../src/shared/ui/form/utils/form-persistence.ts) (exported from `@ui/form`). It is independent of the engine manager and stores to a `Storage`-compatible backend (default `localStorage`).

### 3.1 Storage format

| Key | Value |
|---|---|
| `form_draft:{formId}` | JSON `FormDraft` — `{ values, timestamp, definitionId }` |
| `form_draft_meta:{formId}` | JSON `{ savedAt, fieldCount }` |

### 3.2 Types and signatures

```ts
interface FormDraft<T = Record<string, any>> {
  values: T;
  timestamp: number;
  definitionId: string;
}

// Note: this PersistenceConfig is a different type from the engine's
interface PersistenceConfig {
  storage?: Storage;          // default localStorage
  debounceMs?: number;        // default 500
  maxAgeMs?: number;          // default 24h — draft TTL for recovery
  excludeFields?: string[];   // default ["password", "confirmPassword", "currentPassword"]
}

createPersistenceMiddleware(formId: string, config?: PersistenceConfig)
  => ({ form }: { form: any }) => void

recoverDraft<T = Record<string, any>>(formId: string, config?: PersistenceConfig)
  => FormDraft<T> | null

clearDraft(formId: string, config?: PersistenceConfig): void

getDraftMeta(formId: string, config?: PersistenceConfig)
  => { savedAt: number; fieldCount: number } | null
```

### 3.3 Attach the middleware

```tsx
import {
  Form,
  createPersistenceMiddleware,
  recoverDraft,
} from "@ui/form";

const FORM_ID = "checkout-form";

// Recover before mounting so the form initializes with draft values
const draft = recoverDraft<{ cartId: string; notes: string }>(FORM_ID);
const initialData = draft?.values;

<Form
  definition={definition}
  initialData={initialData}
  middleware={[createPersistenceMiddleware(FORM_ID)]}
/>
```

The middleware debounces on every form change (`debounceMs`, default 500), strips excluded fields, and writes both the draft and meta keys. If storage is unavailable it logs a warning and returns a no-op. `recoverDraft` deletes drafts older than `maxAgeMs` (default 24 hours) and returns `null`.

### 3.4 Pairing table: engine manager vs shared helpers

| Concern | Engine (`persistence` option) | Shared helpers (middleware) |
|---|---|---|
| Config type | `PersistenceConfig` from `@form-core/engine` | `PersistenceConfig` from `@ui/form` (see 3.2) |
| Attach via | `useForm` option / `FormCoreOptions.persistence` | `<Form middleware={[createPersistenceMiddleware(id)]}>` |
| Save trigger | `StateManager` subscription, debounced (`debounceMs`, default 500) | Middleware on every `setValue`, debounced (`debounceMs`, default 500) |
| Restore | Automatic at engine construction (`autoRestore`) or `form.restoreDraft()` | Manual: call `recoverDraft(id)` before mount |
| Clear on submit | Automatic inside `form.submit()` when valid (`clearOnSubmit`) | Manual: call `clearDraft(id)` after a successful submit |
| TTL / expiry | Version stamp only (`version`) | Time-to-live via `maxAgeMs` (default 24h) |
| Sensitive fields | `includeFields` / `excludeFields` | `excludeFields` (password-oriented defaults) |
| Extra state | `uiState` (active section/tab) | Values only; meta key stores `savedAt`/`fieldCount` |
| Lifecycle | `form.destroy()` on unmount (handled by `useForm`) | No timers beyond the middleware debounce |

Use the engine option for engine-first flows; use the middleware helpers when you need recovery before the engine exists or a plain `<Form middleware={...}>` setup.

---

## 4. Programmatic API and lifecycle

### 4.1 Engine draft methods

Exposed on `FormCore` and delegated by the `Form` facade ([engine.ts](../../src/core/form-core/engine.ts), [form.ts](../../src/core/form-core/form.ts)):

```ts
await form.saveDraft();     // flush immediately, bypassing the debounce
const restored = await form.restoreDraft();  // true if a draft was found and applied
await form.clearDraft();    // remove the stored draft (cancels pending autosave)
form.persistence;           // the FormPersistenceManager instance (undefined when disabled)
form.destroy();             // cancel debounce + unsubscribe (called by useForm on unmount)
```

`saveDraft`/`clearDraft`/`restoreDraft` are no-ops (or resolve without effect) when no `persistence` config was provided.

### 4.2 When drafts restore

With `autoRestore` defaulting to `true`, `restore()` runs inside engine initialization. It is **not awaited** — subscribers observe a second state notification when values land. Set `autoRestore: false` if you want to control timing (e.g., after URL hydration, or behind a user prompt).

### 4.3 Version stamping and migration

`config.version` is written into every draft. On restore, a mismatch is rejected (with a development-mode console warning) and the draft is ignored. Bump the version whenever the field shape changes to prevent stale data from hydrating new schemas:

```ts
const persistence: PersistenceConfig = {
  key: "ticket-edit",
  version: "2026-10-01", // bump when the definition changes shape
};
```

### 4.4 Include/exclude filtering

Filtering happens on the top-level keys of `form.values` in `FormPersistenceManager.filterValues`:

- `includeFields` present → only those keys are stored.
- `excludeFields` present → those keys are dropped.
- Both absent → everything is stored.

```ts
const persistence: PersistenceConfig = {
  key: "profile-edit",
  storage: "session",
  includeFields: ["fullName", "department", "startDate"], // never persists tokens
};
```

### 4.5 Clearing on submit

`FormCore.submit()` clears the stored draft after a **successful** validation when persistence is configured and `clearOnSubmit !== false`. Set `clearOnSubmit: false` to keep drafts alive after submission (e.g., resumable workflows).

---

## 5. URL sync

### 5.1 `useFormUrlSync`

[useFormUrlSync.ts](../../src/shared/ui/form/hooks/useFormUrlSync.ts) synchronizes a `Form` engine with `URLSearchParams` through a `PlatformUrlPort`.

| Option | Type | Default | Effect |
|---|---|---|---|
| `form` | `Form<T>` | required | Engine instance to sync |
| `scope` | `string` | derived | Namespace prefix for params (`${scope}_${key}`); prevents collisions between widgets |
| `port` | `PlatformUrlPort` | `PlatformUrlAdapters.useReactRouter({ scope, replace, debounceMs })` | Injected URL adapter |
| `debounceMs` | `number` | `300` | Outbound write debounce (applies to the default port) |
| `serialize` | `(values: T) => Record<string, string \| string[]>` | built-in | Values → URL entries |
| `deserialize` | `(params: URLSearchParams) => Partial<T>` | built-in | URL → form values |
| `replaceHistory` | `boolean` | `true` | Use `history.replaceState` semantics (no back-button spam) |
| `syncStep` | `boolean \| string` | `false` | Keep a wizard step param in sync (string = custom param key, default `"step"`) |
| `currentStepId` | `string` | — | Active wizard step ID |
| `onStepChange` | `(stepId: string) => void` | — | Navigate steps on browser back/forward |

Returns `{ port }`.

Behavior:

- **Inbound (URL → form)** — on mount (and on location change), the hook snapshots the URL, deserializes values (custom `deserialize`, or default extraction: scoped keys are un-prefixed, values parse as arrays when the current form value is an array or the raw string contains commas), and applies each with `form.setValue`. The wizard step param is applied via `onStepChange` when `syncStep` is on.
- **Outbound (form → URL)** — a `form.subscribe` listener serializes values and calls `port.set(entries, { replace: replaceHistory })`. Keys with `null`/`undefined`/`""` are removed; arrays become repeated params.
- **Hydration lock** — an `isHydrating` ref suppresses outbound writes during the initial hydration frame, preventing echo loops (the defended defect `BUG-URL-INFINITE-LOOP` in the form UI test report).
- **Non-destructive** — `port.set` merges only form-owned keys; table sort, pagination, and global search params are preserved.

### 5.2 `useFilterUrlSync`

[useFilterUrlSync.ts](../../src/shared/ui/form/hooks/useFilterUrlSync.ts) is a thin preset of `useFormUrlSync` for filter panels: same `form`, `scope`, `port`, `debounceMs`, `serialize`, `deserialize`, and `replaceHistory` options; no wizard-step sync. It returns `{ port }`.

### 5.3 Worked example: filter panel ↔ URL query string

```tsx
import { useForm, useFilterUrlSync } from "@ui/form";

type ProductFilters = {
  status: string;
  minPrice: number | null;
  tags: string[];
};

function ProductFilterPanel() {
  const filtersDef = useProductFiltersDefinition();

  const { form, values } = useForm<ProductFilters>(
    filtersDef,
    { status: "all", minPrice: null, tags: [] },
    { validationMode: "onBlur" }
  );

  useFilterUrlSync<ProductFilters>({
    form,
    scope: "products",
    debounceMs: 300,
    replaceHistory: true,
    serialize: (v) => ({
      status: v.status,
      minPrice: v.minPrice == null ? null : String(v.minPrice),
      tags: v.tags.length ? v.tags : null,
    }),
    deserialize: (params) => ({
      status: params.get("products_status") ?? "all",
      minPrice: params.has("products_minPrice")
        ? Number(params.get("products_minPrice"))
        : null,
      tags: params.getAll("products_tags"),
    }),
  });

  return <FilterFields form={form} values={values} />;
}
```

With `scope: "products"`, the default port writes `products_status=all` etc.; unscoped keys and unrelated params are left alone. Omit `serialize`/`deserialize` to use the built-in string conversion. Pass an explicit `scope` in most cases: the default port can also derive one from the current route pathname, but the hook's own inbound key extraction only strips the `scope` option you pass to the hook, so a port-derived scope and an unscoped hook would disagree on key names.

### 5.4 The `PlatformUrlPort` contract

[PlatformUrlPort.ts](../../src/core/router/ports/PlatformUrlPort.ts):

```ts
interface PlatformUrlPort {
  readonly scope?: string;
  get(key: string): string | null;
  getAll(key: string): string[];
  snapshot(): URLSearchParams;
  set(entries: Record<string, string | string[] | null | undefined>,
      options?: { replace?: boolean; immediate?: boolean }): void;
  delete(keys: string[], options?: { replace?: boolean; immediate?: boolean }): void;
  getScopedKey(key: string): string;
}
```

`replace` defaults to `true` (replaceState semantics); `immediate: true` flushes the debounce (used for wizard step writes). The default React Router adapter ([PlatformUrlAdapters.ts](../../src/core/router/adapters/PlatformUrlAdapters.ts)) debounces navigation with `debounceMs` to avoid history thrashing. Inject a custom `port` to decouple from React Router (tests, hash-based routing, native shells).

### 5.5 Tracked feature

`useFormUrlSync` carries the tracked issue **FEAT-FORM-URL-SYNC** (with the defended bug `BUG-URL-INFINITE-LOOP`) in the form UI test report ([form.ui-test-report.txt](../testing/reports/shared/form/form.ui-test-report.txt)). When changing hydration or outbound write behavior, keep those tests green.

---

## 6. Combining drafts + URL sync

Ordering on a cold load:

1. `useForm` constructs the engine; with `autoRestore` (default) an async `restore()` starts and applies draft values.
2. React mounts; `useFormUrlSync`'s inbound effect snapshots the URL and calls `form.setValue` for every hydrated key.

Net effect: **URL wins for keys present in the query string; the draft wins for keys absent from it.** Writes from either source re-trigger the other (draft autosave subscribes to state; URL sync subscribes to state), so both converge.

Guidance:

| Goal | Approach |
|---|---|
| Drafts for form content, URL for filters | Persist only content keys (`includeFields`) and scope the URL sync to filter keys — or use two separate `Form` instances |
| Deterministic "URL is source of truth" | Keep defaults as written (URL hydration runs after restore and overwrites matching keys) |
| Deterministic "draft is source of truth" | Set `autoRestore: false`, hydrate the URL first, then call `form.restoreDraft()` in an effect — or skip URL hydration for keys the draft already populated |
| Clean handoff after submit | Engine `clearOnSubmit: true` clears the engine draft; call the shared `clearDraft(formId)` manually if you also use middleware persistence |
| Stable configuration | Memoize both the `persistence` config and the `serialize`/`deserialize` callbacks; unstable references recreate the engine or the sync effect |

---

## 7. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Draft never saves | No `persistence` option, or unstable config reference recreated the engine each render | Pass a memoized `PersistenceConfig`; verify `form.persistence` is defined |
| Draft saves but never restores | `autoRestore: false`, or `version` mismatch, or wrong storage key | Call `form.restoreDraft()`; align `config.version` with the stamped draft; check `key` |
| Restored values flash then vanish | `initialData` sync in `useForm` resets fields after restore (`initialDataSyncMode`) | Use `initialDataSyncMode: "preserve-dirty"` (default) or `"ignore"`, or pass `initialData` only once |
| Sensitive values in storage | No include/exclude configured | Set `excludeFields` (or `includeFields`) on the engine config or middleware config |
| Passwords persisted via middleware | Helper defaults only exclude common names | Add your field names to `excludeFields` |
| Draft survives successful submit | `clearOnSubmit: false`, or middleware path (no auto-clear) | Re-enable `clearOnSubmit`, or call `form.clearDraft()` / shared `clearDraft(formId)` after submit |
| SSR / test crashes on storage access | `localStorage` unavailable | Use `storage: "memory"` (engine) — browser adapters already fall back to memory when `window` is undefined |
| Autosave fires too often | `debounceMs` too low for high-frequency fields | Raise `debounceMs` (default 500) or call `saveDraft()` only at explicit checkpoints |
| URL params wiped when typing in a form | Writing with a non-merging custom port | `port.set` must merge; use the default adapter or preserve unrelated keys in a custom port |
| Back button undoes typing | `replaceHistory: false` | Leave `replaceHistory: true` (default) for inline input; reserve push history for discrete steps |
| Two widgets overwrite each other's params | No `scope` (or shared scope) | Pass distinct `scope` values per widget |
| Wizard step not restored from URL | `syncStep` not enabled or `onStepChange` missing | Pass `syncStep: true` (or a param key) plus `currentStepId` and `onStepChange` |
| Form recreated in a loop with URL sync | Unstable `serialize`/`deserialize` or `persistence` references in `useForm` deps | Wrap callbacks in `useCallback` and configs in `useMemo` |
| Hydration echoes values back to the URL | Outbound listener racing the inbound write | Rely on the built-in hydration lock; if using a custom port, suppress writes until after the first frame |

---

**See also:**

- [VALIDATION_GUIDE.md](./VALIDATION_GUIDE.md) — validation modes, adapters, and the error model
- [QUICK_START.md](./QUICK_START.md) — form patterns including headless `useForm`
- [FORM_ARCHITECTURE.md](./FORM_ARCHITECTURE.md) — engine composition and the 5V state
- [./reference/01-ENGINE.md](./reference/01-ENGINE.md) — `FormCore` / `Form` API reference
- [./reference/03-MODULES.md](./reference/03-MODULES.md) — module map including `FormPersistenceManager`
- [./reference/06-HOOKS.md](./reference/06-HOOKS.md) — `useFormUrlSync` and `useFilterUrlSync` reference
- [./reference/10-SHARED_UTILS.md](./reference/10-SHARED_UTILS.md) — shared form utilities
- [../table/v1/URL_AND_API_SYNC.md](../table/v1/URL_AND_API_SYNC.md) — URL state patterns for tables
