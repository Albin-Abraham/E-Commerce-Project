/**
 * Order Infrastructure: DTO Mappers
 */

import { OrderAggregate } from "../../domain/aggregates/order.aggregate";
import { OrderNumber } from "../../domain/value-objects/order-number.vo";
import { OrderStatus, type OrderLifecycleState } from "../../domain/value-objects/order-status.vo";
import { OrderItemEntity } from "../../domain/entities/order-item.entity";
import type { OrderTrackingResult } from "../../application/ports/order-repository.port";

export class OrderMapper {
  public static toOrderItemEntity(dto: Record<string, unknown>): OrderItemEntity {
    return new OrderItemEntity({
      id: String(dto.id),
      productId: String(dto.product_id ?? dto.product ?? "prod-1"),
      sku: String(dto.sku ?? "SKU-PROD-001"),
      title: String(dto.title ?? dto.product_name ?? "Enterprise Hardware Item"),
      unitPrice: Number(dto.unit_price ?? dto.price ?? 99.0),
      quantity: Math.max(1, Number(dto.quantity ?? 1)),
      thumbnailUrl: typeof dto.thumbnail_url === "string" ? dto.thumbnail_url : undefined,
    });
  }

  public static toOrderAggregate(dto: Record<string, unknown>): OrderAggregate {
    const id = String(dto.id);
    const orderNumber = new OrderNumber(String(dto.order_number ?? dto.number ?? `ORD-${id}`));
    const customerId = String(dto.customer_id ?? dto.customer ?? "cust-1");
    const customerName = typeof dto.customer_name === "string" ? dto.customer_name : undefined;

    const rawStatus = (dto.status as string) || "CONFIRMED";
    const status = new OrderStatus(rawStatus.toUpperCase() as OrderLifecycleState);

    const rawItems = Array.isArray(dto.items) ? (dto.items as Record<string, unknown>[]) : [];
    const items = rawItems.length > 0
      ? rawItems.map((i) => this.toOrderItemEntity(i))
      : [
          new OrderItemEntity({
            id: `item-${id}-1`,
            productId: "prod-macbook-pro",
            sku: "SKU-MBP-16-M3",
            title: "MacBook Pro 16-inch M3 Max",
            unitPrice: 3499.0,
            quantity: 1,
            thumbnailUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80",
          }),
        ];

    const subtotal = Number(dto.subtotal ?? items.reduce((s, i) => s + i.lineTotal, 0));
    const shippingFee = Number(dto.shipping_fee ?? 0);
    const tax = Number(dto.tax ?? Math.round(subtotal * 0.1 * 100) / 100);
    const total = Number(dto.total ?? subtotal + shippingFee + tax);

    return new OrderAggregate({
      id,
      orderNumber,
      customerId,
      customerName,
      status,
      items,
      subtotal,
      shippingFee,
      tax,
      total,
      currency: String(dto.currency ?? "USD"),
      shippingAddress: String(dto.shipping_address ?? "1-1 Chiyoda, Chiyoda City, Tokyo, Japan"),
      trackingNumber: typeof dto.tracking_number === "string" ? dto.tracking_number : "TRK-JP-9481928",
      carrierName: typeof dto.carrier_name === "string" ? dto.carrier_name : "Sagawa Express Enterprise",
      createdAt: String(dto.created_at ?? new Date().toISOString()),
      estimatedDelivery: typeof dto.estimated_delivery === "string" ? dto.estimated_delivery : "Tomorrow by 5:00 PM",
    });
  }

  public static toTrackingResult(order: OrderAggregate): OrderTrackingResult {
    const currentStep = order.status.getProgressStep();

    const steps = [
      {
        step: 1,
        label: "Order Placed",
        description: "Payment confirmed and order received",
        timestamp: order.createdAt,
        isCompleted: currentStep >= 1,
        isCurrent: currentStep === 1,
      },
      {
        step: 2,
        label: "Processing & Packed",
        description: "Allocated in warehouse and packaged for dispatch",
        isCompleted: currentStep >= 2,
        isCurrent: currentStep === 2,
      },
      {
        step: 3,
        label: "Shipped with Carrier",
        description: `Handed over to ${order.carrierName || "Carrier"} (Tracking: ${order.trackingNumber || "Assigned"})`,
        isCompleted: currentStep >= 3,
        isCurrent: currentStep === 3,
      },
      {
        step: 4,
        label: "Delivered",
        description: "Package signed and delivered to destination",
        isCompleted: currentStep >= 4,
        isCurrent: currentStep === 4,
      },
    ];

    return {
      order,
      currentStep,
      steps,
      trackingNumber: order.trackingNumber,
      carrierName: order.carrierName,
      estimatedDelivery: order.estimatedDelivery,
    };
  }
}
