import { useState } from "react";

import type {
  DataSource,
  HookSignature,
  TableQueryParams,
  TableServerResponse,
} from "@ui/table/types";
import { downloadBlob, downloadCSV } from "@ui/table/utils/csv";
import { useTableContext } from "@ui/table/core/TableEngineContext";
import { useTablePhysics } from "@ui/table/core/TablePhysicsContext";

/**
 * ExportModule — Service hook for CSV/JSON export.
 * Resolves rows respecting selection mode (selected rows vs all rows).
 */

export interface UseExportSignature<T = unknown> extends HookSignature {
  filename?: string;
  format?: "csv" | "json";
  transform?: (row: T) => Record<string, unknown>;
  onSuccess?: () => void;
  onError?: (err: Error) => void;
  /** Skip scope modal and export selected rows when selection exists */
  smartScope?: boolean;
}

export const ExportModule = Object.freeze({
  useExport<T>(sig: UseExportSignature<T> = {}) {
    const [_loading, _setLoading] = useState(false);
    const [_error, _setError] = useState<Error | null>(null);
    const { engine } = useTableContext<T>();
    const selectionMode = useTablePhysics((s) => s.selectionMode);
    const selectedRows = useTablePhysics((s) => s.selectedRows);
    const excludedRows = useTablePhysics((s) => s.excludedRows);

    const execute = async () => {
      if (!sig.enabled) return;
      _setLoading(true);
      _setError(null);
      try {
        const allRows = engine.getPrePaginationRowModel().rows;
        const rows =
          selectionMode === "ALL"
            ? allRows
                .filter((r) => !excludedRows.has(r.id))
                .map((r) => r.original)
            : selectedRows.size > 0
              ? allRows
                  .filter((r) => selectedRows.has(r.id))
                  .map((r) => r.original)
              : allRows.map((r) => r.original);

        const data = sig.transform ? rows.map(sig.transform) : rows;
        const filename = sig.filename ?? "export";

        if (sig.format === "json") {
          const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: "application/json",
          });
          downloadBlob(blob, `${filename}.json`);
        } else {
          const csv = await import("../../utils/csv").then((m) =>
            m.generateCSV(data)
          );
          downloadCSV(csv, `${filename}.csv`);
        }

        sig.onSuccess?.();
      } catch (err) {
        const e = err as Error;
        _setError(e);
        sig.onError?.(e);
      } finally {
        _setLoading(false);
      }
    };

    return { execute, loading: _loading, error: _error };
  },
});

export type { DataSource, TableServerResponse, TableQueryParams };
