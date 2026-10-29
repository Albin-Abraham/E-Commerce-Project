# MDAP authoring (TableEntity)

Same four layers as [`docs/archive/form-v1`](../../archive/form-v1/README.md). Author a `TableEntity`. Compile it. `useZenithTable` / `useTableController` consume the flattened runtime (`CompiledTableDef`). Do not hand-write `ColumnDef` JSX as the default path.

```tsx
import {
  compileEntityToTableDef,
  tableCellRegistry,
  useZenithTable,
} from "@shared/ui/table";
import type { TableEntity } from "@shared/ui/table";

tableCellRegistry.register("feature-user-name", ({ row }) => (
  <UserNameCell user={row} />
));

const usersEntity: TableEntity<User> = {
  id: "users",
  name: "Users",
  content: {
    columns: [
      {
        id: "name",
        label: "Name",
        renderer: "feature-user-name",
        sortable: true,
      },
      {
        id: "email",
        label: "Email",
        fieldSchema: {
          id: "email",
          name: "email",
          label: "Email",
          type: "email",
        },
      },
      {
        id: "role",
        label: "Role",
        filterable: true,
        fieldSchema: {
          id: "role",
          name: "role",
          label: "Role",
          type: "select",
          options: [
            { value: "Admin", label: "Admin" },
            { value: "User", label: "User" },
          ],
        },
      },
    ],
    filters: [
      {
        id: "search",
        name: "search",
        label: "Search",
        type: "text",
        properties: { placeholder: "Filter records..." },
      },
      {
        id: "role",
        name: "role",
        label: "Role",
        type: "select",
        options: [
          { value: "Admin", label: "Admin" },
          { value: "User", label: "User" },
        ],
      },
    ],
    getRowId: (row) => row.id,
  },
  behavior: {
    server: {
      fetcher: fetchUsers,
      guard: (params) => Boolean(params.filters.branchId),
      gate: "manual",
    },
    export: { createExport, getStatus, downloadFile },
    import: { uploadFile, getStatus: getImportStatus, onRefresh: refetchUsers },
  },
  surface: {
    pagination: true,
    toolbar: true,
    filterBar: true,
    import: { mode: "modal" },
    // or: import: { mode: "page", onImport: () => navigate("/users/import") },
  },
  presentation: { striped: true, shadow: "sm" },
};

const compiled = compileEntityToTableDef(usersEntity);
const { Table, Header, Body, View, Pagination, FilterBar } =
  useZenithTable(compiled);
```

`useMDAPTable(entity)` is `compileEntityToTableDef` + `useZenithTable` in one hook (same idea as `useMDAPForm`).

## Layers

| Layer            | Owns                                                                                                                           | Compiler output                                                 | v2                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- | ---------------------------------------- |
| **Content**      | `columns` (`TableColumnMeta[]`), `filters` (MDAP `FormFieldSchema[]`), `getRowId`                                              | `TableColumnFactory.compile` + `filterForm`                     | [CONTENT.md](../v2/CONTENT.md)           |
| **Behavior**     | `server.fetcher` / `guard` / `gate`, `client.data`, `export`, `import`                                                         | `DataSource` + `serverExport` + `import`                        | [BEHAVIOR.md](../v2/BEHAVIOR.md)         |
| **Surface**      | pagination / toolbar / filterBar / `{exportBtn}` `{importBtn}` `{filterStatusBadge}` / URL keys / `import` (`modal` \| `page`) | chrome flags + `compiled.chrome` + `meta.url` + `importSurface` | [SURFACE.md](../v2/SURFACE.md)           |
| **Presentation** | striped, shadow, sticky                                                                                                        | visual shortcuts on the runtime config                          | [PRESENTATION.md](../v2/PRESENTATION.md) |

`DataSource` is **compiled**. Put fetcher / guard / gate on `behavior.server`, not as the authoring format.

`behavior.export` / `behavior.import` compile to `compiled.serverExport` / `compiled.import` and infer `compiled.chrome.exportBtn` / `importBtn` (Toolbar slots). `content.filters` infers `compiled.chrome.filterStatusBadge` (Toolbar **and** FilterBar). `surface.import` compiles to `compiled.importSurface`. `useMDAPTable` does **not** auto-start the export/import **job** — the Toolbar button mounts the hook when the chrome flag is on. Override with `surface.exportBtn: false`. See [Bulk operations](./BULK_OPERATIONS.md).

## Filters, dropdowns, popovers

`content.filters` is an MDAP form. `Table.FilterBar` renders `FieldRenderer` (select, autocomplete, date, text). Field `name: "search"` writes `engine.setGlobalFilter`; every other name writes a column filter.

Filterable columns with `fieldSchema` get a header popover that is also `FieldRenderer` — not a raw `<input>`.

## Cell registry (form rule 2.2)

Keep `shared/ui/table` generic. Register feature cells by string:

```ts
tableCellRegistry.register("feature-employee-avatar", EmployeeAvatarCell);
```

Set `renderer: "feature-employee-avatar"` on `TableColumnMeta`. Do not put `<EmployeeAvatar />` trees on `ColumnDef.cell`.

Built-in renderer strings (`text`, `badge`, `avatar`, `currency`, `date`) stay in `TableColumnFactory`. Unknown strings look up the registry, then fall back to text.

## Runtime contract

`useZenithTable({ meta, columns, source })` still works. That object is what the compiler emits. The v1 handbook for URL, gate, `{ rows, totalCount }`, and compound chrome is unchanged.
