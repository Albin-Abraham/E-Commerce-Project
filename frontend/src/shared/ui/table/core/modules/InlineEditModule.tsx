import { useMemo } from "react";

import type { FormFieldSchema, HookSignature, TableColumnMeta } from "@ui/table/types";
import { isCompleteFieldSchema } from "@ui/table/utils/validation";
import { InlineEditProvider } from "@ui/table/core/InlineEditContext";

/**
 * InlineEditModule — Thin wrapper that wires column schemas to InlineEditContext.
 *
 * No internal state — all editing state lives in the Form engine per row.
 * Consumer provides column definitions and callbacks; the module provides the Provider.
 */

export interface UseInlineEditSignature extends HookSignature {
  /** Column definitions with fieldSchema bindings */
  columns: TableColumnMeta[];
  /** Called when user commits changes */
  onSubmit: (rowId: string, changes: Record<string, unknown>) => Promise<void>;
  /** Optional validation before commit */
  validate?: (
    rowId: string,
    changes: Record<string, unknown>
  ) => Record<string, string> | null;
}

export const InlineEditModule = Object.freeze({
  useInlineEdit(sig: UseInlineEditSignature) {
    /** Build columnSchemas map from column definitions */
    const columnSchemas = useMemo(() => {
      const map: Record<string, FormFieldSchema> = {};
      if (sig.columns) {
        for (const col of sig.columns) {
          // `fieldSchema` only guarantees `type`; a form field needs
          // id/name/label too, so a partial descriptor is skipped rather than
          // silently producing an unaddressable input.
          if (col.fieldSchema && isCompleteFieldSchema(col.fieldSchema)) {
            map[col.id] = col.fieldSchema;
          }
        }
      }
      return map;
    }, [sig.columns]);

    /** Stable onSubmit ref to prevent Provider re-creation */
    const onSubmitRef = useMemo(() => sig.onSubmit, [sig.onSubmit]);
    const validateRef = useMemo(() => sig.validate, [sig.validate]);

    /** The Provider component — stable reference */
    const Provider = useMemo(() => {
      const _Provider = ({ children }: { children: React.ReactNode }) => (
        <InlineEditProvider
          columnSchemas={columnSchemas}
          onSubmit={onSubmitRef}
          validate={validateRef}
        >
          {children}
        </InlineEditProvider>
      );
      _Provider.displayName = "InlineEditProvider";
      return _Provider;
    }, [columnSchemas, onSubmitRef, validateRef]);

    return {
      /** Column schemas for form-based editing */
      columnSchemas,
      /** Provider component — wraps the table to enable form-based inline editing */
      Provider,
    };
  },
});
