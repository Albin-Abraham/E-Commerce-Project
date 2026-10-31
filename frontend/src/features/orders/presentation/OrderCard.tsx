/**
 * Order Presentation: Order Card Component
 */

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Package, Truck } from "lucide-react";
import type { OrderAggregate } from "../domain/aggregates/order.aggregate";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { OrderTrackingTimeline } from "./OrderTrackingTimeline";
import { OrderMapper } from "../infrastructure/mappers/order.mapper";

export interface OrderCardProps {
  order: OrderAggregate;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const trackingResult = OrderMapper.toTrackingResult(order);

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xs hover:border-border/80 transition-all">
      {/* Header Bar */}
      <div className="p-5 sm:p-6 bg-surface-muted/30 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            <span className="font-mono font-bold text-sm text-foreground">
              {order.orderNumber.value}
            </span>
          </div>
          <span className="text-muted text-xs">•</span>
          <span className="text-xs text-muted">
            Placed on {new Date(order.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <OrderStatusBadge status={order.status} />
          <div className="text-right">
            <span className="price-card text-base tabular-nums">
              ${order.total.toFixed(2)} {order.currency}
            </span>
          </div>
        </div>
      </div>

      {/* Items Preview */}
      <div className="p-5 sm:p-6 space-y-4">
        <div className="divide-y divide-border/40">
          {order.items.map((item) => (
            <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.title}
                    className="w-12 h-12 rounded-lg object-cover bg-surface-muted border border-border/40 shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-surface-muted border border-border/40 flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-muted" />
                  </div>
                )}
                <div>
                  <h5 className="text-sm font-semibold text-foreground line-clamp-1">{item.title}</h5>
                  <span className="text-xs text-muted font-mono">{item.sku} • Qty: {item.quantity}</span>
                </div>
              </div>

              <span className="text-sm font-bold tabular-nums text-foreground">
                ${item.lineTotal.toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        {/* Tracking Expand / Collapse Toggle */}
        <div className="pt-4 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Truck className="w-4 h-4 text-primary" />
            <span>
              Carrier: <strong>{order.carrierName || "Pending Dispatch"}</strong> • Tracking:{" "}
              <strong className="font-mono">{order.trackingNumber || "Assigned upon dispatch"}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline self-start sm:self-auto"
          >
            <span>{isExpanded ? "Hide Tracking Milestones" : "View Live Tracking Timeline"}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expandable Live Progress Timeline */}
        {isExpanded && (
          <div className="pt-4 mt-2 border-t border-border/40 bg-surface-muted/20 rounded-xl p-4">
            <OrderTrackingTimeline
              steps={trackingResult.steps}
              isCancelled={order.status.isCancelled()}
            />
          </div>
        )}
      </div>
    </div>
  );
};
