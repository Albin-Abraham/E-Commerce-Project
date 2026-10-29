# Table URL Synchronization and API Architecture

Search, filter, sort, URL sync, and HTTP fetching are decoupled. The engine stays headless; you bind the API.

## 1. State extraction (`useTableData`)

The engine does not embed an HTTP client. A `fetcher` callback receives a normalized `TableQueryParams` object plus an `AbortSignal`:

```typescript
const params: TableQueryParams = {
  page: pageIndex,
  pageSize: pageSize,
  sort: [{ key: "name", dir: "desc" }],
  filters: { role: "admin" },
  search: "john",
};
```

Rapid keystrokes cancel the previous request. `refetch()` also aborts the in-flight call before starting a new one.

The fetcher must return `{ rows, totalCount }`. Unwrap the backend envelope in the fetcher:

```ts
const page = ResponseFactory.parse(response).parsePaginated<User>();
return { rows: page.items, totalCount: page.total };
```

For `{ data, meta }` envelopes use `parseEnvelope` and map `data` / `meta.total` onto `{ rows, totalCount }` (see [Getting Started](./GETTING_STARTED.md)).

## 2. URL sync (`TableUrl`)

`useTableUrlReader` applies the URL to the engine. `useTableUrlWriter` writes state back (150ms debounce) so typing "JOHN" pushes the URL once.

### Compact keys (scoped by `meta.id`)

With `meta.id = "users"`:

- Sort: `users:sort=-name` (desc) or `users:sort=name` (asc)
- Filter: `users:filter=email:test@example.com`
- Search: `users:search=John`
- Page: `users:page=2` (omitted when equal to defaults: page `0`, size `10`)

Multiple tables on one page do not overwrite each other.

### Adapter

The URL module talks to a `TableUrlPort`. The controller injects `TableUrl.Adapters.useReactRouter()`. Swap the adapter for Next.js or `useNative()` without changing the engine.

Owned keys are `{meta.id}:page` (and legacy `{meta.id}_page` for known suffixes). Pathname prefixes are not claimed. Clearing search or resetting page to the default **removes** the key from the URL.

DOM scrolling (`scrollToTop`, `scrollToRow`, …) is `TableHandle` on `<ZenithTable>` — see [API Reference](./API_REFERENCE.md#tablehandle). It does not read URL or HTTP.
