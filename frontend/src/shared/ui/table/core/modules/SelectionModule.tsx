import { useEffect, useRef } from "react";
import { Check, Minus } from "lucide-react";

import { cn } from "@core/libs/utils";
import type { ColumnDef } from "@tanstack/react-table";

import type { HookSignature } from "@ui/table/types";
import { useTableContext } from "@ui/table/core/TableEngineContext";
import { useTablePhysics } from "@ui/table/core/TablePhysicsContext";

import { useSelectionShortcuts } from "@ui/table/plugins/selection/useSelectionShortcuts";

/**
 * SelectionModule
 *
 * Provides column defs (header + cell) and a Logic hook for row selection.
 * JSX Closure Rule: column closures are pure JSX factories — zero hook calls.
 * All hooks live in private hoisted function components below.
 */

export interface UseSelectionSignature extends HookSignature {
  type?: "single" | "multiple";
  onSelectionChange?: (ids: string[]) => void;
  /** Reset selection when these values change (Yafei pattern) */
  filters?: unknown;
  search?: string;
}

// ── PRIVATE hoisted components — hooks live here (legal) ─────────────

function SelectAllHeader() {
  const selectionType = useTablePhysics((s) => s.selectionType);
  const selectionMode = useTablePhysics((s) => s.selectionMode);
  const setBulkSelection = useTablePhysics((s) => s.setBulkSelection);
  const setSelectionMode = useTablePhysics((s) => s.setSelectionMode);
  const resetSelection = useTablePhysics((s) => s.resetSelection);
  const { engine } = useTableContext<Record<string, unknown>>();

  if (selectionType === "single") return null;

  const rows = engine.getRowModel().rows;
  const pageIds = rows.map((r) => r.id);

  // Derived selectors — return primitives so Zustand's Object.is comparison works
  const allPageSelected = useTablePhysics((s) =>
    pageIds.length > 0 && pageIds.every((id) => s.selectedRows.has(id))
  );
  const hasExclusions = useTablePhysics((s) => s.excludedRows.size > 0);
  const isAll = useTablePhysics((s) => s.selectionMode === "ALL");

  const checked = isAll ? !hasExclusions : selectionMode === "PAGE" && allPageSelected;
  const ariaChecked: boolean | "mixed" = isAll && hasExclusions ? "mixed" : checked;

  const handleToggle = () => {
    if (isAll) {
      resetSelection();
    } else if (selectionMode === "PAGE" && allPageSelected) {
      setSelectionMode("ALL");
    } else {
      setBulkSelection(pageIds);
    }
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-label="Select all rows on this page"
      aria-checked={ariaChecked}
      data-table-select="header"
      data-testid="table-select-all"
      onClick={handleToggle}
      className={cn(
        "h-4 w-4 rounded-md border transition-all flex items-center justify-center cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/30",
        checked || ariaChecked === "mixed"
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background hover:border-primary/50"
      )}
    >
      {ariaChecked === "mixed" ? (
        <Minus size={12} strokeWidth={3} />
      ) : checked ? (
        <Check size={12} strokeWidth={3} />
      ) : null}
    </button>
  );
}

function SelectCell({ rowId }: { rowId: string }) {
  const selectionType = useTablePhysics((s) => s.selectionType);
  const toggleSelection = useTablePhysics((s) => s.toggleSelection);

  // Derived boolean selector — O(1) comparison, no Set subscription
  const isSelected = useTablePhysics((s) =>
    s.selectionMode === "ALL" ? !s.excludedRows.has(rowId) : s.selectedRows.has(rowId)
  );

  if (selectionType === "single") {
    return (
      <button
        type="button"
        role="radio"
        aria-label={`Select row ${rowId}`}
        aria-checked={isSelected}
        data-table-select="cell"
        data-table-row={rowId}
        data-testid={`table-select-${rowId}`}
        onClick={(e) => {
          e.stopPropagation();
          toggleSelection(rowId, false);
        }}
        className={cn(
          "h-4 w-4 rounded-full border transition-all flex items-center justify-center cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/30",
          isSelected
            ? "border-primary bg-primary/10"
            : "border-input bg-background hover:border-primary/50"
        )}
      >
        {isSelected && <span className="w-2 h-2 rounded-full bg-primary" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-label={`Select row ${rowId}`}
      aria-checked={isSelected}
      data-table-select="cell"
      data-table-row={rowId}
      data-testid={`table-select-${rowId}`}
      onClick={(e) => {
        e.stopPropagation();
        toggleSelection(rowId, true);
      }}
      className={cn(
        "h-4 w-4 rounded-md border transition-all flex items-center justify-center cursor-pointer shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/30",
        isSelected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background hover:border-primary/50"
      )}
    >
      {isSelected && <Check size={12} strokeWidth={3} />}
    </button>
  );
}

function SelectionListener(props: UseSelectionSignature) {
  SelectionModule.useSelection(props);
  return null;
}

// ── PUBLIC module surface ─────────────────────────────────────────────

export const SelectionModule = Object.freeze({
  Header: SelectAllHeader,
  Cell: SelectCell,
  Listener: SelectionListener,

  /**
   * columnDef — generates the complete select column.
   * Column closures are pure JSX factories — no hooks called inside.
   */
  columnDef: <T,>(): ColumnDef<T> => ({
    id: "_select",
    size: 48,
    enableSorting: false,
    enableResizing: false,
    header: () => <SelectAllHeader />,
    cell: ({ row }) => <SelectCell rowId={row.id} />,
  }),

  /**
   * useSelection — Logic hook for selection state.
   * enabled flag guards internally — always called unconditionally.
   */
  useSelection(sig: UseSelectionSignature = {}) {
    useSelectionShortcuts(sig.enabled ?? true);

    const store = {
      selectedRows: useTablePhysics((s) => s.selectedRows),
      excludedRows: useTablePhysics((s) => s.excludedRows),
      selectionMode: useTablePhysics((s) => s.selectionMode),
      setSelectionType: useTablePhysics((s) => s.setSelectionType),
      toggleSelection: useTablePhysics((s) => s.toggleSelection),
      setSelectionMode: useTablePhysics((s) => s.setSelectionMode),
      resetSelection: useTablePhysics((s) => s.resetSelection),
    };

    useEffect(() => {
      if (!sig.enabled) return;
      if (sig.type) store.setSelectionType(sig.type);
    }, [sig.enabled, sig.type, store.setSelectionType]);

    useEffect(() => {
      if (!sig.enabled || !sig.onSelectionChange) return;
      if (store.selectionMode === "ALL") return;
      sig.onSelectionChange(Array.from(store.selectedRows));
    }, [
      sig.enabled,
      store.selectedRows,
      store.selectionMode,
      sig.onSelectionChange,
    ]);

    // Reset selection when filters or search change (Yafei pattern)
    const prevFilters = useRef(sig.filters);
    const prevSearch = useRef(sig.search);
    useEffect(() => {
      if (!sig.enabled) return;
      if (
        prevFilters.current !== sig.filters ||
        prevSearch.current !== sig.search
      ) {
        store.resetSelection();
        prevFilters.current = sig.filters;
        prevSearch.current = sig.search;
      }
    }, [sig.enabled, sig.filters, sig.search, store.resetSelection]);

    return {
      selectedIds: Array.from(store.selectedRows),
      excludedIds: Array.from(store.excludedRows),
      selectionMode: store.selectionMode,
      isSelected: (id: string) =>
        store.selectionMode === "ALL"
          ? !store.excludedRows.has(id)
          : store.selectedRows.has(id),
      toggle: (id: string) => store.toggleSelection(id, true),
      selectAll: () => store.setSelectionMode("ALL"),
      clearAll: () => store.resetSelection(),
    };
  },
});
