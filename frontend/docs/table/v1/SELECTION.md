# Selection

Selection lives on the physics store (`selectedRows`, `excludedRows`, `selectionMode`). The checkbox column and `useSelection` must run **inside** `<Table>`.

`columnDef()` is a factory — call it when building columns (outside `<Table>` is fine). `useSelection` reads physics context — call it inside `<Table>` (or render `TableCore.Selection.Listener`).

Pass `getRowId` so ids stay stable across server pages. Default is row index, which breaks PAGE/ALL when the page changes.

## Wiring

```tsx
import { useMemo } from "react";

import { TableCore, useZenithTable } from "@shared/ui/table";

function UsersTable({
  users,
  onDelete,
}: {
  users: User[];
  onDelete: (ids: string[]) => void;
}) {
  const columns = useMemo(
    () => [
      TableCore.Selection.columnDef<User>(),
      { accessorKey: "name", header: "Name" },
      { accessorKey: "email", header: "Email" },
    ],
    []
  );

  const { Table, Header, Body, View, Pagination, SelectionActionBar } =
    useZenithTable<User>({
      meta: { id: "users" },
      columns,
      source: { type: "client", data: users },
      getRowId: (row) => row.id,
    });

  return (
    <Table>
      <TableCore.Selection.Listener enabled type="multiple" />
      <SelectionActionBar>
        <SelectionActionBar.Info />
        <SelectionActionBar.Modes />
        <SelectionActionBar.Actions>
          <SelectionActionBar.Action
            label="Delete"
            variant="danger"
            onClick={(ctx) => onDelete(ctx.selectedIds)}
          />
        </SelectionActionBar.Actions>
      </SelectionActionBar>
      <View>
        <Header />
        <Body />
      </View>
      <Pagination />
    </Table>
  );
}
```

`Listener` is `useSelection` as a component. Equivalent hook form (still **inside** `<Table>`):

```tsx
function SelectionBridge() {
  TableCore.Selection.useSelection({ enabled: true, type: "multiple" });
  return null;
}
```

`enabled: true` is required. Without it, `type` is not applied and `onSelectionChange` does not fire.

Set `selectionActionBar: true` on the hook to auto-render an empty `<SelectionActionBar />` shell (hidden until there is a selection). Compose `.Info` / `.Modes` / `.Actions` yourself — do not also set the boolean if you render the bar with children (you would get two bars).

## Modes

| `selectionMode` | Meaning                                                                  |
| --------------- | ------------------------------------------------------------------------ |
| `"MANUAL"`      | Individual row ids in `selectedRows`                                     |
| `"PAGE"`        | Current page ids (header checkbox, first click)                          |
| `"ALL"`         | Entire filtered query; `excludedRows` are opt-outs. Second header click. |

Header checkbox cycle: empty → PAGE → ALL → clear.

`onSelectionChange` receives the id array in MANUAL/PAGE only. In ALL it is skipped — use `selectionMode`, `excludedIds`, and `totalCount` (or `SelectionActionBar.Action`’s `onClick` context):

```ts
{
  mode: "MANUAL" | "PAGE" | "ALL";
  selectedIds: string[];
  excludedIds: string[];
  totalCount: number;
}
```

Bulk export/delete must send that context (or `extractQueryParams`) — not only `selectedIds` — when mode is ALL. See [Bulk operations](./BULK_OPERATIONS.md).

This is not `gate: "manual"` and not “TanStack pages locally.” See [README](./README.md#three-different-manuals).
