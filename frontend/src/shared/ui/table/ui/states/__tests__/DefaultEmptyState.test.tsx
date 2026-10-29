import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DefaultEmptyState } from "../DefaultEmptyState";

describe("DefaultEmptyState", () => {
  it("renders default message", () => {
    render(<DefaultEmptyState />);
    expect(screen.getByText("No data available")).toBeDefined();
  });

  it("renders custom message", () => {
    render(<DefaultEmptyState message="Custom empty message" />);
    expect(screen.getByText("Custom empty message")).toBeDefined();
  });

  it("renders title and description", () => {
    render(<DefaultEmptyState context="no-results" />);
    expect(screen.getByText("No results found")).toBeDefined();
    expect(screen.getByText("Try adjusting your search or filters to find what you're looking for.")).toBeDefined();
  });

  it("renders icon", () => {
    render(<DefaultEmptyState />);
    expect(screen.getByTestId("empty-state-icon")).toBeDefined();
  });

  it("renders action button", () => {
    const handleClick = vi.fn();
    render(<DefaultEmptyState action={{ label: "Add record", onClick: handleClick }} />);
    expect(screen.getByRole("button", { name: "Add record" })).toBeDefined();
  });
});
