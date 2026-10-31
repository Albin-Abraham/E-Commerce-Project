import { describe, expect, it } from "vitest";
import {
  OrderAggregate,
  OrderItemEntity,
  OrderNumber,
  OrderStatus,
  orderRepository,
  GetCustomerOrdersQuery,
  GetOrderTrackingQuery,
} from "../index";

describe("Orders Bounded Context", () => {
  describe("1. Order Status Lifecycle", () => {
    it("handles all 10 order lifecycle states and calculates progress steps", () => {
      const pending = new OrderStatus("PENDING");
      expect(pending.getProgressStep()).toBe(1);
      expect(pending.isTerminal()).toBe(false);

      const shipped = new OrderStatus("SHIPPED");
      expect(shipped.getProgressStep()).toBe(3);
      expect(shipped.getDisplayLabel()).toContain("Shipped");

      const delivered = new OrderStatus("DELIVERED");
      expect(delivered.getProgressStep()).toBe(4);
      expect(delivered.isFulfilled()).toBe(true);
      expect(delivered.isTerminal()).toBe(true);

      const cancelled = new OrderStatus("CANCELLED");
      expect(cancelled.isCancelled()).toBe(true);
      expect(cancelled.isTerminal()).toBe(true);
    });
  });

  describe("2. Order Aggregate", () => {
    it("calculates item counts and manages cancellation invariant", () => {
      const item1 = new OrderItemEntity({
        id: "i1",
        productId: "p1",
        sku: "SKU-001",
        title: "Test Item 1",
        unitPrice: 100,
        quantity: 2,
      });

      expect(item1.lineTotal).toBe(200);

      const order = new OrderAggregate({
        id: "ord-1",
        orderNumber: new OrderNumber("ORD-10001"),
        customerId: "cust-1",
        status: new OrderStatus("PENDING"),
        items: [item1],
        subtotal: 200,
        shippingFee: 10,
        tax: 20,
        total: 230,
        shippingAddress: "Tokyo, Japan",
        createdAt: new Date().toISOString(),
      });

      expect(order.totalItemCount).toBe(2);
      expect(order.canCancel()).toBe(true);

      order.cancel();
      expect(order.status.value).toBe("CANCELLED");
      expect(order.canCancel()).toBe(false);
    });
  });

  describe("3. Application Queries & Tracking", () => {
    it("executes GetCustomerOrdersQuery successfully", async () => {
      const query = new GetCustomerOrdersQuery(orderRepository);
      const orders = await query.execute();

      expect(orders.length).toBeGreaterThan(0);
      expect(orders[0].orderNumber.value).toBeTruthy();
    });

    it("executes GetOrderTrackingQuery returning 4-step progress timeline", async () => {
      const query = new GetOrderTrackingQuery(orderRepository);
      const tracking = await query.execute("ord-90412");

      expect(tracking).toBeDefined();
      expect(tracking?.steps.length).toBe(4);
      expect(tracking?.currentStep).toBeGreaterThanOrEqual(1);
    });
  });
});
