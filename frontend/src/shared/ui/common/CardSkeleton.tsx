import React from "react";

import { Zenith } from "@shared/theme";

interface CardSkeletonProps {
  className?: string;
  count?: number;
  variant?: "base" | "glass";
  density?: "compact" | "comfortable" | "spacious";
  minHeight?: string | number;
}

/**
 * Standardized Card Skeleton (Perceptual Layout Layer 4)
 *
 * Enforces visual symmetry with exact-dimension shimmers, matching
 * standard card layouts in dashboard grids to prevent Cumulative Layout Shifts (CLS).
 * Fully integrated with the Zenith Object-Based Styling Injection system.
 */
export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  className,
  count = 3,
  variant = "base",
  density = "comfortable",
  minHeight = "180px",
}) => {
  // 1. Fetch dynamic semantic design tokens from the central system
  const cardConfig = Zenith.card({ variant, density });
  const finalMinHeight =
    typeof minHeight === "number" ? `${minHeight}px` : minHeight;

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={Zenith.cn(
            cardConfig.className,
            "flex flex-col gap-4 animate-pulse duration-1000",
            className
          )}
          style={{ minHeight: finalMinHeight }}
          data-zenith-card={cardConfig["data-zenith-card"]}
        >
          {/* Card Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="h-6 bg-muted rounded-md w-1/2" />
            <div className="h-4 bg-muted rounded-md w-1/4" />
          </div>

          {/* Divider */}
          <div className="h-px bg-muted/40 w-full my-1" />

          {/* Body Lines */}
          <div className="space-y-3 flex-1">
            <div className="h-4 bg-muted/80 rounded w-full" />
            <div className="h-3 bg-muted/60 rounded w-5/6" />
            <div className="h-3 bg-muted/40 rounded w-2/3" />
          </div>

          {/* Card Footer Skeleton */}
          <div className="flex justify-between items-center mt-2">
            <div className="h-5 bg-muted rounded w-1/3" />
            <div className="h-8 bg-muted/80 rounded-lg w-1/4" />
          </div>
        </div>
      ))}
    </>
  );
};
