import { Fragment, useCallback, useLayoutEffect } from "react";

import { cn } from "@core/libs/utils";
import type { Row } from "@tanstack/react-table";

import { useTableDOM } from "@ui/table/core/TableDOMContext";
import { useTableContext } from "@ui/table/core/TableEngineContext";
import { useFeature } from "@ui/table/core/TableFeaturesContext";
import { useTableFetch } from "@ui/table/core/TableFetchContext";
import { useTableMeta } from "@ui/table/core/TableMetaContext";
import { useTablePhysics } from "@ui/table/core/TablePhysicsContext";
import { useTableView } from "@ui/table/core/TableViewContext";
import type { KeyboardNavigationApi } from "@ui/table/features/keyboardNavigation";
import { useGridKeyboardNavigation } from "@ui/table/hooks/useGridKeyboardNavigation";
import { useTableVirtualizer } from "@ui/table/hooks/useTableVirtualizer";
import type { RowContext } from "@ui/table/types";
import { TableAtomicCell } from "../TableAtomicCell";
import { TBody, TD, TR } from "../TablePrimitives";
import { DefaultErrorState } from "../states/DefaultErrorState";
import { EmptyBody } from "./EmptyBody";
import { SkeletonRows } from "./SkeletonRows";

export interface ZenithTableBodyProps extends Omit<
  React.HTMLAttributes<HTMLTableSectionElement>,
  "onClick"
> {
  onRowClick?: (rowId: string) => void;
  virtualized?: boolean;
  estimateRowHeight?: number;
  /** Show skeleton loading rows when data is loading and empty. Defaults to fetch context. */
  loading?: boolean;
  /** Number of skeleton rows to show during loading */
  loadingRows?: number;
  /** Fetch error. Defaults to fetch context. */
  error?: Error | null;
  /** Show global row index column (page offset + local index + 1) */
  showIndex?: boolean;
  renderRow?: (props: {
    row: Row<unknown>;
    index: number;
    cells: React.ReactNode[];
    isSelected: boolean;
    isHovered: boolean;
  }) => React.ReactNode;
  renderExpandedRow?: (props: { context: RowContext<unknown> }) => React.ReactNode;
  getRowProps?: (
    row: Row<unknown>,
    index: number
  ) => React.HTMLAttributes<HTMLTableRowElement>;
}

export function ZenithTableBody({
  onRowClick,
  className,
  virtualized,
  estimateRowHeight,
  loading: loadingProp,
  loadingRows = 5,
  error: errorProp,
  showIndex,
  renderRow,
  renderExpandedRow,
  getRowProps,
  ...rest
}: ZenithTableBodyProps = {}) {
  const { engine } = useTableContext<unknown>();
  const { bodyRef, scrollerRef, containerRef } = useTableDOM();
  const meta = useTableMeta();
  const fetch = useTableFetch();
  const setHover = useTablePhysics((state) => state.setHover);
  const activeView = useTableView().activeView;
  const { setShowIndex } = useTableView();

  const expandedRowIds = useTablePhysics((s) => s.expandedRowIds);
  const lockedRowIds = useTablePhysics((s) => s.lockedRowIds);
  const toggleRowExpansion = useTablePhysics((s) => s.toggleRowExpansion);
  const setRowLock = useTablePhysics((s) => s.setRowLock);

  const loading = loadingProp ?? fetch.loading;
  const error = errorProp !== undefined ? errorProp : fetch.error;

  useLayoutEffect(() => {
    setShowIndex(Boolean(showIndex ?? meta.showIndex));
    return () => setShowIndex(false);
  }, [showIndex, meta.showIndex, setShowIndex]);

  const rows = engine.getRowModel().rows;
  const visibleColumns = engine.getAllColumns().filter((col) =>
    typeof col.getIsVisible === "function" ? col.getIsVisible() : true
  );
  const totalColumns = visibleColumns.length;
  const hasIndexCol = Boolean(showIndex || meta.showIndex);
  const colSpan = (totalColumns || 1) + (hasIndexCol ? 1 : 0);

  // Global row index offset (for paginated tables: (pageIndex * pageSize) + localIndex + 1)
  const pageIndex = engine.getState().pagination?.pageIndex ?? 0;
  const pageSize = engine.getState().pagination?.pageSize ?? rows.length;
  const indexOffset = pageIndex * pageSize;

  const virtualizer = useTableVirtualizer(
    virtualized ? rows.length : 0,
    estimateRowHeight
  );

  const { handleKeyDown, focusCell, getCachedRows } = useGridKeyboardNavigation({
    gridRef: scrollerRef as React.RefObject<HTMLDivElement | null>,
    getRowCount: () => rows.length,
    getColCount: (rowIndex: number) => {
      const row = rows[rowIndex];
      return row ? row.getVisibleCells().length : 0;
    },
    scope: `table:${meta.id}`,
  });

  const keyboardNavApi = useFeature<KeyboardNavigationApi>("keyboardNavigation");
  useLayoutEffect(() => {
    keyboardNavApi?._registerNavigator({ focusCell, getCachedRows });
  }, [keyboardNavApi, focusCell, getCachedRows]);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLTableSectionElement>) => {
      const row = (e.target as HTMLElement).closest("[data-table-row]");
      setHover(row?.getAttribute("data-table-row") ?? null);
    },
    [setHover]
  );

  const handleMouseLeave = useCallback(() => setHover(null), [setHover]);

  const hoveredRowId = useTablePhysics((s) => s.hoveredRowId);
  const selectedRows = useTablePhysics((s) => s.selectedRows);
  const excludedRows = useTablePhysics((s) => s.excludedRows);
  const selectionMode = useTablePhysics((s) => s.selectionMode);

  const isRowSelected = (rowId: string) =>
    selectionMode === "ALL"
      ? !excludedRows.has(rowId)
      : selectedRows.has(rowId);

  const expansionConfig = meta.expansion as
    | import("../../types").RowExpansionConfig<any>
    | undefined;
  const activeRenderExpanded = renderExpandedRow ?? expansionConfig?.render;

  const buildRowContext = (row: Row<unknown>, index: number): RowContext<unknown> => {
    const isExpanded = expandedRowIds.has(row.id);
    const isLocked = lockedRowIds.has(row.id);
    const isSelected = isRowSelected(row.id);

    return {
      data: row.original,
      id: row.id,
      index,
      selected: isSelected,
      expanded: isExpanded,
      locked: isLocked,
      row,
      table: {
        activeView,
        meta,
      },
      expansion: {
        isExpanded,
        toggle: () => toggleRowExpansion(row.id, expansionConfig?.mode ?? "exclusive"),
        close: () => toggleRowExpansion(row.id, "exclusive"),
      },
      actions: {
        lock: () => setRowLock(row.id, true),
        unlock: () => setRowLock(row.id, false),
      },
    };
  };

  const renderCells = (row: Row<unknown>, localIndex: number) => {
    const indexCell = (showIndex || meta.showIndex) ? (
      <TD
        key="__index"
        align="center"
        className="text-xs text-muted-foreground tabular-nums w-14 min-w-[56px] text-center font-mono whitespace-nowrap px-2"
      >
        {indexOffset + localIndex + 1}
      </TD>
    ) : null;

    return [
      indexCell,
      ...row
        .getVisibleCells()
        .map((cell) => (
          <TableAtomicCell
            key={cell.id}
            rowId={row.id}
            colId={cell.column.id}
            cell={cell}
          />
        )),
    ].filter(Boolean);
  };

  const handleRowClick = useCallback(
    (rowId: string, e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("button, a, [role=button], input, select, textarea"))
        return;
      onRowClick?.(rowId);
    },
    [onRowClick]
  );

  // Loading state — show skeletons when loading and no data
  if (loading && rows.length === 0) {
    const LoadingComponent = meta.ui?.loading;
    return (
      <TBody ref={bodyRef} className={className} {...rest}>
        {LoadingComponent ? (
          <LoadingComponent rows={loadingRows} columns={colSpan} />
        ) : (
          <SkeletonRows count={loadingRows} colSpan={colSpan} />
        )}
      </TBody>
    );
  }

  if (error && rows.length === 0) {
    const ErrorComponent = meta.ui?.error ?? DefaultErrorState;
    return (
      <TBody ref={bodyRef} className={className} {...rest}>
        <tr>
          <td colSpan={colSpan}>
            <ErrorComponent error={error} retry={fetch.refetch} />
          </td>
        </tr>
      </TBody>
    );
  }

  // Empty state
  if (rows.length === 0) {
    return <EmptyBody colSpan={colSpan} className={className} />;
  }

  const renderRowItem = (row: Row<unknown>, index: number) => {
    const isSelected = isRowSelected(row.id);
    const isHovered = hoveredRowId === row.id;
    const isExpanded = expandedRowIds.has(row.id);
    const isLocked = lockedRowIds.has(row.id);
    const isOdd = index % 2 === 1;

    const rowContext = buildRowContext(row, index);
    const customProps = getRowProps?.(row, index) ?? {};
    const cells = renderCells(row, index);

    if (renderRow) {
      return (
        <Fragment key={row.id}>
          {renderRow({ row, index, cells, isSelected, isHovered })}
        </Fragment>
      );
    }

    return (
      <Fragment key={row.id}>
        <TR
          data-table-row={row.id}
          data-id={row.id}
          data-state={isSelected ? "selected" : "unselected"}
          data-testid={`table-row-${row.id}`}
          aria-rowindex={index + 1}
          className={cn(
            "zenith-table-row group transition-all duration-200 hover:bg-primary/[0.035]",
            isOdd && meta.striped && "bg-muted/15",
            isSelected && "bg-primary/10 border-primary/30",
            isExpanded && "bg-accent/10 border-l-2 border-l-primary",
            isLocked && "opacity-60 bg-muted/30 pointer-events-none",
            onRowClick && "cursor-pointer",
            customProps.className
          )}
          onClick={(e) => {
            customProps.onClick?.(e);
            handleRowClick(row.id, e);
          }}
          {...customProps}
        >
          {cells}
        </TR>

        {isExpanded && activeRenderExpanded && (
          <TR
            key={`${row.id}-expanded-panel`}
            data-expanded-action-row={row.id}
            className={cn(
              "zenith-expanded-row transition-all duration-300",
              isOdd && meta.striped ? "bg-muted/15" : "bg-background"
            )}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                rowContext.expansion.close();
                containerRef.current
                  ?.querySelector<HTMLElement>(`[data-table-row="${row.id}"]`)
                  ?.focus();
              }
            }}
          >
            <TD
              colSpan={colSpan}
              className="p-0 border-b border-border/40 sticky left-0 z-10"
            >
              <div className="p-4 bg-surface-raised/50 shadow-inner border-l-4 border-l-primary/60 animate-in fade-in slide-in-from-top-2 duration-200">
                {activeRenderExpanded({ context: rowContext })}
              </div>
            </TD>
          </TR>
        )}
      </Fragment>
    );
  };

  if (virtualized) {
    const virtualItems = virtualizer.getVirtualItems();
    return (
      <TBody
        ref={bodyRef}
        className={className}
        onMouseOver={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onKeyDown={handleKeyDown}
        style={{ position: "relative" }}
        {...rest}
      >
        {virtualItems.length > 0 && virtualItems[0].start > 0 && (
          <TR aria-hidden style={{ height: `${virtualItems[0].start}px` }}>
            {null}
          </TR>
        )}
        {virtualItems.map((virtualRow) => {
          const row = rows[virtualRow.index];
          if (!row) return null;
          return (
            <div key={row.id} ref={virtualizer.measureElement} data-index={virtualRow.index}>
              {renderRowItem(row, virtualRow.index)}
            </div>
          );
        })}
        {virtualItems.length > 0 &&
          virtualItems[virtualItems.length - 1].end <
            virtualizer.getTotalSize() && (
            <TR
              aria-hidden
              style={{
                height: `${virtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end}px`,
              }}
            >
              {null}
            </TR>
          )}
      </TBody>
    );
  }

  return (
    <TBody
      ref={bodyRef}
      className={className}
      onMouseOver={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      {...rest}
    >
      {rows.map((row, index) => renderRowItem(row, index))}
    </TBody>
  );
}
