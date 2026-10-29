import type { ReactNode } from "react";

import type { CellContext } from "@tanstack/react-table";

import type { TableColumnMeta } from "../types";

/**
 * Feature-layer cell renderer (form rule 2.2).
 * Register in the feature, reference by string on TableColumnMeta.renderer.
 * Do not put JSX `cell` trees on ColumnDef.
 */
export interface TableCellRenderContext<T = unknown> {
  value: unknown;
  row: T;
  column: TableColumnMeta;
  info: CellContext<T, unknown>;
}

export type TableCellRenderer<T = unknown> = (
  ctx: TableCellRenderContext<T>
) => ReactNode;

const renderers = new Map<string, TableCellRenderer<unknown>>();

export const tableCellRegistry = {
  register<T>(name: string, renderer: TableCellRenderer<T>): void {
    renderers.set(name, renderer as TableCellRenderer<unknown>);
  },

  get(name: string): TableCellRenderer<unknown> | undefined {
    return renderers.get(name);
  },

  has(name: string): boolean {
    return renderers.has(name);
  },

  unregister(name: string): boolean {
    return renderers.delete(name);
  },

  /** Test helper — not for product code. */
  clear(): void {
    renderers.clear();
  },

  names(): string[] {
    return [...renderers.keys()];
  },
};
