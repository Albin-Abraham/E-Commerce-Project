import { describe, expect, it, vi } from "vitest";

import { TanStackAdapter } from "../TanStackAdapter";
import type { ITableEngine } from "../table-engine";

function createMockTable() {
  return {
    getHeaderGroups: vi.fn().mockReturnValue([]),
    getRowModel: vi.fn().mockReturnValue({ rows: [] }),
    getPrePaginationRowModel: vi.fn().mockReturnValue({ rows: [] }),
    getState: vi.fn().mockReturnValue({
      sorting: [],
      pagination: { pageIndex: 0, pageSize: 10 },
    }),
    setPageIndex: vi.fn(),
    nextPage: vi.fn(),
    previousPage: vi.fn(),
    setPageSize: vi.fn(),
    getCanNextPage: vi.fn().mockReturnValue(true),
    getCanPreviousPage: vi.fn().mockReturnValue(false),
    getPageCount: vi.fn().mockReturnValue(5),
    setSorting: vi.fn(),
    setGlobalFilter: vi.fn(),
    setColumnFilters: vi.fn(),
    setColumnVisibility: vi.fn(),
    setColumnPinning: vi.fn(),
    getColumn: vi.fn().mockReturnValue(undefined),
    getRow: vi.fn().mockReturnValue(undefined),
  } as Record<string, unknown>;
}

describe("TanStackAdapter", () => {
  describe("getHeaderGroups", () => {
    it("delegates to table.getHeaderGroups", () => {
      const mock = createMockTable();
      const adapter = new TanStackAdapter(mock as never);
      adapter.getHeaderGroups();
      expect(mock.getHeaderGroups).toHaveBeenCalled();
    });
  });

  describe("getRowModel", () => {
    it("delegates to table.getRowModel", () => {
      const mock = createMockTable();
      const adapter = new TanStackAdapter(mock as never);
      adapter.getRowModel();
      expect(mock.getRowModel).toHaveBeenCalled();
    });
  });

  describe("getPrePaginationRowModel", () => {
    it("delegates to table.getPrePaginationRowModel", () => {
      const mock = createMockTable();
      const adapter = new TanStackAdapter(mock as never);
      adapter.getPrePaginationRowModel();
      expect(mock.getPrePaginationRowModel).toHaveBeenCalled();
    });
  });

  describe("getState", () => {
    it("returns table state", () => {
      const mock = createMockTable();
      const adapter = new TanStackAdapter(mock as never);
      const state = adapter.getState();
      expect(state).toEqual({
        sorting: [],
        pagination: { pageIndex: 0, pageSize: 10 },
      });
    });
  });

  describe("pagination", () => {
    it("setPageIndex delegates to table", () => {
      const mock = createMockTable();
      const adapter = new TanStackAdapter(mock as never);
      adapter.setPageIndex(3);
      expect(mock.setPageIndex).toHaveBeenCalledWith(3);
    });

    it("nextPage delegates to table", () => {
      const mock = createMockTable();
      const adapter = new TanStackAdapter(mock as never);
      adapter.nextPage();
      expect(mock.nextPage).toHaveBeenCalled();
    });

    it("previousPage delegates to table", () => {
      const mock = createMockTable();
      const adapter = new TanStackAdapter(mock as never);
      adapter.previousPage();
      expect(mock.previousPage).toHaveBeenCalled();
    });

    it("setPageSize delegates to table", () => {
      const mock = createMockTable();
      const adapter = new TanStackAdapter(mock as never);
      adapter.setPageSize(25);
      expect(mock.setPageSize).toHaveBeenCalledWith(25);
    });

    it("getCanNextPage returns table value", () => {
      const mock = createMockTable();
      const adapter = new TanStackAdapter(mock as never);
      expect(adapter.getCanNextPage()).toBe(true);
    });

    it("getCanPreviousPage returns table value", () => {
      const mock = createMockTable();
      const adapter = new TanStackAdapter(mock as never);
      expect(adapter.getCanPreviousPage()).toBe(false);
    });

    it("getPageCount returns table value", () => {
      const mock = createMockTable();
      const adapter = new TanStackAdapter(mock as never);
      expect(adapter.getPageCount()).toBe(5);
    });
  });

  describe("sorting", () => {
    it("setSorting delegates to table", () => {
      const mock = createMockTable();
      const adapter = new TanStackAdapter(mock as never);
      const updater = [{ id: "name", desc: false }];
      adapter.setSorting(updater);
      expect(mock.setSorting).toHaveBeenCalledWith(updater);
    });

    it("setSorting accepts function updater", () => {
      const mock = createMockTable();
      const adapter = new TanStackAdapter(mock as never);
      const updater = (old: any) => [...old, { id: "name", desc: false }];
      adapter.setSorting(updater);
      expect(mock.setSorting).toHaveBeenCalledWith(updater);
    });
  });

  describe("filtering", () => {
    it("setGlobalFilter delegates to table", () => {
      const mock = createMockTable();
      const adapter = new TanStackAdapter(mock as never);
      adapter.setGlobalFilter("test");
      expect(mock.setGlobalFilter).toHaveBeenCalledWith("test");
    });

    it("setColumnFilters delegates to table", () => {
      const mock = createMockTable();
      const adapter = new TanStackAdapter(mock as never);
      const filters = [{ id: "role", value: "admin" }];
      adapter.setColumnFilters(filters);
      expect(mock.setColumnFilters).toHaveBeenCalledWith(filters);
    });
  });

  describe("visibility", () => {
    it("setColumnVisibility delegates to table", () => {
      const mock = createMockTable();
      const adapter = new TanStackAdapter(mock as never);
      adapter.setColumnVisibility({ name: true });
      expect(mock.setColumnVisibility).toHaveBeenCalledWith({ name: true });
    });
  });

  describe("pinning", () => {
    it("setColumnPinning delegates to table", () => {
      const mock = createMockTable();
      const adapter = new TanStackAdapter(mock as never);
      adapter.setColumnPinning({ left: ["name"], right: [] });
      expect(mock.setColumnPinning).toHaveBeenCalledWith({
        left: ["name"],
        right: [],
      });
    });
  });

  describe("column/row access", () => {
    it("getColumn delegates to table", () => {
      const mock = createMockTable();
      const adapter = new TanStackAdapter(mock as never);
      adapter.getColumn("name");
      expect(mock.getColumn).toHaveBeenCalledWith("name");
    });

    it("getRow delegates to table", () => {
      const mock = createMockTable();
      const adapter = new TanStackAdapter(mock as never);
      adapter.getRow("row-1");
      expect(mock.getRow).toHaveBeenCalledWith("row-1");
    });
  });

  describe("ITableEngine compliance", () => {
    it("implements ITableEngine interface", () => {
      const mock = createMockTable();
      const adapter: ITableEngine<unknown> = new TanStackAdapter(mock as never);

      expect(typeof adapter.getHeaderGroups).toBe("function");
      expect(typeof adapter.getRowModel).toBe("function");
      expect(typeof adapter.getState).toBe("function");
      expect(typeof adapter.setPageIndex).toBe("function");
      expect(typeof adapter.nextPage).toBe("function");
      expect(typeof adapter.previousPage).toBe("function");
      expect(typeof adapter.setPageSize).toBe("function");
      expect(typeof adapter.getCanNextPage).toBe("function");
      expect(typeof adapter.getCanPreviousPage).toBe("function");
      expect(typeof adapter.getPageCount).toBe("function");
      expect(typeof adapter.setSorting).toBe("function");
      expect(typeof adapter.setGlobalFilter).toBe("function");
      expect(typeof adapter.setColumnFilters).toBe("function");
      expect(typeof adapter.setColumnVisibility).toBe("function");
      expect(typeof adapter.setColumnPinning).toBe("function");
      expect(typeof adapter.getColumn).toBe("function");
      expect(typeof adapter.getRow).toBe("function");
    });
  });
});
