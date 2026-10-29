# Getting Started with ZenithTable

Author a **`TableEntity`** (MDAP: content / behavior / surface / presentation). Compile it. `useZenithTable` is the **runtime** — it does not own the authoring format.

See [MDAP authoring](./MDAP.md). The form engine uses the same split (`EntityDefinition` → `compileEntityToFormDef`).

Both composition styles are valid. Always wrap header/body in `View` so they sit inside a real `<table>`:

```tsx
<Table>
  <View>
    <Header />
    <Body />
  </View>
</Table>

<Table>
  <Table.View>
    <Table.Header />
    <Table.Body />
  </Table.View>
</Table>
```

**Pagination, Toolbar, FilterBar, and SelectionActionBar must be children of `<Table>`.** They read engine/physics context and throw outside the root.

Keep `<Table>` mounted while loading. `<Body />` reads loading/error from the table fetch context — do not unmount `<Table>` on load (that resets URL sync and scroll restoration).

## Client data

A client `source` is the **current page of rows**. The table does not sort, filter, or paginate that array locally. Pass the rows the server already processed, and pass `totalCount` when the full dataset is larger than `data.length`.

```tsx
import { compileEntityToTableDef, useZenithTable } from "@shared/ui/table";
import type { TableEntity } from "@shared/ui/table";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const mockUsers: User[] = [
  { id: "1", name: "Alice Smith", email: "alice@example.com", role: "Admin" },
  { id: "2", name: "Bob Jones", email: "bob@example.com", role: "User" },
];

const usersEntity: TableEntity<User> = {
  id: "users",
  name: "Users",
  content: {
    columns: [
      { id: "name", label: "Full Name" },
      {
        id: "email",
        label: "Email Address",
        fieldSchema: {
          id: "email",
          name: "email",
          label: "Email",
          type: "email",
        },
      },
      { id: "role", label: "System Role" },
    ],
    getRowId: (row) => row.id,
  },
  behavior: { client: { data: mockUsers } },
  surface: { pagination: true },
  presentation: { striped: true, shadow: "sm" },
};

export function UsersTable() {
  const compiled = compileEntityToTableDef(usersEntity);
  const { Table, Header, Body, View, Pagination } =
    useZenithTable<User>(compiled);

  return (
    <div className="p-6">
      <Table>
        <View>
          <Header />
          <Body />
        </View>
        <Pagination />
      </Table>
    </div>
  );
}
```

`useMDAPTable(usersEntity)` is the same compile + hook in one call.

Set `surface.pagination: true` (or `pagination: true` on the compiled config) to auto-render `<Pagination />` inside `Table`. Default is consumer-owned.

Without `totalCount`, a client table is **one page** (the rows you passed). With `behavior.client.totalCount: 100` and 10 rows, the pager has 10 pages and labels use 100 — the engine still renders those 10 rows.

## Server-side data

Put `fetcher`, `guard`, and `gate` on **`behavior.server`**. The compiler emits `DataSource`. Unwrap the backend envelope with `ResponseFactory` and return `{ rows, totalCount }`. The table does not parse HTTP envelopes.

```tsx
import { RequestFactory, ResponseFactory } from "@core/http";
import { httpClient } from "@core/http/http.instance";

import { compileEntityToTableDef, useZenithTable } from "@shared/ui/table";
import type {
  TableEntity,
  TableQueryParams,
  TableServerResponse,
} from "@shared/ui/table";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

async function fetchUsers(
  params: TableQueryParams,
  signal?: AbortSignal
): Promise<TableServerResponse<User>> {
  const request = RequestFactory.get("/api/v1/users/")
    .withParams({
      page: params.page,
      page_size: params.pageSize,
      search: params.search || undefined,
      ordering:
        params.sort
          .map((s) => (s.dir === "desc" ? `-${s.key}` : s.key))
          .join(",") || undefined,
      ...Object.fromEntries(
        Object.entries(params.filters).map(([key, value]) => [
          key,
          value == null ? undefined : String(value),
        ])
      ),
    })
    .build();
  const response = await httpClient.auth.request({ ...request, signal });
  const page = ResponseFactory.parse(response).parsePaginated<User>();
  return { rows: page.items, totalCount: page.total };
}

const usersEntity: TableEntity<User> = {
  id: "users",
  name: "Users",
  content: {
    columns: [
      { id: "name", label: "Full Name" },
      { id: "email", label: "Email Address" },
      { id: "role", label: "System Role" },
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
      guard: (params) => Boolean(params.filters.role),
      gate: "manual",
    },
  },
  surface: { pagination: true, filterBar: true },
  presentation: { striped: true, shadow: "sm" },
};

export function UsersTable() {
  const { Table, Header, Body, View, Pagination, FilterBar } =
    useZenithTable<User>(compileEntityToTableDef(usersEntity));

  return (
    <div className="p-6">
      <Table>
        <FilterBar />
        <View>
          <Header />
          <Body />
        </View>
        <Pagination />
      </Table>
    </div>
  );
}
```

`parsePaginated` reads `items`/`results`/`data` and `total`/`count`/`totalCount`. Map that page onto the table contract — do not pass the envelope through.

If the API wraps a list in `{ data, meta }` instead of a paginated page, use `parseEnvelope` and map it yourself:

```ts
const env = ResponseFactory.parse(response).parseEnvelope<User[]>();
return {
  rows: env.data ?? [],
  totalCount: Number(env.meta?.total ?? env.data?.length ?? 0),
};
```

Sort, filter, search, and page changes re-call the fetcher (previous request aborted). The URL is scoped by `entity.id`, e.g. `?users:page=2`. Rows stay server-owned: TanStack does not re-sort, re-filter, or re-page that array.

**Guard** (proactive) and **gate** (reactive) live on `behavior.server`. After compile they sit on `DataSource`. `gate: "manual"` is fetch policy — it is not `selectionMode: "MANUAL"` and it does not enable client-side paging.

|                  | Role                                                                                               | Typical use      |
| ---------------- | -------------------------------------------------------------------------------------------------- | ---------------- |
| `guard(params)`  | Eligibility. `false` skips every attempt.                                                          | Required filters |
| `gate: "auto"`   | Proactive (default). Fetch on mount and query changes, if guard allows.                            | Live search      |
| `gate: "manual"` | Reactive. Fetch on `search()` / `refetch()` only. Page/sort still refetch after the first success. | Search button    |

`FilterBar` is an MDAP form (`content.filters`). Dropdowns and the column-filter popover use `FieldRenderer`, not raw `<select>` / `<input>`.

Custom cells: `tableCellRegistry.register("feature-…", Comp)` then `renderer: "feature-…"`. See [MDAP](./MDAP.md).

Checkbox selection (column + action bar) is in [Selection](./SELECTION.md). Keyboard, `aria-*`, and common failures are in [Accessibility, keyboard, troubleshooting](./A11Y_AND_TROUBLESHOOTING.md).

CSV **import** is declared on the entity (`behavior.import` ports, `surface.import`: `modal` or `page` with `onImport`) but is not auto-mounted. Compose the plugin + `ProgressModal`, or navigate to an import page that reuses the same ports — [Bulk operations](./BULK_OPERATIONS.md).
