# ZenithTable v1

Headless data-grid built on TanStack Table. State, URL sync, and presentation are separate layers.

> [`TableCore_Architecture_Spec.md`](../../TableCore_Architecture_Spec.md) is aspirational (ECS, workers, 100k-row claims). This v1 folder is the contract for the code in `@shared/ui/table`.

## Read in this order

1. [Getting Started](./GETTING_STARTED.md) — `TableEntity`, compile, first table
2. [MDAP authoring](./MDAP.md) — content / behavior / surface / presentation, cell registry, FilterBar
3. [API Reference](./API_REFERENCE.md) — hooks, `TableMeta`, `DataSource`, `ITableEngine`, `TableHandle`, `TableCore`
4. [Selection](./SELECTION.md) — checkbox column, `useSelection`, action bar
5. [URL and API sync](./URL_AND_API_SYNC.md) — `TableQueryParams`, scoped keys (`users:search`)
6. [Server-driven UI](./SERVER_DRIVEN_UI.md) — `TableColumnFactory`, renderer inference, i18n
7. [Inline editing](./INLINE_EDITING.md) — form-backed cells and commit validation
8. [Bulk operations](./BULK_OPERATIONS.md) — `TableCore.ServerExport` vs `useExportTask`
9. [Accessibility, keyboard, troubleshooting](./A11Y_AND_TROUBLESHOOTING.md)
10. [Rules and anti-patterns](./RULES_AND_ANTI_PATTERNS.md)

## Layers

Authoring is MDAP (`TableEntity` → `compileEntityToTableDef`). The four authoring layers, target `kernel/` / `plugins/` / `registry/` tree, and platform ownership are [v2](../v2/README.md) — [Content](../v2/CONTENT.md) · [Behavior](../v2/BEHAVIOR.md) · [Surface](../v2/SURFACE.md) · [Presentation](../v2/PRESENTATION.md) · [Folders](../v2/FOLDERS.md).

Current **source** folders (implementation):

1. **Core** — `ITableEngine` (TanStack adapter). Sort, filter, and page are **server-owned**. The table does not slice or re-order rows locally.
2. **URL** (`/url`) — `TableUrl` reads/writes pagination, sort, and filters using `meta.id` as a prefix (`users:page`).
3. **Chrome (`/ui`)** — compound `ZenithTable` (`Header`, `Body`, `View`, `Pagination`, `Toolbar`, `FilterBar`, `SelectionActionBar`). Not MDAP presentation ([v2 PRESENTATION](../v2/PRESENTATION.md)). Target paint: [v2 HeroUI](../v2/PLUGINS.md#heroui-paint).
4. **Data ops** — `TableCore` modules, `useExportTask`, `useImportTask`, CSV helpers, `extractQueryParams`.

## Selection modes

`selectionMode` on the physics store (not `gate`, not TanStack):

| `selectionMode` | Meaning                                                                  |
| --------------- | ------------------------------------------------------------------------ |
| `"MANUAL"`      | Individual row ids in `selectedRows`                                     |
| `"PAGE"`        | All ids on the current page (header checkbox, first click)               |
| `"ALL"`         | Entire filtered query; `excludedRows` are opt-outs. Second header click. |

`SelectionActionBar` and `TableCore.Selection` must render **inside** `<Table>`.

## Three different “manual”s

| Term                        | What it means                                                              |
| --------------------------- | -------------------------------------------------------------------------- |
| Server-owned rows           | TanStack never sorts, filters, or paginates locally. Always on.            |
| `gate: "auto"` / `"manual"` | When the **fetcher** runs (`"manual"` waits for `search()` / `refetch()`). |
| `selectionMode: "MANUAL"`   | Row selection is a set of ids, not the whole page or query.                |

## Features

- MDAP authoring: `TableEntity` + `compileEntityToTableDef` (or `useMDAPTable`)
- Headless compound API via `useZenithTable` or `useTableController` (runtime)
- URL-driven, shareable table state (`users:search`, `users:sort=-name`)
- Server fetch with `{ rows, totalCount }` (unwrap the HTTP envelope in the fetcher with `ResponseFactory`)
- MDAP `FilterBar` / column popovers (`FieldRenderer` for dropdowns and filters)
- Feature cells via `tableCellRegistry.register` (no JSX `cell` on column JSON)
- Grid movement keys via Event core (`scope: table:{meta.id}`) plus `handleKeyDown` on `<tbody>` as fallback
- CSV export/import with a shared task status union
- Inline edit via `InlineEditProvider` + the form engine
- `TableColumnFactory` compiles `TableColumnMeta` JSON, including renderer inference
