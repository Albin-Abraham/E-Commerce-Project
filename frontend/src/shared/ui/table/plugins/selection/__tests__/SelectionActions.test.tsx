import React from "react";

import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TableEngineContext } from "../../../core/TableEngineContext";
import { TablePhysicsProvider } from "../../../core/TablePhysicsContext";
import { SelectionBarAction, SelectionBarActions } from "../SelectionActions";

function createMockRef() {
  return { current: null } as React.RefObject<HTMLDivElement | null>;
}

function createMockTable() {
  return {
    getRowModel: vi.fn().mockReturnValue({ rows: [] }),
    ...{},
  } as Record<string, unknown>;
}

function SelectionWrapper({
  children,
  engine,
}: {
  children: React.ReactNode;
  engine?: Record<string, unknown>;
}) {
  return (
    <TablePhysicsProvider containerRef={createMockRef()}>
      <TableEngineContext.Provider
        value={{ engine: (engine ?? createMockTable()) as never }}
      >
        {children}
      </TableEngineContext.Provider>
    </TablePhysicsProvider>
  );
}

describe("SelectionActions", () => {
  describe("SelectionBarAction", () => {
    it("renders button with label", () => {
      const { getByText } = render(
        <SelectionWrapper>
          <SelectionBarAction label="Export" />
        </SelectionWrapper>
      );
      expect(getByText("Export")).toBeDefined();
    });

    it("calls onClick when clicked", () => {
      const onClick = vi.fn();
      const { getByText } = render(
        <SelectionWrapper>
          <SelectionBarAction label="Export" onClick={onClick} />
        </SelectionWrapper>
      );
      getByText("Export").click();
      expect(onClick).toHaveBeenCalled();
    });

    it("passes context to onClick", () => {
      const onClick = vi.fn();
      const { getByText } = render(
        <SelectionWrapper>
          <SelectionBarAction label="Export" onClick={onClick} />
        </SelectionWrapper>
      );
      getByText("Export").click();
      expect(onClick).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: "MANUAL",
          selectedIds: expect.any(Array),
          excludedIds: expect.any(Array),
          totalCount: expect.any(Number),
        })
      );
    });

    it("is disabled when loading", () => {
      const { getByText } = render(
        <SelectionWrapper>
          <SelectionBarAction label="Export" loading />
        </SelectionWrapper>
      );
      expect(getByText("Export").closest("button")?.disabled).toBe(true);
    });

    it("is disabled when disabled prop is true", () => {
      const { getByText } = render(
        <SelectionWrapper>
          <SelectionBarAction label="Export" disabled />
        </SelectionWrapper>
      );
      expect(getByText("Export").closest("button")?.disabled).toBe(true);
    });
  });

  describe("SelectionBarActions", () => {
    it("renders children", () => {
      const { getByText } = render(
        <SelectionWrapper>
          <SelectionBarActions>
            <span>action 1</span>
            <span>action 2</span>
          </SelectionBarActions>
        </SelectionWrapper>
      );
      expect(getByText("action 1")).toBeDefined();
      expect(getByText("action 2")).toBeDefined();
    });
  });
});
