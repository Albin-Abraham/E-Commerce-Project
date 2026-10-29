import { useCallback, useMemo, useState } from "react";

import {
  type ExportTaskStatusResult,
  useExportTask,
} from "@ui/table/hooks/useExportTask";
import type { HookSignature } from "@ui/table/types";
import { extractQueryParams } from "@ui/table/utils/query-params";
import { useTableContext } from "@ui/table/core/TableEngineContext";
import { useTablePhysics } from "@ui/table/core/TablePhysicsContext";

/**
 * ServerExportModule
 *
 * Server-side export with progress tracking and file download.
 * Resolves rows respecting selection mode (MANUAL / PAGE / ALL).
 * Delegates actual API calls to the consumer-provided fetchers.
 */

export type ExportFormat = "csv" | "excel" | "pdf";

export interface UseServerExportSignature extends HookSignature {
  /** Create the export task on the server */
  createExport: (
    params: ServerExportParams
  ) => Promise<ServerExportCreateResponse>;
  /** Poll task status */
  getStatus: (taskId: string) => Promise<ExportTaskStatusResult>;
  /** Download the completed file */
  downloadFile: (taskId: string, filename?: string) => Promise<void>;
  /** Default filename (without extension) */
  filename?: string;
  /** Available formats — default: ["csv", "excel", "pdf"] */
  formats?: ExportFormat[];
  /** Polling interval in ms — default 2000 */
  pollInterval?: number;
  onSuccess?: (filename: string | null) => void;
  onError?: (err: Error) => void;
}

export interface ServerExportParams {
  format: ExportFormat;
  ids: string;
  excluded_ids?: string;
  filters?: Record<string, unknown>;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface ServerExportCreateResponse {
  task_id?: string;
  status?: string;
  filename?: string;
  error?: string;
}

export interface ExportScope {
  type: "selected" | "all";
  label: string;
  count: number;
}

export const ServerExportModule = Object.freeze({
  useServerExport<T>(sig: UseServerExportSignature) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [isScopeModalOpen, setIsScopeModalOpen] = useState(false);
    const [pendingFormat, setPendingFormat] = useState<ExportFormat>("csv");

    const { engine } = useTableContext<T>();
    const selectionMode = useTablePhysics((s) => s.selectionMode);
    const selectedRows = useTablePhysics((s) => s.selectedRows);
    const excludedRows = useTablePhysics((s) => s.excludedRows);
    const totalDataCount = useTablePhysics((s) => s.totalDataCount);

    const task = useExportTask({ pollInterval: sig.pollInterval });

    /** Resolve row IDs based on current selection mode */
    const resolveExportParams = useCallback(
      (format: ExportFormat, scope: "selected" | "all"): ServerExportParams => {
        const query = extractQueryParams(engine.getState());
        let ids: string[];
        let excluded: string[] = [];

        if (scope === "all") {
          ids = ["select_all"];
        } else if (selectionMode === "ALL") {
          ids = ["select_all"];
          excluded = Array.from(excludedRows);
        } else if (selectedRows.size > 0) {
          ids = Array.from(selectedRows);
        } else {
          ids = engine.getPrePaginationRowModel().rows.map((r) => r.id);
        }

        return {
          format,
          ids: ids.join(","),
          excluded_ids: excluded.length > 0 ? excluded.join(",") : undefined,
          filters: query.filters,
          search: query.search,
          page: scope === "all" ? undefined : query.page,
          page_size: scope === "all" ? undefined : query.pageSize,
        };
      },
      [engine, selectionMode, selectedRows, excludedRows]
    );

    /** Determine available export scopes */
    const getExportScopes = useCallback((): ExportScope[] => {
      const scopes: ExportScope[] = [];
      const hasSelected =
        selectedRows.size > 0 ||
        selectionMode === "PAGE" ||
        selectionMode === "ALL";

      if (hasSelected) {
        scopes.push({
          type: "selected",
          label: "Selected Rows",
          count:
            selectionMode === "ALL"
              ? Math.max(0, totalDataCount - excludedRows.size)
              : selectedRows.size,
        });
      }

      scopes.push({
        type: "all",
        label: "All Filtered Data",
        count: totalDataCount,
      });

      return scopes;
    }, [selectionMode, selectedRows, excludedRows, totalDataCount]);

    /** Execute the export with resolved scope */
    const executeExport = useCallback(
      async (format: ExportFormat, scope: "selected" | "all") => {
        if (!sig.enabled) return;

        setLoading(true);
        setError(null);
        setIsScopeModalOpen(false);

        try {
          const params = resolveExportParams(format, scope);
          await task.startExport(() => sig.createExport(params), {
            getStatus: sig.getStatus,
            onCompleted: (filename) => {
              sig.onSuccess?.(filename);
              setLoading(false);
            },
            onFailed: (msg) => {
              const err = new Error(msg);
              setError(err);
              sig.onError?.(err);
              setLoading(false);
            },
          });
        } catch (err) {
          const e = err instanceof Error ? err : new Error(String(err));
          setError(e);
          sig.onError?.(e);
          setLoading(false);
        }
      },
      [
        sig.enabled,
        sig.createExport,
        sig.getStatus,
        sig.downloadFile,
        sig.onSuccess,
        sig.onError,
        resolveExportParams,
        task,
      ]
    );

    /** Handle format selection — determines if scope modal is needed */
    const handleExport = useCallback(
      (format: ExportFormat) => {
        if (!sig.enabled) return;

        setPendingFormat(format);
        const hasSelection =
          selectedRows.size > 0 ||
          selectionMode === "ALL" ||
          selectionMode === "PAGE";

        if (hasSelection) {
          // Has selection — export selected directly
          executeExport(format, "selected");
        } else {
          // No selection — show scope modal
          setIsScopeModalOpen(true);
        }
      },
      [sig.enabled, selectedRows, selectionMode, executeExport]
    );

    /** Download the completed export file */
    const handleDownload = useCallback(async () => {
      if (task.taskId) {
        try {
          await sig.downloadFile(task.taskId, task.filename ?? undefined);
          task.reset();
        } catch (err) {
          const e = err instanceof Error ? err : new Error(String(err));
          setError(e);
          sig.onError?.(e);
        }
      }
    }, [task.taskId, task.filename, task.reset, sig.downloadFile, sig.onError]);

    /** Close the export task modal */
    const handleCloseModal = useCallback(() => {
      if (task.status === "processing") {
        task.cancel();
      }
      task.reset();
      setLoading(false);
    }, [task]);

    return useMemo(
      () => ({
        executeExport,
        handleExport,
        handleDownload,
        handleCloseModal,
        loading,
        error,
        task: {
          status: task.status,
          progress: task.progress,
          filename: task.filename,
          error: task.error,
          taskId: task.taskId,
        },
        isScopeModalOpen,
        setIsScopeModalOpen,
        pendingFormat,
        scopes: getExportScopes(),
      }),
      [
        executeExport,
        handleExport,
        handleDownload,
        handleCloseModal,
        loading,
        error,
        task.status,
        task.progress,
        task.filename,
        task.error,
        task.taskId,
        isScopeModalOpen,
        pendingFormat,
        getExportScopes,
      ]
    );
  },
});
