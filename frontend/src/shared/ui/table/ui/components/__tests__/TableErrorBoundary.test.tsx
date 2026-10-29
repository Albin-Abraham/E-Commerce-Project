import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { TableErrorBoundary } from "../TableErrorBoundary";

function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("Test error");
  return <div>Normal content</div>;
}

describe("TableErrorBoundary", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders children when no error", () => {
    render(
      <TableErrorBoundary>
        <ThrowingComponent shouldThrow={false} />
      </TableErrorBoundary>
    );

    expect(screen.getByText("Normal content")).toBeInTheDocument();
  });

  it("renders default fallback when error occurs", () => {
    render(
      <TableErrorBoundary tableId="test-table">
        <ThrowingComponent shouldThrow={true} />
      </TableErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders custom fallback when provided", () => {
    const fallback = vi.fn((error: Error, reset: () => void) => (
      <div>
        <span>Custom error: {error.message}</span>
        <button onClick={reset}>Retry</button>
      </div>
    ));

    render(
      <TableErrorBoundary fallback={fallback}>
        <ThrowingComponent shouldThrow={true} />
      </TableErrorBoundary>
    );

    expect(screen.getByText("Custom error: Test error")).toBeInTheDocument();
    expect(fallback).toHaveBeenCalledWith(
      expect.any(Error),
      expect.any(Function)
    );
  });

  it("calls onError callback when error occurs", () => {
    const onError = vi.fn();

    render(
      <TableErrorBoundary onError={onError} tableId="my-table">
        <ThrowingComponent shouldThrow={true} />
      </TableErrorBoundary>
    );

    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ componentStack: expect.any(String) })
    );
  });

  it("Try again button resets the error state", () => {
    let shouldThrow = true;

    function ToggleThrow() {
      if (shouldThrow) throw new Error("Test error");
      return <div>Normal content</div>;
    }

    const { rerender } = render(
      <TableErrorBoundary>
        <ToggleThrow />
      </TableErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Fix the error before clicking "Try again"
    shouldThrow = false;
    fireEvent.click(screen.getByText("Try again"));

    // Force re-render of the tree
    rerender(
      <TableErrorBoundary>
        <ToggleThrow />
      </TableErrorBoundary>
    );

    expect(screen.getByText("Normal content")).toBeInTheDocument();
  });

  it("renders with correct data-testid for tableId", () => {
    render(
      <TableErrorBoundary tableId="orders-table">
        <ThrowingComponent shouldThrow={true} />
      </TableErrorBoundary>
    );

    expect(screen.getByTestId("table-error-orders-table")).toBeInTheDocument();
  });

  it("renders default data-testid when no tableId", () => {
    render(
      <TableErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </TableErrorBoundary>
    );

    expect(screen.getByTestId("table-error")).toBeInTheDocument();
  });

  it("logs to console.error when no onError callback", () => {
    render(
      <TableErrorBoundary tableId="debug-table">
        <ThrowingComponent shouldThrow={true} />
      </TableErrorBoundary>
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[ZenithTable:debug-table] Rendering error:",
      expect.any(Error),
      expect.any(String)
    );
  });
});
