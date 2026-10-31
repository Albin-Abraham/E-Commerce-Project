/**
 * Shopping Presentation: Variant Selector
 */

import React from "react";
import type { ProductVariantModel } from "../../modules/products/application/read-models/product-variant.model";

export interface VariantSelectorProps {
  variants: ProductVariantModel[];
  selectedVariantId?: string;
  onSelectVariant: (variant: ProductVariantModel) => void;
}

export const VariantSelector: React.FC<VariantSelectorProps> = ({
  variants,
  selectedVariantId,
  onSelectVariant,
}) => {
  if (variants.length === 0) return null;

  return (
    <div className="space-y-3 py-3 border-y border-border/40">
      <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
        Select Configuration
      </span>

      <div className="flex flex-wrap gap-2.5">
        {variants.map((v) => {
          const isSelected = v.id === selectedVariantId;
          const isAvailable = v.inStock;

          return (
            <button
              key={v.id}
              type="button"
              disabled={!isAvailable}
              onClick={() => onSelectVariant(v)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-200 flex items-center gap-2 ${
                isSelected
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : isAvailable
                  ? "bg-surface hover:bg-surface-muted text-foreground border-border hover:border-primary/50"
                  : "bg-surface-muted/50 text-muted/60 border-border/40 cursor-not-allowed line-through"
              }`}
            >
              <span>{v.name}</span>
              <span className="tabular-nums font-normal opacity-85">
                {v.priceFormatted}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
