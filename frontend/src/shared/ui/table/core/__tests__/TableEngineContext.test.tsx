import React from "react";

import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TableEngineContext, useTableContext } from "../TableEngineContext";

function createMockEngine() {
  return {
    getHeaderGroups: () => [],
    getRowModel: () => ({ rows: [] }),
    getPrePaginationRowModel: () => ({ rows: [] }),
    getAllColumns: () => [],
    getColumn: () => undefined,
    getRow: () => undefined,
    getState: () => ({
      sorting: [],
      pagination: { pageIndex: 0, pageSize: 10 },
    }),
    setPageIndex: () => {},
    nextPage: () => {},
    previousPage: () => {},
    setPageSize: () => {},
    getCanNextPage: () => false,
    getCanPreviousPage: () => false,
    getPageCount: () => 0,
    setSorting: () => {},
    setGlobalFilter: () => {},
    setColumnFilters: () => {},
    setColumnVisibility: () => {},
    setColumnPinning: () => {},
  };
}

function EngineWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TableEngineContext.Provider
      value={{ engine: createMockEngine() as never }}
    >
      {children}
    </TableEngineContext.Provider>
  );
}

describe("TableEngineContext", () => {
  it("throws when useTableContext used outside provider", () => {
    expect(() => {
      renderHook(() => useTableContext());
    }).toThrow("useTableContext must be used inside a <ZenithTable> component");
  });

  it("provides engine to children", () => {
    const { result } = renderHook(() => useTableContext(), {
      wrapper: EngineWrapper,
    });

    expect(result.current.engine).toBeDefined();
    expect(result.current.engine.getHeaderGroups).toBeDefined();
    expect(result.current.engine.getRowModel).toBeDefined();
  });

  it("provides engine with all ITableEngine methods", () => {
    const { result } = renderHook(() => useTableContext(), {
      wrapper: EngineWrapper,
    });

    const engine = result.current.engine;
    expect(typeof engine.getHeaderGroups).toBe("function");
    expect(typeof engine.getRowModel).toBe("function");
    expect(typeof engine.getPrePaginationRowModel).toBe("function");
    expect(typeof engine.getAllColumns).toBe("function");
    expect(typeof engine.getColumn).toBe("function");
    expect(typeof engine.getState).toBe("function");
    expect(typeof engine.setPageIndex).toBe("function");
    expect(typeof engine.nextPage).toBe("function");
    expect(typeof engine.previousPage).toBe("function");
    expect(typeof engine.setPageSize).toBe("function");
    expect(typeof engine.getCanNextPage).toBe("function");
    expect(typeof engine.getCanPreviousPage).toBe("function");
    expect(typeof engine.getPageCount).toBe("function");
    expect(typeof engine.setSorting).toBe("function");
    expect(typeof engine.setGlobalFilter).toBe("function");
    expect(typeof engine.setColumnFilters).toBe("function");
    expect(typeof engine.setColumnVisibility).toBe("function");
    expect(typeof engine.setColumnPinning).toBe("function");
  });
});
