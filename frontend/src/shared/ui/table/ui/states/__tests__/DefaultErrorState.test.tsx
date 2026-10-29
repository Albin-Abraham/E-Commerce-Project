import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DefaultErrorState } from "../DefaultErrorState";

describe("DefaultErrorState", () => {
  it("renders error message", () => {
    const error = new Error("Network timeout");
    const { getByText } = render(<DefaultErrorState error={error} />);
    expect(getByText(/Network timeout/i)).toBeDefined();
  });

  it("renders fallback message when error has no message", () => {
    const error = new Error();
    const { getByText } = render(<DefaultErrorState error={error} />);
    expect(
      getByText("An unexpected error occurred while loading data.")
    ).toBeDefined();
  });

  it("renders 'Something went wrong' heading", () => {
    const error = new Error("test");
    const { getByText } = render(<DefaultErrorState error={error} />);
    expect(getByText("Something went wrong")).toBeDefined();
  });

  it("renders retry button when retry is provided", () => {
    const error = new Error("test");
    const retry = vi.fn();
    const { getByText } = render(
      <DefaultErrorState error={error} retry={retry} />
    );
    expect(getByText("Retry")).toBeDefined();
  });

  it("does not render retry button when retry is not provided", () => {
    const error = new Error("test");
    const { queryByText } = render(<DefaultErrorState error={error} />);
    expect(queryByText("Retry")).toBeNull();
  });

  it("calls retry when button is clicked", () => {
    const error = new Error("test");
    const retry = vi.fn();
    const { getByText } = render(
      <DefaultErrorState error={error} retry={retry} />
    );
    fireEvent.click(getByText("Retry"));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
