import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ProductCard } from "../storefront/ProductCard";
import { ProductGrid } from "../storefront/ProductGrid";
import type { ProductListItemModel } from "../../modules/products/application/read-models/product-list-item.model";

const MOCK_ITEM: ProductListItemModel = {
  id: "item-1",
  title: "Precision Ergonomic Mouse",
  slug: "precision-ergonomic-mouse",
  brandName: "Logitech",
  categoryName: "Peripherals",
  primaryImageUrl: "https://example.com/mouse.jpg",
  currentPrice: { amount: 79.99, currency: "USD", formatted: "$79.99" },
  originalPrice: { amount: 99.99, currency: "USD", formatted: "$99.99" },
  discountPercent: 20,
  rating: { average: 4.8, count: 88 },
  stockStatus: "IN_STOCK",
  stockQuantity: 15,
  badges: [{ label: "-20%", tone: "sale" }],
  isWishlisted: false,
  hasVariants: false,
};

describe("Storefront Product Presentation", () => {
  it("renders ProductCard with tabular price and sale badge", () => {
    render(
      <MemoryRouter>
        <ProductCard product={MOCK_ITEM} />
      </MemoryRouter>
    );

    expect(screen.getByText("Precision Ergonomic Mouse")).toBeDefined();
    expect(screen.getByText("$79.99")).toBeDefined();
    expect(screen.getByText("$99.99")).toBeDefined();
    expect(screen.getByText("-20%")).toBeDefined();
    expect(screen.getByText("In Stock")).toBeDefined();
  });

  it("renders ProductGrid with category tabs and search filtering", () => {
    render(
      <MemoryRouter>
        <ProductGrid products={[MOCK_ITEM]} />
      </MemoryRouter>
    );

    expect(screen.getByText("Peripherals")).toBeDefined();
    expect(screen.getByPlaceholderText("Search catalog or brand...")).toBeDefined();
  });
});
