/**
 * Order Domain: Order Status Value Object
 *
 * Implements realistic 10-state enterprise commerce order lifecycle.
 */

export type OrderLifecycleState =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "PACKED"
  | "SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED"
  | "RETURNED"
  | "REFUNDED";

export class OrderStatus {
  public readonly value: OrderLifecycleState;

  constructor(status: OrderLifecycleState = "PENDING") {
    const validStates: OrderLifecycleState[] = [
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "PACKED",
      "SHIPPED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
      "CANCELLED",
      "RETURNED",
      "REFUNDED",
    ];

    if (!validStates.includes(status)) {
      throw new Error(`Invalid order lifecycle state: "${status}"`);
    }
    this.value = status;
  }

  public isTerminal(): boolean {
    return ["DELIVERED", "CANCELLED", "REFUNDED"].includes(this.value);
  }

  public isFulfilled(): boolean {
    return this.value === "DELIVERED";
  }

  public isCancelled(): boolean {
    return this.value === "CANCELLED";
  }

  public getProgressStep(): number {
    switch (this.value) {
      case "PENDING":
        return 1;
      case "CONFIRMED":
      case "PROCESSING":
      case "PACKED":
        return 2;
      case "SHIPPED":
      case "OUT_FOR_DELIVERY":
        return 3;
      case "DELIVERED":
        return 4;
      default:
        return 0;
    }
  }

  public getDisplayLabel(): string {
    switch (this.value) {
      case "PENDING":
        return "Pending Payment";
      case "CONFIRMED":
        return "Order Confirmed";
      case "PROCESSING":
        return "Processing in Warehouse";
      case "PACKED":
        return "Packed & Ready";
      case "SHIPPED":
        return "Shipped with Carrier";
      case "OUT_FOR_DELIVERY":
        return "Out for Delivery Today";
      case "DELIVERED":
        return "Delivered";
      case "CANCELLED":
        return "Order Cancelled";
      case "RETURNED":
        return "Item Returned";
      case "REFUNDED":
        return "Payment Refunded";
    }
  }
}
