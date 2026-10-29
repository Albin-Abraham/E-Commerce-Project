import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DefaultLoadingState } from "../DefaultLoadingState";

describe("DefaultLoadingState", () => {
  it("renders correct number of rows", () => {
    const { container } = render(<DefaultLoadingState rows={3} columns={2} />);
    const trs = container.querySelectorAll("tr");
    expect(trs).toHaveLength(3);
  });

  it("renders correct number of columns per row", () => {
    const { container } = render(<DefaultLoadingState rows={2} columns={4} />);
    const tds = container.querySelectorAll("tr:first-child td");
    expect(tds).toHaveLength(4);
  });

  it("produces deterministic skeleton widths across renders", () => {
    const { container: container1 } = render(
      <DefaultLoadingState rows={2} columns={2} />
    );
    const { container: container2 } = render(
      <DefaultLoadingState rows={2} columns={2} />
    );

    const widths1 = Array.from(
      container1.querySelectorAll(".animate-pulse")
    ).map((el) => (el as HTMLElement).style.width);
    const widths2 = Array.from(
      container2.querySelectorAll(".animate-pulse")
    ).map((el) => (el as HTMLElement).style.width);

    expect(widths1).toEqual(widths2);
  });

  it("skeleton widths are within 60-100% range", () => {
    const { container } = render(<DefaultLoadingState rows={3} columns={3} />);
    const pulsers = container.querySelectorAll(".animate-pulse");

    pulsers.forEach((el) => {
      const width = (el as HTMLElement).style.width;
      const num = parseInt(width, 10);
      expect(num).toBeGreaterThanOrEqual(60);
      expect(num).toBeLessThanOrEqual(100);
    });
  });

  it("each skeleton has animationDelay", () => {
    const { container } = render(<DefaultLoadingState rows={2} columns={2} />);
    const pulsers = container.querySelectorAll(".animate-pulse");

    pulsers.forEach((el) => {
      const delay = (el as HTMLElement).style.animationDelay;
      expect(delay).toMatch(/^\d+ms$/);
    });
  });

  it("uses defaults when no props provided", () => {
    const { container } = render(<DefaultLoadingState />);
    const trs = container.querySelectorAll("tr");
    expect(trs).toHaveLength(5);
    const tds = container.querySelectorAll("tr:first-child td");
    expect(tds).toHaveLength(4);
  });
});
