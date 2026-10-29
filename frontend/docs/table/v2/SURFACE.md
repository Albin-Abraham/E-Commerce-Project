# MDAP — Surface

What chrome is **mounted** and how query state is **named** in the URL. Author on `TableEntity.surface`. Not visual tokens ([Presentation](./PRESENTATION.md)). Not fetch policy ([Behavior](./BEHAVIOR.md)).

How-to: [v1 URL and API sync](../v1/URL_AND_API_SYNC.md). Compound chrome: [v1 API Reference](../v1/API_REFERENCE.md).

## Owns

| Field                | Role                                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `pagination`         | `true` or `Partial<PaginationMeta>` — auto-render `<Pagination />`                                                     |
| `toolbar`            | Auto-render `<Toolbar />`                                                                                              |
| `filterBar`          | Auto-render `<FilterBar />` (default on when `content.filters` exist)                                                  |
| `exportBtn`          | Toolbar `{exportBtn}`. Default `Boolean(behavior.export)`                                                              |
| `importBtn`          | Toolbar `{importBtn}`. Default `Boolean(behavior.import)`                                                              |
| `filterStatusBadge`  | Same badge in Toolbar **and** FilterBar (`^2`). Default `Boolean(content.filters)`                                     |
| `selectionActionBar` | Auto-render empty `<SelectionActionBar />` shell                                                                       |
| `import`             | `{ mode: "modal" }` or `{ mode: "page", onImport }`. Not auto-mounted — [v1 Bulk operations](../v1/BULK_OPERATIONS.md) |
| `url`                | Key names / defaults. Keys are `{meta.id}:{key}` (`users:search`)                                                      |
| `features.urlSync`   | Only wired flag. Default `true`                                                                                        |

Chrome flags are **surface composition**, not `TableCore` plugins. Compose `SelectionActionBar` with children yourself if you need actions — do not also set the boolean (two bars).

**Placement (target):** Toolbar / FilterBar / Pagination stay these flags. They land in `View` `topContent` / `bottomContent` (HeroUI slots) — [Plugins](./PLUGINS.md#heroui-paint). Shipping still mounts them as siblings of `View`.

## Chrome vs plugins

| Surface (always layout)                                                      | Plugin (opt-in behavior)                              |
| ---------------------------------------------------------------------------- | ----------------------------------------------------- |
| `FilterBar` — MDAP form from `content.filters`                               | `TableCore.Filter` — engine writer                    |
| `Pagination` / `Toolbar` / `{exportBtn}` `{importBtn}` `{filterStatusBadge}` | ServerExport / Import **hooks** (ports from behavior) |
| `SelectionActionBar` **paint**                                               | `TableCore.Selection` **logic**                       |

`SelectionActionBar` is the one shipping UI plugin (`plugins/selection`). FilterBar stays kernel chrome. Target grouping: [Folders](./FOLDERS.md).

## URL

`TableUrl` is **kernel**, not a plugin. Scoped keys so two tables on one page do not collide. Clearing search or resetting page to default **removes** the key.

Do not write an unscoped `search` query param ([v1 rule 2.6](../v1/RULES_AND_ANTI_PATTERNS.md)).

## Do not put here

| Don't                            | Belongs                                    |
| -------------------------------- | ------------------------------------------ |
| `fetcher` / `gate`               | [Behavior](./BEHAVIOR.md)                  |
| `striped` / `stickyHeader`       | [Presentation](./PRESENTATION.md)          |
| `columns` / `filters` field list | [Content](./CONTENT.md)                    |
| `features.selection`             | Compose `TableCore.Selection` — not a flag |
