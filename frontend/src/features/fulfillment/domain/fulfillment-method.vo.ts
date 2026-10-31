/**
 * Fulfillment Domain: Fulfillment Method Value Object
 */

export type FulfillmentType = "DELIVERY" | "BOPIS";

export class FulfillmentMethod {
  public readonly type: FulfillmentType;
  public readonly label: string;
  public readonly estimatedDays: number;
  public readonly fee: number;

  constructor(type: FulfillmentType, label: string, estimatedDays = 2, fee = 0) {
    this.type = type;
    this.label = label;
    this.estimatedDays = estimatedDays;
    this.fee = fee;
  }

  public isBopis(): boolean {
    return this.type === "BOPIS";
  }

  public isDelivery(): boolean {
    return this.type === "DELIVERY";
  }
}
