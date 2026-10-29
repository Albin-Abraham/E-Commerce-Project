import { Button, DialogTrigger, Popover } from "react-aria-components";

import { FieldRenderer } from "@ui/form/FieldRenderer";
import { FormRegistryProvider } from "@ui/form/context/FormRegistryContext";
import { defaultRegistry } from "@ui/form";
import { useForm } from "@ui/form/hooks/useForm";
import { Filter } from "lucide-react";

import { useTableContext } from "@ui/table/core/TableEngineContext";
import { useTableFetch } from "@ui/table/core/TableFetchContext";
import { useTableMeta } from "@ui/table/core/TableMetaContext";
import { formDefFromFieldSchema } from "@ui/table/mdap/compileFiltersToFormDef";
import type { FormFieldSchema } from "@ui/table/types";

interface ColumnMetaSlice {
  fieldSchema?: FormFieldSchema;
  filterable?: boolean;
}

/**
 * MDAP column-filter popover. Uses FieldRenderer (select, date, text, …)
 * instead of a raw input. Writes engine column filter on Apply.
 */
export function ColumnFilterPopover({ columnId }: { columnId: string }) {
  const { engine } = useTableContext<unknown>();
  const tableMeta = useTableMeta();
  const { search, gate } = useTableFetch();
  const column = engine.getColumn(columnId);
  const colMeta = column?.columnDef?.meta as ColumnMetaSlice | undefined;
  const schema = colMeta?.fieldSchema;

  if (!schema || colMeta?.filterable === false) return null;
  if (column && !column.getCanFilter()) return null;

  const field: FormFieldSchema = {
    id: schema.id || columnId,
    name: schema.name || columnId,
    label: schema.label || columnId,
    type: schema.type,
    options: schema.options,
    properties: schema.properties,
    required: schema.required,
  };

  return (
    <span
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <DialogTrigger>
        <Button
          aria-label={`Filter ${field.label}`}
          data-testid={`table-col-filter-${columnId}`}
          className="p-0.5 rounded opacity-40 hover:opacity-100 text-muted-foreground outline-none"
        >
          <Filter size={12} />
        </Button>
        <Popover
          className="rounded-xl border border-border/40 bg-surface p-3 shadow-sm min-w-[220px] outline-none"
          placement="bottom start"
        >
          <ColumnFilterForm
            tableId={tableMeta.id}
            field={field}
            value={column?.getFilterValue()}
            onApply={(value) => {
              column?.setFilterValue(
                value === "" || value == null ? undefined : value
              );
              if (gate === "manual") search();
            }}
          />
        </Popover>
      </DialogTrigger>
    </span>
  );
}

function ColumnFilterForm({
  tableId,
  field,
  value,
  onApply,
}: {
  tableId: string;
  field: FormFieldSchema;
  value: unknown;
  onApply: (value: unknown) => void;
}) {
  const def = formDefFromFieldSchema(tableId, field);
  const { form } = useForm(def, { [field.name]: value ?? "" });

  return (
    <FormRegistryProvider value={{ form, registry: defaultRegistry }}>
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onApply(form.values[field.name]);
        }}
      >
        {form.resolveField(field.id) && (
          <FieldRenderer field={form.resolveField(field.id)!} />
        )}
        <button
          type="submit"
          className="px-3 py-1 rounded-lg bg-primary text-white text-xs font-bold"
        >
          Apply
        </button>
      </form>
    </FormRegistryProvider>
  );
}
