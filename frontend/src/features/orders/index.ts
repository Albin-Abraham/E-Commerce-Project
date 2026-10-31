/**
 * Orders Bounded Context Public API
 */

// Domain
export { OrderAggregate, type OrderAggregateProps } from "./domain/aggregates/order.aggregate";
export { OrderItemEntity, type OrderItemProps } from "./domain/entities/order-item.entity";
export { OrderNumber } from "./domain/value-objects/order-number.vo";
export { OrderStatus, type OrderLifecycleState } from "./domain/value-objects/order-status.vo";

// Application
export type {
  OrderRepositoryPort,
  OrderTrackingResult,
  OrderTrackingTimelineStep,
} from "./application/ports/order-repository.port";
export {
  GetCustomerOrdersQuery,
  GetOrderTrackingQuery,
} from "./application/queries/get-customer-orders.query";

// Infrastructure
export { DjangoOrderRepository, orderRepository } from "./infrastructure/repositories/django-order.repository";
export { OrderMapper } from "./infrastructure/mappers/order.mapper";
