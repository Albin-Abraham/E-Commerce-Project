/**
 * Shopping Presentation: BOPIS (Buy Online, Pick Up In Store) Banner
 */

import React from "react";
import { Store, Clock } from "lucide-react";

export interface BopisPickupBannerProps {
  available: boolean;
  branchName?: string;
  pickupWindow?: string;
}

export const BopisPickupBanner: React.FC<BopisPickupBannerProps> = ({
  available,
  branchName = "Tokyo Flagship Store",
  pickupWindow = "Ready in 2 hours",
}) => {
  if (!available) {
    return (
      <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-muted border border-border text-xs text-muted">
        <Store className="w-4 h-4 shrink-0 text-muted" />
        <span>In-store pickup unavailable at {branchName}. Standard delivery available.</span>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100 text-xs">
      <Store className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
      <div className="flex-1 space-y-0.5">
        <div className="font-bold flex items-center gap-1.5">
          <span>Free Store Pickup at {branchName}</span>
          <span className="bg-emerald-600 text-white px-1.5 py-0.2 rounded text-[10px] font-black uppercase">
            BOPIS
          </span>
        </div>
        <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
          <Clock className="w-3.5 h-3.5" />
          <span>{pickupWindow} • Order now, pick up today</span>
        </div>
      </div>
    </div>
  );
};
