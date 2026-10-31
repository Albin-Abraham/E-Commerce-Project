/**
 * Order Application: Queries
 */

import type {
  OrderRepositoryPort,
  OrderTrackingResult,
} from "../ports/order-repository.port";
import type { OrderAggregate } from "../../domain/aggregates/order.aggregate";

export class GetCustomerOrdersQuery {
  constructor(private readonly repository: OrderRepositoryPort) {}

  public execute(customerId?: string): Promise<OrderAggregate[]> {
    return this.repository.getCustomerOrders(customerId);
  }
}

export class GetOrderTrackingQuery {
  constructor(private readonly repository: OrderRepositoryPort) {}

  public execute(orderId: string): Promise<OrderTrackingResult | null> {
    return this.repository.getOrderTracking(orderId);
  }
}
