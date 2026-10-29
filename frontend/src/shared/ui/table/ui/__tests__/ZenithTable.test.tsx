import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { resolveTableMeta } from "../../meta/TableMetaDefaults";
import { ZenithTable } from "../ZenithTable";

function createMockTable(overrides: Record<string, unknown> = {}) {
  return {
    getRowModel: vi.fn().mockReturnValue({ rows: [] }),
    getHeaderGroups: vi.fn().mockReturnValue([{ id: "header-0", headers: [] }]),
    getAllColumns: vi.fn().mockReturnValue([]),
    getState: vi.fn().mockReturnValue({
      sorting: [],
      pagination: { pageIndex: 0, pageSize: 10 },
      columnFilters: [],
      globalFilter: "",
    }),
    getPrePaginationRowModel: vi.fn().mockReturnValue({ rows: [] }),
    getPageCount: vi.fn().mockReturnValue(1),
    getCanPreviousPage: vi.fn().mockReturnValue(false),
    getCanNextPage: vi.fn().mockReturnValue(false),
    ...overrides,
  } as Record<string, unknown>;
}

const meta = resolveTableMeta({ id: "test-table" });

describe("ZenithTable", () => {
  it("renders with region role", () => {
    const table = createMockTable();
    const { getByRole } = render(
      <ZenithTable engine={table as never} meta={meta}>
        <div>child content</div>
      </ZenithTable>
    );
    expect(getByRole("region")).toBeDefined();
  });

  it("renders with meta.id as testid", () => {
    const table = createMockTable();
    const { getByTestId } = render(
      <ZenithTable engine={table as never} meta={meta}>
        <div>child content</div>
      </ZenithTable>
    );
    expect(getByTestId("test-table")).toBeDefined();
  });

  it("renders children", () => {
    const table = createMockTable();
    const { getByText } = render(
      <ZenithTable engine={table as never} meta={meta}>
        <div>child content</div>
      </ZenithTable>
    );
    expect(getByText("child content")).toBeDefined();
  });

  it("has compound components", () => {
    expect(ZenithTable.Header).toBeDefined();
    expect(ZenithTable.Body).toBeDefined();
    expect(ZenithTable.View).toBeDefined();
    expect(ZenithTable.Pagination).toBeDefined();
    expect(ZenithTable.FilterBar).toBeDefined();
  });

  it("sets aria-label on region", () => {
    const table = createMockTable();
    const { getByRole } = render(
      <ZenithTable engine={table as never} meta={meta}>
        <div>content</div>
      </ZenithTable>
    );
    expect(getByRole("region").getAttribute("aria-label")).toBe("Data table");
  });
});
