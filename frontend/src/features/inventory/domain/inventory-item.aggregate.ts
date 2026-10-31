/**
 * Inventory Domain: Inventory Item Aggregate
 *
 * Models physical warehouse stock, reserved stock, and available-to-promise (ATP) quantity.
 */

export interface InventoryItemProps {
  id: string;
  sku: string;
  warehouseId: string;
  warehouseName: string;
  onHandQuantity: number;
  reservedQuantity: number;
}

export class InventoryItemAggregate {
  public readonly id: string;
  public readonly sku: string;
  public readonly warehouseId: string;
  public readonly warehouseName: string;
  public onHandQuantity: number;
  public reservedQuantity: number;

  constructor(props: InventoryItemProps) {
    if (props.onHandQuantity < 0 || props.reservedQuantity < 0) {
      throw new Error("Inventory quantities cannot be negative.");
    }
    if (props.reservedQuantity > props.onHandQuantity) {
      throw new Error("Reserved quantity cannot exceed on-hand quantity.");
    }

    this.id = props.id;
    this.sku = props.sku;
    this.warehouseId = props.warehouseId;
    this.warehouseName = props.warehouseName;
    this.onHandQuantity = props.onHandQuantity;
    this.reservedQuantity = props.reservedQuantity;
  }

  /**
   * Available-to-Promise (ATP) = OnHand - Reserved
   */
  public get availableQuantity(): number {
    return this.onHandQuantity - this.reservedQuantity;
  }

  public isAvailable(requestedQuantity = 1): boolean {
    return this.availableQuantity >= requestedQuantity;
  }

  public reserve(quantity: number): void {
    if (quantity <= 0) {
      throw new Error("Reservation quantity must be positive.");
    }
    if (this.availableQuantity < quantity) {
      throw new Error(`Insufficient inventory: requested ${quantity}, available ${this.availableQuantity}`);
    }
    this.reservedQuantity += quantity;
  }

  public release(quantity: number): void {
    if (quantity <= 0) {
      throw new Error("Release quantity must be positive.");
    }
    this.reservedQuantity = Math.max(0, this.reservedQuantity - quantity);
  }
}
