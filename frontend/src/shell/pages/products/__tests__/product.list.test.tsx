import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@shared/testing/test-utils";

import ProductsPage from "../product.list";

// 1. Mock React Router DOM hooks
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useLoaderData: vi.fn(() => [
      {
        id: "p1",
        title: "Zenith Ultra Laptop",
        description: "High performance laptop",
        price: 1999,
      },
      {
        id: "p2",
        title: "Zenith Mechanical Keyboard",
        description: "Clicky switches",
        price: 149,
      },
    ]),
  };
});

// 2. Mock our custom Platform Navigation adapters
const mockGoTo = vi.fn();
const mockSetSearch = vi.fn();

vi.mock("@core/router/hooks/usePlatformNavigation", () => ({
  usePlatformNavigation: () => ({
    isPending: false,
    goTo: mockGoTo,
    getLinkProps: (path: string) => ({ "data-path": path }),
  }),
  usePlatformUrlParams: () => ({
    search: "",
    setSearch: mockSetSearch,
  }),
}));

describe("ProductsPage (Enterprise UI Integration Test)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render the product catalog from the loader data", () => {
    renderWithProviders(<ProductsPage />);

    // Validate Page Header
    expect(screen.getByText("Our Collections")).toBeInTheDocument();

    // Validate Products mapped correctly
    expect(screen.getByText("Zenith Ultra Laptop")).toBeInTheDocument();
    expect(screen.getByText("Zenith Mechanical Keyboard")).toBeInTheDocument();
    expect(screen.getByText("$1999")).toBeInTheDocument();
  });

  it("should debouce URL search params when the user types", async () => {
    renderWithProviders(<ProductsPage />);

    const searchInput = screen.getByPlaceholderText(/Search collections/i);
    expect(searchInput).toBeInTheDocument();

    // Simulate user typing
    fireEvent.change(searchInput, { target: { value: "Laptop" } });

    // Validate that the custom usePlatformUrlParams adapter was triggered
    await waitFor(() => {
      expect(mockSetSearch).toHaveBeenCalledWith("Laptop");
    });
  });

  it("should delegate navigation perfectly via getLinkProps", () => {
    renderWithProviders(<ProductsPage />);

    // Find the wrapper card for the first product
    const productCard = screen
      .getByText("Zenith Ultra Laptop")
      .closest("div[data-path]");
    expect(productCard).toBeDefined();

    // Simulate user click
    fireEvent.click(productCard!);

    // Validate that our Platform Router was told exactly where to navigate
    expect(mockGoTo).toHaveBeenCalledWith("/products/p1");
  });
});
