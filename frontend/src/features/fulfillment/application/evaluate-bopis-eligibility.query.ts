/**
 * Fulfillment Application: BOPIS Eligibility Evaluator Query
 *
 * Invariant: Pickup eligibility is NEVER derived solely from static product stock.
 * The evaluation strictly executes:
 * Product -> Variant -> Inventory Availability (via Inventory Port) -> Branch Context -> BOPIS Result
 */

import type { InventoryQueryPort } from "@features/inventory";

export interface BopisEligibilityResult {
  eligible: boolean;
  branchId?: string | number;
  branchName?: string;
  availableQuantity: number;
  pickupWindow?: string;
  reason?: string;
}

export class EvaluateBopisEligibilityQuery {
  constructor(private readonly inventoryPort: InventoryQueryPort) {}

  public async execute(
    variantSku: string,
    targetBranch?: { id: string | number; name: string } | null
  ): Promise<BopisEligibilityResult> {
    if (!targetBranch) {
      return {
        eligible: false,
        availableQuantity: 0,
        reason: "NO_BRANCH_SELECTED",
      };
    }

    const branchStock = await this.inventoryPort.getBranchStock(
      variantSku,
      targetBranch.id
    );

    if (branchStock.availableQuantity > 0) {
      return {
        eligible: true,
        branchId: targetBranch.id,
        branchName: targetBranch.name,
        availableQuantity: branchStock.availableQuantity,
        pickupWindow: "Ready in 2 hours",
      };
    }

    return {
      eligible: false,
      branchId: targetBranch.id,
      branchName: targetBranch.name,
      availableQuantity: 0,
      reason: "OUT_OF_STOCK_AT_BRANCH",
    };
  }
}
