import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { TableTaskStatus } from "@ui/table/types";

/**
 * useImportTask
 *
 * State machine for a long-running import task:
 * idle → uploading → processing → completed | failed
 *
 * Tracks upload progress, processing progress, summary (created/updated/failed),
 * and row-level error details.
 */

export type ImportTaskStatus = TableTaskStatus;

export interface ImportSummary {
  created_count: number;
  updated_count: number;
  error_count: number;
}

export interface ImportError {
  row: number;
  data?: Record<string, unknown>;
  error: string | Record<string, string[]>;
}

export interface ImportTaskState {
  status: ImportTaskStatus;
  taskId: string | null;
  progress: number;
  uploadProgress: number;
  isUploading: boolean;
  summary: ImportSummary | null;
  errors: ImportError[];
  error: string | null;
}

export interface UseImportTaskOptions {
  /** Polling interval in ms — default 2000 */
  pollInterval?: number;
  /** Auto-close delay after successful completion in ms — default 1500 */
  autoCloseDelay?: number;
}

export function useImportTask(options: UseImportTaskOptions = {}) {
  const { pollInterval = 2000, autoCloseDelay = 1500 } = options;

  const [task, setTask] = useState<ImportTaskState>({
    status: "idle",
    taskId: null,
    progress: 0,
    uploadProgress: 0,
    isUploading: false,
    summary: null,
    errors: [],
    error: null,
  });

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbacksRef = useRef<{
    getStatus?: (taskId: string) => Promise<ImportStatusResult>;
    onRefresh?: () => void;
    onCompleted?: (summary: ImportSummary | null) => void;
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

  const startPolling = useCallback(
    (taskId: string) => {
      stopPolling();
      pollingRef.current = setInterval(async () => {
        try {
          const result = await callbacksRef.current.getStatus?.(taskId);
          if (!result) return;

          const status = (result.status || "").toLowerCase();
          const percentage = result.percentage ?? result.progress ?? 0;

          setTask((prev) => ({ ...prev, progress: percentage }));

          if (result.summary) {
            setTask((prev) => ({ ...prev, summary: result.summary! }));
          }

          if (result.errors) {
            setTask((prev) => ({ ...prev, errors: result.errors! }));
          }

          if (status === "pending" || status === "queued") {
            setTask((prev) => ({
              ...prev,
              status: status as ImportTaskStatus,
            }));
          } else if (status === "processing") {
            setTask((prev) => ({ ...prev, status: "processing" }));
          }

          if (status === "success" || status === "completed") {
            stopPolling();
            setTask((prev) => ({
              ...prev,
              status: "completed",
              progress: 100,
            }));
            callbacksRef.current.onRefresh?.();
            callbacksRef.current.onCompleted?.(result.summary ?? null);

            if (!result.summary?.error_count && autoCloseDelay > 0) {
              autoCloseRef.current = setTimeout(() => {
                setTask((prev) => ({
                  ...prev,
                  status: "idle",
                  taskId: null,
                  progress: 0,
                  summary: null,
                  errors: [],
                  error: null,
                }));
              }, autoCloseDelay);
            }
          } else if (status === "failed" || status === "failure") {
            stopPolling();
            const msg = result.error || "Import failed.";
            setTask((prev) => ({ ...prev, status: "failed", error: msg }));
            callbacksRef.current.onFailed?.(msg);
          }
        } catch {
          // Transient error — keep polling
        }
      }, pollInterval);
    },
    [pollInterval, stopPolling, autoCloseDelay]
  );

  /** Upload a file and start tracking the import task */
  const uploadFile = useCallback(
    async (
      uploadFn: (
        onProgress: (pct: number) => void
      ) => Promise<ImportUploadResult>,
      callbacks?: {
        getStatus?: (taskId: string) => Promise<ImportStatusResult>;
        onRefresh?: () => void;
        onCompleted?: (summary: ImportSummary | null) => void;
        onFailed?: (error: string) => void;
      }
    ) => {
      stopPolling();
      stopAutoClose();
      setTask({
        status: "uploading",
        taskId: null,
        progress: 0,
        uploadProgress: 0,
        isUploading: true,
        summary: null,
        errors: [],
        error: null,
      });

      if (callbacks) {
        callbacksRef.current = callbacks;
      }

      try {
        const result = await uploadFn((pct) => {
          setTask((prev) => ({ ...prev, uploadProgress: pct }));
        });

        const status = (result.status || "").toLowerCase();
        const taskId = result.task_id || null;

        setTask((prev) => ({
          ...prev,
          isUploading: false,
          taskId,
          uploadProgress: 100,
          summary: result.summary ?? null,
          errors: result.errors ?? [],
        }));

        if (status === "success" || status === "completed") {
          setTask((prev) => ({ ...prev, status: "completed", progress: 100 }));
          callbacks?.onRefresh?.();
          callbacks?.onCompleted?.(result.summary ?? null);

          if (!result.summary?.error_count && autoCloseDelay > 0) {
            autoCloseRef.current = setTimeout(() => {
              setTask((prev) => ({
                ...prev,
                status: "idle",
                taskId: null,
                progress: 0,
                summary: null,
                errors: [],
                error: null,
              }));
            }, autoCloseDelay);
          }
        } else if (status === "failed" || status === "failure") {
          const msg = result.error || "Import failed.";
          setTask((prev) => ({ ...prev, status: "failed", error: msg }));
          callbacks?.onFailed?.(msg);
        } else if (taskId) {
          setTask((prev) => ({ ...prev, status: "processing" }));
          startPolling(taskId);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Import failed.";
        setTask((prev) => ({
          ...prev,
          status: "failed",
          isUploading: false,
          error: msg,
        }));
        callbacks?.onFailed?.(msg);
      }
    },
    [stopPolling, stopAutoClose, startPolling, autoCloseDelay]
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
      uploadProgress: 0,
      isUploading: false,
      summary: null,
      errors: [],
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
      uploadFile,
      cancel,
      reset,
    }),
    [task, uploadFile, cancel, reset]
  );
}

/** Result from the initial upload endpoint */
export interface ImportUploadResult {
  task_id?: string;
  status?: string;
  summary?: ImportSummary;
  errors?: ImportError[];
  error?: string;
  percentage?: number;
  progress?: number;
}

/** Status result from a polling endpoint */
export interface ImportStatusResult {
  status: string;
  percentage?: number;
  progress?: number;
  summary?: ImportSummary;
  errors?: ImportError[];
  error?: string;
}
