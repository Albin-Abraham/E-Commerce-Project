/**
 * Order Presentation: Order Tracking Timeline Component
 */

import React from "react";
import { Check, Clock, Truck, PackageCheck, AlertCircle } from "lucide-react";
import type { OrderTrackingTimelineStep } from "../application/ports/order-repository.port";

export interface OrderTrackingTimelineProps {
  steps: OrderTrackingTimelineStep[];
  isCancelled?: boolean;
}

export const OrderTrackingTimeline: React.FC<OrderTrackingTimelineProps> = ({
  steps,
  isCancelled = false,
}) => {
  if (isCancelled) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-sm">
        <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
        <span>This order was cancelled. No further tracking events will be dispatched.</span>
      </div>
    );
  }

  const icons = [Clock, PackageCheck, Truck, Check];

  return (
    <div className="w-full py-4">
      <div className="relative flex items-center justify-between">
        {/* Connector Line */}
        <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-0.5 bg-border/60 z-0" />

        {steps.map((step, idx) => {
          const Icon = icons[idx] || Check;

          return (
            <div key={step.step} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  step.isCompleted
                    ? "bg-primary border-primary text-primary-foreground shadow-xs"
                    : step.isCurrent
                    ? "bg-surface border-primary text-primary ring-4 ring-primary/20"
                    : "bg-surface border-border text-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="text-center mt-2 max-w-[100px]">
                <span
                  className={`text-xs font-bold block ${
                    step.isCompleted || step.isCurrent
                      ? "text-foreground"
                      : "text-muted"
                  }`}
                >
                  {step.label}
                </span>
                {step.timestamp && (
                  <span className="text-[10px] text-muted block mt-0.5">
                    {new Date(step.timestamp).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
