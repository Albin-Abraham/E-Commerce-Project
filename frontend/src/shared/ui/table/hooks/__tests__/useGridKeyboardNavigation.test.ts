import { EventDelegator } from "@core/events/EventDelegator";
import { useEventRegistry } from "@core/events/stores/eventRegistry.store";
import { KeyboardDelegationStrategy } from "@core/events/strategies/KeyboardDelegationStrategy";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useGridKeyboardNavigation } from "../useGridKeyboardNavigation";

function createGridRef() {
  const el = document.createElement("div");
  el.setAttribute("role", "grid");

  for (let r = 0; r < 3; r++) {
    const row = document.createElement("div");
    row.setAttribute("data-table-row", `row-${r}`);
    for (let c = 0; c < 3; c++) {
      const cell = document.createElement("div");
      cell.setAttribute("data-table-cell", `cell-${r}-${c}`);
      cell.setAttribute("role", "gridcell");
      cell.tabIndex = -1;
      row.appendChild(cell);
    }
    el.appendChild(row);
  }

  return { current: el };
}

describe("useGridKeyboardNavigation", () => {
  let gridRef: ReturnType<typeof createGridRef>;

  beforeEach(() => {
    gridRef = createGridRef();
    document.body.appendChild(gridRef.current);
    // jsdom doesn't have scrollIntoView
    if (!HTMLElement.prototype.scrollIntoView) {
      HTMLElement.prototype.scrollIntoView = vi.fn() as any;
    }
  });

  afterEach(() => {
    document.body.removeChild(gridRef.current);
    vi.restoreAllMocks();
    const { shortcuts, unregisterShortcut, setActiveScope } =
      useEventRegistry.getState();
    Object.keys(shortcuts).forEach((id) => unregisterShortcut(id));
    setActiveScope("global");
  });

  it("focuses cell on ArrowRight", () => {
    const { result } = renderHook(() =>
      useGridKeyboardNavigation({
        gridRef: gridRef as React.RefObject<HTMLDivElement | null>,
        getRowCount: () => 3,
        getColCount: () => 3,
      })
    );

    act(() => {
      result.current.handleKeyDown({
        key: "ArrowRight",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    const focused = gridRef.current.querySelector(":focus");
    expect(focused).toBeTruthy();
    expect(focused).toHaveAttribute("data-table-cell", "cell-0-1");
  });

  it("focuses cell on ArrowDown", () => {
    const { result } = renderHook(() =>
      useGridKeyboardNavigation({
        gridRef: gridRef as React.RefObject<HTMLDivElement | null>,
        getRowCount: () => 3,
        getColCount: () => 3,
      })
    );

    act(() => {
      result.current.handleKeyDown({
        key: "ArrowDown",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    const focused = gridRef.current.querySelector(":focus");
    expect(focused).toBeTruthy();
    expect(focused).toHaveAttribute("data-table-cell", "cell-1-0");
  });

  it("does nothing when enabled=false", () => {
    const { result } = renderHook(() =>
      useGridKeyboardNavigation({
        gridRef: gridRef as React.RefObject<HTMLDivElement | null>,
        getRowCount: () => 3,
        getColCount: () => 3,
        enabled: false,
      })
    );

    act(() => {
      result.current.handleKeyDown({
        key: "ArrowRight",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(gridRef.current.querySelector(":focus")).toBeFalsy();
  });

  it("calls onCellActivate on Enter", () => {
    const onCellActivate = vi.fn();
    const { result } = renderHook(() =>
      useGridKeyboardNavigation({
        gridRef: gridRef as React.RefObject<HTMLDivElement | null>,
        getRowCount: () => 3,
        getColCount: () => 3,
        onCellActivate,
      })
    );

    act(() => {
      result.current.handleKeyDown({
        key: "Enter",
        preventDefault: vi.fn(),
      } as unknown as React.KeyboardEvent);
    });

    expect(onCellActivate).toHaveBeenCalledWith(0, 0);
  });

  it("focusCell calls scrollIntoView", () => {
    const { result } = renderHook(() =>
      useGridKeyboardNavigation({
        gridRef: gridRef as React.RefObject<HTMLDivElement | null>,
        getRowCount: () => 3,
        getColCount: () => 3,
      })
    );

    const cell = gridRef.current.querySelector(
      "[data-table-cell='cell-1-1']"
    ) as HTMLElement;
    const scrollIntoViewSpy = vi.spyOn(cell, "scrollIntoView");

    act(() => {
      result.current.focusCell(1, 1);
    });

    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: "nearest",
      inline: "nearest",
    });
  });

  it("moves left on ArrowLeft", () => {
    const { result } = renderHook(() =>
      useGridKeyboardNavigation({
        gridRef: gridRef as React.RefObject<HTMLDivElement | null>,
        getRowCount: () => 3,
        getColCount: () => 3,
      })
    );

    // Move right first to col 1
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowRight",
        preventDefault: vi.fn(),
      } as any);
    });

    // Then move left
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowLeft",
        preventDefault: vi.fn(),
      } as any);
    });

    const focused = gridRef.current.querySelector(":focus");
    expect(focused).toHaveAttribute("data-table-cell", "cell-0-0");
  });

  it("moves up on ArrowUp", () => {
    const { result } = renderHook(() =>
      useGridKeyboardNavigation({
        gridRef: gridRef as React.RefObject<HTMLDivElement | null>,
        getRowCount: () => 3,
        getColCount: () => 3,
      })
    );

    // Move down first
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowDown",
        preventDefault: vi.fn(),
      } as any);
    });

    // Then up
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowUp",
        preventDefault: vi.fn(),
      } as any);
    });

    const focused = gridRef.current.querySelector(":focus");
    expect(focused).toHaveAttribute("data-table-cell", "cell-0-0");
  });

  it("Home goes to first cell in row", () => {
    const { result } = renderHook(() =>
      useGridKeyboardNavigation({
        gridRef: gridRef as React.RefObject<HTMLDivElement | null>,
        getRowCount: () => 3,
        getColCount: () => 3,
      })
    );

    // Move to col 2
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowRight",
        preventDefault: vi.fn(),
      } as any);
    });
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowRight",
        preventDefault: vi.fn(),
      } as any);
    });

    // Home
    act(() => {
      result.current.handleKeyDown({
        key: "Home",
        preventDefault: vi.fn(),
      } as any);
    });

    const focused = gridRef.current.querySelector(":focus");
    expect(focused).toHaveAttribute("data-table-cell", "cell-0-0");
  });

  it("Ctrl+Home goes to first cell in grid", () => {
    const { result } = renderHook(() =>
      useGridKeyboardNavigation({
        gridRef: gridRef as React.RefObject<HTMLDivElement | null>,
        getRowCount: () => 3,
        getColCount: () => 3,
      })
    );

    // Move to row 2, col 2
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowDown",
        preventDefault: vi.fn(),
      } as any);
    });
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowDown",
        preventDefault: vi.fn(),
      } as any);
    });
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowRight",
        preventDefault: vi.fn(),
      } as any);
    });
    act(() => {
      result.current.handleKeyDown({
        key: "ArrowRight",
        preventDefault: vi.fn(),
      } as any);
    });

    // Ctrl+Home
    act(() => {
      result.current.handleKeyDown({
        key: "Home",
        ctrlKey: true,
        preventDefault: vi.fn(),
      } as any);
    });

    const focused = gridRef.current.querySelector(":focus");
    expect(focused).toHaveAttribute("data-table-cell", "cell-0-0");
  });

  it("End goes to last cell in row", () => {
    const { result } = renderHook(() =>
      useGridKeyboardNavigation({
        gridRef: gridRef as React.RefObject<HTMLDivElement | null>,
        getRowCount: () => 3,
        getColCount: () => 3,
      })
    );

    act(() => {
      result.current.handleKeyDown({
        key: "End",
        preventDefault: vi.fn(),
      } as any);
    });

    const focused = gridRef.current.querySelector(":focus");
    expect(focused).toHaveAttribute("data-table-cell", "cell-0-2");
  });

  it("registers Event-core shortcuts when scope is set", () => {
    const { unmount } = renderHook(() =>
      useGridKeyboardNavigation({
        gridRef: gridRef as React.RefObject<HTMLDivElement | null>,
        getRowCount: () => 3,
        getColCount: () => 3,
        scope: "table:users",
      })
    );

    const { shortcuts } = useEventRegistry.getState();
    expect(shortcuts["table:users:grid:right"]?.key).toBe("arrowright");
    expect(shortcuts["table:users:grid:ctrl-home"]?.key).toBe("ctrl+home");
    expect(shortcuts["table:users:grid:right"]?.scope).toBe("table:users");

    unmount();
    expect(
      useEventRegistry.getState().shortcuts["table:users:grid:right"]
    ).toBeUndefined();
  });

  it("sets activeScope on grid focusin", () => {
    renderHook(() =>
      useGridKeyboardNavigation({
        gridRef: gridRef as React.RefObject<HTMLDivElement | null>,
        getRowCount: () => 3,
        getColCount: () => 3,
        scope: "table:users",
      })
    );

    act(() => {
      gridRef.current.dispatchEvent(
        new FocusEvent("focusin", { bubbles: true })
      );
    });

    expect(useEventRegistry.getState().activeScope).toBe("table:users");
  });

  it("runs the registered Event-core command", () => {
    renderHook(() =>
      useGridKeyboardNavigation({
        gridRef: gridRef as React.RefObject<HTMLDivElement | null>,
        getRowCount: () => 3,
        getColCount: () => 3,
        scope: "table:users",
      })
    );

    act(() => {
      useEventRegistry
        .getState()
        .shortcuts["table:users:grid:right"]?.command.execute();
    });

    const focused = gridRef.current.querySelector(":focus");
    expect(focused).toHaveAttribute("data-table-cell", "cell-0-1");
  });

  it("PageDown moves 10 rows", () => {
    const { result } = renderHook(() =>
      useGridKeyboardNavigation({
        gridRef: gridRef as React.RefObject<HTMLDivElement | null>,
        getRowCount: () => 3,
        getColCount: () => 3,
      })
    );

    act(() => {
      result.current.handleKeyDown({
        key: "PageDown",
        preventDefault: vi.fn(),
      } as any);
    });

    // Should clamp to last row
    const focused = gridRef.current.querySelector(":focus");
    expect(focused).toHaveAttribute("data-table-cell", "cell-2-0");
  });

  it("ignores virtualizer spacers and index cells without data-table-cell", () => {
    const spacer = document.createElement("div");
    spacer.setAttribute("aria-hidden", "true");
    gridRef.current.insertBefore(spacer, gridRef.current.firstChild);

    const indexCell = document.createElement("div");
    indexCell.textContent = "1";
    gridRef.current
      .querySelector("[data-table-row]")!
      .insertBefore(
        indexCell,
        gridRef.current.querySelector("[data-table-cell]")
      );

    const { result } = renderHook(() =>
      useGridKeyboardNavigation({
        gridRef: gridRef as React.RefObject<HTMLDivElement | null>,
        getRowCount: () => 3,
        getColCount: () => 3,
      })
    );

    act(() => {
      result.current.handleKeyDown({
        key: "ArrowRight",
        preventDefault: vi.fn(),
      } as any);
    });

    expect(gridRef.current.querySelector(":focus")).toHaveAttribute(
      "data-table-cell",
      "cell-0-1"
    );

    act(() => {
      result.current.handleKeyDown({
        key: "ArrowDown",
        preventDefault: vi.fn(),
      } as any);
    });

    expect(gridRef.current.querySelector(":focus")).toHaveAttribute(
      "data-table-cell",
      "cell-1-1"
    );
  });

  it("does not steal Enter from a focused button", () => {
    const onCellActivate = vi.fn();
    const button = document.createElement("button");
    button.textContent = "Edit";
    gridRef.current.querySelector("[data-table-cell]")!.appendChild(button);
    button.focus();

    const { result } = renderHook(() =>
      useGridKeyboardNavigation({
        gridRef: gridRef as React.RefObject<HTMLDivElement | null>,
        getRowCount: () => 3,
        getColCount: () => 3,
        onCellActivate,
      })
    );

    const preventDefault = vi.fn();
    act(() => {
      result.current.handleKeyDown({
        key: "Enter",
        target: button,
        preventDefault,
      } as any);
    });

    expect(onCellActivate).not.toHaveBeenCalled();
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it("does not steal Enter from a header cell", () => {
    const onCellActivate = vi.fn();
    const header = document.createElement("div");
    header.setAttribute("data-table-col", "name");
    gridRef.current.insertBefore(header, gridRef.current.firstChild);
    header.tabIndex = 0;
    header.focus();

    const { result } = renderHook(() =>
      useGridKeyboardNavigation({
        gridRef: gridRef as React.RefObject<HTMLDivElement | null>,
        getRowCount: () => 3,
        getColCount: () => 3,
        onCellActivate,
      })
    );

    act(() => {
      result.current.handleKeyDown({
        key: "Enter",
        target: header,
        preventDefault: vi.fn(),
      } as any);
    });

    expect(onCellActivate).not.toHaveBeenCalled();
  });

  it("does not overwrite previousScope when tabbing between cells", () => {
    useEventRegistry.getState().setActiveScope("page");

    renderHook(() =>
      useGridKeyboardNavigation({
        gridRef: gridRef as React.RefObject<HTMLDivElement | null>,
        getRowCount: () => 3,
        getColCount: () => 3,
        scope: "table:users",
      })
    );

    const outside = document.createElement("button");
    document.body.appendChild(outside);

    act(() => {
      gridRef.current.dispatchEvent(
        new FocusEvent("focusin", { bubbles: true })
      );
    });
    expect(useEventRegistry.getState().activeScope).toBe("table:users");

    act(() => {
      gridRef.current
        .querySelectorAll("[data-table-cell]")[1]
        .dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    });
    expect(useEventRegistry.getState().activeScope).toBe("table:users");

    act(() => {
      gridRef.current.dispatchEvent(
        new FocusEvent("focusout", { bubbles: true, relatedTarget: outside })
      );
    });
    expect(useEventRegistry.getState().activeScope).toBe("page");
    outside.remove();
  });

  describe("KeyboardDelegationStrategy", () => {
    let delegator: EventDelegator;

    beforeEach(() => {
      delegator = new EventDelegator();
      delegator.registerStrategy(new KeyboardDelegationStrategy());
      delegator.start();
    });

    afterEach(() => {
      delegator.stop();
    });

    function mountScopedGrid() {
      renderHook(() =>
        useGridKeyboardNavigation({
          gridRef: gridRef as React.RefObject<HTMLDivElement | null>,
          getRowCount: () => 3,
          getColCount: () => 3,
          scope: "table:users",
        })
      );
      act(() => {
        gridRef.current.dispatchEvent(
          new FocusEvent("focusin", { bubbles: true })
        );
      });
    }

    function press(key: string, init: KeyboardEventInit = {}) {
      const event = new KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
        ...init,
      });
      window.dispatchEvent(event);
      return event;
    }

    it("moves focus on window keydown when the grid is scoped", () => {
      mountScopedGrid();

      const event = press("ArrowRight");

      expect(event.defaultPrevented).toBe(true);
      expect(gridRef.current.querySelector(":focus")).toHaveAttribute(
        "data-table-cell",
        "cell-0-1"
      );
    });

    it("does not move when the grid is not focused (scope is global)", () => {
      renderHook(() =>
        useGridKeyboardNavigation({
          gridRef: gridRef as React.RefObject<HTMLDivElement | null>,
          getRowCount: () => 3,
          getColCount: () => 3,
          scope: "table:users",
        })
      );

      press("ArrowRight");
      expect(gridRef.current.querySelector(":focus")).toBeFalsy();
    });

    it("does not move when an input inside the grid is focused", () => {
      mountScopedGrid();
      const input = document.createElement("input");
      gridRef.current.querySelector("[data-table-cell]")!.appendChild(input);
      input.focus();

      press("ArrowRight");
      expect(document.activeElement).toBe(input);
    });
  });
});
