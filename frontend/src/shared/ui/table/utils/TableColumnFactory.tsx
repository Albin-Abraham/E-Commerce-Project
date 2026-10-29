import React from "react";

import type { CellContext, ColumnDef } from "@tanstack/react-table";

import { tableCellRegistry } from "../mdap/tableCellRegistry";
import type { TableColumnMeta } from "../types";
import { InlineEditCell } from "../ui/components/InlineEditCell";
import { defaultCellRenderers } from "./CellRendererStrategy";

import { resolveTranslation } from "@ui/form/utils/i18n.utils";
import { computeSchemaHash } from "./hash";

const ALIGN_CLASS: Record<NonNullable<TableColumnMeta["align"]>, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

function wrapAlign(node: React.ReactNode, alignClass: string): React.ReactNode {
  return alignClass ? <div className={alignClass}>{node}</div> : node;
}

/** Inference contract when `renderer` is omitted. Explicit `renderer` always wins. */
const RENDERER_BY_FIELD_TYPE: Record<string, string> = {
  text: "text",
  email: "text",
  url: "text",
  password: "text",
  number: "text",
  integer: "text",
  float: "text",
  choice: "text",
  select: "text",
  radio: "text",
  boolean: "text",
  checkbox: "text",
  date: "date",
  datetime: "date",
};

export function inferRenderer(meta: TableColumnMeta): string {
  if (meta.renderer) return meta.renderer;
  const fieldType = meta.fieldSchema?.type;
  if (fieldType && RENDERER_BY_FIELD_TYPE[fieldType]) {
    return RENDERER_BY_FIELD_TYPE[fieldType];
  }
  return "text";
}

/**
 * TableColumnFactory (MDAP Column Compiler)
 *
 * Compiles server-driven TableColumnMeta (JSON) into TanStack ColumnDef objects.
 * This bridges the gap between MDAP server payload responses and the headless table engine,
 * allowing columns, widths, visibility, and renderers to be completely dynamic and driven by user preferences.
 * Includes LRU compilation caching and unknown renderer boundary fallbacks.
 */
export class TableColumnFactory {
  private static compilationCache = new Map<string, ColumnDef<any>[]>();
  private static MAX_CACHE_SIZE = 100;

  /**
   * Transforms an array of server column metadata into executable TanStack columns.
   * Utilizes memoized compilation cache to prevent redundant AST/column generation.
   */
  public static compile<T>(metaColumns: TableColumnMeta[]): ColumnDef<T>[] {
    if (!metaColumns || metaColumns.length === 0) return [];

    const cacheKey = computeSchemaHash(metaColumns);
    if (this.compilationCache.has(cacheKey)) {
      return this.compilationCache.get(cacheKey) as ColumnDef<T>[];
    }

    const compiled = metaColumns
      .filter((col) => !col.hidden)
      .map((col) => this.buildColumn<T>(col));

    if (this.compilationCache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.compilationCache.keys().next().value;
      if (firstKey) this.compilationCache.delete(firstKey);
    }
    this.compilationCache.set(cacheKey, compiled);

    return compiled;
  }

  /**
   * Clears the compilation cache. Useful during tests and hot reloading.
   */
  public static clearCache(): void {
    this.compilationCache.clear();
  }

  private static buildColumn<T>(meta: TableColumnMeta): ColumnDef<T> {
    return {
      id: meta.id,
      accessorKey: meta.id,
      header: () => resolveTranslation(meta.label),
      size: meta.width,
      enableSorting: meta.sortable ?? false,
      enableColumnFilter: meta.filterable ?? false,
      enablePinning: Boolean(meta.pinned),
      meta: {
        align: meta.align,
        pinned: meta.pinned,
        fieldSchema: meta.fieldSchema,
        filterable: meta.filterable,
      },
      cell: (info: CellContext<T, unknown>) => this.renderCell(meta, info),
    };
  }

  private static renderCell<T>(
    meta: TableColumnMeta,
    info: CellContext<T, unknown>
  ): React.ReactNode {
    const value = info.getValue();
    const alignClass = meta.align ? ALIGN_CLASS[meta.align] : "";

    // 1. Inline editing — only when explicitly opted-in via meta.editable.
    if (meta.editable && meta.fieldSchema) {
      const rowId = (info.row.original as { id?: string }).id ?? info.row.id;
      return (
        <div className={alignClass}>
          <InlineEditCell rowId={String(rowId)} colId={meta.id} value={value} />
        </div>
      );
    }

    const renderer = inferRenderer(meta);
    const custom = tableCellRegistry.get(renderer);
    if (custom) {
      return wrapAlign(
        custom({
          value,
          row: info.row.original as unknown,
          column: meta,
          info: info as CellContext<unknown, unknown>,
        }),
        alignClass
      );
    }

    // 2. Default renderer strategy
    const strategy = defaultCellRenderers[renderer];
    if (strategy) {
      const content = strategy(value, meta, info.row.original);
      return wrapAlign(content, alignClass);
    }

    // 3. Unknown renderer boundary fallback
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[TableColumnFactory] Unknown cell renderer "${renderer}" for column "${meta.id}". Falling back to text renderer.`
      );
    }

    const fallbackContent = defaultCellRenderers.text(
      value,
      meta,
      info.row.original
    );
    return wrapAlign(
      <span data-unknown-renderer={renderer}>{fallbackContent}</span>,
      alignClass
    );
  }
}

