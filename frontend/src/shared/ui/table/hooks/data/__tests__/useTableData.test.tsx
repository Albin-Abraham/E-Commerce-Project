import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ITableEngine } from "../../../core/table-engine";
import { resolveTableMeta } from "../../../meta/TableMetaDefaults";
import type { DataSource } from "../../../types";
import { useTableData } from "../useTableData";

function createMockEngine(
  overrides: Record<string, unknown> = {}
): ITableEngine<unknown> {
  return {
    getState: vi.fn().mockReturnValue({
      pagination: { pageIndex: 0, pageSize: 10 },
      sorting: [],
      columnFilters: [],
      globalFilter: "",
    }),
    ...overrides,
  } as unknown as ITableEngine<unknown>;
}

describe("useTableData", () => {
  const meta = resolveTableMeta({ id: "test" });

  describe("client source", () => {
    it("skips setData on mount (parent already initialized data)", () => {
      const source: DataSource<unknown> = {
        type: "client",
        data: [{ id: "1" }, { id: "2" }],
      };
      const setData = vi.fn();
      const engine = createMockEngine();

      renderHook(() => useTableData(source, meta, engine, setData));

      // Hook intentionally skips setData on mount to avoid re-render loop
      expect(setData).not.toHaveBeenCalled();
    });

    it("calls setData when data identity changes", () => {
      const source: DataSource<unknown> = {
        type: "client",
        data: [{ id: "1" }, { id: "2" }],
      };
      const setData = vi.fn();
      const engine = createMockEngine();

      const { rerender } = renderHook(
        ({ data }) =>
          useTableData(
            { ...source, data } as DataSource<unknown>,
            meta,
            engine,
            setData
          ),
        { initialProps: { data: source.data } }
      );

      const newData = [{ id: "3" }];
      rerender({ data: newData });

      expect(setData).toHaveBeenCalledWith(newData);
    });

    it("returns correct totalCount for client source", () => {
      const source: DataSource<unknown> = {
        type: "client",
        data: [{ id: "1" }, { id: "2" }, { id: "3" }],
      };
      const engine = createMockEngine();

      const { result } = renderHook(() =>
        useTableData(source, meta, engine, vi.fn())
      );

      expect(result.current.totalCount).toBe(3);
    });

    it("returns loading=false for client source", () => {
      const source: DataSource<unknown> = {
        type: "client",
        data: [],
      };
      const engine = createMockEngine();

      const { result } = renderHook(() =>
        useTableData(source, meta, engine, vi.fn())
      );

      expect(result.current.loading).toBe(false);
    });

    it("returns error=null for client source", () => {
      const source: DataSource<unknown> = {
        type: "client",
        data: [],
      };
      const engine = createMockEngine();

      const { result } = renderHook(() =>
        useTableData(source, meta, engine, vi.fn())
      );

      expect(result.current.error).toBeNull();
    });
  });

  describe("server source", () => {
    it("calls fetcher and sets data", async () => {
      const fetcher = vi.fn().mockResolvedValue({
        rows: [{ id: "1" }],
        totalCount: 1,
      });
      const source: DataSource<unknown> = {
        type: "server",
        fetcher,
      };
      const setData = vi.fn();
      const engine = createMockEngine();

      renderHook(() => useTableData(source, meta, engine, setData));

      await waitFor(() => {
        expect(fetcher).toHaveBeenCalled();
      });
    });

    it("maps canonical { rows, totalCount } payloads", async () => {
      const fetcher = vi.fn().mockResolvedValue({
        rows: [{ id: "a" }, { id: "b" }],
        totalCount: 42,
      });
      const setData = vi.fn();
      const engine = createMockEngine();

      const { result } = renderHook(() =>
        useTableData({ type: "server", fetcher }, meta, engine, setData)
      );

      await waitFor(() => {
        expect(setData).toHaveBeenCalledWith([{ id: "a" }, { id: "b" }]);
      });
      expect(result.current.totalCount).toBe(42);
    });

    it("accepts PaginatedResponse { items, total } and maps it to rows and totalCount", async () => {
      const fetcher = vi.fn().mockResolvedValue({
        items: [{ id: "1" }],
        total: 5,
      });
      const setData = vi.fn();
      const engine = createMockEngine();

      const { result } = renderHook(() =>
        useTableData({ type: "server", fetcher }, meta, engine, setData)
      );

      await waitFor(() => {
        expect(setData).toHaveBeenCalledWith([{ id: "1" }]);
      });
      expect(result.current.totalCount).toBe(5);
      expect(result.current.error).toBeNull();
    });

    it("rejects envelope payloads that were not unwrapped in the fetcher", async () => {
      const fetcher = vi.fn().mockResolvedValue({
        data: [{ id: "1" }],
        meta: { total: 99 },
      });
      const setData = vi.fn();
      const engine = createMockEngine();

      const { result } = renderHook(() =>
        useTableData({ type: "server", fetcher }, meta, engine, setData)
      );

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(Error);
      });
      expect(result.current.error?.message).toMatch(/rows, totalCount/);
      expect(setData).not.toHaveBeenCalled();
    });

    it("aborts the in-flight request when refetch() is called", async () => {
      let firstSignal: AbortSignal | undefined;
      const fetcher = vi
        .fn()
        .mockImplementation((_params, _serializedParams, signal?: AbortSignal) => {
          if (!firstSignal) firstSignal = signal;
          return new Promise(() => {
            /* hang until aborted */
          });
        });
      const engine = createMockEngine();

      const { result } = renderHook(() =>
        useTableData({ type: "server", fetcher }, meta, engine, vi.fn())
      );

      await waitFor(() => {
        expect(fetcher).toHaveBeenCalled();
      });

      result.current.refetch();

      await waitFor(() => {
        expect(firstSignal?.aborted).toBe(true);
      });
    });

    it("returns loading state during fetch", async () => {
      let resolveFetch!: (value: unknown) => void;
      const fetcher = vi.fn().mockReturnValue(
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
      );
      const source: DataSource<unknown> = {
        type: "server",
        fetcher,
      };
      const engine = createMockEngine();

      const { result } = renderHook(() =>
        useTableData(source, meta, engine, vi.fn())
      );

      expect(result.current.loading).toBe(true);

      resolveFetch({ rows: [], totalCount: 0 });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it("skips the fetcher when guard returns false", async () => {
      const fetcher = vi.fn().mockResolvedValue({ rows: [], totalCount: 0 });
      const setData = vi.fn();
      const engine = createMockEngine();

      const { result } = renderHook(() =>
        useTableData(
          {
            type: "server",
            fetcher,
            guard: (params) => Boolean(params.filters.country),
          },
          meta,
          engine,
          setData
        )
      );

      await new Promise((r) => setTimeout(r, 30));
      expect(fetcher).not.toHaveBeenCalled();
      expect(setData).not.toHaveBeenCalled();
      expect(result.current.canFetch).toBe(false);
      expect(result.current.loading).toBe(false);
    });

    it("calls the fetcher when guard returns true", async () => {
      const fetcher = vi
        .fn()
        .mockResolvedValue({ rows: [{ id: "1" }], totalCount: 1 });
      const setData = vi.fn();
      const engine = createMockEngine({
        getState: vi.fn().mockReturnValue({
          pagination: { pageIndex: 0, pageSize: 10 },
          sorting: [],
          columnFilters: [{ id: "country", value: "Canada" }],
          globalFilter: "",
        }),
      });

      renderHook(() =>
        useTableData(
          {
            type: "server",
            fetcher,
            guard: (params) => Boolean(params.filters.country),
          },
          meta,
          engine,
          setData
        )
      );

      await waitFor(() => {
        expect(fetcher).toHaveBeenCalled();
      });
      expect(setData).toHaveBeenCalledWith([{ id: "1" }]);
    });

    it("gate:manual does not fetch on mount even when guard passes", async () => {
      const fetcher = vi
        .fn()
        .mockResolvedValue({ rows: [{ id: "1" }], totalCount: 1 });
      const engine = createMockEngine({
        getState: vi.fn().mockReturnValue({
          pagination: { pageIndex: 0, pageSize: 10 },
          sorting: [],
          columnFilters: [{ id: "country", value: "Canada" }],
          globalFilter: "",
        }),
      });

      const { result } = renderHook(() =>
        useTableData(
          {
            type: "server",
            fetcher,
            guard: (params) => Boolean(params.filters.country),
            gate: "manual",
          },
          meta,
          engine,
          vi.fn()
        )
      );

      await new Promise((r) => setTimeout(r, 30));
      expect(fetcher).not.toHaveBeenCalled();
      expect(result.current.hasFetched).toBe(false);
      expect(result.current.canFetch).toBe(true);
    });

    it("gate:manual fetches when search() is called and guard passes", async () => {
      const fetcher = vi
        .fn()
        .mockResolvedValue({ rows: [{ id: "1" }], totalCount: 1 });
      const setData = vi.fn();
      const engine = createMockEngine({
        getState: vi.fn().mockReturnValue({
          pagination: { pageIndex: 0, pageSize: 10 },
          sorting: [],
          columnFilters: [{ id: "country", value: "Canada" }],
          globalFilter: "",
        }),
        setPageIndex: vi.fn(),
      });

      const { result } = renderHook(() =>
        useTableData(
          {
            type: "server",
            fetcher,
            guard: (params) => Boolean(params.filters.country),
            gate: "manual",
          },
          meta,
          engine,
          setData
        )
      );

      await result.current.search();

      await waitFor(() => {
        expect(fetcher).toHaveBeenCalled();
        expect(setData).toHaveBeenCalledWith([{ id: "1" }]);
        expect(result.current.hasFetched).toBe(true);
      });
    });

    it("search() reads the latest globalFilter from the engine", async () => {
      const fetcher = vi.fn().mockResolvedValue({ rows: [], totalCount: 0 });
      const state = {
        pagination: { pageIndex: 2, pageSize: 10 },
        sorting: [] as { id: string; desc: boolean }[],
        columnFilters: [] as { id: string; value: unknown }[],
        globalFilter: "",
      };
      const engine = createMockEngine({
        getState: vi.fn(() => state),
        setPageIndex: vi.fn((i: number) => {
          state.pagination = { ...state.pagination, pageIndex: i };
        }),
      });

      const { result } = renderHook(() =>
        useTableData(
          { type: "server", fetcher, gate: "manual" },
          meta,
          engine,
          vi.fn()
        )
      );

      state.globalFilter = "alice";
      await result.current.search();

      await waitFor(() => {
        expect(fetcher).toHaveBeenCalled();
      });
      expect(fetcher.mock.calls[0][0]).toMatchObject({
        search: "alice",
        page: 0,
      });
    });
  });
});
