# ZenithTable v2

Organization handbook for the **same** table that ships in v1.

|           | v1                                                                      | v2                                                                                                                |
| --------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Role      | Implementation — how-to and API                                         | Organization — MDAP four, target folders, plugins                                                                 |
| Code      | [`@shared/ui/table`](../../../src/shared/ui/table) as it exists today   | Unchanged. The [folder map](./FOLDERS.md) is a target tree, not a move                                            |
| Authoring | [Getting Started](../v1/GETTING_STARTED.md), [MDAP stub](../v1/MDAP.md) | [Content](./CONTENT.md) · [Behavior](./BEHAVIOR.md) · [Surface](./SURFACE.md) · [Presentation](./PRESENTATION.md) |

v1 remains the **shipping contract** (hooks, `TableEntity`, URL keys, selection modes). v2 does not add a compile path, plugin SDK, or Excel host.

> [`TableCore_Architecture_Spec.md`](../../TableCore_Architecture_Spec.md) is still aspirational. v2 documents **composition plugins**, not an ECS pipeline.

## Read in this order

1. [Content](./CONTENT.md) — columns, filters, `getRowId`, cell registry
2. [Behavior](./BEHAVIOR.md) — fetcher, guard/gate, export ports, TableCore
3. [Surface](./SURFACE.md) — chrome flags, URL; not plugins
4. [Presentation](./PRESENTATION.md) — tokens, density, empty/loading/error slots
5. [Folders](./FOLDERS.md) — target `kernel/` / `plugins/` / `registry/` map; [HeroUI paint (target)](./PLUGINS.md#heroui-paint)
6. [Plugins](./PLUGINS.md) — catalog, ports, [compose `compiled.serverExport` / `compiled.import`](./PLUGINS.md#compose-with-compiled)
7. [Platform layers](./LAYERS.md) — infrastructure / application / domain / services (**not** the MDAP four)
8. [v1 README](../v1/README.md) — how-to and runtime API

## Three vocabularies

Do not collapse these into one folder map.

| Vocabulary          | Question                                 | Where                                       |
| ------------------- | ---------------------------------------- | ------------------------------------------- |
| **MDAP**            | How do I **author** the table?           | Content / Behavior / Surface / Presentation |
| **Folders**         | Where would this **file** live?          | [FOLDERS.md](./FOLDERS.md)                  |
| **Plugins**         | How does optional capability **attach**? | [PLUGINS.md](./PLUGINS.md)                  |
| **Platform layers** | **Who owns** this code?                  | [LAYERS.md](./LAYERS.md)                    |

## Names

Same word, different meaning. Do not mix these.

| If someone says              | They mean                                                                                                                                                 | Not                                                                |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **MDAP Presentation**        | `TableEntity.presentation` — striped, shadow, sticky ([PRESENTATION.md](./PRESENTATION.md))                                                               | `View` / `Header` / `Body` (`/ui`)                                 |
| **Kernel chrome / UI**       | `View`, `Header`, `Body`, FilterBar, Pagination — `kernel/ui`, v1 folder `/ui` ([FOLDERS.md](./FOLDERS.md))                                               | MDAP presentation                                                  |
| v1 README **Chrome (`/ui`)** | That kernel chrome                                                                                                                                        | MDAP presentation                                                  |
| **HeroUI `Table`**           | Target paint for `ZenithTable.View` — `import { Table } from "@heroui/react"` ([Plugins](./PLUGINS.md#heroui-paint)). Shipping is still `TablePrimitives` | A second engine, `TableCore.register("heroui")`, MDAP presentation |
| **Platform layers**          | infrastructure / application / domain / services ([LAYERS.md](./LAYERS.md))                                                                               | The MDAP four                                                      |

The kernel is always on. Plugins are opted in. Chrome flags (`pagination`, `toolbar`, `filterBar`) are **surface composition**, not plugins. The only wired `meta.features` flag is `urlSync`.
