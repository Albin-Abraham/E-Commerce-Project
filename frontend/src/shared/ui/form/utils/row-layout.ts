import type { FormField, FormRow } from "../fields";

/**
 * Groups a flat list of fields into rows based on their column span (12-column grid).
 */
export function groupFieldsIntoRows(fields: FormField[]): FormRow[] {
  const rows: FormRow[] = [];
  let currentRow: FormField[] = [];
  let currentRowSpan = 0;

  fields.forEach((field, index) => {
    const fieldSpan = getFieldSpan(field);
    const startNewRow = field.properties?.startNewRow || false;

    // Start a new row if:
    // 1. This field is marked to start a new row
    // 2. Current row would exceed 12 columns
    // 3. This is the first field
    if (
      startNewRow ||
      currentRowSpan + fieldSpan > 12 ||
      currentRow.length === 0
    ) {
      if (currentRow.length > 0) {
        rows.push({
          id: `row-${rows.length}`,
          fields: [...currentRow],
        });
      }
      currentRow = [field];
      currentRowSpan = fieldSpan;
    } else {
      currentRow.push(field);
      currentRowSpan += fieldSpan;
    }

    // If this is the last field, add the current row
    if (index === fields.length - 1 && currentRow.length > 0) {
      rows.push({
        id: `row-${rows.length}`,
        fields: [...currentRow],
      });
    }
  });

  return rows;
}

/**
 * Calculates the column span (1-12) for a field based on its properties.
 * Now includes a "Smart Recommendation" layer if no explicit span is defined.
 */
export function getFieldSpan(field: FormField): number {
  const layout = field.layout;
  const columnSpan =
    layout && "columnSpan" in layout
      ? (layout as any).columnSpan
      : field.columnSpan;

  if (columnSpan) {
    return Math.min(12, Math.max(1, columnSpan));
  }

  // Legacy support for colSpan alias
  const colSpan = (layout as any)?.colSpan;
  if (colSpan) {
    return Math.min(12, Math.max(1, colSpan));
  }

  // Support explicit fullWidth flag
  if (layout?.fullWidth || field.properties?.fullWidth) {
    return 12;
  }

  // Switch based on semantic width property
  if (field.properties?.width) {
    switch (field.properties?.width) {
      case "quarter":
        return 3;
      case "third":
        return 4;
      case "half":
        return 6;
      case "full":
        return 12;
    }
  }

  // Switch based on semantic span property
  const semanticSpan = (layout as any)?.span || field.properties?.span;
  if (semanticSpan) {
    switch (semanticSpan) {
      case "quarter":
        return 3;
      case "third":
        return 4;
      case "half":
        return 6;
      case "full":
        return 12;
    }
  }

  // --- SMART RECOMMENDATION ENGINE ---
  // If no explicit size is defined, we infer it from the field's purpose.
  return recommendSmartSpan(field);
}

/**
 * recommendSmartSpan: Heuristic to determine the most "comfortable" span
 * for a field based on its type and identifier.
 */
function recommendSmartSpan(field: FormField): number {
  const type = field.type;
  const id = field.id.toLowerCase();
  const hasDescription =
    Boolean(field.description) ||
    Boolean((field.properties as any)?.description) ||
    Boolean((field.properties as any)?.helpText);

  // Full-width candidates (12 columns = 100%)
  if (
    type === "textarea" ||
    type === "container" ||
    type === "card" ||
    type === "repeater" ||
    type === "section" ||
    type === "group" ||
    type === "fieldset" ||
    type === "divider" ||
    type === "paragraph" ||
    type === "header" ||
    type === "file" ||
    type === "code" ||
    type === "code_input" ||
    (type === "switch" && hasDescription) ||
    id.includes("description") ||
    id.includes("address") ||
    id.includes("comment") ||
    id.includes("summary") ||
    id.includes("organization") ||
    id.includes("org_")
  ) {
    return 12;
  }

  // Half-width candidates (6 columns = 50%)
  if (
    type === "select" ||
    type === "autocomplete" ||
    type === "multiselect" ||
    type === "multiSelect" ||
    type === "radio" ||
    type === "phone" ||
    type === "switch" ||
    id.includes("name") ||
    id.includes("title") ||
    id.includes("email") ||
    id.includes("phone") ||
    id.includes("url") ||
    id.includes("password")
  ) {
    return 6;
  }

  // Quarter-width candidates (3 columns = 25% compact inputs)
  if (
    type === "number" ||
    type === "date" ||
    id.includes("zip") ||
    (id.includes("code") && type !== "code" && type !== "code_input") ||
    id.includes("id") ||
    id.includes("amount")
  ) {
    return 3;
  }

  return 4; // Standard 3-column default (33.3%)
}

/**
 * Returns the Tailwind CSS class for a given column span.
 *
 * Static span map — all literals are required for Tailwind JIT to safelist the classes.
 * Mobile-first: columns 1-11 stack to full width on small screens,
 * then apply their defined span at the md (≥768px) breakpoint.
 *
 * To change breakpoints, update the strings below and add the new combinations
 * to the SAFELIST in tailwind-safelist.ts.
 */
const GRID_SPANS: Record<number, string> = {
  1: "col-span-12 md:col-span-1",
  2: "col-span-12 md:col-span-2",
  3: "col-span-12 md:col-span-3",
  4: "col-span-12 md:col-span-4",
  5: "col-span-12 md:col-span-5",
  6: "col-span-12 md:col-span-6",
  7: "col-span-12 md:col-span-7",
  8: "col-span-12 md:col-span-8",
  9: "col-span-12 md:col-span-9",
  10: "col-span-12 md:col-span-10",
  11: "col-span-12 md:col-span-11",
  12: "col-span-12", // Always full-width — no md: prefix needed
};

/**
 * Returns the responsive Tailwind CSS class(es) for a given column span.
 *
 * All non-full-width spans are rendered as `col-span-12 md:col-span-N`:
 * full width on mobile, targeted span on tablet and above (mobile-first).
 * Span 12 returns `col-span-12` only (always full width at all breakpoints).
 */
const CUSTOM_GRID_SPANS: Record<number, Record<number, string>> = {
  2: { 1: "col-span-1", 2: "col-span-2" },
  3: { 1: "col-span-1", 2: "col-span-2", 3: "col-span-3" },
  4: { 1: "col-span-1", 2: "col-span-2", 3: "col-span-3", 4: "col-span-4" },
  6: {
    1: "col-span-1",
    2: "col-span-2",
    3: "col-span-3",
    4: "col-span-4",
    5: "col-span-5",
    6: "col-span-6",
  },
};

const BASE_COL_SPANS: Record<number, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
  5: "col-span-5",
  6: "col-span-6",
  7: "col-span-7",
  8: "col-span-8",
  9: "col-span-9",
  10: "col-span-10",
  11: "col-span-11",
  12: "col-span-12",
};

export function getGridClassName(
  span: number,
  totalColumns: number = 12
): string {
  const safeSpan = Math.max(1, Math.min(totalColumns, span));

  if (totalColumns === 12) {
    return GRID_SPANS[safeSpan] ?? "col-span-12";
  }

  return (
    CUSTOM_GRID_SPANS[totalColumns]?.[safeSpan] ??
    BASE_COL_SPANS[Math.min(12, safeSpan)] ??
    "col-span-1"
  );
}
