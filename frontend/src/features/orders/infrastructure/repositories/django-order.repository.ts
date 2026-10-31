/**
 * Order Infrastructure: Django Order Repository
 */

import { apiClient } from "@platform/networking";
import { runtimeConfig } from "@platform/configuration";
import type {
  OrderRepositoryPort,
  OrderTrackingResult,
} from "../../application/ports/order-repository.port";
import { OrderAggregate } from "../../domain/aggregates/order.aggregate";
import { OrderMapper } from "../mappers/order.mapper";

const SEEDED_MOCK_ORDERS = [
  {
    id: "ord-90412",
    order_number: "ORD-2026-90412",
    customer_id: "cust-root-01",
    status: "SHIPPED",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    subtotal: 3499.0,
    shipping_fee: 0,
    tax: 349.9,
    total: 3848.9,
    currency: "USD",
    shipping_address: "1-1 Chiyoda, Chiyoda City, Tokyo 100-0001, Japan",
    tracking_number: "TRK-JP-9481928",
    carrier_name: "Sagawa Express Enterprise",
    estimated_delivery: "Tomorrow by 5:00 PM",
    items: [
      {
        id: "item-101",
        product_id: "prod-macbook-pro",
        sku: "SKU-MBP-16-M3",
        title: "MacBook Pro 16-inch M3 Max (36GB / 512GB)",
        unit_price: 3499.0,
        quantity: 1,
        thumbnail_url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80",
      },
    ],
  },
  {
    id: "ord-89211",
    order_number: "ORD-2026-89211",
    customer_id: "cust-root-01",
    status: "DELIVERED",
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
    subtotal: 398.0,
    shipping_fee: 15.0,
    tax: 39.8,
    total: 452.8,
    currency: "USD",
    shipping_address: "1-1 Chiyoda, Chiyoda City, Tokyo 100-0001, Japan",
    tracking_number: "TRK-JP-8172901",
    carrier_name: "Yamato Transport",
    estimated_delivery: "Delivered on Oct 19",
    items: [
      {
        id: "item-102",
        product_id: "prod-sony-wh1000xm5",
        sku: "SKU-SONY-BLK",
        title: "Sony WH-1000XM5 Wireless Headphones (Black)",
        unit_price: 398.0,
        quantity: 1,
        thumbnail_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
      },
    ],
  },
];

export class DjangoOrderRepository implements OrderRepositoryPort {
  public async getCustomerOrders(customerId?: string): Promise<OrderAggregate[]> {
    try {
      const response = await apiClient.get<Record<string, unknown>[]>("/shop/orders/", {
        customer: customerId,
      });
      const list = Array.isArray(response) ? response : [];
      return list.map((dto) => OrderMapper.toOrderAggregate(dto));
    } catch (err) {
      if (runtimeConfig.isDevelopment() || runtimeConfig.isTest() || runtimeConfig.isStorybook()) {
        return SEEDED_MOCK_ORDERS.map((dto) => OrderMapper.toOrderAggregate(dto));
      }
      throw err;
    }
  }

  public async getOrderById(orderId: string): Promise<OrderAggregate | null> {
    try {
      const response = await apiClient.get<Record<string, unknown>>(`/shop/orders/${orderId}/`);
      return OrderMapper.toOrderAggregate(response);
    } catch (err) {
      if (runtimeConfig.isDevelopment() || runtimeConfig.isTest() || runtimeConfig.isStorybook()) {
        const found =
          SEEDED_MOCK_ORDERS.find((o) => o.id === orderId || o.order_number === orderId) ||
          SEEDED_MOCK_ORDERS[0];
        return OrderMapper.toOrderAggregate(found);
      }
      throw err;
    }
  }

  public async getOrderTracking(orderId: string): Promise<OrderTrackingResult | null> {
    const order = await this.getOrderById(orderId);
    if (!order) return null;
    return OrderMapper.toTrackingResult(order);
  }

  public async cancelOrder(orderId: string): Promise<void> {
    try {
      await apiClient.post(`/shop/orders/${orderId}/cancel/`);
    } catch (err) {
      if (runtimeConfig.isDevelopment() || runtimeConfig.isTest() || runtimeConfig.isStorybook()) {
        return;
      }
      throw err;
    }
  }
}

export const orderRepository = new DjangoOrderRepository();
