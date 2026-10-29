import { createContext, useContext, useMemo, useRef } from "react";
import type { ReactNode } from "react";

import type { TableDOMRefs, TableHandle } from "@ui/table/types";

/**
 * TableDOMContext — Layer 4
 *
 * All DOM refs are created by the Root container and distributed via Context.
 * Presenters (Header, Body, View, Pagination) pull their ref and attach to DOM.
 * The consumer receives a TableHandle via forwardRef on <ZenithTable>.
 */

const TableDOMContext = createContext<TableDOMRefs | null>(null);

export function useTableDOM(): TableDOMRefs {
  const ctx = useContext(TableDOMContext);
  if (!ctx) {
    throw new Error(
      "[ZenithTable] useTableDOM must be used inside a <ZenithTable> component."
    );
  }
  return ctx;
}

interface TableDOMProviderProps {
  refs: TableDOMRefs;
  children: ReactNode;
}

export function TableDOMProvider({ refs, children }: TableDOMProviderProps) {
  return (
    <TableDOMContext.Provider value={refs}>{children}</TableDOMContext.Provider>
  );
}

/**
 * useTableDOMRefs
 *
 * Creates all DOM refs in the Root container and returns them as a stable
 * memoised object (useMemo with [] deps — refs are stable React objects).
 */
export function useTableDOMRefs(): TableDOMRefs {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const headerRef = useRef<HTMLTableSectionElement>(null);
  const bodyRef = useRef<HTMLTableSectionElement>(null);
  const paginationRef = useRef<HTMLElement>(null);

  // useMemo with [] — refs are stable, object reference is stable

  return useMemo<TableDOMRefs>(
    () => ({
      containerRef,
      scrollerRef,
      tableRef,
      headerRef,
      bodyRef,
      paginationRef,
    }),
    []
  );
}

/**
 * buildTableHandle
 *
 * Builds the imperative TableHandle from DOM refs.
 * Used inside useImperativeHandle in ZenithTableRoot.
 */
export function buildTableHandle(refs: TableDOMRefs): TableHandle {
  return {
    scrollToTop: () => {
      refs.scrollerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    },

    scrollToRow: (rowId: string) => {
      if (!refs.scrollerRef.current) return;

      // First try direct DOM query (works for non-virtualized or visible rows)
      const row = refs.bodyRef.current?.querySelector<HTMLElement>(
        `[data-table-row="${rowId}"]`
      );

      if (row) {
        refs.scrollerRef.current.scrollTo({
          top: row.offsetTop - (refs.scrollerRef.current.offsetTop ?? 0),
          behavior: "smooth",
        });
        return;
      }

      // Virtualized row not in DOM — estimate position from row index
      // Find the row index from the data attribute pattern
      const allRows =
        refs.bodyRef.current?.querySelectorAll("[data-table-row]");
      if (allRows) {
        // Find row index by counting rows before this one
        const rowIndex = Array.from(allRows).findIndex(
          (r) => r.getAttribute("data-table-row") === rowId
        );
        if (rowIndex >= 0) {
          // Use estimated row height (48px default) to calculate scroll position
          const estimatedTop = rowIndex * 48;
          refs.scrollerRef.current.scrollTo({
            top: estimatedTop,
            behavior: "smooth",
          });
          return;
        }
      }

      // Last resort: try to find the row element after a short delay (allows virtualizer to render)
      requestAnimationFrame(() => {
        const retryRow = refs.bodyRef.current?.querySelector<HTMLElement>(
          `[data-table-row="${rowId}"]`
        );
        if (retryRow && refs.scrollerRef.current) {
          refs.scrollerRef.current.scrollTo({
            top: retryRow.offsetTop - (refs.scrollerRef.current.offsetTop ?? 0),
            behavior: "smooth",
          });
        }
      });
    },

    focusFirstCell: () => {
      refs.bodyRef.current
        ?.querySelector<HTMLElement>('[role="gridcell"]')
        ?.focus();
    },

    getBodyElement: () => refs.bodyRef.current,
    getContainerElement: () => refs.containerRef.current,
  };
}

export type { TableDOMRefs, TableHandle };
