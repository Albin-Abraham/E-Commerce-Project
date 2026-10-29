import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@core/libs/utils";
import { resolveTranslation } from "@ui/form/utils/i18n.utils";
import { ArrowUpDown, ArrowUp, ArrowDown, RotateCcw } from "lucide-react";

import { useTableContext } from "@ui/table/core/TableEngineContext";

/**
 * ToolbarSortPopover (DCS Data Control Surface)
 *
 * Popover surface for viewing and configuring column sort rules.
 */
export function ToolbarSortPopover() {
  const { engine } = useTableContext<unknown>();
  const { t } = useTranslation("common/base");
  const [open, setOpen] = useState(false);

  const sorting = engine.getState().sorting;
  const sortableColumns = engine
    .getAllColumns()
    .filter((col) => col.getCanSort());

  const activeSortCount = sorting.length;

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
          activeSortCount > 0
            ? "bg-primary/10 border-primary/40 text-primary shadow-sm"
            : "bg-surface border-border/40 text-muted-foreground hover:text-foreground"
        )}
      >
        <ArrowUpDown size={13} />
        <span>{t("sort", "Sort")}</span>
        {activeSortCount > 0 && (
          <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-primary text-white">
            {activeSortCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 rounded-xl bg-surface border border-border/60 shadow-xl z-50 p-3 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/30">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                {t("sortColumns", "Sort Columns")}
              </span>
              {activeSortCount > 0 && (
                <button
                  onClick={() => engine.setSorting([])}
                  className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw size={11} /> {t("buttons.reset", "Clear")}
                </button>
              )}
            </div>

            <div className="flex flex-col gap-1 max-h-60 overflow-auto pr-1">
              {sortableColumns.map((col) => {
                const isSorted = col.getIsSorted();
                const rawHeader = col.columnDef.header;
                const label =
                  typeof rawHeader === "string"
                    ? resolveTranslation(rawHeader)
                    : resolveTranslation((col.columnDef.meta as any)?.label ?? col.id);

                return (
                  <div
                    key={col.id}
                    onClick={() => col.toggleSorting()}
                    className={cn(
                      "flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors",
                      isSorted
                        ? "bg-primary/10 text-primary font-semibold"
                        : "hover:bg-muted/50 text-foreground"
                    )}
                  >
                    <span className="truncate">
                      {label}
                    </span>
                    {isSorted === "asc" ? (
                      <ArrowUp size={13} />
                    ) : isSorted === "desc" ? (
                      <ArrowDown size={13} />
                    ) : (
                      <span className="text-[10px] text-muted-foreground/40">
                        {t("none", "None")}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
