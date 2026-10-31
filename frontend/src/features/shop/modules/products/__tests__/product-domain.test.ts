import { describe, expect, it } from "vitest";
import { Money } from "../domain/value-objects/money.vo";
import { SKU } from "../domain/value-objects/sku.vo";
import { StockLevel } from "../domain/value-objects/stock-level.vo";
import { ProductStatus } from "../domain/value-objects/product-status.vo";
import { ProductAggregate } from "../domain/aggregates/product.aggregate";
import { productRepository } from "../infrastructure/repositories/django-product.repository";
import { GetProductsQuery } from "../application/queries/get-products.query";
import { GetProductDetailsQuery } from "../application/queries/get-product-details.query";

describe("Product Bounded Context: Domain & Application Queries", () => {
  describe("1. Money Value Object", () => {
    it("handles currency arithmetic and formatting correctly", () => {
      const price = new Money(99.5, "USD");
      const tax = new Money(8.0, "USD");
      const total = price.add(tax);

      expect(total.amount).toBe(107.5);
      expect(total.format()).toBe("$107.50");

      const discounted = total.applyDiscountPercent(10);
      expect(discounted.amount).toBe(96.75);

      const savings = discounted.calculateSavings(total);
      expect(savings.discountPercent).toBe(10);
    });

    it("throws on negative monetary amounts or currency mismatch", () => {
      expect(() => new Money(-5)).toThrow(/Invalid monetary amount/);

      const usd = new Money(100, "USD");
      const eur = new Money(100, "EUR");
      expect(() => usd.add(eur)).toThrow(/Currency mismatch/);
    });
  });

  describe("2. SKU & Stock Level", () => {
    it("validates SKU normalization and invariants", () => {
      const sku = new SKU("sku-mbp-16");
      expect(sku.value).toBe("SKU-MBP-16");
      expect(() => new SKU("ab")).toThrow(/too short/);
    });

    it("classifies stock into semantic commerce levels", () => {
      const inStock = new StockLevel(20, 5);
      expect(inStock.state).toBe("IN_STOCK");
      expect(inStock.isAvailable()).toBe(true);

      const lowStock = new StockLevel(3, 5);
      expect(lowStock.state).toBe("LOW_STOCK");
      expect(lowStock.getUrgencyLabel()).toContain("Only 3 left");

      const outOfStock = new StockLevel(0);
      expect(outOfStock.state).toBe("OUT_OF_STOCK");
      expect(outOfStock.isAvailable()).toBe(false);
    });
  });

  describe("3. Product Aggregate", () => {
    it("enforces title requirement and compare-at price invariants", () => {
      expect(
        () =>
          new ProductAggregate({
            id: "p1",
            sku: new SKU("SKU-001"),
            title: "",
            slug: "p1",
            description: "test",
            price: new Money(100),
            stock: new StockLevel(10),
            status: new ProductStatus("ACTIVE"),
            images: [],
            variants: [],
            tags: [],
          })
      ).toThrow(/Product title is required/);

      expect(
        () =>
          new ProductAggregate({
            id: "p2",
            sku: new SKU("SKU-002"),
            title: "Valid Title",
            slug: "valid-title",
            description: "test",
            price: new Money(100),
            compareAtPrice: new Money(80), // Lower than price!
            stock: new StockLevel(10),
            status: new ProductStatus("ACTIVE"),
            images: [],
            variants: [],
            tags: [],
          })
      ).toThrow(/Compare-at price .* cannot be less than regular price/);
    });
  });

  describe("4. CQRS Queries & Repository", () => {
    it("executes GetProductsQuery returning lightweight read models", async () => {
      const query = new GetProductsQuery(productRepository);
      const result = await query.execute({ search: "MacBook" });

      expect(result.items.length).toBeGreaterThan(0);
      const item = result.items[0];
      expect(item.title).toContain("MacBook");
      expect(item.currentPrice.formatted).toBeTruthy();
      expect(item.stockStatus).toBe("IN_STOCK");
    });

    it("executes GetProductDetailsQuery returning editorial detail read model", async () => {
      const query = new GetProductDetailsQuery(productRepository);
      const detail = await query.execute("prod-macbook-pro");

      expect(detail).toBeDefined();
      expect(detail?.title).toContain("MacBook");
      expect(detail?.gallery.length).toBeGreaterThanOrEqual(1);
      expect(detail?.variants.length).toBeGreaterThanOrEqual(1);
      expect(detail?.bopisAvailable).toBe(true);
    });
  });
});
