/**
 * Order Application: Repository Port Contract
 */

import type { OrderAggregate } from "../../domain/aggregates/order.aggregate";

export interface OrderTrackingTimelineStep {
  step: number;
  label: string;
  description: string;
  timestamp?: string;
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface OrderTrackingResult {
  order: OrderAggregate;
  currentStep: number;
  steps: OrderTrackingTimelineStep[];
  trackingNumber?: string;
  carrierName?: string;
  estimatedDelivery?: string;
}

export interface OrderRepositoryPort {
  getCustomerOrders(customerId?: string): Promise<OrderAggregate[]>;
  getOrderById(orderId: string): Promise<OrderAggregate | null>;
  getOrderTracking(orderId: string): Promise<OrderTrackingResult | null>;
  cancelOrder(orderId: string): Promise<void>;
}
