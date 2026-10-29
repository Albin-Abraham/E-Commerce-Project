import type { ImportStatusResult, ImportUploadResult } from "@ui/table/hooks/useImportTask";

/**
 * useImportService
 *
 * HTTP wrapper for server-side import operations.
 * Handles file upload with progress tracking and status polling.
 */

export interface ImportServiceConfig {
  /** Base URL for import endpoints */
  baseUrl: string;
  /** Custom fetch function */
  fetch?: typeof fetch;
  /** Request headers (Content-Type is set automatically for FormData) */
  headers?: Record<string, string>;
}

export function useImportService(config: ImportServiceConfig) {
  const _fetch = config.fetch ?? window.fetch;

  /**
   * Upload a file for import with progress tracking via XMLHttpRequest.
   * Returns the initial task status from the server.
   */
  const uploadImport = (
    file: File,
    additionalData?: Record<string, unknown>,
    onProgress?: (percent: number) => void,
    signal?: AbortSignal
  ): Promise<ImportUploadResult> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append("file", file);

      if (additionalData) {
        Object.entries(additionalData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            formData.append(key, String(value));
          }
        });
      }

      // Abort on signal
      signal?.addEventListener("abort", () => {
        xhr.abort();
      });

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response.data || response);
          } catch {
            reject(new Error("Invalid JSON response from server"));
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(
              new Error(error.message || `Upload failed: ${xhr.statusText}`)
            );
          } catch {
            reject(new Error(`Upload failed: ${xhr.statusText}`));
          }
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Network error during upload"));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload aborted"));
      });

      xhr.open("POST", `${config.baseUrl}/upload`);
      if (config.headers) {
        Object.entries(config.headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
      }
      xhr.send(formData);
    });
  };

  /** Poll the status of an import task */
  const getStatus = async (taskId: string): Promise<ImportStatusResult> => {
    const response = await _fetch(`${config.baseUrl}/status/${taskId}`, {
      method: "GET",
      headers: config.headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get import status: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || data;
  };

  return {
    uploadImport,
    getStatus,
  };
}
