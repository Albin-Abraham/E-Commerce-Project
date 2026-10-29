# MDAP — Presentation

How the table **looks**. Author on `TableEntity.presentation`. Not chrome flags ([Surface](./SURFACE.md)). Not `ZenithTable.Body` (that is kernel UI).

This layer is thin in v1: visual shortcuts on the compiled config, plus density on the physics store and `meta.ui` slots on runtime `TableMeta`. v1 README **Chrome (`/ui`)** is kernel chrome (`View` / `Header` / `Body`). **This page is MDAP paint** (striped / shadow / sticky). HeroUI `Table` is that chrome ([Plugins](./PLUGINS.md#heroui-paint)) — map `striped` / `bordered` / `shadow` / `stickyHeader` onto `variant` / `className`. Do not put `Table.ScrollContainer` on `TableEntity.presentation`.

## Owns (`TablePresentationDefinition`)

| Field          | Role                                       |
| -------------- | ------------------------------------------ |
| `striped`      | Zebra rows                                 |
| `bordered`     | Cell borders                               |
| `shadow`       | `true` \| `"sm"` \| `"md"` \| `"lg"`       |
| `stickyHeader` | Sticky `<thead>`                           |
| `compact`      | Compact shortcut (also related to density) |
| `className`    | Root class                                 |

Compiler copies these onto `CompiledTableDef` / `TableMeta`.

## Related, not on `presentation`

| Concern                             | Where it lives today                                                  |
| ----------------------------------- | --------------------------------------------------------------------- |
| Density (`comfortable` / `compact`) | Physics store `setDensity` — Toolbar; CSS vars on the table container |
| Empty / loading / error             | `meta.ui` slots (`empty`, `loading`, `error`) or defaults in `Body`   |
| Cell / row / header slot overrides  | `meta.ui` — runtime, not `TableEntity.presentation`                   |

Keep `<Table>` mounted while loading so URL sync and scroll restoration survive. Loading chrome is presentation of fetch **status**, not behavior.

## Do not put here

| Don't                                      | Belongs                                                         |
| ------------------------------------------ | --------------------------------------------------------------- |
| `pagination: true`                         | [Surface](./SURFACE.md)                                         |
| `fetcher`                                  | [Behavior](./BEHAVIOR.md)                                       |
| `renderer: "feature-…"`                    | [Content](./CONTENT.md)                                         |
| Domain JSX in a cell                       | Cell registry                                                   |
| Treating `/ui` (Header/Body) as this layer | Kernel paint — [Folders](./FOLDERS.md) `kernel/ui`              |
| HeroUI `Table` / `Table.Content`           | [Plugins](./PLUGINS.md#heroui-paint) `kernel/ui` (target paint) |

Form MDAP presentation is DCS / `withAtom`. Table v1 has no styling module; tokens come from the design system and density CSS variables. Do not invent a JSON atom tree on the entity.
