import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "vitest-axe";
import * as matchers from "vitest-axe/matchers";
import "vitest-axe/extend-expect";

expect.extend(matchers);
import {
  useRovingFocus,
  RovingFocusGroup,
} from "../index";

const TestToolbar: React.FC<{
  orientation?: "horizontal" | "vertical" | "both";
  loop?: boolean;
  activation?: "automatic" | "manual";
  onSelect?: (id: string) => void;
}> = ({ orientation = "horizontal", loop = true, activation = "automatic", onSelect }) => {
  const { getItemProps, getContainerProps } = useRovingFocus({
    orientation,
    loop,
    activation,
    onSelect,
    defaultActiveId: "btn-1",
  });

  return (
    <div role="toolbar" aria-label="Editor actions" {...getContainerProps()}>
      <button {...getItemProps("btn-1")}>Bold</button>
      <button {...getItemProps("btn-2")}>Italic</button>
      <button {...getItemProps("btn-3", { disabled: true })} disabled>Underline (Disabled)</button>
      <button {...getItemProps("btn-4")}>Strikethrough</button>
    </div>
  );
};

describe("useRovingFocus", () => {
  it("initializes with active item having tabIndex 0 and others having -1", () => {
    render(<TestToolbar />);
    const btn1 = screen.getByText("Bold");
    const btn2 = screen.getByText("Italic");
    const btn4 = screen.getByText("Strikethrough");

    expect(btn1).toHaveAttribute("tabindex", "0");
    expect(btn2).toHaveAttribute("tabindex", "-1");
    expect(btn4).toHaveAttribute("tabindex", "-1");
  });

  it("navigates forward with ArrowRight in horizontal orientation, skipping disabled items", () => {
    const onSelect = vi.fn();
    render(<TestToolbar onSelect={onSelect} />);
    const btn1 = screen.getByText("Bold");
    const btn2 = screen.getByText("Italic");
    const btn4 = screen.getByText("Strikethrough");

    btn1.focus();
    fireEvent.keyDown(btn1, { key: "ArrowRight" });

    expect(btn2).toHaveAttribute("tabindex", "0");
    expect(btn1).toHaveAttribute("tabindex", "-1");
    expect(onSelect).toHaveBeenCalledWith("btn-2");

    // Press ArrowRight again - should skip disabled btn-3 and land on btn-4
    fireEvent.keyDown(btn2, { key: "ArrowRight" });
    expect(btn4).toHaveAttribute("tabindex", "0");
    expect(btn2).toHaveAttribute("tabindex", "-1");
    expect(onSelect).toHaveBeenCalledWith("btn-4");
  });

  it("wraps around to the first item when pressing ArrowRight on the last item with loop=true", () => {
    render(<TestToolbar loop={true} />);
    const btn1 = screen.getByText("Bold");
    const btn4 = screen.getByText("Strikethrough");

    btn1.focus();
    fireEvent.keyDown(btn1, { key: "ArrowLeft" }); // Previous from first wraps to last
    expect(btn4).toHaveAttribute("tabindex", "0");

    fireEvent.keyDown(btn4, { key: "ArrowRight" }); // Next from last wraps to first
    expect(btn1).toHaveAttribute("tabindex", "0");
  });

  it("jumps to first with Home and last with End", () => {
    render(<TestToolbar />);
    const btn1 = screen.getByText("Bold");
    const btn2 = screen.getByText("Italic");
    const btn4 = screen.getByText("Strikethrough");

    btn1.focus();
    fireEvent.keyDown(btn1, { key: "ArrowRight" });
    expect(btn2).toHaveAttribute("tabindex", "0");

    fireEvent.keyDown(btn2, { key: "End" });
    expect(btn4).toHaveAttribute("tabindex", "0");

    fireEvent.keyDown(btn4, { key: "Home" });
    expect(btn1).toHaveAttribute("tabindex", "0");
  });

  it("supports manual activation mode where arrows move focus but Enter/Space selects", () => {
    const onSelect = vi.fn();
    render(<TestToolbar activation="manual" onSelect={onSelect} />);
    const btn1 = screen.getByText("Bold");
    const btn2 = screen.getByText("Italic");

    btn1.focus();
    fireEvent.keyDown(btn1, { key: "ArrowRight" });
    expect(btn2).toHaveAttribute("tabindex", "0");
    // In manual mode, navigating with arrows does not immediately fire onSelect
    expect(onSelect).not.toHaveBeenCalled();

    // Pressing Enter activates the item
    fireEvent.keyDown(btn2, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith("btn-2");
  });

  it("supports vertical navigation with ArrowDown and ArrowUp", () => {
    render(<TestToolbar orientation="vertical" />);
    const btn1 = screen.getByText("Bold");
    const btn2 = screen.getByText("Italic");

    btn1.focus();
    fireEvent.keyDown(btn1, { key: "ArrowDown" });
    expect(btn2).toHaveAttribute("tabindex", "0");

    fireEvent.keyDown(btn2, { key: "ArrowUp" });
    expect(btn1).toHaveAttribute("tabindex", "0");
  });

  it("has zero accessibility violations", async () => {
    const { container } = render(<TestToolbar />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
