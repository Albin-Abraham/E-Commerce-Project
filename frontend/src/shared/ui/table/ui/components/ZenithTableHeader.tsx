import { flexRender } from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@core/libs/utils";

import { useTableDOM } from "@ui/table/core/TableDOMContext";
import { useTableContext } from "@ui/table/core/TableEngineContext";
import { useTableMeta } from "@ui/table/core/TableMetaContext";
import { useTableView } from "@ui/table/core/TableViewContext";
import { resolveTranslation } from "@ui/form/utils/i18n.utils";
import { getStickyStyles } from "@ui/table/utils/getStickyStyles";
import { TH, THead, TR } from "../TablePrimitives";
import { ColumnFilterPopover } from "./ColumnFilterPopover";

export function ZenithTableHeader() {
  const { engine } = useTableContext<unknown>();
  const { headerRef } = useTableDOM();
  const meta = useTableMeta();
  const { showIndex: viewShowIndex } = useTableView();

  const showIndex = Boolean(meta.showIndex || viewShowIndex);
  const showSortIcon = meta.showSortIcon !== false;
  const enableHeaderFilter = meta.enableHeaderFilter !== false;

  return (
    <THead ref={headerRef} sticky={meta.stickyHeader}>
      {engine.getHeaderGroups().map((headerGroup) => (
        <TR key={headerGroup.id}>
          {showIndex && (
            <TH
              key="__index"
              align="center"
              data-table-col="__index"
              data-testid="table-col-index"
              className="text-xs text-muted-foreground tabular-nums w-14 min-w-[56px] text-center font-mono whitespace-nowrap px-2"
            >
              {resolveTranslation(meta.indexLabel as any, "common/base") || "#"}
            </TH>
          )}
          {headerGroup.headers.map((header) => {
            const isSorted = header.column.getIsSorted();
            const canSort = header.column.getCanSort();
            const isPinned = header.column.getIsPinned();

            const stickyStyles = getStickyStyles(header.column, "header");
            const columnMeta = header.column.columnDef.meta as { align?: "left" | "center" | "right" } | undefined;
            const align = columnMeta?.align ?? "left";

            const ariaSort =
              isSorted === "asc"
                ? "ascending"
                : isSorted === "desc"
                  ? "descending"
                  : "none";

            return (
              <TH
                key={header.id}
                align={align}
                style={stickyStyles}
                aria-sort={ariaSort}
                data-table-col={header.id}
                data-testid={`table-col-${header.id}`}
                tabIndex={header.isPlaceholder ? -1 : 0}
                className={`
                  ${canSort ? "cursor-pointer select-none group" : ""}
                  ${
                    isPinned
                      ? "z-20 shadow-[inset_-1px_0_0_0_var(--color-border-soft,var(--border))] border-r border-border/10"
                      : ""
                  }
                  transition-all duration-[var(--motion-medium)]
                `}
                onClick={header.column.getToggleSortingHandler()}
                onKeyDown={(e) => {
                  if (canSort && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    header.column.getToggleSortingHandler()?.(e);
                  }
                }}
              >
                <div className="flex items-center justify-between gap-2 w-full h-full">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate font-bold">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </span>
                    {canSort && showSortIcon && (
                      <span className="shrink-0">
                        {isSorted === "asc" && (
                          <ChevronUp className="w-3.5 h-3.5 text-primary" />
                        )}
                        {isSorted === "desc" && (
                          <ChevronDown className="w-3.5 h-3.5 text-primary" />
                        )}
                        {!isSorted && (
                          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-center shrink-0">
                    {enableHeaderFilter &&
                      typeof header.column.getCanFilter === "function" &&
                      header.column.getCanFilter() && (
                        <ColumnFilterPopover columnId={header.id} />
                      )}
                  </div>

                  {header.column.getCanResize() && (
                    <div
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className={cn(
                        "group/resizer absolute right-0 top-0 h-full w-2.5 cursor-col-resize select-none touch-none z-30 flex items-center justify-center",
                        header.column.getIsResizing() && "is-resizing"
                      )}
                    >
                      {/* Glowing Vertical Line */}
                      <div
                        className={cn(
                          "h-full w-1 transition-all duration-150 rounded-full",
                          header.column.getIsResizing()
                            ? "bg-primary w-1 shadow-[0_0_10px_rgba(59,130,246,0.8)]"
                            : "bg-transparent group-hover/resizer:bg-primary/50 group-hover/resizer:shadow-[0_0_6px_rgba(59,130,246,0.5)]"
                        )}
                      />
                      {/* Grip Handle Pill */}
                      <div
                        className={cn(
                          "absolute right-[-1px] top-1/2 -translate-y-1/2 w-2 h-4 rounded-full bg-primary/80 transition-all duration-150 flex items-center justify-center opacity-0 group-hover/resizer:opacity-100 shadow-md",
                          header.column.getIsResizing() && "opacity-100 bg-primary scale-110 shadow-lg"
                        )}
                      >
                        <div className="w-0.5 h-2 bg-white/80 rounded-full" />
                      </div>
                    </div>
                  )}
                </div>
              </TH>
            );
          })}
        </TR>
      ))}
    </THead>
  );
}
