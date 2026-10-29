import type { RefObject } from "react";

import { create } from "zustand";
import type { RowExpansionMode } from "@ui/table/types";

/**
 * TablePhysicsStore types
 */
export type SelectionMode = "MANUAL" | "PAGE" | "ALL";
export type TableDensity = "comfortable" | "compact";
export type SelectionType = "single" | "multiple";

export interface TablePhysicsState {
  selectedRows: Set<string>;
  excludedRows: Set<string>;
  expandedRowIds: Set<string>;
  lockedRowIds: Set<string>;
  topOffset: number;
  selectionMode: SelectionMode;
  selectionType: SelectionType;
  density: TableDensity;
  totalDataCount: number;
  totalCountSynced: boolean;
  hoveredRowId: string | null;
  focusedCell: { rowId: string; colId: string } | null;

  setTotalCount: (count: number) => void;
  setSelectionMode: (mode: SelectionMode) => void;
  setSelectionType: (type: SelectionType) => void;
  setDensity: (density: TableDensity) => void;
  toggleSelection: (id: string, multi?: boolean) => void;
  setBulkSelection: (ids: string[]) => void;
  setHover: (id: string | null) => void;
  setFocus: (rowId: string, colId: string) => void;
  resetSelection: () => void;
  toggleRowExpansion: (id: string, mode?: RowExpansionMode) => void;
  collapseAllRows: () => void;
  setRowLock: (id: string, locked?: boolean) => void;
  setTopOffset: (px: number) => void;
}

export interface CreateTablePhysicsStoreOptions {
  /**
   * containerRef — CSS density variables are scoped to this element,
   * NOT document.documentElement. This ensures two tables on the same page
   * can have independent densities.
   */
  containerRef: RefObject<HTMLDivElement | null>;
}

/**
 * createTablePhysicsStore
 *
 * Factory that creates an ISOLATED Zustand store per table instance.
 * Uses `create` (not `createStore`) because we wrap it in a Context provider.
 *
 * Per-instance isolation solves the ERP multi-table problem where two tables
 * on the same page would share selection, hover, and density state.
 */
export function createTablePhysicsStore({
  containerRef,
}: CreateTablePhysicsStoreOptions) {
  return create<TablePhysicsState>((set) => ({
    selectedRows: new Set<string>(),
    excludedRows: new Set<string>(),
    expandedRowIds: new Set<string>(),
    lockedRowIds: new Set<string>(),
    topOffset: 0,
    selectionMode: "MANUAL",
    selectionType: "multiple",
    density: "comfortable",
    totalDataCount: 0,
    totalCountSynced: false,
    hoveredRowId: null,
    focusedCell: null,

    setTotalCount: (count) =>
      set({ totalDataCount: count, totalCountSynced: true }),

    setSelectionMode: (mode) =>
      set({
        selectionMode: mode,
        selectedRows: new Set(),
        excludedRows: new Set(),
      }),

    setSelectionType: (type) =>
      set({
        selectionType: type,
        selectedRows: new Set(),
        selectionMode: "MANUAL",
      }),

    setDensity: (density) => {
      // Scoped to THIS table's container — not global document
      containerRef.current?.style.setProperty(
        "--table-row-py",
        `var(--density-${density}-py)`
      );
      containerRef.current?.style.setProperty(
        "--table-row-px",
        `var(--density-${density}-px)`
      );
      set({ density });
    },

    toggleSelection: (id, multi) =>
      set((state) => {
        if (
          state.selectionMode === "ALL" &&
          state.selectionType === "multiple"
        ) {
          const newExcluded = new Set(state.excludedRows);
          if (newExcluded.has(id)) newExcluded.delete(id);
          else newExcluded.add(id);
          return { excludedRows: newExcluded };
        }

        const isMulti = state.selectionType === "multiple" && multi;
        const newSet = new Set(isMulti ? state.selectedRows : []);

        if (newSet.has(id)) {
          if (isMulti) newSet.delete(id);
        } else {
          newSet.add(id);
        }

        return {
          selectedRows: newSet,
          selectionMode:
            state.selectionType === "single"
              ? "MANUAL"
              : state.selectionMode === "PAGE"
                ? "PAGE"
                : "MANUAL",
        };
      }),

    setBulkSelection: (ids) =>
      set({
        selectedRows: new Set(ids),
        excludedRows: new Set(),
        selectionMode: "PAGE",
      }),

    setHover: (id) => set({ hoveredRowId: id }),
    setFocus: (rowId, colId) => set({ focusedCell: { rowId, colId } }),

    resetSelection: () =>
      set({
        selectedRows: new Set(),
        excludedRows: new Set(),
        selectionMode: "MANUAL",
      }),

    toggleRowExpansion: (id, mode = "exclusive") =>
      set((state) => {
        const newSet = new Set(mode === "exclusive" ? [] : state.expandedRowIds);
        if (state.expandedRowIds.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return { expandedRowIds: newSet };
      }),

    collapseAllRows: () => set({ expandedRowIds: new Set() }),

    setRowLock: (id, locked = true) =>
      set((state) => {
        const newSet = new Set(state.lockedRowIds);
        if (locked) newSet.add(id);
        else newSet.delete(id);
        return { lockedRowIds: newSet };
      }),

    setTopOffset: (px) => set({ topOffset: px }),
  }));
}

export type TablePhysicsStore = ReturnType<typeof createTablePhysicsStore>;
