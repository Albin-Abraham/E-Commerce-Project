# Table API Reference

## Hook selection

| Hook                 | Returns                                                                                                                                                      | Use when                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `useMDAPTable`       | `useZenithTable` result + `compiled`                                                                                                                         | Authoring a `TableEntity`.                                                                   |
| `useZenithTable`     | `{ Table, Header, Body, View, Pagination, Toolbar, FilterBar, SelectionActionBar, loading, error, refetch, search, canFetch, hasFetched, totalCount, meta }` | Runtime. Pass `compileEntityToTableDef(entity)` (or a compiled `{ meta, columns, source }`). |
| `useTableController` | `{ engine, meta, totalCount, loading, error, refetch, search, canFetch, hasFetched }`                                                                        | You need `engine.getState()`, `setGlobalFilter()`, `extractQueryParams`, custom export.      |

```tsx
const compiled = compileEntityToTableDef(usersEntity);
const { Table, Header, Body, FilterBar } = useZenithTable(compiled);
return (
  <Table>
    <FilterBar />
    <Table.View>
      <Header />
      <Body />
    </Table.View>
  </Table>
);

const { engine, meta } = useTableController(compiled);
engine.setGlobalFilter(value);
engine.getColumn("role")?.setFilterValue("CEO");
extractQueryParams(engine.getState());
```

`Table.Header` / `Header` are the same component. `pagination`, `toolbar`, `filterBar`, and `selectionActionBar` on the compiled config **auto-render** those pieces inside `Table` when `true`. Default is `false` (you render them). Authoring belongs on `TableEntity` — see [MDAP](./MDAP.md).

---

## `useZenithTable<T>`

Wraps `useTableController` and memoizes compound components.

### `UseZenithTableConfig<T>`

| Property             | Type                                             | Required | Description                                                                |
| -------------------- | ------------------------------------------------ | -------- | -------------------------------------------------------------------------- |
| `meta`               | `TableMeta`                                      | **Yes**  | Must contain a unique `id`.                                                |
| `columns`            | `ColumnDef<T>[]`                                 | **Yes**  | TanStack column defs.                                                      |
| `source`             | `DataSource<T>`                                  | **Yes**  | `{ type: "client", data }` or `{ type: "server", fetcher }`.               |
| `totalCount`         | `number`                                         | No       | Override server/client total (used for page count and labels).             |
| `getRowId`           | `(row, index) => string`                         | No       | Stable row identity for selection across server pages. Default: row index. |
| `pagination`         | `boolean`                                        | No       | Auto-render `<Pagination />` inside `Table`. Default `false`.              |
| `toolbar`            | `boolean`                                        | No       | Auto-render `<Toolbar />`. Default `false`.                                |
| `filterBar`          | `boolean`                                        | No       | Auto-render `<FilterBar />`. Default `false`.                              |
| `filterForm`         | `FormDefinition`                                 | No       | Compiled from `TableEntity.content.filters`.                               |
| `chrome`             | `{ exportBtn?, importBtn?, filterStatusBadge? }` | No       | Named Toolbar/FilterBar slots. Inferred by the compiler.                   |
| `serverExport`       | `TableExportBehavior`                            | No       | Ports for `{exportBtn}` / `useServerExport`.                               |
| `import`             | `TableImportBehavior`                            | No       | Ports for `{importBtn}` / `useImport`.                                     |
| `importSurface`      | `TableImportSurface`                             | No       | Modal vs page import.                                                      |
| `selectionActionBar` | `boolean`                                        | No       | Auto-render `<SelectionActionBar />`. Default `false`.                     |
| `striped`            | `boolean`                                        | No       | Zebra rows.                                                                |
| `bordered`           | `boolean`                                        | No       | Cell borders.                                                              |
| `shadow`             | `boolean \| "sm" \| "md" \| "lg"`                | No       | Container elevation.                                                       |
| `stickyHeader`       | `boolean`                                        | No       | Sticky header.                                                             |
| `className`          | `string`                                         | No       | Root class.                                                                |
| `loading`            | `boolean`                                        | No       | Override controller loading.                                               |
| `renderRow`          | function                                         | No       | Custom row render.                                                         |

### `UseZenithTableResult<T>`

`Table` also exposes `.Header`, `.Body`, `.View`, `.Pagination`, `.Toolbar`, `.FilterBar`, `.SelectionActionBar`. Plus `loading`, `error`, `refetch`, `search`, `canFetch`, `hasFetched`, `totalCount`, `meta`.

`useZenithTable` passes fetch status into `<Table>`, so `<Body />` shows skeletons/errors without `loading={loading}`. Override with `<Body loading={false} />` or `<Body error={null} />`.

---

## `TableEntity` / `compileEntityToTableDef` / `useMDAPTable`

Authoring format. See [MDAP](./MDAP.md).

```ts
compileEntityToTableDef(entity: TableEntity<T>): CompiledTableDef<T>
useMDAPTable(entity: TableEntity<T>): UseZenithTableResult<T> & { compiled: CompiledTableDef<T> }
```

`behavior.server` (`fetcher`, `guard`, `gate`) compiles to `DataSource`. `behavior.export` compiles to `compiled.serverExport` and infers `compiled.chrome.exportBtn`. `behavior.import` compiles to `compiled.import` and infers `compiled.chrome.importBtn`. `content.filters` infers `compiled.chrome.filterStatusBadge` (Toolbar + FilterBar). `surface.import` (`modal` | `page` + `onImport`) compiles to `compiled.importSurface`. `content.filters` compiles to `filterForm` (MDAP `FormDefinition`).

`useMDAPTable` does **not** auto-start import or export jobs. Toolbar `{exportBtn}` / `{importBtn}` mount the hooks when those chrome flags are on. Pass `compiled.import` into a composed plugin (modal) or call `compiled.importSurface.onImport` (page) if you suppress the buttons.

`tableCellRegistry.register(name, renderer)` — feature-layer cells. `TableColumnMeta.renderer` looks up the registry after built-in strings.

---

## `useTableController<T>`

```ts
function useTableController<T>(config: {
  meta: TableMeta;
  columns: ColumnDef<T>[];
  source: DataSource<T>;
  totalCount?: number;
  getRowId?: (originalRow: T, index: number) => string;
}): {
  engine: ITableEngine<T>;
  meta: Required<TableMeta>;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  search: () => void;
  canFetch: boolean;
  hasFetched: boolean;
  totalCount: number;
};
```

---

## `TableMeta`

Only `id` is required. Everything else is merged with defaults in `resolveTableMeta`.

| Property                                                   | Type                      | Description                                                                                                                                                       |
| ---------------------------------------------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                                                       | `string`                  | **Required.** URL namespace and DOM test id.                                                                                                                      |
| `pagination`                                               | `Partial<PaginationMeta>` | Page size options, labels, first/last buttons.                                                                                                                    |
| `features`                                                 | `Partial<FeatureFlags>`   | Only `urlSync` (default `true`) — toggles TableUrl reader/writer. Selection, export, import, etc. are composed (`TableCore` modules, hook booleans), not flagged. |
| `url`                                                      | `Partial<UrlConfig>`      | Key names and defaults. Keys are scoped as `{id}:{key}`.                                                                                                          |
| `columns`                                                  | `TableColumnMeta[]`       | Server column JSON (optional; usually compiled via factory).                                                                                                      |
| `ui`                                                       | `UIMapping`               | Slot overrides: empty, loading, error, cell, row.                                                                                                                 |
| `stickyHeader`, `striped`, `bordered`, `shadow`, `compact` | visual shortcuts          |                                                                                                                                                                   |

`pagination` means two things:

1. Hook boolean `useZenithTable({ pagination: true })` — auto-render `<Pagination />` inside `Table`.
2. `meta.pagination` — page-size options, labels, first/last buttons.

---

## `DataSource`, `TableQueryParams`, `TableServerResponse`

```ts
interface TableQueryParams {
  page: number; // 0-based
  pageSize: number;
  sort: { key: string; dir: "asc" | "desc" }[];
  filters: Record<string, unknown>;
  search: string;
}

interface TableServerResponse<T> {
  rows: T[];
  totalCount: number;
}

type DataSource<T> =
  | { type: "client"; data: T[] }
  | {
      type: "server";
      fetcher: (
        params: TableQueryParams,
        signal?: AbortSignal
      ) => Promise<TableServerResponse<T>>;
      /** Proactive: return false to skip. Omit to always allow. */
      guard?: (params: TableQueryParams) => boolean;
      /** `auto` (default, proactive) or `manual` (reactive — wait for `search()`). */
      gate?: "auto" | "manual";
    };
```

The fetcher owns HTTP. Unwrap the envelope, then map onto `{ rows, totalCount }`. The table does not read backend envelopes.

List endpoints — `parsePaginated` (preferred):

```ts
const page = ResponseFactory.parse(response).parsePaginated<User>();
return { rows: page.items, totalCount: page.total };
```

`{ data, meta }` envelopes — `parseEnvelope`:

```ts
const env = ResponseFactory.parse(response).parseEnvelope<User[]>();
return {
  rows: env.data ?? [],
  totalCount: Number(env.meta?.total ?? env.data?.length ?? 0),
};
```

Rows are **server-owned**: TanStack does not paginate, sort, or filter locally. That is not `gate: "manual"` (when the fetcher runs) and not `selectionMode: "MANUAL"` (individual row ids).

---

## `TableHandle`

Exposed on `<ZenithTable>` via `forwardRef`. The hook’s `Table` wrapper does not forward a ref — use `useTableController` + `<ZenithTable>` when you need the handle.

```ts
interface TableHandle {
  scrollToTop: () => void;
  scrollToRow: (rowId: string) => void;
  focusFirstCell: () => void; // first [role="gridcell"] in the body
  getBodyElement: () => HTMLTableSectionElement | null;
  getContainerElement: () => HTMLDivElement | null;
}
```

```tsx
const tableRef = useRef<TableHandle>(null);
const { engine, meta, totalCount } = useTableController({
  meta: { id: "users" },
  columns,
  source,
});

<ZenithTable ref={tableRef} engine={engine} meta={meta} totalCount={totalCount}>
  <ZenithTable.View>
    <ZenithTable.Header />
    <ZenithTable.Body />
  </ZenithTable.View>
</ZenithTable>;

tableRef.current?.focusFirstCell();
```

---

## Compound sub-components

On both `ZenithTable` and the hook's `Table`:

- **`Header`** — `<thead>`
- **`Body`** — `<tbody>`
- **`View`** — HTML `<table>` wrapper (use this around Header + Body)
- **`Pagination`** — page controls; label total comes from the `totalCount` passed into `ZenithTable` (synced into physics). Render **inside** `<Table>`.
- **`Toolbar`** — density and selection-type. Global search if you are not using FilterBar. Render **inside** `<Table>`.
- **`FilterBar`** — MDAP form from `content.filters` (`FieldRenderer` for search, selects, dates). Render **inside** `<Table>`.
- **`SelectionActionBar`** — floating bulk bar (`.Info`, `.Modes`, `.Action`, `.Actions`). Render **inside** `<Table>`.

`Body` extras: `loading`, `loadingRows`, `onRowClick`, `showIndex` (adds a `#` column; Header picks this up), `virtualized`, `estimateRowHeight`. `View` also accepts `virtualized` for the scrollport — set both when virtualizing.

Scroll position is restored automatically (`useScrollRestoration`). Pinning is compile-time from column `meta.pinned` (runtime `setColumnPinning` is a no-op).

---

## `ITableEngine`

Exported from `@shared/ui/table`. Chrome and `useTableController` consumers talk to this, not TanStack directly. `TableState`, `HeaderGroup`, `RowModel`, `Row`, `Column`, and the `*State` updater types come from `@tanstack/react-table`.

```ts
interface ITableEngine<T> {
  getHeaderGroups(): HeaderGroup<T>[];
  getRowModel(): RowModel<T>;
  /** Same as `getRowModel` here — the table does not paginate locally. */
  getPrePaginationRowModel(): RowModel<T>;

  getAllColumns(): Column<T, unknown>[];
  getColumn(id: string): Column<T, unknown> | undefined;
  getRow(id: string): Row<T> | undefined;

  getState(): TableState;
  setPageIndex(index: number): void;
  nextPage(): void;
  previousPage(): void;
  setPageSize(size: number): void;
  getCanNextPage(): boolean;
  getCanPreviousPage(): boolean;
  getPageCount(): number;

  setSorting(
    updater: SortingState | ((old: SortingState) => SortingState)
  ): void;
  setGlobalFilter(filter: unknown): void;
  setColumnFilters(
    updater:
      | ColumnFiltersState
      | ((old: ColumnFiltersState) => ColumnFiltersState)
  ): void;
  resetColumnFilters(): void;

  setColumnVisibility(
    updater: VisibilityState | ((old: VisibilityState) => VisibilityState)
  ): void;
  /** Compile-time pinning from column `meta.pinned` wins. Runtime calls are a no-op. */
  setColumnPinning(
    updater:
      | ColumnPinningState
      | ((old: ColumnPinningState) => ColumnPinningState)
  ): void;
}
```

`getState().pagination` is `{ pageIndex, pageSize }`. `getState().sorting` is `{ id, desc }[]`. `getState().columnFilters` is `{ id, value }[]`. `getState().globalFilter` is the search string.

```ts
const { engine } = useTableController({ meta, columns, source });
engine.setGlobalFilter("alice");
engine.getColumn("role")?.setFilterValue("CEO");
engine.setPageIndex(0);
extractQueryParams(engine.getState());
```

---

## `useGridKeyboardNavigation`

Exported from `@shared/ui/table`. Body already calls it with `scope` set to `table:{meta.id}`. Use this hook yourself only for a custom grid.

```ts
function useGridKeyboardNavigation(options: {
  gridRef: React.RefObject<HTMLDivElement | null>;
  getRowCount: () => number;
  getColCount: (rowIndex: number) => number;
  onCellActivate?: (row: number, col: number) => void;
  onHeaderActivate?: (col: number) => void;
  enabled?: boolean; // default true
  scope?: string; // e.g. table:{meta.id} — Event core
}): {
  handleKeyDown: (e: React.KeyboardEvent) => void;
  focusCell: (row: number, col: number) => void;
  activeCellRef: React.MutableRefObject<{ row: number; col: number }>;
};
```

|                 | Role                                                                                                                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scope`         | Registers **movement** keys (arrows, Home/End, PageUp/PageDown) on Event core. Keys run only while the scroller holds focus (`activeScope === scope`). Requires `GlobalEventProvider`. |
| `handleKeyDown` | Local fallback. Body attaches this on `<tbody>` and stops propagation so Event core does not double-move. Use this alone if you omit `scope`.                                          |
| Enter / Space   | **Not** Event-core shortcuts. Header sort stays on `<th>`. Focused buttons/inputs keep native Enter.                                                                                   |

Cell lookup uses `[data-table-row]` / `[data-table-cell]` / `[data-table-col]`, not `nth-child`. Custom `renderRow` must keep those attributes.

See [Accessibility, keyboard, troubleshooting](./A11Y_AND_TROUBLESHOOTING.md).

---

## `TableCore` modules

Opt-in hooks. Must run **under** `<ZenithTable>` (they use engine/physics context).

| Module         | Typical call                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------------- |
| `Selection`    | `columnDef()`, `useSelection({ enabled, type, onSelectionChange })`, `Listener` — see [Selection](./SELECTION.md) |
| `Filter`       | `useFilter({ enabled, debounceMs })` — `setGlobalSearch` writes the engine                                        |
| `Export`       | `useExport({ enabled })` — **current page** of rows, matched by TanStack `row.id`                                 |
| `ServerExport` | `useServerExport({ enabled, createExport, getStatus, downloadFile })` — filtered query                            |
| `Import`       | `useImport({ enabled, uploadFile, getStatus })`                                                                   |
| `BulkDelete`   | `useBulkDelete({ enabled, bulkDeleteApi })` — ALL mode sends `__all__`                                            |
| `InlineEdit`   | `useInlineEdit({ enabled, onSubmit })`                                                                            |

Also on the barrel: `compileEntityToTableDef`, `useMDAPTable`, `tableCellRegistry`, `useGridKeyboardNavigation`, `createActionsColumn`, `extractQueryParams`, CSV helpers, `validateImportFile` / `validateCSVHeaders`, `ProgressModal`, `ScopeSelector`, `TableErrorBoundary`.

```tsx
createActionsColumn({ actions: RowActions, width: 80, header: "" });
```

The actions column pins right (`meta.pinned: "right"`). Pinning is compile-time from column meta; runtime `setColumnPinning` is a no-op.

`Body` / `View` `virtualized` uses TanStack Virtual against the View scroller (`estimateRowHeight` default 48). Set `virtualized` on **both** so the scrollport overflows. `useScrollRestoration` stores `sessionStorage` key `zenith:scroll:{tableId}:{path}` and restores on remount — keep `<Table>` mounted while loading so this is not reset.

---

## `TableColumnMeta`

Input to `TableColumnFactory.compile()`. Hidden columns are dropped.

| Property                  | Type                                                              | Description                                                     |
| ------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------- |
| `id`                      | `string`                                                          | Column id and `accessorKey`.                                    |
| `label`                   | `string`                                                          | Header text.                                                    |
| `sortable` / `filterable` | `boolean`                                                         | Default `false` in the factory.                                 |
| `pinned`                  | `"left" \| "right" \| false`                                      | Written onto column `meta`; adapter pins at compile time.       |
| `hidden`                  | `boolean`                                                         | Omitted from the compiled defs.                                 |
| `width`                   | `number`                                                          | Column `size`.                                                  |
| `align`                   | `"left" \| "center" \| "right"`                                   | Applied on the cell wrapper.                                    |
| `renderer`                | `"text" \| "badge" \| "avatar" \| "currency" \| "date" \| string` | Built-in, or a `tableCellRegistry` name. Wins over inference.   |
| `fieldSchema`             | `FormFieldSchema`                                                 | Semantic type for inference / inline edit.                      |
| `editable`                | `boolean`                                                         | If true **and** `fieldSchema` is set, cell is `InlineEditCell`. |
| `formatOptions`           | `{ currency?, locale?, dateFormat? }`                             | `Intl` options for currency/date.                               |

---

## Empty, loading, error

| Surface | Who renders it                                                                                                                                                                                                              |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Empty   | Automatic in `Body` when there are no rows (`meta.ui.empty` or `DefaultEmptyState`).                                                                                                                                        |
| Loading | Automatic from fetch context when the controller is loading and there are no rows. Override with `<Body loading={…} />`. Uses `meta.ui.loading` or skeleton rows.                                                           |
| Error   | Automatic from fetch context when fetch failed and there are no rows (`meta.ui.error` or `DefaultErrorState` with retry). Override with `<Body error={…} />`. `TableErrorBoundary` wraps the table root for render crashes. |

Keep `<Table>` mounted while loading so URL sync and scroll restoration stay alive.

---

## `useExportTask` / `useImportTask`

Shared status: `TableTaskStatus` = `idle \| uploading \| pending \| queued \| processing \| completed \| failed`.

|           | `useExportTask`                                              | `useImportTask`                                                         |
| --------- | ------------------------------------------------------------ | ----------------------------------------------------------------------- |
| Options   | `pollInterval` (default 2000), `autoCloseDelay` (default 0)  | `pollInterval` (default 2000), `autoCloseDelay` (default 1500)          |
| Start     | `startExport(apiCall, { getStatus, onCompleted, onFailed })` | `uploadFile(uploadFn, { getStatus, onRefresh, onCompleted, onFailed })` |
| State     | `status`, `progress`, `filename`, `taskId`, `error`          | plus `uploadProgress`, `summary`, `errors`                              |
| Lifecycle | `cancel`, `reset`                                            | `cancel`, `reset`                                                       |

`apiCall` / `getStatus` should return `{ task_id, status, filename? }`. Import `errors` may be `{ row, error }` or `{ row, message }` — `DefaultErrorList` accepts both. Pass `status` into `ProgressModal` with no cast.

---

## `createActionsColumn`

Pinned-right actions column. Row type must have `id: string`.

```ts
createActionsColumn({ actions: MyRowActions, width: 80, header: "" });
```

`MyRowActions` receives `{ row, rowData }`.

---

## `MetaSchemaBridge`

`MetaSchemaBridge.compileToZenithColumns(headerMetaSchema)` turns an API header schema into `TableColumnMeta[]` (then pass through `TableColumnFactory.compile`). Sets `renderer` from field type and binds `fieldSchema` for optional inline edit. This is the form-schema path; `TableColumnFactory` is the table-column path.
