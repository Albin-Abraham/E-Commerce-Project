import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { resolveTableMeta } from "../../../meta/TableMetaDefaults";
import { ZenithTable } from "../../ZenithTable";

function createMockTable(headers: { id: string; label: string }[] = []) {
  return {
    getHeaderGroups: vi.fn().mockReturnValue([
      {
        id: "header-group-0",
        headers: headers.map((h) => ({
          id: h.id,
          column: {
            id: h.id,
            getIsSorted: vi.fn().mockReturnValue(false),
            getCanSort: vi.fn().mockReturnValue(false),
            getIsPinned: vi.fn().mockReturnValue(false),
            getCanResize: vi.fn().mockReturnValue(false),
            getToggleSortingHandler: vi.fn().mockReturnValue(undefined),
            columnDef: { header: h.label },
          },
          isPlaceholder: false,
          getResizeHandler: vi.fn(),
          getContext: vi.fn(),
        })),
      },
    ]),
    getRowModel: vi.fn().mockReturnValue({ rows: [] }),
    getAllColumns: vi.fn().mockReturnValue([]),
    getState: vi.fn().mockReturnValue({
      sorting: [],
      pagination: { pageIndex: 0, pageSize: 10 },
    }),
  } as Record<string, unknown>;
}

const meta = resolveTableMeta({ id: "test-table" });

describe("ZenithTableHeader", () => {
  it("renders header cells", () => {
    const table = createMockTable([
      { id: "name", label: "Name" },
      { id: "email", label: "Email" },
    ]);
    const { getByTestId } = render(
      <ZenithTable engine={table as never} meta={meta}>
        <ZenithTable.Header />
      </ZenithTable>
    );
    expect(getByTestId("table-col-name")).toBeDefined();
    expect(getByTestId("table-col-email")).toBeDefined();
  });

  it("sets aria-sort=none for unsorted columns", () => {
    const table = createMockTable([{ id: "name", label: "Name" }]);
    const { getByTestId } = render(
      <ZenithTable engine={table as never} meta={meta}>
        <ZenithTable.Header />
      </ZenithTable>
    );
    expect(getByTestId("table-col-name").getAttribute("aria-sort")).toBe(
      "none"
    );
  });

  it("sets tabIndex=0 for sortable columns", () => {
    const table = createMockTable([{ id: "name", label: "Name" }]);
    const { getByTestId } = render(
      <ZenithTable engine={table as never} meta={meta}>
        <ZenithTable.Header />
      </ZenithTable>
    );
    expect(getByTestId("table-col-name").getAttribute("tabindex")).toBe("0");
  });
});
