/**
 * Shopping Presentation: Editorial Product Detail Buy Box
 */

import React, { useState } from "react";
import { Star, ShieldCheck, Truck, RefreshCw, ShoppingBag, Zap, Heart } from "lucide-react";
import type { ProductDetailModel } from "../../modules/products/application/read-models/product-detail.model";
import type { ProductVariantModel } from "../../modules/products/application/read-models/product-variant.model";
import { VariantSelector } from "./VariantSelector";
import { StockIndicator } from "./StockIndicator";
import { BopisPickupBanner } from "./BopisPickupBanner";

export interface ProductDetailBuyBoxProps {
  product: ProductDetailModel;
  onAddToCart?: (product: ProductDetailModel, variant?: ProductVariantModel, quantity?: number) => void;
  onBuyNow?: (product: ProductDetailModel, variant?: ProductVariantModel, quantity?: number) => void;
}

export const ProductDetailBuyBox: React.FC<ProductDetailBuyBoxProps> = ({
  product,
  onAddToCart,
  onBuyNow,
}) => {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantModel | undefined>(
    product.variants[0]
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(product.isWishlisted);

  const activePriceFormatted = selectedVariant
    ? selectedVariant.priceFormatted
    : product.currentPrice.formatted;

  const activeCompareFormatted = selectedVariant
    ? selectedVariant.compareAtPriceFormatted
    : product.originalPrice?.formatted;

  const isAvailable = selectedVariant
    ? selectedVariant.inStock
    : product.stockStatus !== "OUT_OF_STOCK";

  const handleAddToCart = () => {
    onAddToCart?.(product, selectedVariant, quantity);
  };

  const handleBuyNow = () => {
    onBuyNow?.(product, selectedVariant, quantity);
  };

  return (
    <div
      data-testid="product-detail-buybox"
      className="bg-surface border border-border rounded-2xl p-6 lg:p-8 space-y-6 shadow-sm"
    >
      {/* Brand & Title */}
      <div className="space-y-2">
        {product.brandName && (
          <span className="text-xs font-bold text-primary uppercase tracking-wider block">
            {product.brandName}
          </span>
        )}
        <h1 className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight">
          {product.title}
        </h1>

        {/* Rating & SKU Summary */}
        <div className="flex items-center gap-3 text-xs text-muted">
          <div className="flex items-center text-amber-500">
            <Star className="w-4 h-4 fill-current" />
            <span className="font-bold ml-1 text-foreground">
              {product.rating.average.toFixed(1)}
            </span>
          </div>
          <span>•</span>
          <span className="underline cursor-pointer hover:text-foreground">
            {product.rating.count} verified customer reviews
          </span>
          <span>•</span>
          <span className="font-mono">{product.sku}</span>
        </div>
      </div>

      {/* Hero Tabular Pricing */}
      <div className="flex items-baseline gap-3 p-4 rounded-xl bg-surface-muted/60 border border-border/60">
        <span className="price-hero">{activePriceFormatted}</span>
        {activeCompareFormatted && (
          <span className="price-strike">{activeCompareFormatted}</span>
        )}
        {product.discountPercent && product.discountPercent > 0 && (
          <span className="savings-pill">Save {product.discountPercent}%</span>
        )}
      </div>

      {/* Stock Urgency Indicator */}
      <StockIndicator
        status={product.stockStatus}
        quantity={product.stockQuantity}
      />

      {/* Variant Selector */}
      {product.variants.length > 0 && (
        <VariantSelector
          variants={product.variants}
          selectedVariantId={selectedVariant?.id}
          onSelectVariant={(v) => setSelectedVariant(v)}
        />
      )}

      {/* BOPIS Store Pickup Banner */}
      <BopisPickupBanner
        available={product.bopisAvailable}
        branchName={product.bopisBranchName}
        pickupWindow={product.bopisPickupWindow}
      />

      {/* Quantity & Action Controls */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-4">
          <span className="text-xs font-bold uppercase text-muted tracking-wider">Quantity:</span>
          <div className="inline-flex items-center border border-border rounded-xl bg-surface">
            <button
              type="button"
              disabled={quantity <= 1}
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="px-3 py-2 text-foreground font-bold hover:bg-surface-muted disabled:opacity-30 disabled:cursor-not-allowed rounded-l-xl transition-colors"
            >
              -
            </button>
            <span className="px-4 py-2 text-sm font-bold tabular-nums min-w-[2.5rem] text-center">
              {quantity}
            </span>
            <button
              type="button"
              disabled={!isAvailable || quantity >= product.stockQuantity}
              onClick={() => setQuantity(quantity + 1)}
              className="px-3 py-2 text-foreground font-bold hover:bg-surface-muted disabled:opacity-30 disabled:cursor-not-allowed rounded-r-xl transition-colors"
            >
              +
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            type="button"
            disabled={!isAvailable}
            onClick={handleAddToCart}
            className="w-full py-3.5 px-4 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add to Cart</span>
          </button>

          <button
            type="button"
            disabled={!isAvailable}
            onClick={handleBuyNow}
            className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Zap className="w-4 h-4" />
            <span>Instant Buy Now</span>
          </button>
        </div>

        {/* Wishlist quick action */}
        <button
          type="button"
          onClick={() => setIsWishlisted(!isWishlisted)}
          className="w-full py-2 flex items-center justify-center gap-2 text-xs font-semibold text-muted hover:text-foreground transition-colors"
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
          <span>{isWishlisted ? "Saved to your Wishlist" : "Save to Wishlist"}</span>
        </button>
      </div>

      {/* Trust & Guarantee Grid */}
      <div className="grid grid-cols-3 gap-3 pt-6 border-t border-border/40 text-center text-[11px] text-muted">
        <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-surface-muted/40">
          <Truck className="w-4 h-4 text-primary" />
          <span>Fast Tracked Dispatch</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-surface-muted/40">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>2-Year Full Warranty</span>
        </div>
        <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg bg-surface-muted/40">
          <RefreshCw className="w-4 h-4 text-indigo-500" />
          <span>30-Day Hassle-Free Return</span>
        </div>
      </div>
    </div>
  );
};
