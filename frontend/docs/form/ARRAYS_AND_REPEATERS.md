# Arrays and Repeaters

This guide covers dynamic list fields: plain array values, `repeater` containers, the React and engine APIs for row mutation, the row-identity machinery that keeps per-row state stable, rendering, and validation. All signatures are taken from the sources linked in each section.

---

## 1. Concepts

### 1.1 Array values in form state

Form data lives in the V1 slice (`ValuesState`) of the 5V matrix and is read/written through path-based access. The engine's [value-proxy.ts](../../src/core/form-core/value-proxy.ts) wraps lodash `get`/`set`, so an array row cell is addressed as a lodash path:

```ts
form.getValue("dependents[0].fullName");   // read one cell
form.setValue("dependents[1].birthDate", "1990-04-01");
```

Paths are plain strings. Missing paths return `undefined`; writes create intermediate objects/arrays. See [./reference/01-ENGINE.md](./reference/01-ENGINE.md) for the full `IFormCore` surface.

### 1.2 Repeater fields

`repeater` is declared in the `StructureFieldType` union in [domain/field.ts](../../src/core/form-core/domain/field.ts) and registered in `FIELD_REGISTRY` with the `COLLECTOR` capability set:

```ts
repeater: {
  type: "repeater",
  category: "structure",
  label: "Repeater",
  capabilities: CAPS.COLLECTOR, // hasValidity + derivesValidityFromChildren, no own value slot
}
```

The runtime manifest in [default-manifests.ts](../../src/shared/ui/form/manifest/default-manifests.ts) classifies it as `category: "composite"`, `routing: "repeater"`, `layout.acceptsChildren: true`, `wrapper.enabled: false`. Routing metadata comes from `FieldManifest` ([domain/manifest.ts](../../src/core/form-core/domain/manifest.ts), `FieldRouting = "leaf" | "container" | "repeater" | "slot"`).

A repeater does not own a value slot itself. Its `fields[]` are templates; each row materializes a real field instance per template, and the repeater's value is the underlying array at its `name` path.

### 1.3 RepeaterConfig, RowPathFormat, FormRow

These contracts live in [domain/field.ts](../../src/core/form-core/domain/field.ts) and are attached to a repeater field via `FormField.repeaterConfig`:

| Type | Members | Purpose |
|---|---|---|
| `RepeaterConfig` | `rowStateStrategy?: "index" \| "identity"`, `rowIdentityField?: string`, `rowPathFormat?: RowPathFormat` | Selects how internal row state keys are formed and which business field identifies a row |
| `RowPathFormat` | `template: string`, `identityField?: string` | Optional template for the external data path; tokens `[idx]` (row index) and `[id]` (identity value) are replaced |
| `FormRow` | `id: string`, `fields: FormField[]` | Resolved row shape: a stable row `id` plus the row's materialized child fields |

Default identity field is `"id"`. With no `rowPathFormat`, the external data path is standard lodash array notation: `repeaterId[index].leafName`.

Note a source discrepancy: the declared union is `"index" | "identity"`, but the runtime check in [repeater-factory.ts](../../src/core/form-core/modules/repeater-factory.ts) falls back to positional keys only when `rowStateStrategy === "positional"`. Passing `"index"` therefore does not select the positional path; omit the option (identity is the default) or cast `"positional"` if positional keys are required.

### 1.4 Simple array fields vs repeater containers

| Aspect | `array` field | `repeater` field |
|---|---|---|
| Category | `input` (`InputFieldType`) | `structure` / manifest `composite` |
| Capabilities | `CAPS.INPUT` (own value, validity, vitality) | `CAPS.COLLECTOR` (`derivesValidityFromChildren`) |
| Value | One opaque array value in V1 | Array of rows; each cell is a separate materialized field |
| Per-item state | None — the whole array is a single field | Per-cell validity, vitality, visibility keyed by row |
| Rendering | Whatever component is registered for `array` | `RepeaterField`, manifest-routed |
| Use when | Storing a list of primitives with no per-item UI state | Editable rows with per-cell validation, errors, and reorder safety |

---

## 2. React API: `useFormArray`

### 2.1 Signature

From [useFormArray.ts](../../src/shared/ui/form/hooks/useFormArray.ts), exported from `@ui/form`:

```ts
export function useFormArray<TItem = Record<string, any>>(
  name: string
): UseFormArrayReturn<TItem>;
```

`name` is resolved through `useFormContext().resolveField(name)`; the hook then subscribes to the resolved field id, its data path, and the global store via `useSyncExternalStore`. It must be called under a mounted `<Form>` (or any tree providing the registry context) — `useFormContext` throws outside it.

### 2.2 Returned operations

```ts
export interface UseFormArrayReturn<TItem = Record<string, any>> {
  fields: Array<TItem & { id: string }>;
  append: (item?: Partial<TItem>) => string;
  remove: (indexOrRowId: number | string) => void;
  move: (fromIndex: number, toIndex: number) => void;
  swap: (indexA: number, indexB: number) => void;
  replace: (items: TItem[]) => void;
}
```

| Member | Behavior |
|---|---|
| `fields` | Live row data; each row exposes `id` for React keys, preferring the non-enumerable `_rowId`, then a business `id`, then `row_<index>` |
| `append` | Delegates to `form.appendRow`; returns the generated row id |
| `remove` | Delegates to `form.removeRow`; accepts an index or a stable row id string |
| `move` | Delegates to `form.moveRow`; state slices stay bound to their row |
| `swap` | Bounds-checks both indices, then composes two `moveRow` calls inside `form.batch` when the rows are non-adjacent |
| `replace` | Writes the whole array through `form.setValue` (single notification, full dirty marking) |

### 2.3 Example: dependents list

```tsx
import React from "react";
import { useFormArray, useFormContext } from "@ui/form";

interface Dependent {
  fullName: string;
  birthDate: string;
  relationship: "spouse" | "child";
}

export function DependentsEditor(): React.ReactElement {
  const form = useFormContext<{ dependents: Dependent[] }>();
  const { fields, append, remove, move } = useFormArray<Dependent>("dependents");

  return (
    <section>
      {fields.map((row, index) => (
        <div key={row.id}>
          <span>{row.fullName || `Dependent ${index + 1}`}</span>
          <button
            type="button"
            disabled={index === 0}
            onClick={() => move(index, index - 1)}
          >
            Move up
          </button>
          <button type="button" onClick={() => remove(row.id)}>
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          append({ fullName: "", birthDate: "", relationship: "child" })
        }
      >
        Add dependent
      </button>
      <p>Count: {form.values.dependents?.length ?? 0}</p>
    </section>
  );
}
```

Use `row.id` (never the array index) as the React `key` so reorders and removals do not remount unrelated row components.

---

## 3. Engine API: FormCore row methods

`FormCore` ([engine.ts](../../src/core/form-core/engine.ts)) and the `IFormCore` contract ([form-interface.ts](../../src/core/form-core/form-interface.ts)) expose row mutations that also push undo history entries:

```ts
public appendRow(repeaterPath: string, initialRowData?: Record<string, any>): string
public removeRow(repeaterPath: string, indexOrRowId: number | string): void
public moveRow(repeaterPath: string, fromIndex: number, toIndex: number): void
public async batch(fn: () => void | Promise<void>): Promise<void>
```

| Method | Engine behavior |
|---|---|
| `appendRow` | `stateManager.appendRow` assigns a non-enumerable `_rowId`, writes the new array, notifies the field; then history push and visibility re-evaluation; returns the row id |
| `removeRow` | Resolves the target by index or by `_rowId`/`id`, deregisters that row's identity-keyed state slices, splices the array, notifies; then history push and visibility re-evaluation |
| `moveRow` | Bounds-checked splice reorder; notifies the field; pushes history; does not alter any row's state slices and does not re-run visibility |
| `batch` | Runs `fn` inside the `StateManager` batch context; global notifications are deferred until the outermost batch settles (per-field `notifyField` calls still fire immediately). Returns a `Promise` — `await` it |

Multi-row updates that must produce one notification pass:

```ts
await form.batch(() => {
  form.appendRow("items", { sku: "SKU-A", qty: 1 });
  form.appendRow("items", { sku: "SKU-B", qty: 2 });
  form.moveRow("items", 0, 1);
});
```

The same methods exist on the `Form` facade ([form.ts](../../src/core/form-core/form.ts)) as one-line delegates.

---

## 4. Internal machinery: `RepeaterRowFactory`

[repeater-factory.ts](../../src/core/form-core/modules/repeater-factory.ts) materializes and destroys row instances. It splits identity into two paths: the internal state key (V2–V5 slices) and the external data path (V1 and serialization).

### 4.1 Row identity

`getOrAssignRowId(rowData, idField = "id")` resolves a stable id with this priority:

1. `rowData[idField]` when it is non-null and non-empty (business id, returned as a string).
2. An existing `rowData._rowId`.
3. A cached id from the `rowIdMap` `WeakMap` keyed by the row object.
4. A generated ``row_<counter>_<random>`` id, stored in the `WeakMap` and defined on the row as a **non-enumerable** `_rowId` property, so it never appears in `JSON.stringify` payloads. Frozen/sealed rows fall back to the `WeakMap` only and do not throw.

### 4.2 State keys and data paths

`resolveStateKey(repeaterId, rowIndex, rowData, config, leafName)`:

- Identity strategy (default — `config?.rowStateStrategy` is `"identity"` or `undefined`): `` `${repeaterId}__${rowId}__${leafName}` ``, e.g. `items__item-101__sku`.
- Positional fallback (`rowStateStrategy === "positional"` at runtime): `` `${repeaterId}[${rowIndex}].${leafName}` ``.

The private `resolveDataPath` produces the V1 path: `` `${repeaterId}[${rowIndex}].${leafName}` `` by default, or `` `${repeaterId}${template}${leafName}` `` when `rowPathFormat` is set (`[idx]`/`[id]` tokens replaced).

### 4.3 `createRowNodes` and `destroyRow`

`createRowNodes(repeaterId, rowIndex, template, rowData)` clones each template `RenderNode` with a fresh `stateKey` (V2–V5), `dataPath` (V1), `id`, `parentId`, and `visibilityKey`, then calls `stateManager.registerRowState(stateKey)` for every node. `destroyRow(repeaterId, rowIndex, template, rowData)` recomputes the same keys and calls `stateManager.deregisterRowState` for each, preventing leaks and ghost validation errors.

### 4.4 StateManager row state

[modules/state-manager.ts](../../src/core/form-core/modules/state-manager.ts):

| Method | Behavior |
|---|---|
| `registerRowState(fieldId, initialValue?)` | Allocates validity, vitality, and visibility slices for a materialized row cell, respecting the field's `FieldCapabilities` |
| `deregisterRowState(fieldId)` | Deletes validity, vitality, visibility, and view slices — unless the field is pinned (`pinField` keeps slices alive across virtualized unmounts) |
| `appendRow(repeaterPath, initialRowData = {})` | Copies the current array, stamps a generated non-enumerable `_rowId` on the new row, writes, notifies, returns the id |
| `removeRow(repeaterPath, indexOrRowId)` | Resolves index by number or by `_rowId`/`id` match; deregisters every validity key prefixed `` `${repeaterPath}__${targetRowId}__` ``; splices; notifies |
| `moveRow(repeaterPath, fromIndex, toIndex)` | Bounds-checked reorder; no state-slice changes |

### 4.5 Why identity matters

[__tests__/array-identity.test.ts](../../src/core/form-core/__tests__/array-identity.test.ts) pins the contract:

- Business ids are preferred; generated `_rowId` values match `row_<digits>_<alnum>` and are excluded from `Object.keys` and `JSON.stringify`.
- Removing row 0 of 3 clears only that row's `items__<rowId>__*` validity; the remaining rows' errors do not shift or corrupt.
- `moveRow(0, 2)` reorders values while the moved row's validity and vitality stay bound to its `__<rowId>__` keys.
- End-to-end through `FormCore`: `setError`/`setVitality` on one row survive removal of other rows and subsequent reordering; `JSON.stringify(form.values)` contains no `_rowId`.

With positional keys, any removal or reorder re-binds slices to whatever row now occupies the index — errors and touched state follow the position, not the data. The identity strategy is the default for this reason.

---

## 5. Rendering

### 5.1 FieldRouter routing

[FieldRouter.tsx](../../src/shared/ui/form/FieldRouter.tsx) resolves the field's `FieldManifest` and checks `routing === "repeater"` to render `RepeaterField` directly (bypassing the leaf `FieldRenderer` path). Repeater nodes are excluded from motion. A field whose V3 visibility is `false` renders `null`.

### 5.2 `RepeaterField`

[RepeaterField.tsx](../../src/shared/ui/form/fields/structure/RepeaterField.tsx) renders the repeater as a virtualized table using `@tanstack/react-virtual` (estimated row height 72px, 52px in compact density, `overscan: 10`, scroll cap `max-h-[500px]`):

- Sticky header row built from the template `fields[]` labels.
- Each visible row maps templates to children with a dynamic id and path: `` const dynamicId = `${parentPath}[${index}].${template.name}` `` — the child is rendered through `FieldRenderer` with `showLabel={false}`.
- Children hidden by the `visibility` map render an empty cell placeholder.
- Footer renders the add button; an empty state renders when `items.length === 0`.
- The repeater-level error message renders in the footer region.

### 5.3 Add/remove row UI

The built-in buttons mutate the whole array through the field's `onChange`:

```ts
const handleAddItem = () => {
  onChange([...items, {}]);
};
const handleRemoveItem = (index: number) => {
  onChange(items.filter((_, i) => i !== index));
};
```

This path does not call `appendRow`/`removeRow`, so it does not stamp `_rowId` or run per-row slice cleanup. For identity-tracked rows (reorders, targeted removal, per-row error retention), drive mutations through `useFormArray` or the engine methods instead of relying on the default footer buttons.

### 5.4 Nested repeaters

The resolver ([modules/resolver.ts](../../src/core/form-core/modules/resolver.ts)) parses arbitrary-depth dynamic paths (`users[0].addresses[1].street`) and identity keys (`users__<rowId>__name`), and field registration marks every descendant of a repeater as a template. `RepeaterField` renders children via `FieldRenderer`, which resolves components from the field registry; `RepeaterField` itself is not registered in the default registry — top-level repeaters are routed by `FieldRouter`. To nest repeaters in the default UI, supply a component override on the nested template (`field.component` or `meta.ui.component`).

---

## 6. Validation of arrays

### 6.1 Per-item validation

Template children never receive their own state slices (flagged as templates in [int-types.ts](../../src/core/form-core/int-types.ts) and registered recursively in [modules/field-registry.ts](../../src/core/form-core/modules/field-registry.ts)). Materialized row cells validate as normal fields under their dynamic path or identity key:

```ts
await form.setValue("items[0].itemName", "");
const validity = form.state.validity["items[0].itemName"]; // { valid: false, errors: [...] }
```

`required: true` (or `validation.rules`) on a template applies once per row. The validator ([modules/validator.ts](../../src/core/form-core/modules/validator.ts)) skips fields with no vitality entry — that is what keeps templates from producing ghost errors — and skips fields whose V3 visibility is `false`.

### 6.2 Cross-row rules

[domain/validation.ts](../../src/core/form-core/domain/validation.ts) defines `ValidationSettings.crossField: CrossFieldValidation[]` with `{ fields: string[]; validator: (values) => boolean | string; message: string; severity?: "error" | "warning" }`. Because the validator receives the whole values object, array-level rules (minimum row count, uniqueness across rows) are expressed there or in an external schema:

```ts
const validationSchema = z.object({
  dependents: z
    .array(
      z.object({
        fullName: z.string().min(1, "Name is required"),
        birthDate: z.string().min(1),
        relationship: z.enum(["spouse", "child"]),
      })
    )
    .min(1, "At least one dependent is required"),
});
```

Pass the schema as `validationSchema` on `<Form>` or as `schema`/`validationSchema` to `useForm`.

### 6.3 Errors on row removal

`StateManager.removeRow` deregisters validity slices whose keys start with `` `${repeaterPath}__${rowId}__` ``. Consequences:

- Identity-keyed errors and vitality for the removed row are cleared; surviving rows keep theirs without re-indexing (verified in [array-identity.test.ts](../../src/core/form-core/__tests__/array-identity.test.ts)).
- Path-keyed slices such as `items[0].sku` are not re-indexed by `removeRow` itself; they reflect the row that currently occupies the index after subsequent writes trigger revalidation.

Prefer identity keys (the default strategy) when rows carry errors that must survive reordering.

---

## 7. Worked example

Definition with a `dependents` repeater, plus a component that combines the `<Form>` tree with `useFormArray`:

```tsx
import React from "react";
import {
  Form,
  useFormArray,
  useFormContext,
  type FormDefinition,
} from "@ui/form";
import { z } from "zod";

interface EmployeeProfile {
  fullName: string;
  dependents: Array<{
    fullName: string;
    birthDate: string;
    relationship: "spouse" | "child";
  }>;
}

const PROFILE_DEFINITION: FormDefinition = {
  id: "employee-profile",
  title: "Employee Profile",
  sections: [
    {
      id: "section-identity",
      title: "Identity",
      fields: [
        {
          id: "full_name",
          name: "fullName",
          type: "text",
          label: "Full name",
          required: true,
        },
        {
          id: "dependents",
          name: "dependents",
          type: "repeater",
          label: "Dependents",
          repeaterConfig: { rowStateStrategy: "identity", rowIdentityField: "id" },
          fields: [
            {
              id: "dependent_name",
              name: "fullName",
              type: "text",
              label: "Name",
              required: true,
            },
            {
              id: "dependent_dob",
              name: "birthDate",
              type: "date",
              label: "Birth date",
              required: true,
            },
            {
              id: "dependent_relationship",
              name: "relationship",
              type: "select",
              label: "Relationship",
              options: [
                { value: "spouse", label: "Spouse" },
                { value: "child", label: "Child" },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const PROFILE_SCHEMA = z.object({
  fullName: z.string().min(1, "Full name is required"),
  dependents: z.array(
    z.object({
      fullName: z.string().min(1, "Name is required"),
      birthDate: z.string().min(1, "Birth date is required"),
      relationship: z.enum(["spouse", "child"]),
    })
  ),
});

function DependentsPanel(): React.ReactElement {
  const form = useFormContext<EmployeeProfile>();
  const { fields, append, remove, move } =
    useFormArray<EmployeeProfile["dependents"][number]>("dependents");

  return (
    <div>
      {fields.map((row, index) => (
        <div key={row.id}>
          <span>{row.fullName || `Dependent ${index + 1}`}</span>
          <button
            type="button"
            disabled={index === 0}
            onClick={() => move(index, index - 1)}
          >
            Up
          </button>
          <button type="button" onClick={() => remove(row.id)}>
            Remove
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          append({ fullName: "", birthDate: "", relationship: "child" })
        }
      >
        Add dependent
      </button>
      <p>Dirty: {form.isDirty ? "Yes" : "No"}</p>
    </div>
  );
}

export function EmployeeProfileScreen(): React.ReactElement {
  return (
    <Form
      definition={PROFILE_DEFINITION}
      validationSchema={PROFILE_SCHEMA}
      onSubmit={async (data) => {
        await fetch("/api/profile", { method: "PUT", body: JSON.stringify(data) });
      }}
    >
      <DependentsPanel />
    </Form>
  );
}
```

Headless variant: the `useForm` hook ([useForm.tsx](../../src/shared/ui/form/hooks/useForm.tsx)) returns the `FormCore` instance, so row methods are available directly. `useFormArray` itself requires the registry context mounted by `<Form>`; under headless `useForm`, drive rows through the engine methods:

```tsx
import { useForm, type FormDefinition } from "@ui/form";

const definition: FormDefinition = PROFILE_DEFINITION;

function useDependentsHeadless() {
  const { form, values, isDirty } = useForm<EmployeeProfile>(definition);
  const addRow = () => form.appendRow("dependents", {
    fullName: "",
    birthDate: "",
    relationship: "child",
  });
  const removeRow = (rowId: string) => form.removeRow("dependents", rowId);
  return { rows: values.dependents ?? [], isDirty, addRow, removeRow, form };
}
```

---

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Row errors or touched state move to the wrong row after reorder/removal | Positional state keys in use (`rowStateStrategy` set to the runtime positional value) | Use the default identity strategy; ensure rows carry a business `id` or let `_rowId` be assigned |
| `rowStateStrategy: "index"` has no effect | Declared type says `"index"`, runtime checks `"positional"` | Omit the option for identity keys, or cast `"positional"` if positional keys are intended |
| `_rowId` shows up in a submitted payload | Rows were pushed by mutating the array value directly, bypassing `appendRow` | Append rows via `form.appendRow` / `useFormArray().append`; `_rowId` is non-enumerable when assigned by the factory |
| `useFormArray` throws "Must be used inside a `<Form>` component" | Hook used outside the registry context (e.g., under headless `useForm` only) | Render the component inside `<Form>`, or use engine row methods headlessly |
| Reorder preserves values but validation stays on the old index | Validity keyed by `items[N].field` path rather than identity keys | Keep the identity strategy; set errors through identity keys (`items__<rowId>__field`) when injecting server errors |
| Removed rows still surface errors | Stale path-keyed slices or errors injected on removed paths | Let `removeRow` run (it deregisters `__<rowId>__` slices); re-run `validate()` after bulk removals |
| Nested repeater template renders as a missing field | `RepeaterField` is routed by `FieldRouter`, not present in the leaf registry | Provide `field.component` (or `meta.ui.component`) override on the nested repeater template |
| Add/remove footer buttons do not keep row identity | Built-in UI replaces the whole array via `onChange` | Drive mutations with `useFormArray` or `form.appendRow`/`removeRow` |
| Large repeaters lag while typing | Row cost grows with full re-renders of all cells | Rely on the built-in virtualization; keep row components keyed by stable `row.id` to avoid remounts |

---

**See also:**

- [PERMISSIONS_AND_NAVIGATION.md](./PERMISSIONS_AND_NAVIGATION.md) — field permissions and unsaved-changes navigation guard
- [./reference/01-ENGINE.md](./reference/01-ENGINE.md) — `FormCore` API, 5V matrix, `isDirty`
- [./reference/03-MODULES.md](./reference/03-MODULES.md) — `StateManager` and `RepeaterRowFactory` reference
- [./reference/04-DOMAIN_TYPES.md](./reference/04-DOMAIN_TYPES.md) — `FormField`, `RepeaterConfig`, validation contracts
- [./reference/06-HOOKS.md](./reference/06-HOOKS.md) — `useFormArray` and `useForm` reference
- [./QUICK_START.md](./QUICK_START.md) — form authoring patterns
