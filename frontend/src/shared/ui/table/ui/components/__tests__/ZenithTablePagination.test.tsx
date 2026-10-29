import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { resolveTableMeta } from "../../../meta/TableMetaDefaults";
import { ZenithTable } from "../../ZenithTable";

function createMockTable(overrides: Record<string, unknown> = {}) {
  return {
    getRowModel: vi.fn().mockReturnValue({ rows: [] }),
    getHeaderGroups: vi.fn().mockReturnValue([]),
    getAllColumns: vi.fn().mockReturnValue([]),
    getState: vi.fn().mockReturnValue({
      sorting: [],
      pagination: { pageIndex: 0, pageSize: 10 },
    }),
    getPrePaginationRowModel: vi.fn().mockReturnValue({ rows: [] }),
    getPageCount: vi.fn().mockReturnValue(5),
    getCanPreviousPage: vi.fn().mockReturnValue(false),
    getCanNextPage: vi.fn().mockReturnValue(true),
    previousPage: vi.fn(),
    nextPage: vi.fn(),
    setPageIndex: vi.fn(),
    setPageSize: vi.fn(),
    ...overrides,
  } as Record<string, unknown>;
}

const meta = resolveTableMeta({ id: "test-table" });

describe("ZenithTablePagination", () => {
  it("renders pagination navigation", () => {
    const table = createMockTable();
    const { getByTestId } = render(
      <ZenithTable engine={table as never} meta={meta}>
        <ZenithTable.Pagination />
      </ZenithTable>
    );
    expect(getByTestId("table-pagination")).toBeDefined();
  });

  it("shows page numbers when totalPages > 1", () => {
    const table = createMockTable({
      getPageCount: vi.fn().mockReturnValue(3),
    });
    const { getByTestId } = render(
      <ZenithTable engine={table as never} meta={meta}>
        <ZenithTable.Pagination />
      </ZenithTable>
    );
    expect(getByTestId("table-pagination-page-1")).toBeDefined();
    expect(getByTestId("table-pagination-page-2")).toBeDefined();
    expect(getByTestId("table-pagination-page-3")).toBeDefined();
  });

  it("hides navigation when totalPages is 1", () => {
    const table = createMockTable({
      getPageCount: vi.fn().mockReturnValue(1),
    });
    const { queryByTestId } = render(
      <ZenithTable engine={table as never} meta={meta}>
        <ZenithTable.Pagination />
      </ZenithTable>
    );
    expect(queryByTestId("table-pagination-page-1")).toBeNull();
  });

  it("shows first/last buttons by default", () => {
    const table = createMockTable({
      getPageCount: vi.fn().mockReturnValue(3),
    });
    const { getByTestId } = render(
      <ZenithTable engine={table as never} meta={meta}>
        <ZenithTable.Pagination />
      </ZenithTable>
    );
    expect(getByTestId("table-pagination-first")).toBeDefined();
    expect(getByTestId("table-pagination-last")).toBeDefined();
  });

  it("shows prev/next buttons", () => {
    const table = createMockTable({
      getPageCount: vi.fn().mockReturnValue(3),
    });
    const { getByTestId } = render(
      <ZenithTable engine={table as never} meta={meta}>
        <ZenithTable.Pagination />
      </ZenithTable>
    );
    expect(getByTestId("table-pagination-prev")).toBeDefined();
    expect(getByTestId("table-pagination-next")).toBeDefined();
  });

  it("shows display label", () => {
    const table = createMockTable();
    const { getByText } = render(
      <ZenithTable engine={table as never} meta={meta}>
        <ZenithTable.Pagination />
      </ZenithTable>
    );
    expect(getByText("Showing 0-0 of 0 records")).toBeDefined();
  });

  it("uses totalCount from physics, not the current page row count", async () => {
    const tenRows = Array.from({ length: 10 }, (_, i) => ({ id: String(i) }));
    const table = createMockTable({
      getPrePaginationRowModel: vi.fn().mockReturnValue({ rows: tenRows }),
      getPageCount: vi.fn().mockReturnValue(10),
    });
    const { getByText, findByText } = render(
      <ZenithTable engine={table as never} meta={meta} totalCount={100}>
        <ZenithTable.Pagination />
      </ZenithTable>
    );
    expect(await findByText("Showing 1-10 of 100 records")).toBeDefined();
    expect(getByText("Showing 1-10 of 100 records")).toBeDefined();
  });

  it("shows 0 records when totalCount is 0 even if page rows exist", async () => {
    const tenRows = Array.from({ length: 10 }, (_, i) => ({ id: String(i) }));
    const table = createMockTable({
      getPrePaginationRowModel: vi.fn().mockReturnValue({ rows: tenRows }),
      getPageCount: vi.fn().mockReturnValue(0),
    });
    const { findByText } = render(
      <ZenithTable engine={table as never} meta={meta} totalCount={0}>
        <ZenithTable.Pagination />
      </ZenithTable>
    );
    expect(await findByText("Showing 0-0 of 0 records")).toBeDefined();
  });
});
