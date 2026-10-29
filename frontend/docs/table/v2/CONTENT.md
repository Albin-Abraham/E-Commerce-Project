# MDAP — Content

What a row **is**. Author on `TableEntity.content`. Compiler: `TableColumnFactory.compile` + `filterForm`. How-to: [v1 MDAP](../v1/MDAP.md), [v1 Getting Started](../v1/GETTING_STARTED.md). Cells attach via the [registry](./FOLDERS.md#registry).

## Owns

| Field      | Role                                                                                                               |
| ---------- | ------------------------------------------------------------------------------------------------------------------ |
| `columns`  | `TableColumnMeta[]` — id, label, sortable, filterable, pinned, width, align, `renderer`, `fieldSchema`, `editable` |
| `filters`  | MDAP `FormFieldSchema[]` — FilterBar / popovers. `name: "search"` writes `globalFilter`                            |
| `getRowId` | Stable id across server pages. Default is row index (breaks PAGE/ALL)                                              |

Pinned is **content** (compile-time column meta). Runtime `setColumnPinning` is a no-op.

## Do not put here

| Don't                        | Belongs                                   |
| ---------------------------- | ----------------------------------------- |
| `fetcher` / `guard` / `gate` | [Behavior](./BEHAVIOR.md)                 |
| `pagination: true`           | [Surface](./SURFACE.md)                   |
| `striped` / `shadow`         | [Presentation](./PRESENTATION.md)         |
| JSX `cell: () => <Avatar />` | `tableCellRegistry.register("feature-…")` |

## Renderer strings

Built-in: `text`, `badge`, `avatar`, `currency`, `date` (`TableColumnFactory`). Unknown strings look up `tableCellRegistry`, then fall back to text.

```ts
tableCellRegistry.register("feature-employee-avatar", EmployeeAvatarCell);
// content.columns: { id: "employee", renderer: "feature-employee-avatar" }
```

Register in the **feature**, not in `shared/ui/table`. Target slot: `registry/cells` — [Folders](./FOLDERS.md).

## Compiler output

`columns: ColumnDef<T>[]` plus optional `filterForm: FormDefinition`. That object is **runtime** (`CompiledTableDef`). Do not author it by hand ([v1 rule 1.6](../v1/RULES_AND_ANTI_PATTERNS.md)).
