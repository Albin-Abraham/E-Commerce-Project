/**
 * Storefront Presentation: Product Card Component
 *
 * Implements Shopify/Amazon-grade commerce standards:
 * - Tabular numeric pricing
 * - Semantic stock urgency pills
 * - Hover image swap preview
 * - 2-line title clamping
 * - Wishlist toggle & Quick Add to Cart
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Star } from "lucide-react";
import type { ProductListItemModel } from "../../modules/products/application/read-models/product-list-item.model";

export interface ProductCardProps {
  product: ProductListItemModel;
  onAddToCart?: (product: ProductListItemModel) => void;
  onToggleWishlist?: (product: ProductListItemModel) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onToggleWishlist,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(product.isWishlisted);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    onToggleWishlist?.(product);
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart?.(product);
  };

  const displayImage =
    isHovered && product.hoverImageUrl
      ? product.hoverImageUrl
      : product.primaryImageUrl;

  return (
    <div
      data-testid={`product-card-${product.id}`}
      className="group relative bg-surface border border-border rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:border-primary/40 flex flex-col justify-between overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top Media Section */}
      <div className="relative w-full aspect-product-card overflow-hidden rounded-lg bg-surface-muted mb-3 flex items-center justify-center">
        {/* Badges Overlay */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {product.badges.map((b, idx) => (
            <span
              key={idx}
              className={`badge-commerce ${
                b.tone === "sale"
                  ? "badge-sale"
                  : b.tone === "new"
                  ? "badge-new"
                  : "badge-bestseller"
              }`}
            >
              {b.label}
            </span>
          ))}
        </div>

        {/* Wishlist Button */}
        <button
          type="button"
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={handleWishlistClick}
          className="absolute top-2 right-2 z-10 p-2 rounded-full bg-surface/80 backdrop-blur-sm border border-border/60 hover:bg-surface text-foreground transition-all duration-200 shadow-sm"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isWishlisted ? "fill-rose-500 text-rose-500" : "text-muted hover:text-foreground"
            }`}
          />
        </button>

        {/* Product Image */}
        <Link to={`/products/${product.id}`} className="w-full h-full block">
          <img
            src={displayImage}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        </Link>
      </div>

      {/* Content Section */}
      <div className="flex flex-col flex-1">
        {product.brandName && (
          <span className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">
            {product.brandName}
          </span>
        )}

        <Link
          to={`/products/${product.id}`}
          className="font-semibold text-foreground text-sm line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors mb-1.5"
          title={product.title}
        >
          {product.title}
        </Link>

        {/* Rating Row */}
        <div className="flex items-center gap-1.5 mb-2 text-xs text-muted">
          <div className="flex items-center text-amber-500">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span className="font-semibold ml-1 text-foreground">
              {product.rating.average.toFixed(1)}
            </span>
          </div>
          <span>•</span>
          <span>({product.rating.count})</span>
        </div>

        {/* Stock Urgency Pill */}
        <div className="mb-3">
          <span
            className={`stock-pill ${
              product.stockStatus === "IN_STOCK"
                ? "stock-pill-in"
                : product.stockStatus === "LOW_STOCK"
                ? "stock-pill-low"
                : "stock-pill-out"
            }`}
          >
            {product.stockStatus === "IN_STOCK"
              ? "In Stock"
              : product.stockStatus === "LOW_STOCK"
              ? `Only ${product.stockQuantity} left`
              : "Out of Stock"}
          </span>
        </div>

        {/* Bottom Price & Add to Cart Row */}
        <div className="flex items-baseline justify-between mt-auto pt-3 border-t border-border/40">
          <div className="flex items-baseline gap-2">
            <span className="price-card">{product.currentPrice.formatted}</span>
            {product.originalPrice && (
              <span className="price-strike">{product.originalPrice.formatted}</span>
            )}
          </div>

          <button
            type="button"
            aria-label={`Add ${product.title} to cart`}
            disabled={product.stockStatus === "OUT_OF_STOCK"}
            onClick={handleAddToCartClick}
            className={`p-2 rounded-lg border transition-all duration-200 flex items-center justify-center ${
              product.stockStatus === "OUT_OF_STOCK"
                ? "bg-surface-muted text-muted cursor-not-allowed border-transparent"
                : "bg-primary text-primary-foreground hover:bg-primary/90 border-transparent shadow-sm active:scale-95"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
