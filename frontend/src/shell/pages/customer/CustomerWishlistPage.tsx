import React from "react";
import { Link } from "react-router-dom";
import { Heart, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useWishlistStore } from "@features/shop/modules/wishlist";
import { ProductCard } from "@features/shop/presentation/storefront/ProductCard";

export const CustomerWishlistPage: React.FC = () => {
  const { items, clear, removeItem } = useWishlistStore();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-1">
            Saved Products & Favorites
          </span>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            My Wishlist ({items.length})
          </h1>
          <p className="text-sm text-muted mt-1">
            Items saved for future procurement and price alert tracking.
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-muted hover:text-rose-500 hover:border-rose-300 self-start sm:self-auto transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Wishlist</span>
          </button>
        )}
      </div>

      {/* Wishlist Grid */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 bg-surface border border-dashed border-border rounded-2xl text-center space-y-3">
          <Heart className="w-12 h-12 text-muted" />
          <h3 className="text-base font-bold text-foreground">Your Wishlist is Empty</h3>
          <p className="text-sm text-muted max-w-sm">
            Save hardware products and components you wish to track or purchase later by clicking the heart icon.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-xs hover:bg-primary/90 mt-2"
          >
            <span>Explore Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={() => {
                console.log("[Wishlist] Moved to cart:", product.title);
              }}
              onToggleWishlist={() => {
                removeItem(product.id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerWishlistPage;
