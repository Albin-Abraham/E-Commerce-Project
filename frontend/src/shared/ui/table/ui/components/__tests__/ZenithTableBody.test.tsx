import type { ColumnDef } from "@tanstack/react-table";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { resolveTableMeta } from "../../../meta/TableMetaDefaults";
import { ZenithTable } from "../../ZenithTable";

interface TestRow {
  id: string;
  name: string;
}

const columns: ColumnDef<TestRow, unknown>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Name" },
];

function createMockTable(
  rows: unknown[] = [],
  overrides: Record<string, unknown> = {}
) {
  return {
    getRowModel: vi.fn().mockReturnValue({
      rows: rows.map((r, i) => ({
        id: `row-${i}`,
        original: r,
        getVisibleCells: vi.fn().mockReturnValue([]),
      })),
    }),
    getAllColumns: vi
      .fn()
      .mockReturnValue(columns.map((c: any) => ({ id: (c.accessorKey || c.id) as string }))),
    getState: vi.fn().mockReturnValue({
      sorting: [],
      pagination: { pageIndex: 0, pageSize: 10 },
    }),
    ...overrides,
  } as Record<string, unknown>;
}

const meta = resolveTableMeta({ id: "test-table" });

describe("ZenithTableBody", () => {
  it("renders empty state when no rows", () => {
    const table = createMockTable([]);
    const { getByText } = render(
      <ZenithTable engine={table as never} meta={meta}>
        <ZenithTable.Body />
      </ZenithTable>
    );
    expect(getByText("No records found")).toBeDefined();
  });

  it("renders rows when data present", () => {
    const table = createMockTable([{ id: "1", name: "Alice" }]);
    const { getByTestId } = render(
      <ZenithTable engine={table as never} meta={meta}>
        <ZenithTable.Body />
      </ZenithTable>
    );
    expect(getByTestId("table-row-row-0")).toBeDefined();
  });

  it("renders multiple rows", () => {
    const table = createMockTable([
      { id: "1", name: "Alice" },
      { id: "2", name: "Bob" },
    ]);
    const { getByTestId } = render(
      <ZenithTable engine={table as never} meta={meta}>
        <ZenithTable.Body />
      </ZenithTable>
    );
    expect(getByTestId("table-row-row-0")).toBeDefined();
    expect(getByTestId("table-row-row-1")).toBeDefined();
  });

  it("renders fetch error from context when there are no rows", () => {
    const table = createMockTable([]);
    const { getByText } = render(
      <ZenithTable
        engine={table as never}
        meta={meta}
        error={new Error("Network timeout")}
        refetch={() => {}}
      >
        <ZenithTable.Body />
      </ZenithTable>
    );
    expect(getByText(/Network timeout/i)).toBeDefined();
    expect(getByText("Retry")).toBeDefined();
  });
});
