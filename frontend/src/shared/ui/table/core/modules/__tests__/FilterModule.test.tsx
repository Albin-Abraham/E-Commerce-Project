import React from "react";

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TableEngineContext } from "../../TableEngineContext";
import { FilterModule } from "../FilterModule";

function createMockEngine() {
  const state = {
    columnFilters: [] as { id: string; value: unknown }[],
    globalFilter: "",
  };

  const setFilterValue = vi.fn((id: string, val: unknown) => {
    state.columnFilters = state.columnFilters.filter((f) => f.id !== id);
    if (val != null && val !== "") {
      state.columnFilters.push({ id, value: val });
    }
  });

  return {
    state,
    getState: vi.fn(() => ({
      columnFilters: state.columnFilters,
      globalFilter: state.globalFilter,
    })),
    getColumn: vi.fn((id: string) => ({
      setFilterValue: (val: unknown) => setFilterValue(id, val),
    })),
    resetColumnFilters: vi.fn(() => {
      state.columnFilters = [];
    }),
    setGlobalFilter: vi.fn((v: unknown) => {
      state.globalFilter = String(v ?? "");
    }),
  };
}

function Wrapper({
  children,
  engine,
}: {
  children: React.ReactNode;
  engine?: ReturnType<typeof createMockEngine>;
}) {
  return (
    <TableEngineContext.Provider
      value={{ engine: (engine ?? createMockEngine()) as never }}
    >
      {children}
    </TableEngineContext.Provider>
  );
}

describe("FilterModule", () => {
  describe("useFilter", () => {
    it("reads filters from the engine", () => {
      const mockTable = createMockEngine();
      mockTable.state.columnFilters = [{ id: "role", value: "admin" }];
      const { result } = renderHook(
        () => FilterModule.useFilter({ debounceMs: 0 }),
        {
          wrapper: ({ children }) => (
            <Wrapper engine={mockTable}>{children}</Wrapper>
          ),
        }
      );

      expect(result.current.filters).toEqual({ role: "admin" });
      expect(result.current.activeCount).toBe(1);
    });

    it("setFilter writes to the engine after flush", () => {
      const mockTable = createMockEngine();
      const { result } = renderHook(
        () => FilterModule.useFilter({ debounceMs: 0 }),
        {
          wrapper: ({ children }) => (
            <Wrapper engine={mockTable}>{children}</Wrapper>
          ),
        }
      );

      act(() => {
        result.current.setFilter("role", "admin");
        result.current.flush();
      });

      expect(mockTable.state.columnFilters).toEqual([
        { id: "role", value: "admin" },
      ]);
    });

    it("clearFilter removes a filter on the engine", () => {
      const mockTable = createMockEngine();
      mockTable.state.columnFilters = [{ id: "role", value: "admin" }];
      const { result } = renderHook(
        () => FilterModule.useFilter({ debounceMs: 0 }),
        {
          wrapper: ({ children }) => (
            <Wrapper engine={mockTable}>{children}</Wrapper>
          ),
        }
      );

      act(() => {
        result.current.clearFilter("role");
      });

      expect(mockTable.state.columnFilters).toEqual([]);
    });

    it("clearAll resets column filters and global search on the engine", () => {
      const mockTable = createMockEngine();
      const { result } = renderHook(
        () => FilterModule.useFilter({ debounceMs: 0 }),
        {
          wrapper: ({ children }) => (
            <Wrapper engine={mockTable}>{children}</Wrapper>
          ),
        }
      );

      act(() => {
        result.current.clearAll();
      });

      expect(mockTable.resetColumnFilters).toHaveBeenCalled();
      expect(mockTable.setGlobalFilter).toHaveBeenCalledWith("");
    });

    it("activeCount reads from engine state (column filters + global search)", () => {
      const mockTable = createMockEngine();
      mockTable.state.columnFilters = [
        { id: "role", value: "admin" },
        { id: "status", value: "" },
      ];
      mockTable.state.globalFilter = "hello";
      const { result } = renderHook(() => FilterModule.useFilter(), {
        wrapper: ({ children }) => (
          <Wrapper engine={mockTable}>{children}</Wrapper>
        ),
      });

      expect(result.current.activeCount).toBe(2);
    });

    it("setGlobalSearch calls engine.setGlobalFilter", () => {
      const mockTable = createMockEngine();
      const { result } = renderHook(
        () => FilterModule.useFilter({ debounceMs: 0 }),
        {
          wrapper: ({ children }) => (
            <Wrapper engine={mockTable}>{children}</Wrapper>
          ),
        }
      );

      act(() => {
        result.current.setGlobalSearch("hello");
      });

      expect(mockTable.setGlobalFilter).toHaveBeenCalledWith("hello");
    });

    it("does not write when enabled is false", () => {
      const mockTable = createMockEngine();
      const { result } = renderHook(
        () => FilterModule.useFilter({ enabled: false, debounceMs: 0 }),
        {
          wrapper: ({ children }) => (
            <Wrapper engine={mockTable}>{children}</Wrapper>
          ),
        }
      );

      act(() => {
        result.current.setFilter("role", "admin");
        result.current.flush();
      });

      expect(mockTable.state.columnFilters).toEqual([]);
    });
  });
});
