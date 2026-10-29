import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DefaultScopeSelector, ScopeSelector } from "../ScopeSelector";

const options = [
  { type: "page", label: "Current Page", count: 10 },
  { type: "all", label: "All Filtered Data", count: 500 },
];

describe("ScopeSelector", () => {
  it("renders children as render prop", () => {
    const onSelect = vi.fn();

    render(
      <ScopeSelector options={options} onSelect={onSelect}>
        {({ options: opts, select }) => (
          <div>
            {opts.map((o) => (
              <button key={o.type} onClick={() => select(o.type)}>
                {o.label} ({o.count})
              </button>
            ))}
          </div>
        )}
      </ScopeSelector>
    );

    expect(screen.getByText(/Current Page/)).toBeInTheDocument();
    expect(screen.getByText(/All Filtered Data/)).toBeInTheDocument();
  });

  it("calls onSelect when option clicked in render prop", () => {
    const onSelect = vi.fn();

    render(
      <ScopeSelector options={options} onSelect={onSelect}>
        {({ select }) => (
          <button onClick={() => select("all")}>Select All</button>
        )}
      </ScopeSelector>
    );

    fireEvent.click(screen.getByText("Select All"));

    expect(onSelect).toHaveBeenCalledWith("all");
  });

  it("renders default UI when no children", () => {
    render(<ScopeSelector options={options} onSelect={vi.fn()} />);

    expect(screen.getByText("Current Page")).toBeInTheDocument();
    expect(screen.getByText("All Filtered Data")).toBeInTheDocument();
    expect(screen.getByText("10 rows")).toBeInTheDocument();
    expect(screen.getByText("500 rows")).toBeInTheDocument();
  });

  it("calls onSelect when option clicked in default UI", () => {
    const onSelect = vi.fn();

    render(<ScopeSelector options={options} onSelect={onSelect} />);

    fireEvent.click(screen.getByText("Current Page"));

    expect(onSelect).toHaveBeenCalledWith("page");
  });

  it("highlights defaultType option", () => {
    render(
      <ScopeSelector options={options} onSelect={vi.fn()} defaultType="page" />
    );

    const pageButton = screen.getByText("Current Page").closest("button")!;

    expect(pageButton.className).toContain("border-primary/40");
  });
});

describe("DefaultScopeSelector", () => {
  it("renders options with counts", () => {
    render(<DefaultScopeSelector options={options} onSelect={vi.fn()} />);

    expect(screen.getByText("10 rows")).toBeInTheDocument();
    expect(screen.getByText("500 rows")).toBeInTheDocument();
  });

  it("calls onSelect on click", () => {
    const onSelect = vi.fn();

    render(<DefaultScopeSelector options={options} onSelect={onSelect} />);

    fireEvent.click(screen.getByText("All Filtered Data"));

    expect(onSelect).toHaveBeenCalledWith("all");
  });
});
