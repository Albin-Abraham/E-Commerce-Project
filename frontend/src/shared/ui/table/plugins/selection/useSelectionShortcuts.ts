import { useEffect } from "react";
import { useTableContext } from "@ui/table/core/TableEngineContext";
import { useTablePhysics } from "@ui/table/core/TablePhysicsContext";

export function useSelectionShortcuts(enabled: boolean = true) {
  const setBulkSelection = useTablePhysics((s) => s.setBulkSelection);
  const resetSelection = useTablePhysics((s) => s.resetSelection);
  const selectedRows = useTablePhysics((s) => s.selectedRows);
  const selectionMode = useTablePhysics((s) => s.selectionMode);

  let engine: any = null;
  try {
    const tableContext = useTableContext();
    engine = tableContext?.engine;
  } catch {
    // Graceful fallback if invoked outside TableEngineContext
  }

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement as HTMLElement | null;
      const isInput =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          activeElement.tagName === "SELECT" ||
          activeElement.isContentEditable);

      // 1. ⌘A / Ctrl+A -> Select all rows on current page
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a") {
        if (isInput) return; // Do not trigger when typing inside search/inputs

        if (engine && typeof engine.getRowModel === "function") {
          const rows = engine.getRowModel().rows;
          if (rows && rows.length > 0) {
            e.preventDefault();
            const pageIds = rows.map((r: any) => r.id);
            setBulkSelection(pageIds);
          }
        }
      }

      // 2. Esc -> Clear selection (if any rows selected or mode active)
      if (e.key === "Escape") {
        if (selectedRows.size > 0 || selectionMode !== "MANUAL") {
          if (!isInput) {
            e.preventDefault();
            resetSelection();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    enabled,
    engine,
    setBulkSelection,
    resetSelection,
    selectedRows,
    selectionMode,
  ]);
}
