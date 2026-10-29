import React from "react";

import type { ColumnDef } from "@tanstack/react-table";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useTablePhysics } from "../../core/TablePhysicsContext";
import { resolveTableMeta } from "../../meta/TableMetaDefaults";
import { ZenithTable } from "../ZenithTable";

interface TestRow {
  id: string;
  name: string;
  email: string;
}

const columns: ColumnDef<TestRow>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: (info) => info.getValue() as string,
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: (info) => info.getValue() as string,
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: (info) => info.getValue() as string,
  },
];

const testData: TestRow[] = [
  { id: "1", name: "Alice", email: "alice@test.com" },
  { id: "2", name: "Bob", email: "bob@test.com" },
  { id: "3", name: "Charlie", email: "charlie@test.com" },
];

function createMockTable(data: TestRow[] = testData) {
  const state = {
    sorting: [],
    pagination: { pageIndex: 0, pageSize: 10 },
    columnFilters: [],
    globalFilter: "",
  };

  const rows = data.map((row, i) => ({
    id: row.id,
    original: row,
    index: i,
    getVisibleCells: () =>
      columns.map((col: any) => {
        const value = (row as any)[col.accessorKey as string];
        const cellDef = col.cell;
        return {
          id: `${row.id}-${col.id ?? col.accessorKey}`,
          column: {
            id: (col.accessorKey || col.id) as string,
            columnDef: col,
            getIndex: () => columns.indexOf(col),
            getIsPinned: () => false as const,
            getStart: () => 0,
            getIsSorted: () => false as const,
            getCanSort: () => false,
            getCanResize: () => false,
            getIsResizing: () => false,
            getToggleSortingHandler: () => undefined,
          },
          getValue: () => value,
          row: {} as any,
          getContext: () => ({
            getValue: () => value,
            row: { original: row },
            column: { id: (col.accessorKey || col.id) as string },
            cell: {},
          }),
          // Support flexRender: cellDef is a function that returns the rendered content
          columnDef: {
            cell: cellDef,
          },
        };
      }),
  }));

  return {
    getState: vi.fn().mockReturnValue(state),
    getRowModel: vi.fn().mockReturnValue({ rows }),
    getHeaderGroups: vi.fn().mockReturnValue([
      {
        id: "header-0",
        headers: columns.map((col: any, i) => ({
          id: col.accessorKey || col.id || `col-${i}`,
          column: {
            id: col.accessorKey || col.id,
            columnDef: col,
            getIsPinned: () => false as const,
            getStart: () => 0,
            getIsSorted: () => false as const,
            getCanSort: () => true,
            getCanResize: () => false,
            getIsResizing: () => false,
            getToggleSortingHandler: () => vi.fn(),
            getIndex: () => i,
          },
          isPlaceholder: false,
          header: col.header,
          getContext: () => ({
            header: { column: { columnDef: col } },
          }),
          getResizeHandler: () => vi.fn(),
        })),
      },
    ]),
    getAllColumns: vi.fn().mockReturnValue(
      columns.map((col: any) => ({
        id: (col.accessorKey || col.id) as string,
        columnDef: col,
      }))
    ),
    getPrePaginationRowModel: vi.fn().mockReturnValue({ rows }),
    getPageCount: vi.fn().mockReturnValue(1),
    getCanPreviousPage: vi.fn().mockReturnValue(false),
    getCanNextPage: vi.fn().mockReturnValue(false),
  } as Record<string, unknown>;
}

const meta = resolveTableMeta({ id: "integration-table" });

describe("ZenithTable Integration", () => {
  it("renders table with header and body", () => {
    const table = createMockTable();
    render(
      <ZenithTable engine={table as never} meta={meta}>
        <ZenithTable.View>
          <ZenithTable.Header />
          <ZenithTable.Body />
        </ZenithTable.View>
      </ZenithTable>
    );

    expect(screen.getByRole("region")).toBeInTheDocument();
    expect(screen.getByTestId("integration-table")).toBeInTheDocument();
  });

  it("renders header columns", () => {
    const table = createMockTable();
    render(
      <ZenithTable engine={table as never} meta={meta}>
        <ZenithTable.View>
          <ZenithTable.Header />
          <ZenithTable.Body />
        </ZenithTable.View>
      </ZenithTable>
    );

    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("renders data rows with correct count", () => {
    const table = createMockTable();
    render(
      <ZenithTable engine={table as never} meta={meta}>
        <ZenithTable.View>
          <ZenithTable.Header />
          <ZenithTable.Body />
        </ZenithTable.View>
      </ZenithTable>
    );

    // Check row count via data-testid
    expect(screen.getByTestId("table-row-1")).toBeInTheDocument();
    expect(screen.getByTestId("table-row-2")).toBeInTheDocument();
    expect(screen.getByTestId("table-row-3")).toBeInTheDocument();
  });

  it("renders row data attributes", () => {
    const table = createMockTable();
    render(
      <ZenithTable engine={table as never} meta={meta}>
        <ZenithTable.View>
          <ZenithTable.Header />
          <ZenithTable.Body />
        </ZenithTable.View>
      </ZenithTable>
    );

    const row = screen.getByTestId("table-row-1");
    expect(row).toHaveAttribute("data-id", "1");
    expect(row).toHaveAttribute("data-state", "unselected");
  });

  it("sets data-state=selected on rows in ALL mode", async () => {
    function SeedAll() {
      const setSelectionMode = useTablePhysics((s) => s.setSelectionMode);
      React.useEffect(() => {
        setSelectionMode("ALL");
      }, [setSelectionMode]);
      return null;
    }

    const table = createMockTable();
    render(
      <ZenithTable engine={table as never} meta={meta}>
        <SeedAll />
        <ZenithTable.View>
          <ZenithTable.Header />
          <ZenithTable.Body />
        </ZenithTable.View>
      </ZenithTable>
    );

    await waitFor(() => {
      expect(screen.getByTestId("table-row-1")).toHaveAttribute(
        "data-state",
        "selected"
      );
    });
  });

  it("renders empty state when no data", () => {
    const table = createMockTable([]);
    render(
      <ZenithTable engine={table as never} meta={meta}>
        <ZenithTable.View>
          <ZenithTable.Header />
          <ZenithTable.Body />
        </ZenithTable.View>
      </ZenithTable>
    );

    expect(screen.getByText("No records found")).toBeInTheDocument();
  });

  it("renders loading skeletons when loading and empty", () => {
    const table = createMockTable([]);
    const { container } = render(
      <ZenithTable engine={table as never} meta={meta}>
        <ZenithTable.View>
          <ZenithTable.Header />
          <ZenithTable.Body loading loadingRows={3} />
        </ZenithTable.View>
      </ZenithTable>
    );

    const skeletons = container.querySelectorAll('[data-status="loading"]');
    expect(skeletons.length).toBe(3);
  });

  it("renders global row index when showIndex=true", () => {
    const table = createMockTable();
    const { container } = render(
      <ZenithTable engine={table as never} meta={meta}>
        <ZenithTable.View>
          <ZenithTable.Header />
          <ZenithTable.Body showIndex />
        </ZenithTable.View>
      </ZenithTable>
    );

    // Index cells have the tabular-nums class
    const indexCells = container.querySelectorAll(".tabular-nums");
    expect(indexCells.length).toBe(4);
    expect(indexCells[0].textContent).toMatch(/SL NO|#/);
    expect(indexCells[1]).toHaveTextContent("1");
    expect(indexCells[2]).toHaveTextContent("2");
    expect(indexCells[3]).toHaveTextContent("3");
  });

  it("calls onRowClick when clicking a row", () => {
    const onRowClick = vi.fn();
    const table = createMockTable();
    render(
      <ZenithTable engine={table as never} meta={meta}>
        <ZenithTable.View>
          <ZenithTable.Header />
          <ZenithTable.Body onRowClick={onRowClick} />
        </ZenithTable.View>
      </ZenithTable>
    );

    const row = screen.getByTestId("table-row-1");
    row.click();

    expect(onRowClick).toHaveBeenCalledWith("1");
  });

  it("does not call onRowClick when clicking a button inside row", () => {
    const onRowClick = vi.fn();
    const table = createMockTable([
      { id: "1", name: "Alice", email: "alice@test.com" },
    ]);
    render(
      <ZenithTable engine={table as never} meta={meta}>
        <ZenithTable.View>
          <ZenithTable.Header />
          <ZenithTable.Body
            onRowClick={onRowClick}
            renderRow={({ row, cells }) => (
              <tr
                key={row.id}
                data-table-row={row.id}
                data-testid={`table-row-${row.id}`}
              >
                {cells}
                <td>
                  <button>Edit</button>
                </td>
              </tr>
            )}
          />
        </ZenithTable.View>
      </ZenithTable>
    );

    const button = screen.getByRole("button", { name: "Edit" });
    button.click();

    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("passes striped/bordered/shadow meta to Table", () => {
    const stripedMeta = resolveTableMeta({
      id: "styled-table",
      striped: true,
      bordered: true,
      shadow: "md",
    });
    const table = createMockTable();
    const { container } = render(
      <ZenithTable engine={table as never} meta={stripedMeta}>
        <ZenithTable.View>
          <ZenithTable.Header />
          <ZenithTable.Body />
        </ZenithTable.View>
      </ZenithTable>
    );

    const tableEl = container.querySelector("table");
    expect(tableEl).toHaveClass("striped");
    expect(tableEl).toHaveClass("bordered");
    expect(container.querySelector('[class*="shadow-md"]')).toBeInTheDocument();
  });
});
