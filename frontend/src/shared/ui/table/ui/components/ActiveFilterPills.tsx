import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useTableContext } from "@ui/table/core/TableEngineContext";
import { useTableFetch } from "@ui/table/core/TableFetchContext";
import { useTableFilterForm } from "@ui/table/mdap/TableFilterContext";
import { resolveTranslation } from "@ui/form/utils/i18n.utils";
import type { FormDefinition } from "@ui/form/types";
import { RotateCcw, X } from "lucide-react";

function getOptionLabel(def: FormDefinition | null, fieldName: string, rawValue: unknown): string {
  if (!def || !def.fields) return String(rawValue);
  const field = def.fields.find((f) => String(f.name) === fieldName || String(f.id) === fieldName);
  if (!field) return String(rawValue);

  if (field.options && Array.isArray(field.options)) {
    const opt = field.options.find((o) => String(o.value) === String(rawValue));
    if (opt?.label) {
      return resolveTranslation(opt.label as any, "common/base") || String(rawValue);
    }
  }
  return String(rawValue);
}

function getFieldLabel(def: FormDefinition | null, fieldName: string): string {
  if (!def || !def.fields) return fieldName;
  const field = def.fields.find((f) => String(f.name) === fieldName || String(f.id) === fieldName);
  if (!field?.label) return fieldName;
  return resolveTranslation(field.label as any, "common/base") || fieldName;
}

export function ActiveFilterPills() {
  const { engine } = useTableContext<unknown>();
  const { search, gate } = useTableFetch();
  const { t } = useTranslation("common/base");
  const filterForm = useTableFilterForm();
  const state = engine.getState();

  const globalFilter = String(state.globalFilter ?? "").trim();
  const columnFilters = state.columnFilters ?? [];

  const activeColumnFilters = useMemo(() => {
    return columnFilters.filter((f) => f.id !== "search" && f.value !== "" && f.value != null);
  }, [columnFilters]);

  const totalCount = (globalFilter ? 1 : 0) + activeColumnFilters.length;

  if (totalCount === 0) return null;

  const handleRemoveColumnFilter = (colId: string) => {
    const nextFilters = columnFilters.filter((f) => f.id !== colId);
    engine.setColumnFilters(nextFilters);
    if (gate === "manual") search();
  };

  const handleRemoveGlobalSearch = () => {
    engine.setGlobalFilter("");
    if (gate === "manual") search();
  };

  const handleClearAll = () => {
    engine.setGlobalFilter("");
    engine.resetColumnFilters();
    if (gate === "manual") search();
  };

  return (
    <div
      data-testid="table-active-filter-pills"
      className="flex items-center gap-2 flex-wrap pt-2 pb-1 text-xs animate-in fade-in slide-in-from-top-1 duration-200"
    >
      <span className="text-[11px] font-bold text-muted-foreground/70 uppercase tracking-wider select-none">
        {t("activeFilters", "Active Filters:")}
      </span>

      {/* Global Search Pill */}
      {globalFilter && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-semibold shadow-xs">
          <span className="opacity-70 font-medium">{t("search", "Search:")}</span>
          <span>"{globalFilter}"</span>
          <button
            type="button"
            onClick={handleRemoveGlobalSearch}
            className="p-0.5 rounded-full hover:bg-primary/20 transition-colors ml-0.5"
            title={t("removeSearch", "Remove search filter")}
          >
            <X size={12} />
          </button>
        </span>
      )}

      {/* Column Filter Pills */}
      {activeColumnFilters.map((f) => {
        const fieldLabel = getFieldLabel(filterForm, f.id);
        const optionLabel = getOptionLabel(filterForm, f.id, f.value);

        return (
          <span
            key={f.id}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-raised border border-border/50 text-foreground text-xs font-semibold shadow-xs"
          >
            <span className="text-muted-foreground font-medium">{fieldLabel}:</span>
            <span>{optionLabel}</span>
            <button
              type="button"
              onClick={() => handleRemoveColumnFilter(f.id)}
              className="p-0.5 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground ml-0.5"
              title={t("removeFilter", "Remove {{field}} filter", { field: fieldLabel })}
            >
              <X size={12} />
            </button>
          </span>
        );
      })}

      {/* Clear All Trigger */}
      <button
        type="button"
        onClick={handleClearAll}
        className="flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-destructive transition-colors ml-1"
        title={t("buttons.reset", "Clear all active filters")}
      >
        <RotateCcw size={11} /> {t("clearAll", "Clear All ({{count}})", { count: totalCount })}
      </button>
    </div>
  );
}
