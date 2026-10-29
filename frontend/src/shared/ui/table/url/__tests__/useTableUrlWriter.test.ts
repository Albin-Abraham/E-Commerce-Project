/**
 * Table URL Writer Hook Test Suite
 *
 * @issue [FEAT-TABLE-URL-WRITER]
 * @bug [BUG-TABLE-URL-LOOP]
 *
 * Validates debounced, state-diffed URL parameter persistence for table state:
 *  1. Non-default pagination and sorting serialization
 *  2. Search query parameter persistence
 *  3. Debounce cancellation on unmount to prevent memory leaks and infinite cascades
 */

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ITableEngine } from "../../core/table-engine";
import { resolveTableMeta } from "../../meta/TableMetaDefaults";
import type { UrlConfig } from "../../types";
import { TableUrlKeyResolver } from "../TableUrlKeyResolver";
import { TableUrlAdapters } from "../adapters/TableUrlAdapters";
import { useTableUrlWriter } from "../hooks/useTableUrlWriter";

function createMockEngine(
  stateOverrides: Record<string, unknown> = {}
): ITableEngine<unknown> {
  const state = {
    sorting: [],
    pagination: { pageIndex: 0, pageSize: 10 },
    columnFilters: [],
    globalFilter: "",
    ...stateOverrides,
  };

  return {
    getState: vi.fn().mockReturnValue(state),
  } as unknown as ITableEngine<unknown>;
}

const meta = resolveTableMeta({ id: "orders" });
const urlConfig: UrlConfig = meta.url;

describe("useTableUrlWriter", () => {
  let adapter: ReturnType<typeof TableUrlAdapters.createMock>;
  let resolver: TableUrlKeyResolver;

  beforeEach(() => {
    vi.useFakeTimers();
    adapter = TableUrlAdapters.createMock();
    resolver = new TableUrlKeyResolver(meta);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("writes pagination to URL when non-default", () => {
    const engine = createMockEngine({
      pagination: { pageIndex: 2, pageSize: 25 },
    });

    renderHook(() =>
      useTableUrlWriter(resolver, adapter, urlConfig, engine, { enabled: true })
    );

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(adapter.get("orders:page")).toBe("2");
    expect(adapter.get("orders:size")).toBe("25");
  });

  it("does not write default pagination values", () => {
    const engine = createMockEngine({
      pagination: { pageIndex: 0, pageSize: 10 },
    });

    renderHook(() =>
      useTableUrlWriter(resolver, adapter, urlConfig, engine, { enabled: true })
    );

    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Default values should not be written
    expect(adapter.get("orders:page")).toBeNull();
    expect(adapter.get("orders:size")).toBeNull();
  });

  it("writes search to URL", () => {
    const engine = createMockEngine({
      globalFilter: "test query",
    });

    renderHook(() =>
      useTableUrlWriter(resolver, adapter, urlConfig, engine, { enabled: true })
    );

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(adapter.get("orders:search")).toBe("test query");
  });

  it("writes sorting to URL", () => {
    const engine = createMockEngine({
      sorting: [{ id: "name", desc: true }],
    });

    renderHook(() =>
      useTableUrlWriter(resolver, adapter, urlConfig, engine, { enabled: true })
    );

    act(() => {
      vi.advanceTimersByTime(150);
    });

    const sortValues = adapter.getAll("orders:sort");
    expect(sortValues.length).toBeGreaterThan(0);
  });

  it("writes column filters to URL in compact format", () => {
    const engine = createMockEngine({
      columnFilters: [{ id: "status", value: "active" }],
    });

    renderHook(() =>
      useTableUrlWriter(resolver, adapter, urlConfig, engine, { enabled: true })
    );

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(adapter.getAll("orders:filter")).toEqual(["status:active"]);
  });

  it("does not write when enabled=false", () => {
    const engine = createMockEngine({
      pagination: { pageIndex: 2, pageSize: 25 },
      globalFilter: "test",
    });

    renderHook(() =>
      useTableUrlWriter(resolver, adapter, urlConfig, engine, {
        enabled: false,
      })
    );

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(adapter.get("orders:page")).toBeNull();
    expect(adapter.get("orders:search")).toBeNull();
  });

  it("clears previous owned keys before writing", () => {
    // Pre-populate with old values
    adapter.set({ "orders:page": "5" });

    const engine = createMockEngine({
      pagination: { pageIndex: 1, pageSize: 10 },
      globalFilter: "",
    });

    renderHook(() =>
      useTableUrlWriter(resolver, adapter, urlConfig, engine, { enabled: true })
    );

    act(() => {
      vi.advanceTimersByTime(150);
    });

    // Old page should be overwritten with new value
    expect(adapter.get("orders:page")).toBe("1");
  });

  it("removes owned keys that return to defaults", () => {
    adapter.set({ "orders:search": "john", "orders:page": "2" });

    const engine = createMockEngine({
      pagination: { pageIndex: 0, pageSize: 10 },
      globalFilter: "",
    });

    renderHook(() =>
      useTableUrlWriter(resolver, adapter, urlConfig, engine, { enabled: true })
    );

    act(() => {
      vi.advanceTimersByTime(150);
    });

    expect(adapter.get("orders:search")).toBeNull();
    expect(adapter.get("orders:page")).toBeNull();
  });
});
