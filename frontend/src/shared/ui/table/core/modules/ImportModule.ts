import { useCallback, useMemo, useRef, useState } from "react";

import {
  type ImportStatusResult,
  type ImportSummary,
  type ImportUploadResult,
  useImportTask,
} from "@ui/table/hooks/useImportTask";
import type { HookSignature } from "@ui/table/types";
import { downloadCSV, generateCSV, parseCSV } from "@ui/table/utils/csv";
import { useTableContext } from "@ui/table/core/TableEngineContext";

/**
 * ImportModule
 *
 * CSV/Excel import with file validation, upload progress, and status polling.
 * Validates file extension and size before upload.
 * Tracks upload progress → processing progress → completion with summary.
 */

export interface ImportFileValidationRules {
  /** Allowed file extensions — default: [".csv", ".xlsx", ".xls"] */
  allowedExtensions?: string[];
  /** Max file size in bytes — default: 10MB */
  maxFileSize?: number;
  /** Min file size in bytes — default: 1 */
  minFileSize?: number;
  /** Required CSV headers — if provided, file must contain all these columns */
  requiredHeaders?: string[];
}

export type ImportFileErrorCode =
  | "INVALID_EXTENSION"
  | "FILE_TOO_LARGE"
  | "FILE_TOO_SMALL"
  | "MISSING_HEADERS";

export interface ImportFileError {
  code: ImportFileErrorCode;
  message: string;
  value?: unknown;
}

export interface UseImportSignature extends HookSignature {
  /** Upload function — consumer provides their own HTTP client */
  uploadFile: (
    file: File,
    additionalData?: Record<string, unknown>,
    onProgress?: (percent: number) => void
  ) => Promise<ImportUploadResult>;
  /** Poll task status */
  getStatus: (taskId: string) => Promise<ImportStatusResult>;
  /** Called after successful import */
  onRefresh?: () => void;
  /** Additional data to send with the upload */
  additionalData?: Record<string, unknown>;
  /** File validation rules */
  fileValidation?: ImportFileValidationRules;
  /** Auto-close delay after success in ms — default 1500 */
  autoCloseDelay?: number;
  onSuccess?: (summary: ImportSummary | null) => void;
  onError?: (error: string) => void;
}

const DEFAULT_EXTENSIONS = [".csv", ".xlsx", ".xls"];
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

export const ImportModule = Object.freeze({
  useImport(sig: UseImportSignature) {
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [fileErrors, setFileErrors] = useState<ImportFileError[]>([]);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const { engine } = useTableContext<unknown>();

    const task = useImportTask({
      autoCloseDelay: sig.autoCloseDelay,
    });

    /** Validate a file against the configured rules */
    const validateFile = useCallback(
      async (file: File): Promise<ImportFileError[]> => {
        const rules = sig.fileValidation;
        if (!rules) return [];

        const errors: ImportFileError[] = [];
        const extensions = rules.allowedExtensions ?? DEFAULT_EXTENSIONS;
        const maxSize = rules.maxFileSize ?? DEFAULT_MAX_SIZE;
        const minSize = rules.minFileSize ?? 1;

        // Extension check
        const ext = "." + file.name.split(".").pop()?.toLowerCase();
        if (!extensions.includes(ext)) {
          errors.push({
            code: "INVALID_EXTENSION",
            message: `File type "${ext}" is not allowed. Accepted: ${extensions.join(", ")}`,
            value: ext,
          });
        }

        // Size checks
        if (file.size > maxSize) {
          const mb = (maxSize / (1024 * 1024)).toFixed(1);
          errors.push({
            code: "FILE_TOO_LARGE",
            message: `File exceeds ${mb}MB limit. Actual: ${(file.size / (1024 * 1024)).toFixed(1)}MB`,
            value: file.size,
          });
        }

        if (file.size < minSize) {
          errors.push({
            code: "FILE_TOO_SMALL",
            message: "File is empty or too small.",
            value: file.size,
          });
        }

        // CSV header check (only for CSV files)
        if (rules.requiredHeaders && ext === ".csv" && errors.length === 0) {
          try {
            const rows = await parseCSV<{ [key: string]: unknown }>(file);
            if (rows.length > 0) {
              const fileHeaders = Object.keys(rows[0]);
              const missing = rules.requiredHeaders.filter(
                (h) => !fileHeaders.includes(h)
              );
              if (missing.length > 0) {
                errors.push({
                  code: "MISSING_HEADERS",
                  message: `Missing required columns: ${missing.join(", ")}`,
                  value: missing,
                });
              }
            }
          } catch {
            // Parse error — let the server handle detailed validation
          }
        }

        return errors;
      },
      [sig.fileValidation]
    );

    /** Trigger file input click */
    const triggerImport = useCallback(() => {
      fileInputRef.current?.click();
    }, []);

    /** Handle file input change */
    const handleFileChange = useCallback(
      async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Reset file input so same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = "";

        // Validate file
        const errors = await validateFile(file);
        setFileErrors(errors);

        if (errors.length > 0) {
          setIsImportModalOpen(true);
          return;
        }

        // Proceed with upload
        setIsImportModalOpen(true);
        await task.uploadFile(
          (onProgress) => sig.uploadFile(file, sig.additionalData, onProgress),
          {
            getStatus: sig.getStatus,
            onRefresh: sig.onRefresh,
            onCompleted: sig.onSuccess,
            onFailed: sig.onError,
          }
        );
      },
      [sig, validateFile, task]
    );

    /** Close the import modal */
    const handleCloseModal = useCallback(() => {
      task.reset();
      setFileErrors([]);
      setIsImportModalOpen(false);
    }, [task]);

    /** Clear file-level errors (e.g. after fixing the file) */
    const clearFileErrors = useCallback(() => {
      setFileErrors([]);
    }, []);

    /** Download a CSV template with column headers from the table definition */
    const downloadTemplate = useCallback(
      async (filename?: string) => {
        const columns = engine.getAllColumns();
        const headers = columns
          .filter((col) => col.id !== "_select" && !col.getIsVisible())
          .map((col) => col.id);
        const csv = await generateCSV([
          headers.reduce((acc, h) => ({ ...acc, [h]: "" }), {}),
        ]);
        downloadCSV(csv, filename ?? "import-template.csv");
      },
      [engine]
    );

    return useMemo(
      () => ({
        // Task state
        status: task.status,
        progress: task.progress,
        uploadProgress: task.uploadProgress,
        isUploading: task.isUploading,
        summary: task.summary,
        errors: task.errors,
        error: task.error,
        taskId: task.taskId,

        // Modal state
        isImportModalOpen,
        setIsImportModalOpen,

        // File validation
        fileErrors,
        clearFileErrors,

        // Actions
        triggerImport,
        handleFileChange,
        handleCloseModal,
        downloadTemplate,
        fileInputRef,
      }),
      [
        task.status,
        task.progress,
        task.uploadProgress,
        task.isUploading,
        task.summary,
        task.errors,
        task.error,
        task.taskId,
        isImportModalOpen,
        fileErrors,
        triggerImport,
        handleFileChange,
        handleCloseModal,
        clearFileErrors,
        downloadTemplate,
      ]
    );
  },
});
