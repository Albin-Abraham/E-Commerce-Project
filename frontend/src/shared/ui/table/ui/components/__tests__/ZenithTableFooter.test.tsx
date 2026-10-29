import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ZenithTable } from "../../ZenithTable";

describe("ZenithTableFooter", () => {
  it("renders aggregation totals in table footer", () => {
    const mockColumns = [
      { id: "name", header: "Name", accessorKey: "name" },
      { id: "score", header: "Score", accessorKey: "score" },
    ];

    const mockData = [
      { id: "1", name: "Alpha", score: 100 },
      { id: "2", name: "Beta", score: 200 },
      { id: "3", name: "Gamma", score: 300 },
    ];

    const mockEngine: any = {
      getVisibleLeafColumns: () => [
        {
          id: "name",
          columnDef: { meta: {} },
          getIsPinned: () => false,
          getStart: () => 0,
        },
        {
          id: "score",
          columnDef: { meta: { variant: "numeric" } },
          getIsPinned: () => false,
          getStart: () => 0,
        },
      ],
      getRowModel: () => ({
        rows: mockData.map((d) => ({ id: d.id, original: d })),
      }),
      getState: () => ({}),
    };

    const mockMeta: any = {
      id: "test-table",
      columns: mockColumns,
      ui: {},
    };

    render(
      <ZenithTable engine={mockEngine} meta={mockMeta}>
        <ZenithTable.View>
          <ZenithTable.Footer
            aggregates={{
              score: "sum",
            }}
          />
        </ZenithTable.View>
      </ZenithTable>
    );

    expect(screen.getByTestId("zenith-table-footer")).toBeInTheDocument();
    expect(screen.getByText("600")).toBeInTheDocument();
    expect(screen.getByText(/Summary/)).toBeInTheDocument();
  });
});
