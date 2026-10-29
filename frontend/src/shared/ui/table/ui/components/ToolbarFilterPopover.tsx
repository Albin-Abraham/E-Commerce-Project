import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@core/libs/utils";
import { FieldRenderer } from "@ui/form/FieldRenderer";
import { FormRegistryProvider } from "@ui/form/context/FormRegistryContext";
import { FormThemeProvider } from "@ui/form/context/FormThemeContext";
import { defaultRegistry } from "@ui/form";
import { useForm } from "@ui/form/hooks/useForm";
import { DEFAULT_FORM_THEME } from "@ui/form/styles/FormTheme";
import type { FormDefinition } from "@ui/form/types";
import { Filter, RotateCcw, Check } from "lucide-react";

import { useTableContext } from "@ui/table/core/TableEngineContext";
import { useTableFetch } from "@ui/table/core/TableFetchContext";
import { useTableFilterForm } from "@ui/table/mdap/TableFilterContext";

function fieldNames(def: FormDefinition): string[] {
  return (def.fields ?? []).map((f) => String(f.name));
}

function initialFromEngine(
  def: FormDefinition,
  columnFilters: { id: string; value: unknown }[]
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const name of fieldNames(def)) {
    values[name] = columnFilters.find((f) => f.id === name)?.value ?? "";
  }
  return values;
}

/**
 * ToolbarFilterPopover (ECS / DCS Entity Control Surface)
 *
 * Renders MDAP compiled filter form fields inside a Popover surface dropdown.
 * Binds directly to the form engine and TableFilterContext.
 */
export function ToolbarFilterPopover() {
  const filterForm = useTableFilterForm();
  const { engine } = useTableContext<unknown>();
  const { search, gate } = useTableFetch();
  const { t } = useTranslation("common/base");
  const [open, setOpen] = useState(false);

  if (!filterForm || !filterForm.fields || filterForm.fields.length === 0) return null;

  const columnFilters = engine.getState().columnFilters ?? [];
  const activeFilters = columnFilters.filter((f) => f.id !== "search" && f.value !== "");
  const filterCount = activeFilters.length;

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
          filterCount > 0
            ? "bg-primary/10 border-primary/40 text-primary shadow-sm"
            : "bg-surface border-border/40 text-muted-foreground hover:text-foreground"
        )}
      >
        <Filter size={13} />
        <span>{t("filters", "Filters")}</span>
        {filterCount > 0 && (
          <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-primary text-white">
            {filterCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 rounded-xl bg-surface border border-border/60 shadow-xl z-50 p-4 animate-in fade-in slide-in-from-top-2 duration-150">
            <ToolbarFilterFormInner
              def={filterForm}
              columnFilters={columnFilters}
              onCommit={(values) => {
                const nextFilters: { id: string; value: unknown }[] = [];
                for (const [key, value] of Object.entries(values)) {
                  if (key === "search") continue;
                  if (value !== "" && value != null) {
                    nextFilters.push({ id: key, value });
                  }
                }
                engine.setColumnFilters(nextFilters);
                if (gate === "manual") search();
                setOpen(false);
              }}
              onReset={() => {
                engine.resetColumnFilters();
                if (gate === "manual") search();
              }}
              onCancel={() => setOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  );
}

function ToolbarFilterFormInner({
  def,
  columnFilters,
  onCommit,
  onReset,
  onCancel,
}: {
  def: FormDefinition;
  columnFilters: { id: string; value: unknown }[];
  onCommit: (values: Record<string, unknown>) => void;
  onReset: () => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation("common/base");
  const initial = initialFromEngine(def, columnFilters);

  const compactDef = useMemo(
    () => ({
      ...def,
      settings: {
        ...def.settings,
        density: "compact" as const,
      },
    }),
    [def]
  );

  const { form, setValue } = useForm(compactDef, initial);

  useEffect(() => {
    const next = initialFromEngine(compactDef, columnFilters);
    for (const [key, value] of Object.entries(next)) {
      if (form.values[key] !== value) setValue(key, value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnFilters, compactDef, setValue]);

  const compactTheme = useMemo(
    () => ({
      ...DEFAULT_FORM_THEME,
      density: "compact" as const,
    }),
    []
  );

  const fieldsToRender = (compactDef.fields ?? []).filter((f) => f.name !== "search");

  return (
    <FormThemeProvider theme={compactTheme}>
      <FormRegistryProvider value={{ form, registry: defaultRegistry }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onCommit(form.values as Record<string, unknown>);
          }}
        >
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/30">
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">
              {t("filterRecords", "Filter Records")}
            </span>
            <button
              type="button"
              onClick={() => {
                form.reset();
                onReset();
              }}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw size={11} /> {t("buttons.reset", "Reset")}
            </button>
          </div>

          <div className="flex flex-col gap-3 max-h-72 overflow-auto pr-1">
            {fieldsToRender.map((field, index) => {
              const fieldId = field.id ?? field.name;
              if (!fieldId) return null;
              const resolved = form.resolveField(String(fieldId));
              if (!resolved) return null;

              return (
                <div key={String(fieldId) || index} className="flex flex-col gap-1">
                  <FieldRenderer field={resolved} density="compact" />
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 mt-3 border-t border-border/30">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-muted/50 transition-colors"
            >
              {t("buttons.cancel", "Cancel")}
            </button>
            <button
              type="submit"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white shadow-sm hover:bg-primary/90 transition-colors"
            >
              <Check size={12} /> {t("buttons.submit", "Apply")}
            </button>
          </div>
        </form>
      </FormRegistryProvider>
    </FormThemeProvider>
  );
}
