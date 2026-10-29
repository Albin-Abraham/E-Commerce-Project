import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@testing/test-utils";
import { describe, expect, it, vi } from "vitest";

import { compileFiltersToFormDef } from "../../../mdap/compileFiltersToFormDef";
import { resolveTableMeta } from "../../../meta/TableMetaDefaults";
import { ZenithTable } from "../../ZenithTable";

function createMockEngine(overrides: Record<string, unknown> = {}) {
  return {
    getRowModel: vi.fn().mockReturnValue({ rows: [] }),
    getHeaderGroups: vi.fn().mockReturnValue([]),
    getAllColumns: vi.fn().mockReturnValue([]),
    getColumn: vi.fn(),
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
    setGlobalFilter: vi.fn(),
    setColumnFilters: vi.fn(),
    resetColumnFilters: vi.fn(),
    ...overrides,
  };
}

const meta = resolveTableMeta({ id: "users", features: { urlSync: false } });

describe("TableFilterBar", () => {
  it("writes search to setGlobalFilter and other fields to setColumnFilters", async () => {
    const setGlobalFilter = vi.fn();
    const setColumnFilters = vi.fn();
    const engine = createMockEngine({ setGlobalFilter, setColumnFilters });
    const filterForm = compileFiltersToFormDef("users", [
      {
        id: "search",
        name: "search",
        label: "Search",
        type: "text",
        properties: { placeholder: "Find…" },
      },
      {
        id: "role",
        name: "role",
        label: "Role",
        type: "text",
      },
    ]);
    const user = userEvent.setup();

    renderWithProviders(
      <ZenithTable engine={engine as never} meta={meta} filterForm={filterForm}>
        <ZenithTable.FilterBar />
      </ZenithTable>
    );

    const search = await screen.findByLabelText(/search/i);
    await user.type(search, "alice");
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(setGlobalFilter).toHaveBeenCalled();
    expect(setColumnFilters).toHaveBeenCalled();
  });

  it("shows the same filterStatusBadge as Toolbar when search is active", () => {
    const engine = createMockEngine({
      getState: vi.fn().mockReturnValue({
        sorting: [],
        pagination: { pageIndex: 0, pageSize: 10 },
        columnFilters: [{ id: "role", value: "Admin" }],
        globalFilter: "alice",
      }),
    });
    const filterForm = compileFiltersToFormDef("users", [
      { id: "search", name: "search", label: "Search", type: "text" },
    ]);
    renderWithProviders(
      <ZenithTable
        engine={engine as never}
        meta={meta}
        filterForm={filterForm}
        chrome={{ filterStatusBadge: true }}
      >
        <ZenithTable.Toolbar />
        <ZenithTable.FilterBar />
      </ZenithTable>
    );
    const badges = screen.getAllByTestId("table-filter-status-badge");
    expect(badges).toHaveLength(2);
    expect(badges[0]).toHaveTextContent("2 filters");
  });
});
