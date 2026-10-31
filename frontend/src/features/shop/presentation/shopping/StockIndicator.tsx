/**
 * Shopping Presentation: Stock Urgency Indicator
 */

import React from "react";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export interface StockIndicatorProps {
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  quantity: number;
}

export const StockIndicator: React.FC<StockIndicatorProps> = ({
  status,
  quantity,
}) => {
  if (status === "OUT_OF_STOCK") {
    return (
      <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-sm font-semibold">
        <XCircle className="w-4 h-4" />
        <span>Currently Out of Stock</span>
      </div>
    );
  }

  if (status === "LOW_STOCK") {
    return (
      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm font-semibold animate-pulse">
        <AlertTriangle className="w-4 h-4" />
        <span>Only {quantity} units remaining — Order soon</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
      <CheckCircle2 className="w-4 h-4" />
      <span>In Stock & Ready for Dispatch</span>
    </div>
  );
};
