import type { ColumnDef } from "@tanstack/react-table";
import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useTanstackAdapter } from "../useTanstackAdapter";

interface TestRow {
  id: string;
  name: string;
}

const columns: ColumnDef<TestRow, unknown>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Name" },
];

const data: TestRow[] = [
  { id: "1", name: "Alice" },
  { id: "2", name: "Bob" },
];

const manyRows: TestRow[] = Array.from({ length: 25 }, (_, i) => ({
  id: String(i + 1),
  name: `User ${i + 1}`,
}));

describe("useTanstackAdapter", () => {
  it("returns engine, state, and actions", () => {
    const { result } = renderHook(() => useTanstackAdapter({ data, columns }));

    expect(result.current.engine).toBeDefined();
    expect(result.current.state).toBeDefined();
    expect(result.current.actions).toBeDefined();
  });

  it("initializes with default pagination", () => {
    const { result } = renderHook(() => useTanstackAdapter({ data, columns }));

    expect(result.current.state.pagination).toEqual({
      pageIndex: 0,
      pageSize: 10,
    });
  });

  it("uses custom defaultPageSize", () => {
    const { result } = renderHook(() =>
      useTanstackAdapter({ data, columns, defaultPageSize: 25 })
    );

    expect(result.current.state.pagination.pageSize).toBe(25);
  });

  it("initializes with initialState sorting", () => {
    const { result } = renderHook(() =>
      useTanstackAdapter({
        data,
        columns,
        initialState: { sorting: [{ id: "name", desc: true }] },
      })
    );

    expect(result.current.state.sorting).toEqual([{ id: "name", desc: true }]);
  });

  it("does not slice rows locally — server owns pagination", () => {
    const { result } = renderHook(() =>
      useTanstackAdapter({
        data: manyRows,
        columns,
        defaultPageSize: 10,
        pageCount: 3,
      })
    );

    expect(result.current.engine.getRowModel().rows.length).toBe(25);
  });

  it("uses pageCount for next-page, not local row count", () => {
    const { result } = renderHook(() =>
      useTanstackAdapter({
        data,
        columns,
        pageCount: 5,
      })
    );

    expect(result.current.engine.getPageCount()).toBe(5);
    expect(result.current.engine.getCanNextPage()).toBe(true);
  });

  it("engine has correct row count", () => {
    const { result } = renderHook(() => useTanstackAdapter({ data, columns }));

    expect(result.current.engine.getRowModel().rows.length).toBe(2);
  });
});
