import type { FormField } from "./domain";

/**
 * COMPOSITE_DCS (Data Component Specification)
 *
 * This registry defines reusable "Schema Fragments".
 * These are NOT React components; they are engine-level templates that the
 * FormCore ECS (Engine Component Specification) expands at runtime.
 */
export const COMPOSITE_DCS: Record<string, Partial<FormField>[]> = {
  /**
   * address-group
   * A standard international address block.
   */
  "address-group": [
    {
      name: "street",
      type: "text",
      label: "Street Address",
      properties: { placeholder: "123 Main St", width: "full" },
    },
    {
      name: "city",
      type: "text",
      label: "City",
      properties: { width: "half" },
    },
    {
      name: "zip",
      type: "text",
      label: "ZIP / Postal Code",
      properties: { width: "half" },
    },
  ],

  /**
   * branch-address-group
   * A regional corporate branch address block with localized fields (line1, city, state).
   */
  "branch-address-group": [
    {
      name: "line1",
      type: "text",
      label: "Street Address",
      required: true,
      properties: { placeholder: "123 Main St", width: "full" },
      meta: { ui: { icon: "home" } },
    },
    {
      name: "city",
      type: "text",
      label: "City",
      required: true,
      properties: { width: "half" },
      meta: { ui: { icon: "map" } },
    },
    {
      name: "state",
      type: "text",
      label: "State/Province",
      required: true,
      properties: { width: "half" },
      meta: { ui: { icon: "map" } },
    },
  ],

  /**
   * table-filter-section
   * A high-density filtering block for data tables.
   */
  "table-filter-section": [
    {
      name: "search",
      type: "text",
      label: "Quick Search",
      meta: { ui: { icon: "Search" } },
      properties: { placeholder: "Search records...", width: "full" },
    },
    {
      name: "status",
      type: "select",
      label: "Status",
      options: [
        { label: "Active", value: "active" },
        { label: "Pending", value: "pending" },
        { label: "Archived", value: "archived" },
      ],
      properties: { width: "half" },
    },
    {
      name: "dateRange",
      type: "date",
      label: "Date Range",
      properties: { width: "half" },
    },
  ],
};

/**
 * Resolves a composite type to its DCS fields.
 */
export function getCompositeFields(
  type: string
): Partial<FormField>[] | undefined {
  return COMPOSITE_DCS[type];
}
