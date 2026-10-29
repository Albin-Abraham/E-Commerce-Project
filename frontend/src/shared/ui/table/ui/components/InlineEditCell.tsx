import React from "react";

import { FieldRenderer } from "@ui/form/FieldRenderer";
import { FormRegistryProvider } from "@ui/form/context/FormRegistryContext";
import { defaultRegistry } from "@ui/form";

import { useOptionalInlineEditContext } from "../../core/InlineEditContext";

/**
 * InlineEditCell
 *
 * Renders a ZenithForm FieldRenderer when the row is being edited,
 * or falls back to displaying the default value.
 *
 * Type coercion is handled by the Form engine — no manual String/Number conversion.
 */

export interface InlineEditCellProps {
  rowId: string;
  colId: string;
  /** Original cell value from the data row */
  value: unknown;
  /** Default display renderer when not editing */
  children?: React.ReactNode;
}

/** Inner component that uses the form registry from context */
function InlineEditCellInner({
  rowId,
  colId,
  value,
  children,
}: InlineEditCellProps) {
  const ctx = useOptionalInlineEditContext();
  const isEditing = ctx?.isEditing(rowId) ?? false;

  if (!ctx || !isEditing) {
    return <>{children ?? String(value ?? "")}</>;
  }

  const field = ctx.getFieldForColumn(colId);

  if (!field || !ctx.activeForm) {
    throw new Error(
      `[ZenithTable] No form field schema defined for column "${colId}". ` +
        `Inline editing requires a valid FormFieldSchema provided via InlineEditProvider.`
    );
  }

  const currentValue = ctx.activeForm.values[colId];
  const error = ctx.errors[colId];

  return (
    <div className="w-full">
      <FieldRenderer
        field={field}
        value={currentValue}
        onChange={(val: unknown) => ctx.activeForm?.setValue(colId, val)}
        error={error}
      />
    </div>
  );
}

/**
 * InlineEditCell — exported component that wraps with FormRegistryProvider.
 * The FormRegistryProvider is needed for FieldRenderer to access the registry.
 */
export function InlineEditCell(props: InlineEditCellProps) {
  return (
    <FormRegistryProvider value={{ form: null, registry: defaultRegistry }}>
      <InlineEditCellInner {...props} />
    </FormRegistryProvider>
  );
}
