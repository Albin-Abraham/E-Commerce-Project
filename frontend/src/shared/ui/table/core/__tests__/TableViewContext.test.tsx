import React from "react";

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TableViewProvider, useTableView } from "../TableViewContext";

function ViewWrapper({
  children,
  defaultView,
}: {
  children: React.ReactNode;
  defaultView?: "table" | "board" | "list";
}) {
  return (
    <TableViewProvider defaultView={defaultView}>{children}</TableViewProvider>
  );
}

describe("TableViewContext", () => {
  it("throws when useTableView used outside provider", () => {
    expect(() => {
      renderHook(() => useTableView());
    }).toThrow("useTableView must be used inside a <ZenithTable> component");
  });

  it("defaults to table view", () => {
    const { result } = renderHook(() => useTableView(), {
      wrapper: ({ children }) => <ViewWrapper>{children}</ViewWrapper>,
    });

    expect(result.current.activeView).toBe("table");
  });

  it("respects custom defaultView", () => {
    const { result } = renderHook(() => useTableView(), {
      wrapper: ({ children }) => (
        <ViewWrapper defaultView="board">{children}</ViewWrapper>
      ),
    });

    expect(result.current.activeView).toBe("board");
  });

  it("setView changes active view", () => {
    const { result } = renderHook(() => useTableView(), {
      wrapper: ({ children }) => <ViewWrapper>{children}</ViewWrapper>,
    });

    act(() => {
      result.current.setView("list");
    });

    expect(result.current.activeView).toBe("list");
  });

  it("setView is stable across renders", () => {
    const { result, rerender } = renderHook(() => useTableView(), {
      wrapper: ({ children }) => <ViewWrapper>{children}</ViewWrapper>,
    });

    const firstSetView = result.current.setView;
    rerender();
    expect(result.current.setView).toBe(firstSetView);
  });

  it("setShowIndex is available and defaults to false", () => {
    const { result } = renderHook(() => useTableView(), {
      wrapper: ({ children }) => <ViewWrapper>{children}</ViewWrapper>,
    });

    expect(result.current.showIndex).toBe(false);
    act(() => {
      result.current.setShowIndex(true);
    });
    expect(result.current.showIndex).toBe(true);
  });
});
