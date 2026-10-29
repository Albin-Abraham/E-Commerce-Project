import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { TableTaskStatus } from "@ui/table/types";

/**
 * useExportTask
 *
 * State machine for a long-running export task:
 * idle → pending | queued | processing → completed | failed
 *
 * Tracks task ID, progress %, filename, and error state.
 * Provides start/cancel/reset lifecycle methods.
 */

export type ExportTaskStatus = TableTaskStatus;

export interface ExportTaskState {
  status: ExportTaskStatus;
  taskId: string | null;
  progress: number;
  filename: string | null;
  error: string | null;
}

export interface UseExportTaskOptions {
  /** Polling interval in ms — default 2000 */
  pollInterval?: number;
  /** Auto-close delay after completion in ms — default 0 (no auto-close) */
  autoCloseDelay?: number;
}

export function useExportTask(options: UseExportTaskOptions = {}) {
  const { pollInterval = 2000, autoCloseDelay = 0 } = options;

  const [task, setTask] = useState<ExportTaskState>({
    status: "idle",
    taskId: null,
    progress: 0,
    filename: null,
    error: null,
  });

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbacksRef = useRef<{
    getStatus?: (taskId: string) => Promise<ExportTaskStatusResult>;
    onCompleted?: (filename: string | null) => void;
    onFailed?: (error: string) => void;
  }>({});

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const stopAutoClose = useCallback(() => {
    if (autoCloseRef.current) {
      clearTimeout(autoCloseRef.current);
      autoCloseRef.current = null;
    }
  }, []);

  const scheduleAutoClose = useCallback(() => {
    if (autoCloseDelay <= 0) return;
    autoCloseRef.current = setTimeout(() => {
      setTask({
        status: "idle",
        taskId: null,
        progress: 0,
        filename: null,
        error: null,
      });
    }, autoCloseDelay);
  }, [autoCloseDelay]);

  const startPolling = useCallback(
    (taskId: string) => {
      stopPolling();
      pollingRef.current = setInterval(async () => {
        try {
          const result = await callbacksRef.current.getStatus?.(taskId);
          if (!result) return;

          const status = (result.status || "").toLowerCase();

          setTask((prev) => ({
            ...prev,
            progress: result.progress ?? prev.progress,
            filename: result.filename ?? prev.filename,
          }));

          if (status === "pending" || status === "queued") {
            setTask((prev) => ({
              ...prev,
              status: status as ExportTaskStatus,
            }));
          } else if (status === "processing") {
            setTask((prev) => ({ ...prev, status: "processing" }));
          }

          if (status === "completed" || status === "success") {
            stopPolling();
            setTask((prev) => ({
              ...prev,
              status: "completed",
              progress: 100,
              filename: result.filename ?? prev.filename,
            }));
            callbacksRef.current.onCompleted?.(result.filename ?? null);
            scheduleAutoClose();
          } else if (status === "failed" || status === "failure") {
            stopPolling();
            setTask((prev) => ({
              ...prev,
              status: "failed",
              error: result.error || "Export failed.",
            }));
            callbacksRef.current.onFailed?.(result.error || "Export failed.");
          }
        } catch {
          // Transient error — keep polling
        }
      }, pollInterval);
    },
    [pollInterval, stopPolling, scheduleAutoClose]
  );

  const startExport = useCallback(
    async (
      apiCall: () => Promise<{
        task_id?: string;
        status?: string;
        filename?: string;
      }>,
      callbacks?: {
        getStatus?: (taskId: string) => Promise<ExportTaskStatusResult>;
        onCompleted?: (filename: string | null) => void;
        onFailed?: (error: string) => void;
      }
    ) => {
      stopPolling();
      stopAutoClose();
      setTask({
        status: "processing",
        taskId: null,
        progress: 0,
        filename: null,
        error: null,
      });

      if (callbacks) {
        callbacksRef.current = callbacks;
      }

      try {
        const response = await apiCall();
        const taskId = response.task_id || null;
        const status = (response.status || "").toLowerCase();

        setTask((prev) => ({
          ...prev,
          taskId,
          filename: response.filename ?? null,
        }));

        if (status === "completed" || status === "success") {
          setTask((prev) => ({
            ...prev,
            status: "completed",
            progress: 100,
            filename: response.filename ?? null,
          }));
          callbacks?.onCompleted?.(response.filename ?? null);
          scheduleAutoClose();
        } else if (status === "failed" || status === "failure") {
          setTask((prev) => ({
            ...prev,
            status: "failed",
            error: "Export failed.",
          }));
          callbacks?.onFailed?.("Export failed.");
        } else if (taskId) {
          startPolling(taskId);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Export failed.";
        setTask((prev) => ({ ...prev, status: "failed", error: msg }));
        callbacks?.onFailed?.(msg);
      }
    },
    [stopPolling, stopAutoClose, startPolling, scheduleAutoClose]
  );

  const cancel = useCallback(() => {
    stopPolling();
    stopAutoClose();
    setTask((prev) => ({ ...prev, status: "idle", error: null }));
  }, [stopPolling, stopAutoClose]);

  const reset = useCallback(() => {
    stopPolling();
    stopAutoClose();
    setTask({
      status: "idle",
      taskId: null,
      progress: 0,
      filename: null,
      error: null,
    });
  }, [stopPolling, stopAutoClose]);

  useEffect(() => {
    return () => {
      stopPolling();
      stopAutoClose();
    };
  }, [stopPolling, stopAutoClose]);

  return useMemo(
    () => ({
      ...task,
      startExport,
      cancel,
      reset,
    }),
    [task, startExport, cancel, reset]
  );
}

/** Status result from a polling endpoint */
export interface ExportTaskStatusResult {
  status: string;
  progress?: number;
  filename?: string;
  error?: string;
}
