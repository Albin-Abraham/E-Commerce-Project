import { useEffect } from "react";
import { FieldRenderer } from "@ui/form/FieldRenderer";
import { FormRegistryProvider } from "@ui/form/context/FormRegistryContext";
import { defaultRegistry } from "@ui/form";
import { useForm } from "@ui/form/hooks/useForm";
import type { FormDefinition } from "@ui/form/types";

import { useTableContext } from "@ui/table/core/TableEngineContext";
import { useTableFetch } from "@ui/table/core/TableFetchContext";
import { useTableChrome } from "@ui/table/mdap/TableChromeContext";
import { useTableFilterForm } from "@ui/table/mdap/TableFilterContext";
import { FilterStatusBadge } from "./FilterStatusBadge";

function fieldNames(def: FormDefinition): string[] {
  return (def.fields ?? []).map((f) => String(f.name));
}

function initialFromEngine(
  def: FormDefinition,
  globalFilter: unknown,
  columnFilters: { id: string; value: unknown }[]
): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  for (const name of fieldNames(def)) {
    if (name === "search") {
      values[name] = String(globalFilter ?? "");
    } else {
      values[name] = columnFilters.find((f) => f.id === name)?.value ?? "";
    }
  }
  return values;
}

/**
 * MDAP filter chrome. Fields come from TableEntity.content.filters
 * (compiled FormDefinition). `search` writes globalFilter; other names
 * write column filters. Enter / Search uses gate like Toolbar.
 */
export function TableFilterBar() {
  const def = useTableFilterForm();
  const chrome = useTableChrome();
  const { engine } = useTableContext<unknown>();
  const { search, gate } = useTableFetch();

  if (!def?.fields?.length && !chrome.filterStatusBadge) return null;

  return (
    <div className="flex items-end gap-3 flex-wrap">
      {chrome.filterStatusBadge ? <FilterStatusBadge /> : null}
      {def?.fields?.length ? (
        <TableFilterBarInner
          def={def}
          engineSearch={String(engine.getState().globalFilter ?? "")}
          columnFilters={engine.getState().columnFilters}
          onCommit={(values) => {
            const nextFilters: { id: string; value: unknown }[] = [];
            for (const [key, value] of Object.entries(values)) {
              if (key === "search") {
                engine.setGlobalFilter(value ?? "");
                continue;
              }
              if (value !== "" && value != null) {
                nextFilters.push({ id: key, value });
              }
            }
            engine.setColumnFilters(nextFilters);
            if (gate === "manual") search();
          }}
        />
      ) : null}
    </div>
  );
}

function TableFilterBarInner({
  def,
  engineSearch,
  columnFilters,
  onCommit,
}: {
  def: FormDefinition;
  engineSearch: string;
  columnFilters: { id: string; value: unknown }[];
  onCommit: (values: Record<string, unknown>) => void;
}) {
  const initial = initialFromEngine(def, engineSearch, columnFilters);
  const { form, setValue } = useForm(def, initial);

  useEffect(() => {
    const next = initialFromEngine(def, engineSearch, columnFilters);
    for (const [key, value] of Object.entries(next)) {
      if (form.values[key] !== value) setValue(key, value);
    }
    // Engine is source of truth; do not depend on `form` (new object each render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engineSearch, columnFilters, def, setValue]);

  return (
    <FormRegistryProvider value={{ form, registry: defaultRegistry }}>
      <form
        data-testid="table-filter-bar"
        className="flex items-end gap-3 flex-wrap"
        onSubmit={(e) => {
          e.preventDefault();
          onCommit(form.values as Record<string, unknown>);
        }}
      >
        {(def.fields ?? []).map((field, index) => {
          // `id` is optional on a raw (pre-normalization) field — it is derived
          // from `key`/`name` during normalization, so fall back for the lookup.
          const fieldId = field.id ?? field.name;
          if (!fieldId) return null;
          const resolved = form.resolveField(String(fieldId));
          if (!resolved) return null;
          return (
            <div key={String(fieldId) || index} className="min-w-[160px]">
              <FieldRenderer field={resolved} />
            </div>
          );
        })}
        <button
          type="submit"
          className="px-4 py-1.5 rounded-xl bg-primary text-white text-sm font-bold"
        >
          Search
        </button>
      </form>
    </FormRegistryProvider>
  );
}
