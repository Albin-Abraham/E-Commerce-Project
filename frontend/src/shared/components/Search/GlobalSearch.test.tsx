import { commandBus } from "@core/events/CommandBus";
import { PlatformCommand } from "@core/events/config/shortcuts";
import { usePlatformUrlParams } from "@core/router/hooks/usePlatformNavigation";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@shared/testing/test-utils";

import { GlobalSearch } from "./GlobalSearch";

// Mock usePlatformUrlParams to verify it's called correctly
const mockSetSearch = vi.fn();
vi.mock("@core/router/hooks/usePlatformNavigation", () => ({
  usePlatformUrlParams: vi.fn(() => ({
    search: "",
    setSearch: mockSetSearch,
  })),
}));

describe("GlobalSearch Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock return value
    (usePlatformUrlParams as any).mockReturnValue({
      search: "",
      setSearch: mockSetSearch,
    });
  });

  it("renders correctly with placeholder", async () => {
    renderWithProviders(<GlobalSearch />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Search platform/i)).toBeDefined();
    });
  });

  it("updates local state but NOT URL when typing", async () => {
    renderWithProviders(<GlobalSearch />);

    const input = (await screen.findByPlaceholderText(
      /Search platform/i
    )) as HTMLInputElement;

    await act(async () => {
      fireEvent.change(input, { target: { value: "test search" } });
    });

    await waitFor(() => {
      expect(input.value).toBe("test search");
    });
    expect(mockSetSearch).not.toHaveBeenCalled();
  });

  it("updates URL params when Enter is pressed", async () => {
    renderWithProviders(<GlobalSearch />);

    const input = (await screen.findByPlaceholderText(
      /Search platform/i
    )) as HTMLInputElement;

    await act(async () => {
      fireEvent.change(input, { target: { value: "submit search" } });
    });

    await waitFor(() => {
      expect(input.value).toBe("submit search");
    });

    await act(async () => {
      fireEvent.keyDown(input, { key: "Enter" });
    });

    expect(mockSetSearch).toHaveBeenCalledWith("submit search", true);
  });

  it("clears search when Clear button is clicked", async () => {
    renderWithProviders(<GlobalSearch />);

    const input = (await screen.findByPlaceholderText(
      /Search platform/i
    )) as HTMLInputElement;

    await act(async () => {
      fireEvent.change(input, { target: { value: "to be cleared" } });
    });

    const clearButton = await screen.findByTitle(/Clear search/i);
    expect(clearButton).toBeDefined();

    await act(async () => {
      fireEvent.click(clearButton);
    });

    await waitFor(() => {
      expect(input.value).toBe("");
    });
    // Should also clear URL
    expect(mockSetSearch).toHaveBeenCalledWith("", true);
  });

  it("displays the current search value from URL params", async () => {
    (usePlatformUrlParams as any).mockReturnValue({
      search: "initial value",
      setSearch: mockSetSearch,
    });

    renderWithProviders(<GlobalSearch />);
    const input = (await screen.findByPlaceholderText(
      /Search platform/i
    )) as HTMLInputElement;
    expect(input.value).toBe("initial value");
  });

  it("focuses input when PlatformCommand.FocusSearch is emitted", async () => {
    renderWithProviders(<GlobalSearch />);
    const input = await screen.findByPlaceholderText(/Search platform/i);

    // Ensure it's not focused initially
    expect(document.activeElement).not.toBe(input);

    // Emit command
    commandBus.emit(PlatformCommand.FocusSearch);

    expect(document.activeElement).toBe(input);
  });

  it("blurs input when Escape key is pressed", async () => {
    renderWithProviders(<GlobalSearch />);
    const input = await screen.findByPlaceholderText(/Search platform/i);

    input.focus();
    expect(document.activeElement).toBe(input);

    fireEvent.keyDown(input, { key: "Escape" });

    expect(document.activeElement).not.toBe(input);
  });
});
