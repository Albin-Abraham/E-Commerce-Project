# Accessibility, keyboard, and troubleshooting

Operator notes for what the table actually wires. This is not a WCAG audit.

## Accessibility (what is on by default)

| Surface              | What you get                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Root                 | `role="region"` `aria-label="Data table"` `data-testid={meta.id}`                                                                                |
| `<View>` / `<table>` | `role="grid"`                                                                                                                                    |
| Rows / cells         | `role="row"`, `role="columnheader"`, `role="gridcell"`; cells have `data-table-cell` and `aria-colindex`                                         |
| Sortable headers     | `aria-sort` (`ascending` / `descending` / `none`), `tabIndex={0}`, Enter/Space toggles sort                                                      |
| Select column        | `aria-label` on header (“Select all rows on this page”) and cells (`Select row {id}`); header `aria-checked` is `"mixed"` in ALL with exclusions |
| Pagination           | `role="navigation"` `aria-label="Table pagination"`; first/prev/next/last have `aria-label`; current page `aria-current="page"`                  |
| Loading skeletons    | `aria-hidden` on skeleton rows                                                                                                                   |
| Error boundary       | `role="alert"`                                                                                                                                   |

Root `aria-label` is the string `"Data table"`. Override by spreading onto `<Table>` (`<Table aria-label="Users">`) — the root is a `div` that forwards HTML attributes.

`getRowId` matters for select `aria-label` and `data-testid={`table-select-${rowId}`}`.

## Keyboard

Body registers **movement** keys on Event core (`scope: table:{meta.id}`) and still attaches `handleKeyDown` on `<tbody>` so the grid works if `GlobalEventProvider` is missing. `handleKeyDown` stops propagation so both paths do not double-move. Enter/Space are **not** Event-core shortcuts — header sort and in-cell buttons keep native Enter. Focus must be inside the grid for Event-core arrows (header or body).

| Key                           | Behavior                                             |
| ----------------------------- | ---------------------------------------------------- |
| Arrow keys                    | Move among `[data-table-cell]` in `[data-table-row]` |
| Home / End                    | First / last cell in the row                         |
| Ctrl+Home / Ctrl+End          | First / last cell in the grid                        |
| PageUp / PageDown             | Jump 10 rows                                         |
| Enter / Space on a **header** | Toggle sort (handled on `<th>`, not the grid hook)   |

What is **not** wired:

- Enter/Space on a header still toggle sort on `<th>`. The grid hook defers to that (and to focused buttons/inputs).
- `useGridKeyboardNavigation` is also exported from `@shared/ui/table` for custom grids. Pass `scope` to use Event core; `handleKeyDown` is the fallback.

Body cells get a roving `tabIndex` when the hook focuses them. Event core skips movement keys while an input is focused (toolbar search, inline edit), except Escape.

`TableHandle.focusFirstCell()` focuses the first `[role="gridcell"]` in the body. It is on `<ZenithTable ref>` (`useTableController`). The hook’s `Table` does not forward a ref.

Toolbar search: type in the field; Enter commits. With `gate: "manual"`, Enter also calls `search()`.

## Troubleshooting

| Symptom                                                      | Likely cause                                                                                                                                                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useTableMeta` / `useTableDOM` / pagination throws           | `<Pagination />`, `<Toolbar />`, `<SelectionActionBar />`, or `useSelection` rendered **outside** `<Table>`.                                                                          |
| Invalid HTML / hydration (`thead` inside `div`)              | Header/Body not wrapped in `<View>`.                                                                                                                                                  |
| URL or scroll resets on load                                 | `<Table>` unmounted while loading. Keep it mounted; Body reads fetch context.                                                                                                         |
| Empty table / fetch `error` about `{ rows, totalCount }`     | Fetcher returned an HTTP envelope. Unwrap with `ResponseFactory.parse(response).parsePaginated()` in the fetcher.                                                                     |
| Fetcher never runs                                           | `guard` returned false, or `gate: "manual"` and `search()` / `refetch()` not called yet.                                                                                              |
| Fetcher runs on every keystroke (you wanted a Search button) | Default `gate: "auto"`. Set `gate: "manual"`. That is not `selectionMode: "MANUAL"`.                                                                                                  |
| Client table shows 10 of 100 rows you passed                 | The table does not slice locally. `data` is the current page. Pass `totalCount` for the pager; fetch the page yourself.                                                               |
| Selection lost on page 2 / wrong rows targeted               | Missing `getRowId`. Default is row index.                                                                                                                                             |
| `onSelectionChange` silent after “select all”                | ALL mode skips that callback. Read `selectionMode` + `excludedIds`, or use `SelectionActionBar.Action` `onClick`.                                                                     |
| Header checkbox does nothing / no select column              | Forgot `TableCore.Selection.columnDef()` in `columns`, or `Listener` / `useSelection` without `enabled: true`.                                                                        |
| Two tables fight over `?page=`                               | Duplicate `meta.id`. Each table needs a unique id (`users`, `orders`).                                                                                                                |
| Pagination labels say 10 of 10 but the API has 250           | Server `totalCount` not returned (or client `totalCount` prop omitted).                                                                                                               |
| Sort/filter in the URL but rows unchanged                    | Server must apply `params.sort` / `params.filters` / `params.search`. The table will not re-sort the page.                                                                            |
| Export is only this page                                     | `TableCore.Export` is the current page. Use `TableCore.ServerExport` + `extractQueryParams` for the filtered query.                                                                   |
| Keyboard arrows do nothing                                   | Focus is not in the grid. Click a header or cell first. Custom `renderRow` must keep `data-table-row` and `data-table-cell`. Body still has `onKeyDown` if Event core is not mounted. |
