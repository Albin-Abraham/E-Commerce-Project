import { describe, expect, it } from "vitest";

import { createTablePhysicsStore } from "../createTablePhysicsStore";

function createMockRef(value: HTMLDivElement | null = null) {
  return { current: value } as React.RefObject<HTMLDivElement | null>;
}

describe("createTablePhysicsStore", () => {
  it("creates store with default state", () => {
    const store = createTablePhysicsStore({ containerRef: createMockRef() });
    const state = store.getState();
    expect(state.selectedRows.size).toBe(0);
    expect(state.excludedRows.size).toBe(0);
    expect(state.selectionMode).toBe("MANUAL");
    expect(state.selectionType).toBe("multiple");
    expect(state.density).toBe("comfortable");
    expect(state.hoveredRowId).toBeNull();
    expect(state.focusedCell).toBeNull();
  });

  it("toggles selection in manual mode", () => {
    const store = createTablePhysicsStore({ containerRef: createMockRef() });
    store.getState().toggleSelection("row-1", true);
    expect(store.getState().selectedRows.has("row-1")).toBe(true);

    store.getState().toggleSelection("row-1", true);
    expect(store.getState().selectedRows.has("row-1")).toBe(false);
  });

  it("single select replaces selection", () => {
    const store = createTablePhysicsStore({ containerRef: createMockRef() });
    store.getState().toggleSelection("row-1");
    store.getState().toggleSelection("row-2");
    expect(store.getState().selectedRows.has("row-1")).toBe(false);
    expect(store.getState().selectedRows.has("row-2")).toBe(true);
  });

  it("sets bulk selection", () => {
    const store = createTablePhysicsStore({ containerRef: createMockRef() });
    store.getState().setBulkSelection(["a", "b", "c"]);
    expect(store.getState().selectedRows.size).toBe(3);
    expect(store.getState().selectionMode).toBe("PAGE");
  });

  it("resets selection", () => {
    const store = createTablePhysicsStore({ containerRef: createMockRef() });
    store.getState().toggleSelection("row-1");
    store.getState().resetSelection();
    expect(store.getState().selectedRows.size).toBe(0);
    expect(store.getState().selectionMode).toBe("MANUAL");
  });

  it("sets hover state", () => {
    const store = createTablePhysicsStore({ containerRef: createMockRef() });
    store.getState().setHover("row-5");
    expect(store.getState().hoveredRowId).toBe("row-5");
    store.getState().setHover(null);
    expect(store.getState().hoveredRowId).toBeNull();
  });

  it("sets focus state", () => {
    const store = createTablePhysicsStore({ containerRef: createMockRef() });
    store.getState().setFocus("row-1", "col-name");
    expect(store.getState().focusedCell).toEqual({
      rowId: "row-1",
      colId: "col-name",
    });
  });

  it("sets selection mode", () => {
    const store = createTablePhysicsStore({ containerRef: createMockRef() });
    store.getState().setSelectionMode("ALL");
    expect(store.getState().selectionMode).toBe("ALL");
    expect(store.getState().selectedRows.size).toBe(0);
    expect(store.getState().excludedRows.size).toBe(0);
  });

  it("sets selection type", () => {
    const store = createTablePhysicsStore({ containerRef: createMockRef() });
    store.getState().setSelectionType("single");
    expect(store.getState().selectionType).toBe("single");
    expect(store.getState().selectedRows.size).toBe(0);
    expect(store.getState().selectionMode).toBe("MANUAL");
  });

  it("toggles exclusion in ALL mode", () => {
    const store = createTablePhysicsStore({ containerRef: createMockRef() });
    store.getState().setSelectionMode("ALL");

    store.getState().toggleSelection("row-1", true);
    expect(store.getState().excludedRows.has("row-1")).toBe(true);

    store.getState().toggleSelection("row-1", true);
    expect(store.getState().excludedRows.has("row-1")).toBe(false);
  });

  it("sets total data count", () => {
    const store = createTablePhysicsStore({ containerRef: createMockRef() });
    store.getState().setTotalCount(100);
    expect(store.getState().totalDataCount).toBe(100);
    expect(store.getState().totalCountSynced).toBe(true);
  });
});
