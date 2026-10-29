import type { ReactNode } from "react";

import { cn } from "@core/libs/utils";
import { useTableEngine } from "@ui/table/core/TableEngineContext";
import { useTablePhysics } from "@ui/table/core/TablePhysicsContext";
import type { TableColumnMeta } from "@ui/table/types";
import { getStickyStyles } from "@ui/table/utils/getStickyStyles";

export type AggregationType = "sum" | "avg" | "min" | "max" | "count" | ((values: any[], rows: any[]) => ReactNode);

export interface ZenithTableFooterProps {
  /** Map of columnId to aggregation operation */
  aggregates?: Record<string, AggregationType>;
  /** Custom label for the first non-aggregated column (defaults to "Total / Summary") */
  summaryLabel?: string;
  className?: string;
}

/**
 * ZenithTableFooter
 *
 * Sticky bottom aggregation footer computing instant totals, averages,
 * counts, and custom mathematical summaries across visible rows.
 */
export function ZenithTableFooter({
  aggregates = {},
  summaryLabel = "Summary",
  className,
}: ZenithTableFooterProps) {
  const engine = useTableEngine<any>();
  const totalCount = useTablePhysics((s) => s.totalDataCount);

  const columns =
    typeof engine.getVisibleLeafColumns === "function"
      ? engine.getVisibleLeafColumns()
      : (engine.getAllColumns?.() ?? []).filter((col) =>
          typeof col.getIsVisible === "function" ? col.getIsVisible() : true
        );
  const rows = engine.getRowModel().rows;
  const rawRows = rows.map((r) => r.original);

  if (Object.keys(aggregates).length === 0) {
    return null;
  }

  return (
    <tfoot
      data-testid="zenith-table-footer"
      className={cn(
        "sticky bottom-0 z-20 bg-card/95 backdrop-blur-md border-t-2 border-border/80 shadow-md font-medium text-xs",
        className
      )}
    >
      <tr>
        {columns.map((column, index) => {
          const colId = column.id;
          const colMeta = (column.columnDef.meta || {}) as TableColumnMeta;
          const align = colMeta.align ?? (colMeta.variant === "numeric" ? "right" : "left");
          const stickyStyles =
            typeof column.getIsPinned === "function"
              ? getStickyStyles(column as any, "cell")
              : {};
          const aggType = aggregates[colId];

          let content: React.ReactNode = null;

          if (index === 0 && !aggType) {
            const countDisplay = (totalCount ?? rows.length).toLocaleString();
            content = (
              <span className="font-black text-muted-foreground uppercase tracking-wider text-[10px]">
                {summaryLabel} ({rows.length.toLocaleString()} of {countDisplay})
              </span>
            );
          } else if (typeof aggType === "function") {
            const values = rawRows.map((r) => r[colId]);
            content = aggType(values, rawRows);
          } else if (aggType) {
            const numValues = rawRows
              .map((r) => Number(r[colId]))
              .filter((n) => !isNaN(n));

            switch (aggType) {
              case "sum": {
                const sum = numValues.reduce((acc, curr) => acc + curr, 0);
                content = (
                  <span className="font-mono font-bold text-foreground">
                    {sum.toLocaleString()}
                  </span>
                );
                break;
              }
              case "avg": {
                const avg = numValues.length
                  ? numValues.reduce((acc, curr) => acc + curr, 0) / numValues.length
                  : 0;
                content = (
                  <span className="font-mono font-bold text-foreground">
                    {avg.toFixed(1)}
                  </span>
                );
                break;
              }
              case "min": {
                const min = numValues.length ? Math.min(...numValues) : 0;
                content = (
                  <span className="font-mono font-bold text-foreground">
                    {min.toLocaleString()}
                  </span>
                );
                break;
              }
              case "max": {
                const max = numValues.length ? Math.max(...numValues) : 0;
                content = (
                  <span className="font-mono font-bold text-foreground">
                    {max.toLocaleString()}
                  </span>
                );
                break;
              }
              case "count": {
                content = (
                  <span className="font-mono font-bold text-foreground">
                    {rawRows.length} items
                  </span>
                );
                break;
              }
            }
          }

          return (
            <td
              key={colId}
              style={stickyStyles}
              className={cn(
                "px-4 py-3 border-r border-border/20 last:border-r-0",
                align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
              )}
            >
              {content}
            </td>
          );
        })}
      </tr>
    </tfoot>
  );
}

export default ZenithTableFooter;
