# Table Architecture: Rules and Anti-Patterns

## 1. Anti-patterns

### 1.1. State duplication

Do not keep pagination, sorting, or filtering in a wrapper component. That fights `TableUrl` and the engine. The engine owns table state; the server owns the row slice.

### 1.2. God column

Do not put large `cell: (info) => ...` trees in column defs. Register a feature renderer (`tableCellRegistry.register("feature-user-avatar", UserAvatarCell)`) and set `renderer: "feature-user-avatar"` on `TableColumnMeta`. `TableColumnFactory` is the default compile path.

### 1.3. Client-side table filtering

The table does not sort, filter, or paginate locally. A client `source` is the current page of rows. Do not expect TanStack to slice a 10k-row array.

### 1.4. Local fetch latch

Do not add `const [armed, setArmed] = useState` / `useRef(false)` (or a second copy of filters) to decide when to call the API. That is 1.1 applied to fetching.

Required filters and a Search button belong on **`behavior.server`**. The compiler writes them onto `DataSource`. `TableCore.Filter` writes to the engine only — it does not keep a local filter map.

```tsx
behavior: {
  server: {
    fetcher,
    guard: (params) => Boolean(params.filters.branchId),
    gate: "manual",
  },
}
```

### 1.5. Envelope mapping in the table

Do not put `responseMap` (or any HTTP envelope paths) on `TableMeta`. Unwrap with `ResponseFactory.parse(response).parsePaginated()` inside the fetcher and return `{ rows, totalCount }`. The table stays HTTP-agnostic.

### 1.6. Flattened `useZenithTable({ columns: [{ accessorKey }] })` as authoring

That object is **runtime** (`CompiledTableDef`). Author a `TableEntity` and `compileEntityToTableDef`. Same rule as form 1.3 (no hand-written `FormDefinition`).

## 2. Rules

### 2.1. Controllers

Use `useMDAPTable(entity)`, or `compileEntityToTableDef` then `useZenithTable` / `useTableController`. Do not reach into internal contexts.

### 2.2. Import validation

Use `validateImportFile` and `validateCSVHeaders` before upload.

### 2.3. Single barrel

Import from `@shared/ui/table` only. Do not deep-import `@shared/ui/table/core/...`.

### 2.4. Export what the user sees

Pass `extractQueryParams(engine.getState())` into export APIs.

### 2.5. Composition

Use `<View>` around `<Header />` and `<Body />`. Both `Header` and `Table.Header` are valid. Render `<Pagination />`, `<Toolbar />`, `<FilterBar />`, and `<SelectionActionBar />` **inside** `<Table>`.

### 2.6. Toolbar search

Search must go through `engine.setGlobalFilter` (the Toolbar already does). Do not write an unscoped `search` query param — that bypasses `users:search`.

With `gate: "auto"` (default), that also refetches. With `gate: "manual"`, Toolbar Enter commits the engine then calls `search()`. Do not work around that with a local string.

### 2.7. Guard and gate time HTTP only

`guard` and `gate` do not own filters. They only decide whether `useTableData` calls `fetcher`.

|                  | Role                                                                               | Aligns with          |
| ---------------- | ---------------------------------------------------------------------------------- | -------------------- |
| `guard(params)`  | Proactive eligibility from **engine** `TableQueryParams`                           | 1.1 — no extra state |
| `gate: "auto"`   | Fetch when the query changes (default)                                             | Engine → fetcher     |
| `gate: "manual"` | Fetch on `search()` / `refetch()`; page/sort still refetch after the first success | Search-form tables   |

Default is `gate: "auto"` and no `guard` — every query change fetches.

`gate: "manual"` is not `selectionMode: "MANUAL"` and does not mean TanStack pages locally. Rows stay server-owned.

### 2.8. Author via `TableEntity`

Content (columns + MDAP filter fields), behavior (fetcher / guard / gate / export / import), surface (chrome, `import` modal \| page), presentation (striped / shadow). Compile before the runtime hook.

### 2.9. Filters are MDAP forms

`content.filters` → `FilterBar` / column popovers via `FieldRenderer`. Do not drop raw `<select>` / `<input>` next to the table for query filters.

### 2.10. Layer and plugin boundaries

Ownership, plugins, and the target folder map: [v2 Layers](../v2/LAYERS.md), [v2 Plugins](../v2/PLUGINS.md), [v2 Folders](../v2/FOLDERS.md). MDAP four: [Content](../v2/CONTENT.md), [Behavior](../v2/BEHAVIOR.md), [Surface](../v2/SURFACE.md), [Presentation](../v2/PRESENTATION.md).

| Don't                                             | Do                                                                                      |
| ------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `httpClient` inside `TableCore` or `plugins/`     | Inject `fetcher` / `createExport` from the feature                                      |
| Selection / export as `meta.features` booleans    | Compose `TableCore.*` under `<Table>` (`urlSync` is the only flag)                      |
| Domain cell JSX on `ColumnDef.cell`               | `tableCellRegistry.register("feature-…")` in the feature                                |
| `TableCore.register("excel")` for a sheet         | Sibling sheet host — not this kernel                                                    |
| Treat `FilterBar` as `TableCore.Filter`           | Chrome vs engine writer                                                                 |
| `meta.features.import` or `<Modal>` on the entity | `surface.import: { mode: "modal" }` or `{ mode: "page", onImport }` + compose plugin/UI |
