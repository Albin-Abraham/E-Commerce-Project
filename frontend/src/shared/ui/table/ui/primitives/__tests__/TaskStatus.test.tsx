import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DefaultErrorList, DefaultSummary, TaskStatus } from "../TaskStatus";

describe("TaskStatus", () => {
  it("renders children as render prop", () => {
    render(
      <TaskStatus
        summary={{ created_count: 5, updated_count: 2, error_count: 1 }}
        errors={[{ row: 3, message: "Bad value" }]}
        status="completed"
      >
        {({ summary, errors, status }) => (
          <div>
            <span data-testid="status">{status}</span>
            <span data-testid="created">{summary?.created_count}</span>
            <span data-testid="errors">{errors.length}</span>
          </div>
        )}
      </TaskStatus>
    );

    expect(screen.getByTestId("status")).toHaveTextContent("completed");
    expect(screen.getByTestId("created")).toHaveTextContent("5");
    expect(screen.getByTestId("errors")).toHaveTextContent("1");
  });

  it("renders with renderSummary when completed", () => {
    const renderSummary = vi.fn((s) => (
      <div data-testid="custom-summary">{s.created_count} created</div>
    ));

    render(
      <TaskStatus
        summary={{ created_count: 5, updated_count: 0, error_count: 0 }}
        status="completed"
        renderSummary={renderSummary}
      />
    );

    expect(screen.getByTestId("custom-summary")).toHaveTextContent("5 created");
    expect(renderSummary).toHaveBeenCalled();
  });

  it("does not render renderSummary when processing", () => {
    const renderSummary = vi.fn(() => <div />);

    render(
      <TaskStatus
        summary={{ created_count: 0, updated_count: 0, error_count: 0 }}
        status="processing"
        renderSummary={renderSummary}
      />
    );

    expect(renderSummary).not.toHaveBeenCalled();
  });

  it("renders renderErrors when completed with errors", () => {
    const errors = [
      { row: 1, message: "Error 1" },
      { row: 2, message: "Error 2" },
    ];
    const renderErrors = vi.fn((errs) => (
      <div data-testid="custom-errors">{errs.length} errors</div>
    ));

    render(
      <TaskStatus
        summary={{ created_count: 0, updated_count: 0, error_count: 2 }}
        errors={errors}
        status="completed"
        renderErrors={renderErrors}
      />
    );

    expect(screen.getByTestId("custom-errors")).toHaveTextContent("2 errors");
  });
});

describe("DefaultSummary", () => {
  it("renders created/updated/error counts", () => {
    render(
      <DefaultSummary
        summary={{ created_count: 5, updated_count: 3, error_count: 1 }}
      />
    );

    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});

describe("DefaultErrorList", () => {
  it("renders error list", () => {
    const errors = [
      { row: 1, message: "Invalid name" },
      { row: 2, message: "Missing email" },
    ];

    render(<DefaultErrorList errors={errors} />);

    expect(screen.getByText(/Row 1/)).toBeInTheDocument();
    expect(screen.getByText(/Invalid name/)).toBeInTheDocument();
    expect(screen.getByText(/Row 2/)).toBeInTheDocument();
  });

  it("renders nothing when errors empty", () => {
    const { container } = render(<DefaultErrorList errors={[]} />);

    expect(container.firstChild).toBeNull();
  });
});
