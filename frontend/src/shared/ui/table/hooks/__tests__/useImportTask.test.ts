import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  type ImportUploadResult,
  useImportTask,
} from "../../hooks/useImportTask";

describe("useImportTask", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes with idle status", () => {
    const { result } = renderHook(() => useImportTask());

    expect(result.current.status).toBe("idle");
    expect(result.current.taskId).toBeNull();
    expect(result.current.progress).toBe(0);
    expect(result.current.isUploading).toBe(false);
    expect(result.current.summary).toBeNull();
    expect(result.current.errors).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it("uploadFile sets uploading status", async () => {
    const { result } = renderHook(() => useImportTask());

    const uploadFn = vi.fn().mockImplementation((onProgress) => {
      onProgress(50);
      return Promise.resolve({
        status: "processing",
        task_id: "task-1",
      } as ImportUploadResult);
    });

    await act(async () => {
      result.current.uploadFile(uploadFn);
    });

    expect(result.current.taskId).toBe("task-1");
    expect(result.current.status).toBe("processing");
  });

  it("uploadFile handles immediate completion", async () => {
    const { result } = renderHook(() => useImportTask({ autoCloseDelay: 0 }));

    const uploadFn = vi.fn().mockResolvedValue({
      status: "completed",
      task_id: "task-1",
      summary: { created_count: 5, updated_count: 0, error_count: 0 },
    } as ImportUploadResult);

    await act(async () => {
      result.current.uploadFile(uploadFn);
    });

    expect(result.current.status).toBe("completed");
    expect(result.current.summary?.created_count).toBe(5);
  });

  it("uploadFile handles failure", async () => {
    const { result } = renderHook(() => useImportTask());

    const uploadFn = vi.fn().mockRejectedValue(new Error("Upload failed"));

    await act(async () => {
      result.current.uploadFile(uploadFn);
    });

    expect(result.current.status).toBe("failed");
    expect(result.current.error).toBe("Upload failed");
  });

  it("uploadFile tracks upload progress", async () => {
    const { result } = renderHook(() => useImportTask());

    let progressCallback: (pct: number) => void = () => {};
    const uploadFn = vi.fn().mockImplementation((onProgress) => {
      progressCallback = onProgress;
      return new Promise<ImportUploadResult>((resolve) => {
        setTimeout(() => {
          progressCallback(100);
          resolve({ status: "processing", task_id: "task-1" });
        }, 100);
      });
    });

    act(() => {
      result.current.uploadFile(uploadFn);
    });

    act(() => {
      progressCallback(50);
    });

    expect(result.current.uploadProgress).toBe(50);

    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current.uploadProgress).toBe(100);
  });

  it("polls status until completion", async () => {
    const { result } = renderHook(() => useImportTask({ pollInterval: 1000 }));

    const uploadFn = vi.fn().mockResolvedValue({
      status: "processing",
      task_id: "task-1",
    } as ImportUploadResult);
    const getStatus = vi
      .fn()
      .mockResolvedValueOnce({ status: "processing", percentage: 50 })
      .mockResolvedValueOnce({
        status: "completed",
        percentage: 100,
        summary: { created_count: 3, updated_count: 1, error_count: 0 },
      });

    await act(async () => {
      result.current.uploadFile(uploadFn, { getStatus });
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(getStatus).toHaveBeenCalledWith("task-1");

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.status).toBe("completed");
    expect(result.current.summary?.created_count).toBe(3);
  });

  it("polls status handles failure", async () => {
    const { result } = renderHook(() => useImportTask({ pollInterval: 1000 }));

    const uploadFn = vi.fn().mockResolvedValue({
      status: "processing",
      task_id: "task-1",
    } as ImportUploadResult);
    const getStatus = vi
      .fn()
      .mockResolvedValue({ status: "failed", error: "Processing failed" });

    await act(async () => {
      result.current.uploadFile(uploadFn, { getStatus });
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.status).toBe("failed");
    expect(result.current.error).toBe("Processing failed");
  });

  it("cancel resets state", async () => {
    const { result } = renderHook(() => useImportTask());

    const uploadFn = vi.fn().mockResolvedValue({
      status: "processing",
      task_id: "task-1",
    } as ImportUploadResult);

    await act(async () => {
      result.current.uploadFile(uploadFn);
    });

    act(() => {
      result.current.cancel();
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.error).toBeNull();
  });

  it("reset clears all state", async () => {
    const { result } = renderHook(() => useImportTask());

    const uploadFn = vi.fn().mockResolvedValue({
      status: "completed",
      task_id: "task-1",
      summary: { created_count: 5, updated_count: 0, error_count: 0 },
    } as ImportUploadResult);

    await act(async () => {
      result.current.uploadFile(uploadFn);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.taskId).toBeNull();
    expect(result.current.progress).toBe(0);
    expect(result.current.summary).toBeNull();
    expect(result.current.errors).toEqual([]);
  });

  it("calls onRefresh on completion", async () => {
    const onRefresh = vi.fn();
    const { result } = renderHook(() => useImportTask({ autoCloseDelay: 0 }));

    const uploadFn = vi.fn().mockResolvedValue({
      status: "completed",
      task_id: "task-1",
    } as ImportUploadResult);

    await act(async () => {
      result.current.uploadFile(uploadFn, { onRefresh });
    });

    expect(onRefresh).toHaveBeenCalled();
  });

  it("auto-closes after success delay", async () => {
    const { result } = renderHook(() =>
      useImportTask({ autoCloseDelay: 1500 })
    );

    const uploadFn = vi.fn().mockResolvedValue({
      status: "completed",
      task_id: "task-1",
      summary: { created_count: 1, updated_count: 0, error_count: 0 },
    } as ImportUploadResult);

    await act(async () => {
      result.current.uploadFile(uploadFn);
    });

    expect(result.current.status).toBe("completed");

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.status).toBe("idle");
  });

  it("does not auto-close when there are errors", async () => {
    const { result } = renderHook(() =>
      useImportTask({ autoCloseDelay: 1500 })
    );

    const uploadFn = vi.fn().mockResolvedValue({
      status: "completed",
      task_id: "task-1",
      summary: { created_count: 1, updated_count: 0, error_count: 2 },
    } as ImportUploadResult);

    await act(async () => {
      result.current.uploadFile(uploadFn);
    });

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(result.current.status).toBe("completed");
  });
});
