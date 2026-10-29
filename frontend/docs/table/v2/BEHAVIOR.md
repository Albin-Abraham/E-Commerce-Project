# MDAP — Behavior

Side effects: where rows come from, when fetch runs, export/import/save. Author on `TableEntity.behavior`. Runtime plugins (`TableCore`) also live here — they are not surface chrome. How-to: [v1 Getting Started](../v1/GETTING_STARTED.md) (server), [v1 Bulk operations](../v1/BULK_OPERATIONS.md). Catalog: [Plugins](./PLUGINS.md).

## Owns

| Field                               | Role                                                                                                                                          |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `client.data` / `client.totalCount` | Current **page** of rows. The table does not sort/filter/page locally                                                                         |
| `server.fetcher`                    | `(params, signal?) => { rows, totalCount }`. Unwrap HTTP in the feature                                                                       |
| `server.guard`                      | Skip fetch when params are ineligible (required filters)                                                                                      |
| `server.gate`                       | `"auto"` (default) vs `"manual"` (`search()` / `refetch()`)                                                                                   |
| `export`                            | Ports for `TableCore.ServerExport` (`createExport`, `getStatus`, `downloadFile`)                                                              |
| `import`                            | Ports for `TableCore.Import` / `useImportTask` (`uploadFile`, `getStatus`). Not auto-mounted — [v1 Bulk operations](../v1/BULK_OPERATIONS.md) |

`DataSource` is **compiler output**. Put fetcher / guard / gate on `behavior.server`, not as the authoring format.

## Runtime behavior (plugins)

Opt-in under `<Table>`. Not `meta.features` booleans.

| Plugin                              | Behavior                                             |
| ----------------------------------- | ---------------------------------------------------- |
| `TableCore.Filter`                  | Writes engine filters (debounce). Not a second store |
| `TableCore.Selection`               | Physics: MANUAL / PAGE / ALL                         |
| `TableCore.Export` / `ServerExport` | Page CSV vs filtered **query**                       |
| `TableCore.Import` / `BulkDelete`   | Upload / delete ports                                |
| `TableCore.InlineEdit`              | `onSubmit(rowId, changes)`                           |

`export` / `import` ports do **not** auto-start jobs. Compiler infers `{exportBtn}` / `{importBtn}` on [Surface](./SURFACE.md); Toolbar mounts the button and the hook when those flags are on. Override with `surface.exportBtn: false`.

`useTableData` (`guard` / `gate`) is **kernel** fetch policy, not a plugin. Target folders: [FOLDERS.md](./FOLDERS.md).

## Ports vs plugins

Features inject HTTP. Plugins do not import `httpClient`.

| Port                                          | Consumed by             |
| --------------------------------------------- | ----------------------- |
| `fetcher`                                     | Kernel (`useTableData`) |
| `createExport` / `getStatus` / `downloadFile` | ServerExport            |
| `uploadFile` / `getStatus`                    | Import                  |
| `bulkDeleteApi`                               | BulkDelete              |
| `onSubmit`                                    | InlineEdit              |

## Do not put here

| Don't                            | Belongs                            |
| -------------------------------- | ---------------------------------- |
| Column ids / `fieldSchema`       | [Content](./CONTENT.md)            |
| FilterBar layout / URL key names | [Surface](./SURFACE.md)            |
| Striped rows                     | [Presentation](./PRESENTATION.md)  |
| Envelope paths on `TableMeta`    | Feature gateway (`parsePaginated`) |
