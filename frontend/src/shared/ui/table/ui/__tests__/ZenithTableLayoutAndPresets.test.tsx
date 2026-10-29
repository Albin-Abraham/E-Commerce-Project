import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ZenithTable } from "../ZenithTable";
import { createTablePhysicsStore } from "../../core/createTablePhysicsStore";
import type { ITableEngine } from "../../core/table-engine";
import type { TableMeta } from "../../types";

function createMockEngine(rows: any[] = []): ITableEngine<any> {
  let globalFilter = "";
  let pageIndex = 0;
  let pageSize = 10;

  return {
    getState: () => ({
      globalFilter,
      pagination: { pageIndex, pageSize },
      sorting: [],
      columnVisibility: {},
      rowSelection: {},
    }),
    setGlobalFilter: (val: any) => {
      globalFilter = val;
    },
    setPageIndex: (idx: number) => {
      pageIndex = idx;
    },
    setPageSize: (size: number) => {
      pageSize = size;
    },
    getPageCount: () => Math.ceil(rows.length / pageSize) || 1,
    getCanPreviousPage: () => pageIndex > 0,
    getCanNextPage: () => pageIndex < Math.ceil(rows.length / pageSize) - 1,
    previousPage: () => {
      if (pageIndex > 0) pageIndex--;
    },
    nextPage: () => {
      pageIndex++;
    },
    getRowModel: () => ({
      rows: rows.map((r, i) => ({ id: `row-${i}`, original: r })),
    }),
    getPrePaginationRowModel: () => ({
      rows: rows.map((r, i) => ({ id: `row-${i}`, original: r })),
    }),
    getHeaderGroups: () => [],
    getVisibleFlatColumns: () => [],
    getAllLeafColumns: () => [],
    getAllColumns: () => [],
    getColumn: () => undefined,
  } as unknown as ITableEngine<any>;
}

const mockMeta: TableMeta = {
  id: "test-layout-table",
  columns: [],
};

describe("ZenithTable Layout, Presets & Primitives", () => {
  it("renders with default inline toolbar when no preset is provided", () => {
    const engine = createMockEngine([{ id: "1", name: "Alpha" }]);
    render(
      <ZenithTable engine={engine} meta={mockMeta}>
        <ZenithTable.Toolbar />
      </ZenithTable>
    );

    expect(screen.getByTestId("table-toolbar")).toBeDefined();
  });

  it("renders with analytics preset (split toolbar layout)", () => {
    const engine = createMockEngine([{ id: "1", name: "Beta" }]);
    render(
      <ZenithTable engine={engine} meta={mockMeta} preset="analytics">
        <ZenithTable.Toolbar />
      </ZenithTable>
    );

    expect(screen.getByTestId("table-toolbar")).toBeDefined();
  });

  it("renders with composable toolbar primitives", () => {
    const engine = createMockEngine([{ id: "1", name: "Gamma" }]);
    render(
      <ZenithTable engine={engine} meta={mockMeta}>
        <ZenithTable.Toolbar>
          <ZenithTable.Toolbar.Start>
            <ZenithTable.Toolbar.Search placeholder="Custom Search..." />
          </ZenithTable.Toolbar.Start>
          <ZenithTable.Toolbar.End>
            <ZenithTable.Toolbar.Density />
            <ZenithTable.Toolbar.Slot>
              <button data-testid="custom-action-btn">Export All</button>
            </ZenithTable.Toolbar.Slot>
          </ZenithTable.Toolbar.End>
        </ZenithTable.Toolbar>
      </ZenithTable>
    );

    expect(screen.getByPlaceholderText("Custom Search...")).toBeDefined();
    expect(screen.getByTestId("custom-action-btn")).toBeDefined();
  });

  it("renders split-three pagination correctly", () => {
    const engine = createMockEngine([
      { id: "1", name: "Item 1" },
      { id: "2", name: "Item 2" },
      { id: "3", name: "Item 3" },
    ]);

    render(
      <ZenithTable engine={engine} meta={mockMeta}>
        <ZenithTable.Pagination align="split-three" />
      </ZenithTable>
    );

    expect(screen.getByRole("navigation")).toBeDefined();
    expect(screen.getByLabelText("Rows per page:")).toBeDefined();
  });

  it("tracks viewport physics and density changes in physics store", () => {
    const containerRef = { current: document.createElement("div") };
    const store = createTablePhysicsStore({ containerRef });

    expect(store.getState().viewport.breakpoint).toBe("desktop");

    store.getState().setViewport({
      width: 480,
      height: 700,
      breakpoint: "mobile",
      isMobile: true,
      isTablet: false,
      isDesktop: false,
    });

    expect(store.getState().viewport.isMobile).toBe(true);
    expect(store.getState().viewport.breakpoint).toBe("mobile");
  });
});
