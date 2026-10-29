import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@core/libs/utils";
import { resolveTranslation } from "@ui/form/utils/i18n.utils";
import { Eye, RotateCcw } from "lucide-react";

import { useTableContext } from "@ui/table/core/TableEngineContext";

/**
 * ToolbarColumnVisibilityDropdown (DCS Data Control Surface)
 *
 * Dropdown surface allowing users to show/hide table columns.
 */
export function ToolbarColumnVisibilityDropdown() {
  const { engine } = useTableContext<unknown>();
  const { t } = useTranslation("common/base");
  const [open, setOpen] = useState(false);

  const columns = engine.getAllColumns();
  const hiddenCount = columns.filter((c) => !c.getIsVisible()).length;

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
          hiddenCount > 0
            ? "bg-primary/10 border-primary/40 text-primary shadow-sm"
            : "bg-surface border-border/40 text-muted-foreground hover:text-foreground"
        )}
      >
        <Eye size={13} />
        <span>{t("columns", "Columns")}</span>
        {hiddenCount > 0 && (
          <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-primary text-white">
            {hiddenCount} hidden
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 rounded-xl bg-surface border border-border/60 shadow-xl z-50 p-3 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/30">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                {t("columnVisibility", "Column Visibility")}
              </span>
              {hiddenCount > 0 && (
                <button
                  onClick={() => columns.forEach((col) => col.toggleVisibility(true))}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw size={11} /> {t("showAll", "Show All")}
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1 max-h-60 overflow-auto pr-1">
              {columns.map((col) => {
                const isVisible = col.getIsVisible();
                const canHide = col.getCanHide();
                if (!canHide || col.id === "_select" || col.id === "_actions") return null;

                const rawHeader = col.columnDef.header;
                const label =
                  typeof rawHeader === "string"
                    ? resolveTranslation(rawHeader)
                    : resolveTranslation((col.columnDef.meta as any)?.label ?? col.id);

                return (
                  <label
                    key={col.id}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-muted/50 transition-colors"
                  >
                    <span className="truncate">{label}</span>
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={col.getToggleVisibilityHandler()}
                      className="rounded border-border/60 text-primary focus:ring-primary/30"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
