import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useExportTask } from "../../hooks/useExportTask";

describe("useExportTask", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes with idle status", () => {
    const { result } = renderHook(() => useExportTask());

    expect(result.current.status).toBe("idle");
    expect(result.current.taskId).toBeNull();
    expect(result.current.progress).toBe(0);
    expect(result.current.filename).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("startExport sets processing status", async () => {
    const { result } = renderHook(() => useExportTask());

    const apiCall = vi
      .fn()
      .mockResolvedValue({ task_id: "task-1", status: "processing" });

    await act(async () => {
      result.current.startExport(apiCall);
    });

    expect(result.current.status).toBe("processing");
    expect(result.current.taskId).toBe("task-1");
    expect(apiCall).toHaveBeenCalled();
  });

  it("autoCloseDelay resets to idle after completion", async () => {
    const { result } = renderHook(() => useExportTask({ autoCloseDelay: 500 }));

    const apiCall = vi.fn().mockResolvedValue({
      task_id: "task-1",
      status: "completed",
      filename: "export.csv",
    });

    await act(async () => {
      result.current.startExport(apiCall);
    });

    expect(result.current.status).toBe("completed");

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.status).toBe("idle");
  });

  it("startExport handles immediate completion", async () => {
    const { result } = renderHook(() => useExportTask());

    const apiCall = vi.fn().mockResolvedValue({
      task_id: "task-1",
      status: "completed",
      filename: "export.csv",
    });

    await act(async () => {
      result.current.startExport(apiCall);
    });

    expect(result.current.status).toBe("completed");
    expect(result.current.filename).toBe("export.csv");
  });

  it("startExport handles failure", async () => {
    const { result } = renderHook(() => useExportTask());

    const apiCall = vi.fn().mockRejectedValue(new Error("Network error"));

    await act(async () => {
      result.current.startExport(apiCall);
    });

    expect(result.current.status).toBe("failed");
    expect(result.current.error).toBe("Network error");
  });

  it("startExport polls status until completion", async () => {
    const { result } = renderHook(() => useExportTask({ pollInterval: 1000 }));

    const apiCall = vi
      .fn()
      .mockResolvedValue({ task_id: "task-1", status: "processing" });
    const getStatus = vi
      .fn()
      .mockResolvedValueOnce({ status: "processing", progress: 50 })
      .mockResolvedValueOnce({
        status: "completed",
        progress: 100,
        filename: "done.csv",
      });

    await act(async () => {
      result.current.startExport(apiCall, { getStatus });
    });

    expect(result.current.status).toBe("processing");

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(getStatus).toHaveBeenCalledWith("task-1");

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.status).toBe("completed");
    expect(result.current.filename).toBe("done.csv");
  });

  it("cancel resets state", async () => {
    const { result } = renderHook(() => useExportTask());

    const apiCall = vi
      .fn()
      .mockResolvedValue({ task_id: "task-1", status: "processing" });

    await act(async () => {
      result.current.startExport(apiCall);
    });

    act(() => {
      result.current.cancel();
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.error).toBeNull();
  });

  it("reset clears all state", async () => {
    const { result } = renderHook(() => useExportTask());

    const apiCall = vi.fn().mockResolvedValue({
      task_id: "task-1",
      status: "completed",
      filename: "test.csv",
    });

    await act(async () => {
      result.current.startExport(apiCall);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe("idle");
    expect(result.current.taskId).toBeNull();
    expect(result.current.progress).toBe(0);
    expect(result.current.filename).toBeNull();
  });

  it("calls onCompleted callback", async () => {
    const onCompleted = vi.fn();
    const { result } = renderHook(() => useExportTask());

    const apiCall = vi.fn().mockResolvedValue({
      task_id: "task-1",
      status: "completed",
      filename: "export.csv",
    });

    await act(async () => {
      result.current.startExport(apiCall, { onCompleted });
    });

    expect(onCompleted).toHaveBeenCalledWith("export.csv");
  });

  it("calls onFailed callback on error", async () => {
    const onFailed = vi.fn();
    const { result } = renderHook(() => useExportTask());

    const apiCall = vi.fn().mockRejectedValue(new Error("Upload failed"));

    await act(async () => {
      result.current.startExport(apiCall, { onFailed });
    });

    expect(onFailed).toHaveBeenCalledWith("Upload failed");
  });
});
