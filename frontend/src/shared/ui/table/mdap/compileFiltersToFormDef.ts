import type { FormDefinition } from "@ui/form/types";

import type { FormFieldSchema } from "../types";

/**
 * Compiles TableEntity.content.filters into a runtime FormDefinition.
 * Search is a field named "search"; every other field is a column filter.
 */
export function compileFiltersToFormDef(
  tableId: string,
  filters: FormFieldSchema[]
): FormDefinition {
  return {
    id: `${tableId}-filters`,
    title: "Filters",
    settings: {
      hideHeader: true,
      hideFooter: true,
      density: "compact",
    },
    fields: filters.map((f) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      label: f.label,
      initialValue: f.initialValue ?? "",
      required: f.required,
      options: f.options,
      validation: f.validation,
      properties: f.properties,
    })),
  };
}

export function formDefFromFieldSchema(
  tableId: string,
  field: FormFieldSchema
): FormDefinition {
  return compileFiltersToFormDef(tableId, [field]);
}
