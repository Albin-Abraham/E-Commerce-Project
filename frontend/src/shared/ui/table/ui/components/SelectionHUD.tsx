import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Download, Trash2, X } from "lucide-react";
import { cn } from "@core/libs/utils";
import { useTableContext } from "../../core/TableEngineContext";
import { useTablePhysics } from "../../core/TablePhysicsContext";
import { useTableChrome } from "../../mdap/TableChromeContext";

export interface SelectionHUDProps {
  className?: string;
  onExport?: () => void;
  onDelete?: () => void;
  actions?: React.ReactNode;
}

export function SelectionHUD({
  className,
  onExport,
  onDelete,
  actions,
}: SelectionHUDProps) {
  const { engine } = useTableContext<unknown>();
  const { t } = useTranslation("common/base");
  const selectedRows = useTablePhysics((s) => s.selectedRows);
  const excludedRows = useTablePhysics((s) => s.excludedRows);
  const selectionMode = useTablePhysics((s) => s.selectionMode);
  const totalDataCount = useTablePhysics((s) => s.totalDataCount);
  const resetSelection = useTablePhysics((s) => s.resetSelection);
  const setBulkSelection = useTablePhysics((s) => s.setBulkSelection);
  const setSelectionMode = useTablePhysics((s) => s.setSelectionMode);
  const chrome = useTableChrome();

  const hasSelection = selectedRows.size > 0 || selectionMode !== "MANUAL";
  const selectedCount =
    selectionMode === "ALL"
      ? Math.max(0, totalDataCount - excludedRows.size)
      : selectedRows.size;

  // Keyboard shortcut listeners (ESC to clear, ⌘A to select all)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && hasSelection) {
        resetSelection();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "a") {
        const activeEl = document.activeElement;
        const isInput =
          activeEl?.tagName === "INPUT" || activeEl?.tagName === "TEXTAREA";
        if (!isInput) {
          e.preventDefault();
          setSelectionMode("ALL");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasSelection, resetSelection, setSelectionMode]);

  return (
    <AnimatePresence>
      {hasSelection && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          data-testid="selection-hud"
          className={cn(
            "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
            "flex items-center gap-3 px-4 py-2.5 rounded-2xl",
            "bg-card/95 dark:bg-card/90 backdrop-blur-xl",
            "border border-primary/30 shadow-2xl shadow-primary/10",
            "text-foreground text-xs font-medium",
            className
          )}
        >
          {/* Selected Count Indicator */}
          <div className="flex items-center gap-2 pr-2 border-r border-border/60 text-primary font-bold">
            <CheckCircle2 size={16} />
            <span>
              {t("toolbar.selectedCount", "{{count}} Selected", {
                count: selectedCount,
              })}
            </span>
          </div>

          {/* Scope Selector */}
          <div className="flex items-center gap-1 bg-surface-raised p-0.5 rounded-lg border border-border/40 text-[10px]">
            <button
              type="button"
              onClick={() => {
                if (engine && typeof engine.getRowModel === "function") {
                  const rows = engine.getRowModel().rows;
                  if (rows) setBulkSelection(rows.map((r: any) => r.id));
                }
              }}
              className={cn(
                "px-2 py-1 rounded-md font-bold uppercase transition-all",
                selectionMode === "PAGE"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t("toolbar.thisPage", "Page")}
            </button>
            <button
              type="button"
              onClick={() => setSelectionMode("ALL")}
              className={cn(
                "px-2 py-1 rounded-md font-bold uppercase transition-all",
                selectionMode === "ALL"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t("toolbar.wholeData", "All")}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-border/60">
            {actions}
            {chrome.exportBtn && onExport && (
              <button
                type="button"
                onClick={onExport}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-raised border border-border/40 text-xs font-medium text-foreground transition-all"
              >
                <Download size={13} />
                <span>Export</span>
              </button>
            )}
            {chrome.deleteBtn && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 text-xs font-medium text-destructive transition-all"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            )}
          </div>

          {/* Clear & Keyboard shortcut */}
          <button
            type="button"
            onClick={resetSelection}
            className="flex items-center gap-1.5 pl-2 text-muted-foreground hover:text-destructive transition-colors ml-1"
            title="Clear (ESC)"
          >
            <X size={14} />
            <kbd className="hidden sm:inline-block px-1 py-0.5 text-[9px] font-mono bg-muted/60 rounded border border-border/40">
              ESC
            </kbd>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
