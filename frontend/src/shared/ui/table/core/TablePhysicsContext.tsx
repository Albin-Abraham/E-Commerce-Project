import { createContext, useContext, useRef } from "react";
import type { ReactNode, RefObject } from "react";

import { useStore } from "zustand";

import {
  type TablePhysicsState,
  type TablePhysicsStore,
  createTablePhysicsStore,
} from "./createTablePhysicsStore";

export const TablePhysicsContext = createContext<TablePhysicsStore | null>(null);

export interface TablePhysicsProviderProps {
  children: ReactNode;
  containerRef: RefObject<HTMLDivElement | null>;
}

/**
 * TablePhysicsProvider
 *
 * Creates a per-instance Zustand store via useRef (never recreated on re-render).
 * The containerRef is passed so density CSS variables are scoped to this table only.
 */
export function TablePhysicsProvider({
  children,
  containerRef,
}: TablePhysicsProviderProps) {
  const storeRef = useRef<TablePhysicsStore | undefined>(undefined);
  if (!storeRef.current) {
    storeRef.current = createTablePhysicsStore({ containerRef });
  }

  return (
    <TablePhysicsContext.Provider value={storeRef.current}>
      {children}
    </TablePhysicsContext.Provider>
  );
}

/**
 * useTablePhysics
 *
 * Atomic selector hook — only re-renders when the selected slice changes.
 * This is O(1) per interaction regardless of table size.
 *
 * @example
 * const selectedRows = useTablePhysics(s => s.selectedRows);
 */
export function useTablePhysics<S>(
  selector: (state: TablePhysicsState) => S
): S {
  const store = useContext(TablePhysicsContext);
  if (!store) {
    throw new Error(
      "[ZenithTable] useTablePhysics must be used inside a <ZenithTable> component."
    );
  }
  return useStore(store, (state) => {
    if (state == null) return selector(store.getState());
    return selector(state);
  });
}

/**
 * useTableCellAtom
 *
 * Surgical selector for atomic cell updates.
 * Reads only isSelected, isHovered, and isLocked for a given rowId.
 */
export function useTableCellAtom(rowId: string) {
  const isSelected = useTablePhysics((s) =>
    s.selectionMode === "ALL"
      ? !s.excludedRows.has(rowId)
      : s.selectedRows.has(rowId)
  );
  const isHovered = useTablePhysics((s) => s.hoveredRowId === rowId);
  const isLocked = useTablePhysics((s) => s.lockedRowIds.has(rowId));
  return { isSelected, isHovered, isLocked };
}

/**
 * useIsRowLocked — atomic selector for row locking
 */
export function useIsRowLocked(rowId: string): boolean {
  return useTablePhysics((s) => s.lockedRowIds.has(rowId));
}

/**
 * useIsRowExpanded — atomic selector for row expansion
 */
export function useIsRowExpanded(rowId: string): boolean {
  return useTablePhysics((s) => s.expandedRowIds.has(rowId));
}

/**
 * useTableViewport — atomic selector for container and viewport physics
 */
export function useTableViewport() {
  return useTablePhysics((s) => s.viewport);
}

/**
 * useTableBreakpoint — atomic selector for active responsive breakpoint
 */
export function useTableBreakpoint(): "mobile" | "tablet" | "desktop" {
  return useTablePhysics((s) => s.viewport.breakpoint);
}
