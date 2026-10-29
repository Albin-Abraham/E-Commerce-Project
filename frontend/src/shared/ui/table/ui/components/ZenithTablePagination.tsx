import React, { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@core/libs/utils";
import { resolveTranslation } from "@ui/form/utils/i18n.utils";
import { useTableDOM } from "@ui/table/core/TableDOMContext";
import { useTableContext } from "@ui/table/core/TableEngineContext";
import { useTableLayout } from "@ui/table/core/TableLayoutContext";
import { useTableMeta } from "@ui/table/core/TableMetaContext";
import { useTablePhysics } from "@ui/table/core/TablePhysicsContext";
import type { PaginationContext } from "@ui/table/types";
import type {
  PaginationAlign,
  PaginationPosition,
} from "@ui/table/types/layout";
import { getPageNumbers } from "@ui/table/utils/PaginationHelpers";
import { derivePageSizeOptions } from "@ui/table/utils/derivePageSizeOptions";
import { resolvePaginationLabel } from "@ui/table/utils/resolvePaginationLabel";

export interface ZenithTablePaginationProps {
  className?: string;
  align?: PaginationAlign;
  position?: PaginationPosition;
  variant?: "full" | "compact" | "minimal" | "none";
}

export function ZenithTablePagination({
  className,
  align: propAlign,
  variant: propVariant,
}: ZenithTablePaginationProps) {
  const { engine } = useTableContext<unknown>();
  const { paginationRef } = useTableDOM();
  const meta = useTableMeta();
  const layout = useTableLayout();
  const { t } = useTranslation("common/base");
  const selectedRows = useTablePhysics((s) => s.selectedRows);
  const excludedRows = useTablePhysics((s) => s.excludedRows);
  const selectionMode = useTablePhysics((s) => s.selectionMode);
  const totalDataCount = useTablePhysics((s) => s.totalDataCount);
  const totalCountSynced = useTablePhysics((s) => s.totalCountSynced);

  const { pagination: paginationMeta } = meta;
  const align = propAlign ?? layout.pagination?.align ?? "between";
  const variant =
    propVariant ??
    layout.pagination?.variant ??
    paginationMeta.variant ??
    "full";

  // Disabled pagination or variant="none"
  if (paginationMeta.enabled === false || variant === "none") {
    return null;
  }

  const labels = paginationMeta.labels ?? {};

  const pageIndex = engine.getState().pagination.pageIndex;
  const pageSize = engine.getState().pagination.pageSize;
  const pageRowCount = engine.getPrePaginationRowModel().rows.length;
  const totalRows = totalCountSynced ? totalDataCount : pageRowCount;
  const totalPages = engine.getPageCount();
  const currentPage = pageIndex + 1;
  const selectedCount =
    selectionMode === "ALL"
      ? Math.max(0, totalRows - excludedRows.size)
      : selectedRows.size;

  const from = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
  const to = totalRows === 0 ? 0 : Math.min(from + pageRowCount - 1, totalRows);

  const ctx: PaginationContext = useMemo(
    () => ({
      from,
      to,
      total: totalRows,
      page: currentPage,
      totalPages,
      pageSize,
      selectedCount,
    }),
    [from, to, totalRows, currentPage, totalPages, pageSize, selectedCount]
  );

  const pageNumbers = useMemo(
    () =>
      getPageNumbers(currentPage, totalPages, paginationMeta.maxVisiblePages),
    [currentPage, totalPages, paginationMeta.maxVisiblePages]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      engine.setPageIndex(page - 1);
    },
    [engine]
  );

  const handlePageSizeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      engine.setPageSize(Number(e.target.value));
    },
    [engine]
  );

  const displayTemplate = paginationMeta.display_format ?? labels.displayLabel;

  const displayLabel = resolvePaginationLabel(
    displayTemplate,
    "Showing {from}-{to} of {total} records",
    ctx
  );
  const selectedLabel = resolvePaginationLabel(
    labels.selectedLabel,
    "{selectedCount} selected",
    ctx
  );

  const rowsPerPageText =
    resolveTranslation(labels.rowsPerPage as any, "common/base") ||
    t("rowsPerPage", "Rows per page");
  const firstPageText =
    resolveTranslation(labels.first as any, "common/base") ||
    t("first", "First page");
  const prevPageText =
    resolveTranslation(labels.previous as any, "common/base") ||
    t("previous", "Previous page");
  const nextPageText =
    resolveTranslation(labels.next as any, "common/base") ||
    t("next", "Next page");
  const lastPageText =
    resolveTranslation(labels.last as any, "common/base") ||
    t("last", "Last page");

  const showFirstLast = paginationMeta.showFirstLast !== false;

  // Minimal variant
  if (variant === "minimal") {
    return (
      <nav
        ref={paginationRef}
        role="navigation"
        aria-label="Table pagination"
        data-testid="table-pagination"
        className={cn(
          "flex items-center justify-end gap-2 text-xs text-muted-foreground p-3 border-t border-border/30",
          className
        )}
      >
        <span>
          {currentPage} / {totalPages || 1}
        </span>
        <button
          data-testid="table-pagination-prev"
          className="p-1 rounded hover:bg-surface-raised disabled:opacity-30 disabled:cursor-not-allowed"
          onClick={() => engine.previousPage()}
          disabled={!engine.getCanPreviousPage()}
          aria-label={prevPageText}
        >
          {"\u2039"}
        </button>
        <button
          data-testid="table-pagination-next"
          className="p-1 rounded hover:bg-surface-raised disabled:opacity-30 disabled:cursor-not-allowed"
          onClick={() => engine.nextPage()}
          disabled={!engine.getCanNextPage()}
          aria-label={nextPageText}
        >
          {"\u203A"}
        </button>
      </nav>
    );
  }

  // Split-Three Layout: Summary Left, Nav Buttons Center, Page Size Right
  if (align === "split-three") {
    return (
      <nav
        ref={paginationRef}
        role="navigation"
        aria-label="Table pagination"
        data-testid="table-pagination"
        className={cn(
          "flex items-center justify-between gap-4 px-4 py-3 border-t border-border/40 bg-card/60 text-xs flex-wrap",
          className
        )}
      >
        {/* Left Section: Summary */}
        <div className="flex items-center gap-3 text-muted-foreground">
          <span>{displayLabel}</span>
          {selectedCount > 0 && (
            <span className="font-semibold text-primary">
              ({selectedLabel})
            </span>
          )}
        </div>

        {/* Center Section: Navigation Buttons */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            {showFirstLast && (
              <button
                data-testid="table-pagination-first"
                onClick={() => handlePageChange(1)}
                disabled={!engine.getCanPreviousPage()}
                aria-label={firstPageText}
                className="px-2.5 py-1 rounded-lg border border-border/40 bg-surface hover:bg-surface-raised disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                «
              </button>
            )}
            <button
              data-testid="table-pagination-prev"
              onClick={() => engine.previousPage()}
              disabled={!engine.getCanPreviousPage()}
              aria-label={prevPageText}
              className="px-2.5 py-1 rounded-lg border border-border/40 bg-surface hover:bg-surface-raised disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              ‹
            </button>

            {pageNumbers.map((p, i) =>
              p === "..." ? (
                <span key={`dots-${i}`} className="px-2 text-muted-foreground">
                  …
                </span>
              ) : (
                <button
                  key={p}
                  data-testid={`table-pagination-page-${p}`}
                  onClick={() => handlePageChange(Number(p))}
                  aria-current={p === currentPage ? "page" : undefined}
                  className={cn(
                    "min-w-[28px] h-7 px-2 rounded-lg font-medium transition-all text-xs",
                    p === currentPage
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "border border-border/40 bg-surface hover:bg-surface-raised text-foreground"
                  )}
                >
                  {p}
                </button>
              )
            )}

            <button
              data-testid="table-pagination-next"
              onClick={() => engine.nextPage()}
              disabled={!engine.getCanNextPage()}
              aria-label={nextPageText}
              className="px-2.5 py-1 rounded-lg border border-border/40 bg-surface hover:bg-surface-raised disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              ›
            </button>
            {showFirstLast && (
              <button
                data-testid="table-pagination-last"
                onClick={() => handlePageChange(totalPages)}
                disabled={!engine.getCanNextPage()}
                aria-label={lastPageText}
                className="px-2.5 py-1 rounded-lg border border-border/40 bg-surface hover:bg-surface-raised disabled:opacity-30 disabled:pointer-events-none transition-all"
              >
                »
              </button>
            )}
          </div>
        )}

        {/* Right Section: Page Size Selector */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <label htmlFor="rows-per-page-select-split">{rowsPerPageText}:</label>
          <select
            id="rows-per-page-select-split"
            value={pageSize}
            onChange={handlePageSizeChange}
            className="h-7 px-2 rounded-lg border border-border/40 bg-surface text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {derivePageSizeOptions(
              totalRows,
              paginationMeta.pageSizeOptions
            ).map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </nav>
    );
  }

  // Standard Between / Centered / End Alignments
  const alignClass =
    align === "center"
      ? "justify-center"
      : align === "end"
        ? "justify-end"
        : align === "start"
          ? "justify-start"
          : "justify-between";

  return (
    <nav
      ref={paginationRef}
      role="navigation"
      aria-label="Table pagination"
      data-testid="table-pagination"
      className={cn(
        "flex items-center gap-4 px-4 py-3 border-t border-border/40 bg-card/60 text-xs flex-wrap",
        alignClass,
        className
      )}
    >
      {/* Summary */}
      <div className="flex items-center gap-3 text-muted-foreground">
        <span>{displayLabel}</span>
        {selectedCount > 0 && (
          <span className="font-semibold text-primary">({selectedLabel})</span>
        )}
      </div>

      {/* Nav & Page size */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1">
          {showFirstLast && (
            <button
              data-testid="table-pagination-first"
              onClick={() => handlePageChange(1)}
              disabled={!engine.getCanPreviousPage()}
              aria-label={firstPageText}
              className="px-2.5 py-1 rounded-lg border border-border/40 bg-surface hover:bg-surface-raised disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              «
            </button>
          )}
          <button
            data-testid="table-pagination-prev"
            onClick={() => engine.previousPage()}
            disabled={!engine.getCanPreviousPage()}
            aria-label={prevPageText}
            className="px-2.5 py-1 rounded-lg border border-border/40 bg-surface hover:bg-surface-raised disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            ‹
          </button>

          {totalPages > 1 &&
            pageNumbers.map((p, i) =>
              p === "..." ? (
                <span
                  key={`dots-${i}`}
                  className="px-1.5 text-muted-foreground"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  data-testid={`table-pagination-page-${p}`}
                  onClick={() => handlePageChange(Number(p))}
                  aria-current={p === currentPage ? "page" : undefined}
                  className={cn(
                    "min-w-[26px] h-7 px-2 rounded-lg font-medium transition-all text-xs",
                    p === currentPage
                      ? "bg-primary text-primary-foreground font-bold shadow-xs"
                      : "border border-border/40 bg-surface hover:bg-surface-raised text-foreground"
                  )}
                >
                  {p}
                </button>
              )
            )}

          <button
            data-testid="table-pagination-next"
            onClick={() => engine.nextPage()}
            disabled={!engine.getCanNextPage()}
            aria-label={nextPageText}
            className="px-2.5 py-1 rounded-lg border border-border/40 bg-surface hover:bg-surface-raised disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            ›
          </button>
          {showFirstLast && (
            <button
              data-testid="table-pagination-last"
              onClick={() => handlePageChange(totalPages)}
              disabled={!engine.getCanNextPage()}
              aria-label={lastPageText}
              className="px-2.5 py-1 rounded-lg border border-border/40 bg-surface hover:bg-surface-raised disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              »
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-muted-foreground">
          <label htmlFor="rows-per-page-select">{rowsPerPageText}:</label>
          <select
            id="rows-per-page-select"
            value={pageSize}
            onChange={handlePageSizeChange}
            className="h-7 px-2 rounded-lg border border-border/40 bg-surface text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {derivePageSizeOptions(
              totalRows,
              paginationMeta.pageSizeOptions
            ).map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>
    </nav>
  );
}
