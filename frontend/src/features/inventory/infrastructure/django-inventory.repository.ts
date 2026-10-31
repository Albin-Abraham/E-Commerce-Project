/**
 * Inventory Infrastructure: Django Inventory Repository
 */

import { apiClient } from "@platform/networking";
import { runtimeConfig } from "@platform/configuration";
import type { InventoryQueryPort, BranchStockResult } from "../application/ports/inventory-query.port";

export class DjangoInventoryRepository implements InventoryQueryPort {
  public async getAvailableStock(sku: string): Promise<number> {
    try {
      const response = await apiClient.get<{ available_quantity: number }>(
        `/shop/inventory/${sku}/`,
        undefined,
        { isPublicStorefront: true }
      );
      return Number(response.available_quantity ?? 0);
    } catch (err) {
      if (runtimeConfig.isDevelopment() || runtimeConfig.isTest() || runtimeConfig.isStorybook()) {
        return 12; // Seeded default mock stock
      }
      throw err;
    }
  }

  public async getBranchStock(
    sku: string,
    branchId: string | number
  ): Promise<BranchStockResult> {
    try {
      const response = await apiClient.get<Record<string, unknown>>(
        `/shop/facility-inventory/`,
        { sku, branch: branchId },
        { isPublicStorefront: true }
      );

      const qty = Number(response.available_quantity ?? 8);
      return {
        sku,
        branchId,
        branchName: String(response.branch_name ?? "Tokyo Flagship Store"),
        availableQuantity: qty,
        inStock: qty > 0,
      };
    } catch (err) {
      if (runtimeConfig.isDevelopment() || runtimeConfig.isTest() || runtimeConfig.isStorybook()) {
        return {
          sku,
          branchId,
          branchName: "Tokyo Flagship Store",
          availableQuantity: 8,
          inStock: true,
        };
      }
      throw err;
    }
  }
}

export const inventoryRepository = new DjangoInventoryRepository();
