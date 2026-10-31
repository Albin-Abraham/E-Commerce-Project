/**
 * Storefront Presentation: Product Card Skeleton
 */

import React from "react";

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div
      data-testid="product-card-skeleton"
      className="bg-surface border border-border/60 rounded-xl p-4 flex flex-col justify-between animate-pulse"
    >
      <div className="w-full aspect-product-card rounded-lg bg-surface-muted mb-3" />
      <div className="space-y-2 mb-4">
        <div className="h-4 bg-surface-muted rounded w-3/4" />
        <div className="h-3 bg-surface-muted rounded w-1/2" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border/40">
        <div className="h-5 bg-surface-muted rounded w-20" />
        <div className="h-8 bg-surface-muted rounded w-8" />
      </div>
    </div>
  );
};
