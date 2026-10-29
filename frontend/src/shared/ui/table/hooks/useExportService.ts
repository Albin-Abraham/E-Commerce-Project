/**
 * useExportService
 *
 * Thin HTTP wrapper for server-side export operations.
 * Consumer provides their own fetch implementation or uses this default.
 */

export interface ExportServiceConfig {
  /** Base URL for export endpoints */
  baseUrl: string;
  /** Custom fetch function — defaults to window.fetch */
  fetch?: typeof fetch;
  /** Request headers */
  headers?: Record<string, string>;
}

export interface CreateExportParams {
  /** Export format */
  format: "csv" | "excel" | "pdf";
  /** Row IDs to export — "select_all" for all matching */
  ids?: string;
  /** Excluded IDs when selectAllPages is active */
  excluded_ids?: string;
  /** Additional filters to apply */
  filters?: Record<string, unknown>;
  /** Search query */
  search?: string;
  /** Page number */
  page?: number;
  /** Page size */
  page_size?: number;
}

export interface CreateExportResponse {
  task_id?: string;
  status?: string;
  filename?: string;
  error?: string;
}

export function useExportService(config: ExportServiceConfig) {
  const _fetch = config.fetch ?? window.fetch;

  const createExportTask = async (
    params: CreateExportParams
  ): Promise<CreateExportResponse> => {
    const response = await _fetch(`${config.baseUrl}/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...config.headers,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.json();
  };

  const getTaskStatus = async (
    taskId: string
  ): Promise<CreateExportResponse> => {
    const response = await _fetch(`${config.baseUrl}/status/${taskId}`, {
      method: "GET",
      headers: config.headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to get export status: ${response.statusText}`);
    }

    return response.json();
  };

  const downloadFile = async (
    taskId: string,
    filename?: string
  ): Promise<void> => {
    const response = await _fetch(`${config.baseUrl}/download/${taskId}`, {
      method: "GET",
      headers: config.headers,
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || `export-${taskId}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    createExportTask,
    getTaskStatus,
    downloadFile,
  };
}
