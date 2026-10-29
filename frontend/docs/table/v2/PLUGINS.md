# ZenithTable v2 — Plugins

Extension contract. **How** optional capability attaches to the kernel.

- Authoring: [Content](./CONTENT.md) / [Behavior](./BEHAVIOR.md) / [Surface](./SURFACE.md) / [Presentation](./PRESENTATION.md)
- Physical grouping (logic + paint per plugin): [Folders](./FOLDERS.md)
- Who owns HTTP: [Platform layers](./LAYERS.md)
- Call signatures: [v1 API Reference](../v1/API_REFERENCE.md). Selection: [v1 Selection](../v1/SELECTION.md). Bulk: [v1 Bulk operations](../v1/BULK_OPERATIONS.md)

v2 documents **composition plugins**, not the ECS pipeline in [`TableCore_Architecture_Spec.md`](../../TableCore_Architecture_Spec.md). That spec is not implemented. Paths in the catalog below are **v1 shipping** locations; target slots are in [Folders](./FOLDERS.md).

## Compose, do not flag

`meta.features` is only `urlSync`. Selection, export, import, and inline edit are **not** booleans on `TableMeta`. Turn them on by composing under `<Table>`.

Chrome flags (`surface.pagination`, `toolbar`, `filterBar`, `selectionActionBar`, `exportBtn`, `importBtn`, `filterStatusBadge`) auto-mount chrome. They are **not** `TableCore` plugins.

## Catalog

| Kind               | Location                         | Layer                             | How you turn it on                                                        |
| ------------------ | -------------------------------- | --------------------------------- | ------------------------------------------------------------------------- |
| **Logic modules**  | `core/modules/*` via `TableCore` | Application                       | Compose under `<Table>`: `useSelection`, `useServerExport`, … (`enabled`) |
| **UI plugin**      | `plugins/selection`              | Infrastructure UI                 | Render `SelectionActionBar` / `Listener` inside `<Table>`                 |
| **Cell plugins**   | `tableCellRegistry`              | Domain registers; kernel looks up | `register("feature-…")` + `renderer` on the column                        |
| **Custom modules** | `TableCore.register` / `get`     | Domain or app                     | Untyped slot; does **not** replace built-ins                              |
| **URL categories** | `url/categories`                 | Infrastructure                    | Kernel (not opt-in)                                                       |
| **Chrome flags**   | `surface.pagination` etc.        | Surface                           | Auto-mount chrome; not `TableCore`                                        |

Asymmetry in the shipping tree: only selection has a `plugins/` UI package. `FilterBar` lives in `ui/components`. Logic for both lives in `core/modules`. Target: one folder per plugin ([Folders](./FOLDERS.md)). Do not treat every folder as a plugin today.

## Built-in `TableCore` modules

Must run **under** `<ZenithTable>` (engine / physics context). `columnDef()` may run when building columns (outside `<Table>` is fine).

| Module         | Typical call                                                                    | Port (feature-injected)                 |
| -------------- | ------------------------------------------------------------------------------- | --------------------------------------- |
| `Selection`    | `columnDef()`, `useSelection({ enabled, type, onSelectionChange })`, `Listener` | — (physics only)                        |
| `Filter`       | `useFilter({ enabled, debounceMs })`                                            | — (`setGlobalSearch` writes the engine) |
| `Export`       | `useExport({ enabled })`                                                        | — (current **page** of rows)            |
| `ServerExport` | `useServerExport({ enabled, createExport, getStatus, downloadFile })`           | Job APIs; filtered **query**            |
| `Import`       | `useImport({ enabled, uploadFile, getStatus })`                                 | Upload + status                         |
| `BulkDelete`   | `useBulkDelete({ enabled, bulkDeleteApi })`                                     | Delete API; ALL mode sends `__all__`    |
| `InlineEdit`   | `useInlineEdit({ enabled, onSubmit })`                                          | `onSubmit(rowId, changes)`              |

`useExportTask` / `useImportTask` are job machines used **by** ServerExport / Import. They are not a second plugin type.

## Plugin contract

| Rule            | Meaning                                                                  |
| --------------- | ------------------------------------------------------------------------ |
| `enabled`       | Opt-in. Without it, type / callbacks may not apply (Selection).          |
| Context         | Read engine / physics only under `<Table>`.                              |
| Ports           | Side effects are injected (`createExport`, `bulkDeleteApi`, `onSubmit`). |
| Generic         | No `httpClient`, no domain `if (employee)`.                              |
| Typed built-ins | `TableCore.Selection` etc. are concrete. `register()` is extras only.    |

## Compose with compiled {#compose-with-compiled}

Canonical path when `behavior.export` / `behavior.import` are on the entity. Spread compiler output — do not re-pass `http.post`. `ProgressModal` slot markup: [v1 Bulk operations](../v1/BULK_OPERATIONS.md). Requires `behavior.export` / `behavior.import` on the entity.

```tsx
const compiled = compileEntityToTableDef(usersEntity);
const { Table, Header, Body, View } = useZenithTable(compiled);

function ExportImport() {
  const exportApi = TableCore.ServerExport.useServerExport({
    enabled: true,
    ...compiled.serverExport!,
  });
  const importApi = TableCore.Import.useImport({
    enabled: true,
    ...compiled.import!,
  });

  const openImport = () => {
    if (compiled.importSurface?.mode === "page")
      compiled.importSurface.onImport();
    else importApi.triggerImport();
  };

  return (
    <>
      <button type="button" onClick={() => exportApi.handleExport("csv")}>
        Export
      </button>
      <button type="button" onClick={openImport}>
        Import
      </button>
      <ProgressModal
        isOpen={exportApi.task.status !== "idle"}
        onClose={exportApi.handleCloseModal}
        status={exportApi.task.status}
        progress={exportApi.task.progress}
        title="Export"
      />
    </>
  );
}

return (
  <Table>
    <ExportImport />
    <View>
      <Header />
      <Body />
    </View>
  </Table>
);
```

`ExportImport` must render **inside** `<Table>`. Modal import can also use `importApi.setIsImportModalOpen(true)`. Page import never mounts `ProgressModal` on the list — the route reuses `compiled.import` + `useImportTask`.

When `compiled.chrome.exportBtn` / `importBtn` is true and `Toolbar` is mounted, those buttons are already in the toolbar (same hooks, same ports). You do not need a second Export button.

## HeroUI paint (target) {#heroui-paint}

**Target**, not shipping. Do not copy this into a running table until `View` is wired. Shipping grid is `TablePrimitives`. Folder map: [Folders](./FOLDERS.md).

`import { Table } from "@heroui/react"` (no alias). `ZenithTable` stays the compound. Not `TableCore.register("heroui")`.

```tsx
import { Table } from "@heroui/react";
import type { Selection } from "@heroui/react";

function ZenithTableView({
  children,
  topContent,
  bottomContent,
}: {
  children: React.ReactNode;
  topContent?: React.ReactNode;
  bottomContent?: React.ReactNode;
}) {
  const { scrollerRef, tableRef } = useTableDOM();
  const meta = useTableMeta();
  const { engine } = useTableContext();
  const selectionEnabled = true;
  TableCore.Selection.useSelection({
    enabled: selectionEnabled,
    type: "multiple",
  });
  const selectionType = useTablePhysics((s) => s.selectionType);
  const selectedRows = useTablePhysics((s) => s.selectedRows);
  const physicsMode = useTablePhysics((s) => s.selectionMode);

  const selectedKeys: Selection = physicsMode === "ALL" ? "all" : selectedRows;

  return (
    <Table>
      {topContent}
      <Table.ScrollContainer ref={scrollerRef}>
        <Table.Content
          ref={tableRef}
          aria-label={meta.id}
          sortDescriptor={toSortDescriptor(engine.getState().sorting)}
          onSortChange={(d) => engine.setSorting(toSortingState(d))}
          selectionMode={selectionEnabled ? selectionType : "none"}
          selectedKeys={selectedKeys}
          onSelectionChange={applyHeroSelection}
        >
          {children}
        </Table.Content>
      </Table.ScrollContainer>
      {bottomContent ? <Table.Footer>{bottomContent}</Table.Footer> : null}
    </Table>
  );
}
```

`useSelection({ enabled })` is the same flag as `Listener`. Physics defaults `selectionType` to `"multiple"` — without `enabled`, pass `"none"`.

`applyHeroSelection(keys: Selection)`: `keys instanceof Set` → empty `resetSelection()`, else `setBulkSelection([...keys])` (single: size ≤ 1). `keys === "all"` is **PAGE** (visible collection), not server `ALL`.

Selection **paint** is HeroUI `Checkbox` `slot="selection"`. `columnDef()` wraps that or stops being the DOM.

Host: `topContent={<><Toolbar /><FilterBar /></>}` `bottomContent={<Pagination />}`. `{children}` is Header + Body + `flexRender`. Pass `selectedRows` as a **Set**.

```tsx
<Table>
  <TableCore.Selection.Listener enabled type="multiple" />
  <SelectionActionBar>
    <SelectionActionBar.Info />
    <SelectionActionBar.Actions>
      <SelectionActionBar.Action
        label="Delete"
        onClick={(ctx) => onDelete(ctx.selectedIds)}
      />
    </SelectionActionBar.Actions>
  </SelectionActionBar>
  <View>
    <Header />
    <Body />
  </View>
</Table>
```

## Logic vs paint

|           | Behavior                         | Paint                                              |
| --------- | -------------------------------- | -------------------------------------------------- |
| Selection | `core/modules/SelectionModule`   | `plugins/selection` (`SelectionActionBar`)         |
| Filter    | `TableCore.Filter` writes engine | `FilterBar` is **chrome**, not a UI plugin package |
| Export    | `TableCore.ServerExport` + ports | `ProgressModal` (status chrome)                    |

Do not put fetchers in `plugins/`. Do not put action-bar JSX in `TableColumnMeta`.

## Cell plugins (domain)

Keep `shared/ui/table` generic. Register in the feature:

```ts
tableCellRegistry.register("feature-employee-avatar", EmployeeAvatarCell);
```

Set `renderer: "feature-employee-avatar"` on `TableColumnMeta`. Built-in strings (`text`, `badge`, `avatar`, `currency`, `date`) stay in `TableColumnFactory`. Unknown strings look up the registry, then fall back to text.

Do not add a new `TableCore` module inside shared UI for a domain cell.

## Custom `TableCore.register`

```ts
TableCore.register("my-ops", myModule);
TableCore.get("my-ops");
```

Use for feature-only ops that still need engine context. It does not replace `TableCore.Selection` (or any built-in). Prefer `tableCellRegistry` for cells.

## Ports vs plugins

|            | Plugin                                      | Port                                       |
| ---------- | ------------------------------------------- | ------------------------------------------ |
| What       | Generic capability composed under `<Table>` | Function the feature passes in             |
| Examples   | `ServerExport`, `BulkDelete`                | `fetcher`, `createExport`, `bulkDeleteApi` |
| Owns HTTP? | No                                          | Yes (feature gateway)                      |

`behavior.server.fetcher` feeds the **kernel** (`useTableData`), not a TableCore module. Job functions feed **plugins**.

## FilterBar vs `TableCore.Filter`

|                                 | Role                                                        |
| ------------------------------- | ----------------------------------------------------------- |
| `content.filters` + `FilterBar` | MDAP surface — `FieldRenderer` for search / selects / dates |
| `TableCore.Filter`              | Engine writer (debounce). Not a second filter store         |

Do not drop a raw `<select>` beside the table for query filters.

## Excel / sheet

A spreadsheet is a **sibling host**, not `TableCore.register("excel")`. Share `TableColumnMeta`, `fieldSchema`, and save/load ports. Do not route Univer / Handsontable through `ITableEngine` or `useZenithTable`. List grids stay this kernel; sheets get their own kernel + plugins.

HeroUI `Table` is **View paint**, not `TableCore.register("heroui")`. Selection logic stays `TableCore.Selection`; `selectedKeys` is a `Set` on `Table.Content`. Paint is HeroUI `Checkbox` `slot="selection"` — [HeroUI paint](#heroui-paint).

## Anti-patterns

| Don't                                          | Do                                                   |
| ---------------------------------------------- | ---------------------------------------------------- |
| `features: { selection: true }` on `TableMeta` | Compose `TableCore.Selection` + `SelectionActionBar` |
| Import `httpClient` in a module                | Inject a port from the feature                       |
| `TableCore.register` to override `Selection`   | Use the typed built-in                               |
| God column JSX                                 | Cell registry                                        |
| Treat `FilterBar` as `TableCore.Filter`        | Chrome vs engine writer                              |
| `TableCore.register("heroui")`                 | [HeroUI paint](#heroui-paint) — kernel View paint    |
| Re-pass `http.post` into ServerExport / Import | Spread `compiled.serverExport` / `compiled.import`   |
| Claim ECS pipeline plugins are shipping        | This catalog only                                    |
