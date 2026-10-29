import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CardSkeleton, FieldSkeleton } from "./FieldSkeleton";

describe("FieldSkeleton", () => {
  it("renders an input-shaped skeleton for input types", () => {
    const { container, getByRole } = render(
      <FieldSkeleton type="text" component="text" />
    );
    expect(container.querySelector('[data-field-type="text"]')).toBeTruthy();
    expect(getByRole("status")).toBeTruthy();
    expect(container.querySelector(".h-10")).toBeTruthy();
  });

  it("renders a tall block for textarea components", () => {
    const { container } = render(
      <FieldSkeleton type="text" component="textarea" />
    );
    expect(container.querySelector(".h-24")).toBeTruthy();
  });

  it("renders a toggle row for switch/checkbox types", () => {
    const { container } = render(<FieldSkeleton type="switch" />);
    expect(container.querySelector(".h-5")).toBeTruthy();
  });

  it("renders text lines for a paragraph static type", () => {
    const { container } = render(<FieldSkeleton type="paragraph" />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      1
    );
  });

  it("falls back to an input placeholder for unknown types", () => {
    const { container } = render(<FieldSkeleton type="unknown-thing" />);
    expect(container.querySelector("[data-field-type]")).toBeTruthy();
    expect(container.querySelector(".h-10")).toBeTruthy();
  });
});

describe("CardSkeleton", () => {
  it("mirrors card chrome: header, body rows, footer", () => {
    const { container, getByRole } = render(
      <CardSkeleton rows={2} footer />
    );
    expect(getByRole("status").getAttribute("aria-label")).toBe(
      "Card loading"
    );
    expect(container.querySelector('[data-skeleton="card"]')).toBeTruthy();
    // Header title + description bars
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(
      4
    );
  });

  it("uses FieldSkeleton type=card path", () => {
    const { container } = render(<FieldSkeleton type="card" rows={2} />);
    expect(container.querySelector('[data-skeleton="card"]')).toBeTruthy();
  });
});