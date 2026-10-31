import { describe, expect, it } from "vitest";
import { EvaluateBopisEligibilityQuery } from "../application/evaluate-bopis-eligibility.query";
import type { InventoryQueryPort } from "@features/inventory/application/ports/inventory-query.port";

describe("Fulfillment Bounded Context: BOPIS Eligibility Flow", () => {
  it("evaluates BOPIS as eligible when target branch has positive stock", async () => {
    const mockInventoryPort: InventoryQueryPort = {
      getAvailableStock: async () => 10,
      getBranchStock: async (sku, branchId) => ({
        sku,
        branchId,
        branchName: "Tokyo Flagship Store",
        availableQuantity: 5,
        inStock: true,
      }),
    };

    const query = new EvaluateBopisEligibilityQuery(mockInventoryPort);
    const result = await query.execute("SKU-MBP-16-512", {
      id: "br-tokyo",
      name: "Tokyo Flagship Store",
    });

    expect(result.eligible).toBe(true);
    expect(result.branchName).toBe("Tokyo Flagship Store");
    expect(result.availableQuantity).toBe(5);
    expect(result.pickupWindow).toContain("2 hours");
  });

  it("evaluates BOPIS as ineligible when branch is out of stock even if total catalog has stock", async () => {
    const mockInventoryPort: InventoryQueryPort = {
      getAvailableStock: async () => 100, // Central warehouse has plenty
      getBranchStock: async (sku, branchId) => ({
        sku,
        branchId,
        branchName: "Osaka Central Hub",
        availableQuantity: 0, // But target store has 0!
        inStock: false,
      }),
    };

    const query = new EvaluateBopisEligibilityQuery(mockInventoryPort);
    const result = await query.execute("SKU-MBP-16-512", {
      id: "br-osaka",
      name: "Osaka Central Hub",
    });

    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("OUT_OF_STOCK_AT_BRANCH");
  });

  it("returns ineligible when no branch context is selected", async () => {
    const mockInventoryPort: InventoryQueryPort = {
      getAvailableStock: async () => 10,
      getBranchStock: async () => ({
        sku: "X",
        branchId: 1,
        branchName: "X",
        availableQuantity: 1,
        inStock: true,
      }),
    };

    const query = new EvaluateBopisEligibilityQuery(mockInventoryPort);
    const result = await query.execute("SKU-MBP-16-512", null);

    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("NO_BRANCH_SELECTED");
  });
});
