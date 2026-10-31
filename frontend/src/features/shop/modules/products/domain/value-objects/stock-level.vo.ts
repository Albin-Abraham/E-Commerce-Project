/**
 * Product Domain: Stock Level Value Object
 *
 * Classifies inventory availability into semantic commerce states.
 */

export type StockState = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export class StockLevel {
  public readonly quantity: number;
  public readonly lowStockThreshold: number;
  public readonly state: StockState;

  constructor(quantity: number, lowStockThreshold = 5) {
    if (isNaN(quantity) || quantity < 0) {
      throw new Error(`Stock quantity cannot be negative.`);
    }

    this.quantity = Math.floor(quantity);
    this.lowStockThreshold = lowStockThreshold;

    if (this.quantity === 0) {
      this.state = "OUT_OF_STOCK";
    } else if (this.quantity <= this.lowStockThreshold) {
      this.state = "LOW_STOCK";
    } else {
      this.state = "IN_STOCK";
    }
  }

  public isAvailable(): boolean {
    return this.quantity > 0;
  }

  public isLowStock(): boolean {
    return this.state === "LOW_STOCK";
  }

  public getUrgencyLabel(): string {
    if (this.state === "OUT_OF_STOCK") return "Out of Stock";
    if (this.state === "LOW_STOCK") return `Only ${this.quantity} left in stock!`;
    return "In Stock";
  }
}
