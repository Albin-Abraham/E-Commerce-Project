import type { DataSource, TableMeta } from "../types";
import { TableColumnFactory } from "../utils/TableColumnFactory";
import { compileFiltersToFormDef } from "./compileFiltersToFormDef";
import type { CompiledTableDef, TableEntity } from "./table-entity";

/**
 * MDAP compiler — TableEntity → flattened runtime for useZenithTable.
 *
 * Content → TableColumnFactory.compile
 * Behavior.server / .client → DataSource
 * Behavior.export → CompiledTableDef.serverExport (not on DataSource)
 * Behavior.import → CompiledTableDef.import (not on DataSource)
 * Surface → chrome flags + URL meta + importSurface + compiled.chrome
 * Presentation → visual shortcuts
 * Content.filters → FormDefinition (FilterBar / popovers)
 */
export function compileEntityToTableDef<T>(
  entity: TableEntity<T>
): CompiledTableDef<T> {
  const content = entity.content;
  const behavior = entity.behavior;
  const surface = entity.surface;
  const presentation = entity.presentation;

  if (behavior?.client && behavior.server) {
    throw new Error(
      `[ZenithTable] TableEntity "${entity.id}" cannot set both behavior.client and behavior.server.`
    );
  }

  if (!behavior?.client && !behavior?.server) {
    throw new Error(
      `[ZenithTable] TableEntity "${entity.id}" needs behavior.client or behavior.server.`
    );
  }

  const source: DataSource<T> = behavior.server
    ? {
        type: "server",
        fetcher: behavior.server.fetcher,
        guard: behavior.server.guard,
        gate: behavior.server.gate,
      }
    : { type: "client", data: behavior.client!.data };

  const paginationMeta =
    typeof surface?.pagination === "object" ? surface.pagination : undefined;

  const meta: TableMeta = {
    id: entity.id,
    columns: content.columns,
    url: surface?.url,
    features: surface?.features,
    pagination: paginationMeta,
    striped: presentation?.striped,
    bordered: presentation?.bordered,
    shadow: presentation?.shadow,
    stickyHeader: presentation?.stickyHeader,
    compact: presentation?.compact,
  };

  const filterForm =
    content.filters && content.filters.length > 0
      ? compileFiltersToFormDef(entity.id, content.filters)
      : undefined;

  return {
    meta,
    columns: TableColumnFactory.compile<T>(content.columns),
    source,
    totalCount: behavior.client?.totalCount,
    getRowId: content.getRowId,
    pagination:
      surface?.pagination === true || typeof surface?.pagination === "object",
    toolbar: surface?.toolbar,
    filterBar: surface?.filterBar ?? Boolean(filterForm),
    selectionActionBar: surface?.selectionActionBar,
    className: presentation?.className,
    striped: presentation?.striped,
    bordered: presentation?.bordered,
    shadow: presentation?.shadow,
    stickyHeader: presentation?.stickyHeader,
    filterForm,
    serverExport: behavior.export,
    import: behavior.import,
    importSurface: surface?.import,
    chrome: {
      exportBtn: surface?.exportBtn ?? Boolean(behavior.export),
      importBtn: surface?.importBtn ?? Boolean(behavior.import),
      deleteBtn: surface?.deleteBtn ?? false,
      filterStatusBadge: surface?.filterStatusBadge ?? Boolean(filterForm),
    },
  };
}
