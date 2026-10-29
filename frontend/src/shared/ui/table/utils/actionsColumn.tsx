import type { ColumnDef } from "@tanstack/react-table";

import type { RowActionsSlotProps } from "../types";

/**
 * createActionsColumn
 *
 * Creates a pinned-right actions column for row-level actions.
 * The column renders the provided actions component in a sticky container.
 *
 * Usage:
 * ```ts
 * const columns = [
 *   ...yourColumns,
 *   createActionsColumn({ actions: MyRowActions }),
 * ];
 * ```
 */
export function createActionsColumn<T extends { id: string }>(options: {
  /** Actions component to render in each row */
  actions: React.ComponentType<RowActionsSlotProps>;
  /** Column width in pixels — default: 80 */
  width?: number;
  /** Custom header text — default: "" */
  header?: string;
}): ColumnDef<T> {
  return {
    id: "__actions__",
    size: options.width ?? 80,
    enableSorting: false,
    enableResizing: false,
    meta: {
      pinned: "right" as const,
    },
    header: () => options.header ?? "",
    cell: ({ row }) => {
      const ActionsComponent = options.actions;
      return (
        <div className="sticky right-0 z-10 flex items-center justify-end gap-1 bg-inherit">
          <ActionsComponent row={row} rowData={row.original} />
        </div>
      );
    },
  };
}
