/**
 * Inventory Application: Query Port Contract
 */

export interface BranchStockResult {
  sku: string;
  branchId: string | number;
  branchName: string;
  availableQuantity: number;
  inStock: boolean;
}

export interface InventoryQueryPort {
  getAvailableStock(sku: string): Promise<number>;
  getBranchStock(sku: string, branchId: string | number): Promise<BranchStockResult>;
}
