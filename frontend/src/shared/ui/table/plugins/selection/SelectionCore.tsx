import React, { createContext, useContext } from "react";

import { CheckCircle2, Download, Trash2, Upload, X } from "lucide-react";

import { useTableContext } from "@ui/table/core/TableEngineContext";
import { useTablePhysics } from "@ui/table/core/TablePhysicsContext";
import type { SelectionMode } from "@ui/table/core/createTablePhysicsStore";
import type { TableActionContext, TanStackTable } from "@ui/table/types";

/**
 * Selection Plugin Architecture
 *
 * Orchestrates bulk selection logic and UI actions.
 */

export interface SelectionContextValue {
  selectedCount: number;
  selectionMode: SelectionMode;
  totalCount: number;
}

export const SelectionBarContext = createContext<SelectionContextValue | null>(
  null
);

export function useSelectionContext() {
  const context = useContext(SelectionBarContext);
  if (!context) {
    throw new Error(
      "Selection components must be used within a SelectionActionBar provider"
    );
  }
  return context;
}

function getEngineState(table: TanStackTable<unknown> | undefined) {
  if (table && typeof table.getState === "function") {
    return table.getState();
  }
  return undefined;
}

export function SelectionBarModes() {
  const context = useSelectionContext();
  const setBulkSelection = useTablePhysics((s) => s.setBulkSelection);
  const setSelectionMode = useTablePhysics((s) => s.setSelectionMode);
  const resetSelection = useTablePhysics((s) => s.resetSelection);

  let engine: TanStackTable<unknown> | null = null;
  try {
    const tableContext = useTableContext();
    engine = tableContext?.engine ?? null;
  } catch {
    // Safely handled if outside TableEngineContext
  }

  const handleSelectPage = () => {
    if (engine && typeof engine.getRowModel === "function") {
      const ids = engine.getRowModel().rows.map((r) => r.id);
      setBulkSelection(ids);
    }
  };

  const handleSelectAll = () => {
    resetSelection();
    setSelectionMode("ALL");
  };

  return (
    <div className="flex items-center gap-1 bg-surface-raised/80 dark:bg-surface-raised/40 p-1 rounded-xl border border-border/40 shadow-xs">
      <button
        type="button"
        onClick={handleSelectPage}
        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
          context.selectionMode === "PAGE"
            ? "bg-surface shadow-xs text-primary font-extrabold"
            : "text-muted-foreground hover:text-foreground hover:bg-surface/50"
        }`}
      >
        This Page
      </button>
      <button
        type="button"
        onClick={handleSelectAll}
        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200 ${
          context.selectionMode === "ALL"
            ? "bg-surface shadow-xs text-primary font-extrabold"
            : "text-muted-foreground hover:text-foreground hover:bg-surface/50"
        }`}
      >
        Whole Data ({context.totalCount.toLocaleString()})
      </button>
    </div>
  );
}

export interface SelectionActionBarRootProps {
  children: React.ReactNode;
  /** When true, renders inline without fixed bottom overlay position */
  inline?: boolean;
}

export function SelectionActionBarRoot({
  children,
  inline = false,
}: SelectionActionBarRootProps) {
  const selectedRows = useTablePhysics((s) => s.selectedRows);
  const excludedRows = useTablePhysics((s) => s.excludedRows);
  const selectionMode = useTablePhysics((s) => s.selectionMode);
  const totalDataCount = useTablePhysics((s) => s.totalDataCount);

  if (selectedRows.size === 0 && selectionMode === "MANUAL") return null;

  const selectedCount =
    selectionMode === "ALL"
      ? Math.max(0, totalDataCount - excludedRows.size)
      : selectedRows.size;

  return (
    <SelectionBarContext.Provider
      value={{
        selectedCount,
        selectionMode: selectionMode as SelectionMode,
        totalCount: totalDataCount,
      }}
    >
      {inline ? (
        <div className="flex items-center justify-between gap-4 px-4 py-2 bg-primary/10 dark:bg-primary/20 border border-primary/30 rounded-xl text-foreground w-full">
          {children}
        </div>
      ) : (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto flex flex-col items-center">
          <div className="flex items-center justify-between gap-4 px-5 py-2.5 bg-background/95 dark:bg-surface-raised/95 backdrop-blur-2xl border border-primary/30 rounded-2xl shadow-2xl text-foreground max-w-2xl w-full">
            {children}
          </div>

          {selectionMode === "ALL" && (
            <div className="mt-2 px-4 py-1.5 bg-primary/10 rounded-xl border border-primary/20 text-[11px] font-bold text-primary flex items-center justify-center gap-2 backdrop-blur-md shadow-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Global selection active: All {selectedCount.toLocaleString()}{" "}
              records across all pages are targeted for the next action.
            </div>
          )}
        </div>
      )}
    </SelectionBarContext.Provider>
  );
}

export interface SelectionBarInfoProps {
  onDelete?: (context: TableActionContext) => void;
  onExport?: (context: TableActionContext) => void;
  onImport?: (context: TableActionContext) => void;
  showDelete?: boolean;
  showExport?: boolean;
  showImport?: boolean;
  showModes?: boolean;
}

export function SelectionBarInfo({
  onDelete,
  onExport,
  onImport,
  showDelete = true,
  showExport = true,
  showImport = true,
  showModes = true,
}: SelectionBarInfoProps = {}) {
  const context = useSelectionContext();
  const selectedRows = useTablePhysics((state) => state.selectedRows);
  const excludedRows = useTablePhysics((state) => state.excludedRows);
  const resetSelection = useTablePhysics((state) => state.resetSelection);
  const totalDataCount = useTablePhysics((state) => state.totalDataCount);

  let engine: TanStackTable<unknown> | null = null;
  try {
    const tableContext = useTableContext();
    engine = tableContext?.engine ?? null;
  } catch {
    // Safely handled if outside TableEngineContext
  }
  const engineState = getEngineState(engine);

  const count =
    context.selectionMode === "ALL"
      ? context.totalCount - excludedRows.size
      : context.selectedCount;

  const buildActionContext = (): TableActionContext => ({
    mode: context.selectionMode as "MANUAL" | "PAGE" | "ALL",
    selectedIds: Array.from(selectedRows),
    excludedIds: Array.from(excludedRows),
    totalCount: totalDataCount,
    search: String(engineState?.globalFilter ?? ""),
    sort: (engineState?.sorting ?? []) as { id: string; desc: boolean }[],
    filters: (engineState?.columnFilters ?? []) as { id: string; value: unknown }[],
  });

  return (
    <div className="flex items-center justify-between w-full gap-4 flex-wrap">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-primary">
          <CheckCircle2 size={18} />
          <span className="text-sm font-black uppercase tracking-widest">
            {count.toLocaleString()} Selected
          </span>
        </div>

        {showModes && <SelectionBarModes />}

        <div className="h-4 w-px bg-border/40" />
        <button
          type="button"
          onClick={resetSelection}
          className="text-xs font-bold text-muted-foreground hover:text-danger transition-colors duration-[var(--motion-medium)] flex items-center gap-1"
        >
          <X size={14} /> Clear
        </button>
      </div>

      <div className="flex items-center gap-2">
        {showExport && (
          <button
            type="button"
            onClick={() =>
              onExport
                ? onExport(buildActionContext())
                : alert(`Exporting ${count} selected records`)
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-surface-raised border border-border/40 shadow-sm hover:bg-surface transition-all text-foreground"
          >
            <Download size={13} /> Export
          </button>
        )}

        {showImport && (
          <button
            type="button"
            onClick={() =>
              onImport
                ? onImport(buildActionContext())
                : alert("Importing data")
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-surface-raised border border-border/40 shadow-sm hover:bg-surface transition-all text-foreground"
          >
            <Upload size={13} /> Import
          </button>
        )}

        {showDelete && (
          <button
            type="button"
            onClick={() =>
              onDelete
                ? onDelete(buildActionContext())
                : alert(`Deleting ${count} selected records`)
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-destructive text-white shadow-sm hover:bg-destructive/90 transition-all"
          >
            <Trash2 size={13} /> Delete
          </button>
        )}
      </div>
    </div>
  );
}

