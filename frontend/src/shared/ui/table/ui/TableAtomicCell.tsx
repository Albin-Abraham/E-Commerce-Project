import React, { forwardRef, memo, useState } from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@core/libs/utils";
import { flexRender } from "@tanstack/react-table";
import type { Cell, Column, Row } from "@tanstack/react-table";
import { useTableMeta } from "@ui/table/core/TableMetaContext";
import { useTableCellAtom } from "@ui/table/core/TablePhysicsContext";
import type {
  CellBorder,
  CellIntent,
  TableColumnMeta,
} from "@ui/table/types";

import { getStickyStyles } from "../utils/getStickyStyles";
import { TD } from "./TablePrimitives";

export interface TableAtomicCellProps {
  rowId: string;
  colId: string;
  cell: Cell<unknown, unknown>;
  className?: string;
  onClick?: () => void;
  renderCell?: (props: {
    value: unknown;
    row: Row<unknown>;
    column: Column<unknown, unknown>;
    cell: Cell<unknown, unknown>;
    isSelected: boolean;
    isHovered: boolean;
  }) => React.ReactNode;
}

const INTENT_BADGE_CLASSES: Record<CellIntent, string> = {
  neutral: "bg-muted text-muted-foreground border-border/40",
  primary: "bg-primary/10 text-primary border-primary/20",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  danger: "bg-destructive/10 text-destructive border-destructive/20",
  info: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20",
};

const INTENT_DOT_CLASSES: Record<CellIntent, string> = {
  neutral: "bg-muted-foreground",
  primary: "bg-primary",
  success: "bg-emerald-500 shadow-sm shadow-emerald-500/50",
  warning: "bg-amber-500 shadow-sm shadow-amber-500/50",
  danger: "bg-destructive shadow-sm shadow-destructive/50",
  info: "bg-sky-500 shadow-sm shadow-sky-500/50",
};

const BORDER_CLASSES: Record<CellBorder, string> = {
  none: "",
  right: "border-r border-border/40",
  left: "border-l border-border/40",
  both: "border-x border-border/40",
  prominent: "border-r-2 border-border/80 shadow-[1px_0_0_0_var(--color-border-strong)]",
  dashed: "border-r border-dashed border-border/60",
  "sticky-edge": "shadow-[inset_-2px_0_0_0_var(--color-primary)]",
};

function CopyableValue({ value }: { value: unknown }) {
  const [copied, setCopied] = useState(false);
  const textValue = String(value ?? "");

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(textValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="inline-flex items-center gap-1.5 group/copy">
      <span>{textValue}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="opacity-0 group-hover/copy:opacity-100 p-1 rounded hover:bg-muted/60 transition-opacity text-muted-foreground hover:text-foreground"
        title="Copy to clipboard"
      >
        {copied ? (
          <Check size={12} className="text-emerald-500" />
        ) : (
          <Copy size={12} />
        )}
      </button>
    </div>
  );
}

export const TableAtomicCell = memo(
  forwardRef<HTMLTableCellElement, TableAtomicCellProps>(
    ({ rowId, colId, cell, className, onClick, renderCell }, ref) => {
      const { isSelected, isHovered } = useTableCellAtom(rowId);
      const meta = useTableMeta();
      const stickyStyles = getStickyStyles(cell.column, "cell");

      const columnMeta = (cell.column.columnDef.meta || {}) as TableColumnMeta;
      const align = columnMeta.align ?? (columnMeta.variant === "numeric" ? "right" : "left");
      const border = columnMeta.border ?? "none";
      const borderClass = BORDER_CLASSES[border] || "";

      // Determine which renderer to use (prop > slot > custom variant > tanstack default)
      const CellSlot = meta.ui?.cell;
      const cellProps = {
        value: cell.getValue(),
        row: cell.row,
        column: cell.column,
        cell,
        isSelected,
        isHovered,
      };

      let content: React.ReactNode;
      if (renderCell) {
        content = renderCell(cellProps);
      } else if (CellSlot) {
        content = <CellSlot {...(cellProps as any)} />;
      } else if (cell.column.columnDef.cell) {
        content = flexRender(cell.column.columnDef.cell, cell.getContext());
      } else if (columnMeta.variant) {
        // Built-in Atomic Cell Archetypes
        const val = cell.getValue();
        const rawRow = cell.row.original;

        switch (columnMeta.variant) {
          case "numeric": {
            const numVal = typeof val === "number" ? val : Number(val);
            if (isNaN(numVal)) {
              content = <span className="text-muted-foreground font-mono">—</span>;
            } else {
              const fmt = columnMeta.numericFormat?.format;
              let formatted: string;
              if (fmt === "compact") {
                formatted = new Intl.NumberFormat("en-US", {
                  notation: "compact",
                  maximumFractionDigits: columnMeta.numericFormat?.decimals ?? 1,
                }).format(numVal);
              } else if (fmt === "currency") {
                formatted = new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: columnMeta.numericFormat?.currency ?? "USD",
                }).format(numVal);
              } else if (fmt === "percent") {
                formatted = `${(numVal * (numVal > 1 ? 1 : 100)).toFixed(
                  columnMeta.numericFormat?.decimals ?? 1
                )}%`;
              } else {
                formatted = numVal.toLocaleString();
              }
              content = <span className="font-mono tabular-nums font-semibold">{formatted}</span>;
            }
            break;
          }

          case "badge": {
            const key = String(val ?? "");
            const badgeCfg = columnMeta.badgeMap?.[key];
            const intent = badgeCfg?.intent ?? (typeof columnMeta.intent === "function" ? columnMeta.intent(val, rawRow) : columnMeta.intent) ?? "neutral";
            const label = badgeCfg?.label ?? key;
            content = (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                  INTENT_BADGE_CLASSES[intent]
                )}
              >
                {badgeCfg?.icon}
                <span>{label}</span>
              </span>
            );
            break;
          }

          case "status-dot": {
            const key = String(val ?? "");
            const badgeCfg = columnMeta.badgeMap?.[key];
            const intent = badgeCfg?.intent ?? (typeof columnMeta.intent === "function" ? columnMeta.intent(val, rawRow) : columnMeta.intent) ?? "neutral";
            const label = badgeCfg?.label ?? key;
            content = (
              <div className="inline-flex items-center gap-2">
                <span className={cn("w-2 h-2 rounded-full", INTENT_DOT_CLASSES[intent])} />
                <span className="font-medium text-xs text-foreground">{label}</span>
              </div>
            );
            break;
          }

          case "code": {
            content = (
              <span className="px-2 py-0.5 bg-muted/60 dark:bg-muted/30 border border-border/40 rounded font-mono text-xs text-foreground">
                {columnMeta.copyable ? <CopyableValue value={val} /> : String(val ?? "")}
              </span>
            );
            break;
          }

          case "copyable": {
            content = <CopyableValue value={val} />;
            break;
          }

          case "identity": {
            const title = String(val ?? "");
            const subtitle = typeof columnMeta.subtitle === "function" ? columnMeta.subtitle(rawRow) : columnMeta.subtitle;
            const icon = typeof columnMeta.icon === "function" ? columnMeta.icon(rawRow) : columnMeta.icon;
            content = (
              <div className="flex items-center gap-2.5 py-0.5">
                {icon && <div className="text-primary shrink-0">{icon}</div>}
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-foreground text-xs truncate">{title}</span>
                  {subtitle && <span className="text-[10px] text-muted-foreground truncate">{subtitle}</span>}
                </div>
              </div>
            );
            break;
          }

          default:
            content = <span>{String(val ?? "")}</span>;
        }
      } else {
        content = <span>{String(cell.getValue() ?? "")}</span>;
      }

      return (
        <TD
          ref={ref}
          align={align}
          style={stickyStyles}
          data-table-cell={colId}
          data-label={String(cell.column.columnDef.header ?? colId)}
          aria-colindex={cell.column.getIndex() + 1}
          className={cn(
            "zenith-table-cell transition-all duration-[var(--motion-medium)]",
            borderClass,
            isSelected && "zenith-table-cell--selected bg-primary/10",
            isHovered &&
              !isSelected &&
              "zenith-table-cell--hovered bg-primary/5",
            cell.column.getIsPinned() &&
              "zenith-table-cell--pinned shadow-[inset_-1px_0_0_0_var(--color-border-soft)] border-r border-border/5",
            className
          )}
          onClick={onClick}
        >
          {content}
        </TD>
      );
    }
  )
);

TableAtomicCell.displayName = "TableAtomicCell";
