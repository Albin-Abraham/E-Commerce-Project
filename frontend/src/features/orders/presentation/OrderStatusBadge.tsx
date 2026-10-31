/**
 * Order Presentation: Order Status Badge
 */

import React from "react";
import type { OrderStatus } from "../domain/value-objects/order-status.vo";

export interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status }) => {
  const label = status.getDisplayLabel();
  const val = status.value;

  let colorClasses = "bg-surface-muted text-muted border-border";

  if (val === "DELIVERED") {
    colorClasses = "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
  } else if (val === "SHIPPED" || val === "OUT_FOR_DELIVERY") {
    colorClasses = "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800";
  } else if (val === "PROCESSING" || val === "PACKED" || val === "CONFIRMED") {
    colorClasses = "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800";
  } else if (val === "CANCELLED" || val === "REFUNDED") {
    colorClasses = "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800";
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-2xs ${colorClasses}`}
    >
      {label}
    </span>
  );
};
