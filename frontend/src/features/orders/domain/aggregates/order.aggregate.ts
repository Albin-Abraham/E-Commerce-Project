/**
 * Order Domain: Order Root Aggregate
 */

import { OrderNumber } from "../value-objects/order-number.vo";
import { OrderStatus } from "../value-objects/order-status.vo";
import { OrderItemEntity } from "../entities/order-item.entity";

export interface OrderAggregateProps {
  id: string;
  orderNumber: OrderNumber;
  customerId: string;
  customerName?: string;
  status: OrderStatus;
  items: OrderItemEntity[];
  subtotal: number;
  shippingFee: number;
  tax: number;
  total: number;
  currency?: string;
  shippingAddress: string;
  trackingNumber?: string;
  carrierName?: string;
  createdAt: string;
  estimatedDelivery?: string;
}

export class OrderAggregate {
  public readonly id: string;
  public readonly orderNumber: OrderNumber;
  public readonly customerId: string;
  public readonly customerName?: string;
  public status: OrderStatus;
  public readonly items: ReadonlyArray<OrderItemEntity>;
  public readonly subtotal: number;
  public readonly shippingFee: number;
  public readonly tax: number;
  public readonly total: number;
  public readonly currency: string;
  public readonly shippingAddress: string;
  public trackingNumber?: string;
  public carrierName?: string;
  public readonly createdAt: string;
  public estimatedDelivery?: string;

  constructor(props: OrderAggregateProps) {
    if (props.items.length === 0) {
      throw new Error("Order must contain at least one line item.");
    }

    this.id = props.id;
    this.orderNumber = props.orderNumber;
    this.customerId = props.customerId;
    this.customerName = props.customerName;
    this.status = props.status;
    this.items = props.items;
    this.subtotal = props.subtotal;
    this.shippingFee = props.shippingFee;
    this.tax = props.tax;
    this.total = props.total;
    this.currency = props.currency ?? "USD";
    this.shippingAddress = props.shippingAddress;
    this.trackingNumber = props.trackingNumber;
    this.carrierName = props.carrierName;
    this.createdAt = props.createdAt;
    this.estimatedDelivery = props.estimatedDelivery;
  }

  public get totalItemCount(): number {
    return this.items.reduce((acc, item) => acc + item.quantity, 0);
  }

  public canCancel(): boolean {
    return this.status.value === "PENDING" || this.status.value === "CONFIRMED";
  }

  public cancel(): void {
    if (!this.canCancel()) {
      throw new Error(`Order in state "${this.status.value}" cannot be cancelled.`);
    }
    this.status = new OrderStatus("CANCELLED");
  }
}
