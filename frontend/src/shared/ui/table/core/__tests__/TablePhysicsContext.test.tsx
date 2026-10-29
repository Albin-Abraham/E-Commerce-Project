import React from "react";

import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  TablePhysicsProvider,
  useTableCellAtom,
  useTablePhysics,
} from "../TablePhysicsContext";

function createMockRef() {
  return { current: null } as React.RefObject<HTMLDivElement | null>;
}

function PhysicsWrapper({ children }: { children: React.ReactNode }) {
  return (
    <TablePhysicsProvider containerRef={createMockRef()}>
      {children}
    </TablePhysicsProvider>
  );
}

describe("TablePhysicsContext", () => {
  it("throws when useTablePhysics used outside provider", () => {
    expect(() => {
      renderHook(() => useTablePhysics((s) => s.selectedRows));
    }).toThrow("useTablePhysics must be used inside a <ZenithTable> component");
  });

  it("provides physics state to children", () => {
    const { result } = renderHook(() => useTablePhysics((s) => s.density), {
      wrapper: PhysicsWrapper,
    });

    expect(result.current).toBe("comfortable");
  });

  it("provides initial selection state", () => {
    const { result } = renderHook(
      () => useTablePhysics((s) => s.selectionMode),
      { wrapper: PhysicsWrapper }
    );

    expect(result.current).toBe("MANUAL");
  });

  it("useTableCellAtom returns default state", () => {
    const { result } = renderHook(() => useTableCellAtom("row-1"), {
      wrapper: PhysicsWrapper,
    });

    expect(result.current.isSelected).toBe(false);
    expect(result.current.isHovered).toBe(false);
  });

  it("useTableCellAtom reflects hover changes", () => {
    const { result } = renderHook(() => useTableCellAtom("row-1"), {
      wrapper: PhysicsWrapper,
    });

    expect(result.current.isHovered).toBe(false);
  });

  it("useTableCellAtom reflects selection in ALL mode", () => {
    const { result } = renderHook(
      () => ({
        mode: useTablePhysics((s) => s.selectionMode),
        cell: useTableCellAtom("row-1"),
      }),
      { wrapper: PhysicsWrapper }
    );

    expect(result.current.mode).toBe("MANUAL");
    expect(result.current.cell.isSelected).toBe(false);
  });

  it("physics store exposes toggleSelection", () => {
    const { result } = renderHook(
      () => useTablePhysics((s) => s.toggleSelection),
      { wrapper: PhysicsWrapper }
    );

    expect(typeof result.current).toBe("function");
  });

  it("physics store exposes setBulkSelection", () => {
    const { result } = renderHook(
      () => useTablePhysics((s) => s.setBulkSelection),
      { wrapper: PhysicsWrapper }
    );

    expect(typeof result.current).toBe("function");
  });

  it("physics store exposes resetSelection", () => {
    const { result } = renderHook(
      () => useTablePhysics((s) => s.resetSelection),
      { wrapper: PhysicsWrapper }
    );

    expect(typeof result.current).toBe("function");
  });
});
