import { useCallback, useMemo, useState } from "react";

import type { HookSignature, TableActionContext } from "@ui/table/types";
import { useTablePhysics } from "@ui/table/core/TablePhysicsContext";

/**
 * BulkDeleteModule
 *
 * Selection-aware bulk delete with confirmation.
 * Resolves selected IDs respecting ALL / PAGE / MANUAL modes and excluded rows.
 * Consumer provides the API call and optional confirmation logic.
 */

export interface UseBulkDeleteSignature extends HookSignature {
  /** Call the server to delete the given IDs */
  bulkDeleteApi: (ids: string[], context: TableActionContext) => Promise<void>;
  /** Optional confirmation dialog — return true to proceed */
  confirmDelete?: (
    count: number,
    context: TableActionContext
  ) => Promise<boolean> | boolean;
  /** Called after successful deletion */
  onSuccess?: () => void;
  /** Called on error */
  onError?: (err: Error) => void;
  /** Filters/search context to include in the delete request */
  filters?: Record<string, unknown>;
  search?: string;
}

export const BulkDeleteModule = Object.freeze({
  useBulkDelete(sig: UseBulkDeleteSignature) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const selectedRows = useTablePhysics((s) => s.selectedRows);
    const excludedRows = useTablePhysics((s) => s.excludedRows);
    const selectionMode = useTablePhysics((s) => s.selectionMode);
    const totalDataCount = useTablePhysics((s) => s.totalDataCount);
    const resetSelection = useTablePhysics((s) => s.resetSelection);

    /** Whether there are any items selected (including ALL mode) */
    const hasSelection = useMemo(
      () => selectedRows.size > 0 || selectionMode === "ALL",
      [selectedRows, selectionMode]
    );

    /** Count of items that will be deleted */
    const selectedCount = useMemo(() => {
      if (selectionMode === "ALL") {
        return totalDataCount - excludedRows.size;
      }
      return selectedRows.size;
    }, [selectionMode, selectedRows, totalDataCount, excludedRows]);

    /** Execute the bulk delete */
    const execute = useCallback(async () => {
      if (!sig.enabled || !hasSelection) return;

      const context: TableActionContext = {
        mode: selectionMode,
        selectedIds: Array.from(selectedRows),
        excludedIds: Array.from(excludedRows),
        totalCount: totalDataCount,
      };

      // Confirmation
      if (sig.confirmDelete) {
        const confirmed = await sig.confirmDelete(selectedCount, context);
        if (!confirmed) return;
      }

      setLoading(true);
      setError(null);

      try {
        // For ALL mode on server-side tables, pass filters/search so backend knows what 'all' means
        const ids =
          selectionMode === "ALL"
            ? ["__all__"] // Signal to backend: delete all matching
            : Array.from(selectedRows);

        await sig.bulkDeleteApi(ids, {
          ...context,
          filters: sig.filters,
          search: sig.search,
        } as TableActionContext & {
          filters?: Record<string, unknown>;
          search?: string;
        });

        resetSelection();
        sig.onSuccess?.();
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        sig.onError?.(e);
      } finally {
        setLoading(false);
      }
    }, [
      sig.enabled,
      sig.confirmDelete,
      sig.bulkDeleteApi,
      sig.onSuccess,
      sig.onError,
      sig.filters,
      sig.search,
      hasSelection,
      selectionMode,
      selectedRows,
      excludedRows,
      totalDataCount,
      selectedCount,
      resetSelection,
    ]);

    return useMemo(
      () => ({
        execute,
        loading,
        error,
        hasSelection,
        selectedCount,
      }),
      [execute, loading, error, hasSelection, selectedCount]
    );
  },
});
