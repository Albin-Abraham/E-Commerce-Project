import { describe, expect, it } from "vitest";

import { createActionsColumn } from "../actionsColumn";

function TestActions({ rowData }: { row: any; rowData: any }) {
  return (
    <button data-testid={`action-${rowData.id}`}>Edit {rowData.name}</button>
  );
}

describe("createActionsColumn", () => {
  it("creates a column with correct id", () => {
    const col = createActionsColumn({ actions: TestActions });

    expect(col.id).toBe("__actions__");
  });

  it("defaults to 80px width", () => {
    const col = createActionsColumn({ actions: TestActions });

    expect(col.size).toBe(80);
  });

  it("accepts custom width", () => {
    const col = createActionsColumn({ actions: TestActions, width: 120 });

    expect(col.size).toBe(120);
  });

  it("disables sorting and resizing", () => {
    const col = createActionsColumn({ actions: TestActions });

    expect(col.enableSorting).toBe(false);
    expect(col.enableResizing).toBe(false);
  });

  it("pins column to right", () => {
    const col = createActionsColumn({ actions: TestActions });

    expect(col.meta).toEqual({ pinned: "right" });
  });

  it("renders header as empty string by default", () => {
    const col = createActionsColumn({ actions: TestActions });

    const HeaderComp = col.header as () => string;
    expect(HeaderComp()).toBe("");
  });

  it("renders custom header text", () => {
    const col = createActionsColumn({
      actions: TestActions,
      header: "Actions",
    });

    const HeaderComp = col.header as () => string;
    expect(HeaderComp()).toBe("Actions");
  });

  it("renders actions component in cell", () => {
    const col = createActionsColumn({ actions: TestActions });

    const CellComp = col.cell as (props: { row: { id: string; original: Record<string, unknown> } }) => unknown;
    const result = CellComp({
      row: {
        id: "row-1",
        original: { id: "row-1", name: "John" },
      },
    });

    expect(result).toBeTruthy();
  });
});
