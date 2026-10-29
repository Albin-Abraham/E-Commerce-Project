import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlatformUrlAdapters } from "@core/router/adapters/PlatformUrlAdapters";
import { useFilterUrlSync } from "../useFilterUrlSync";

describe("useFilterUrlSync", () => {
  it("hydrates initial state from URL parameters without JSON.parse", async () => {
    const mockPort = PlatformUrlAdapters.createMock({
      status: "active",
      page: "2",
      inStock: "true",
    });

    let localState = { status: "", page: 1, inStock: false };
    const setLocalState = vi.fn((next) => {
      localState = next;
    });

    renderHook(() =>
      useFilterUrlSync(localState, setLocalState, { port: mockPort })
    );

    expect(setLocalState).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "active",
        page: 2,
        inStock: true,
      })
    );
  });

  it("synchronizes local state updates to URL parameters without JSON.stringify", async () => {
    const mockPort = PlatformUrlAdapters.createMock();
    let localState = { status: "active", count: 10 };
    const setLocalState = vi.fn();

    const { rerender } = renderHook(
      ({ state }) =>
        useFilterUrlSync(state, setLocalState, { port: mockPort }),
      { initialProps: { state: localState } }
    );

    // Wait for hydration release
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    // Update state
    act(() => {
      localState = { status: "pending", count: 25 };
      rerender({ state: localState });
    });

    expect(mockPort.get("status")).toBe("pending");
    expect(mockPort.get("count")).toBe("25");
    // Verify no JSON quotes or brackets in simple values
    expect(mockPort.get("status")).not.toContain('"');
  });

  it("handles bracketed nested object fields cleanly", async () => {
    const mockPort = PlatformUrlAdapters.createMock();
    let localState = { filter: { role: "admin", level: 3 } };
    const setLocalState = vi.fn();

    const { rerender } = renderHook(
      ({ state }) =>
        useFilterUrlSync(state, setLocalState, { port: mockPort }),
      { initialProps: { state: localState } }
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    act(() => {
      localState = { filter: { role: "superadmin", level: 5 } };
      rerender({ state: localState });
    });

    expect(mockPort.get("filter[role]")).toBe("superadmin");
    expect(mockPort.get("filter[level]")).toBe("5");
    // Should NOT be serialized as raw JSON
    expect(mockPort.get("filter")).toBeNull();
  });

  it("preserves non-owned query parameters non-destructively", async () => {
    const mockPort = PlatformUrlAdapters.createMock({
      table_sort: "name:asc",
      other_param: "keep_me",
    });

    let localState = { status: "active" };
    const setLocalState = vi.fn();

    const { rerender } = renderHook(
      ({ state }) =>
        useFilterUrlSync(state, setLocalState, { port: mockPort }),
      { initialProps: { state: localState } }
    );

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    act(() => {
      localState = { status: "archived" };
      rerender({ state: localState });
    });

    expect(mockPort.get("status")).toBe("archived");
    expect(mockPort.get("table_sort")).toBe("name:asc");
    expect(mockPort.get("other_param")).toBe("keep_me");
  });
});
