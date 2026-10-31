/**
 * Storefront Presentation: Product Grid Component
 */

import React, { useState, useMemo } from "react";
import { Search, SlidersHorizontal, PackageOpen } from "lucide-react";
import type { ProductListItemModel } from "../../modules/products/application/read-models/product-list-item.model";
import { ProductCard } from "./ProductCard";
import { ProductCardSkeleton } from "./ProductCardSkeleton";

export interface ProductGridProps {
  products: ProductListItemModel[];
  isLoading?: boolean;
  onAddToCart?: (product: ProductListItemModel) => void;
  onToggleWishlist?: (product: ProductListItemModel) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading = false,
  onAddToCart,
  onToggleWishlist,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.categoryName) set.add(p.categoryName);
    }
    return ["All", ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brandName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" ||
        p.categoryName?.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <div className="w-full space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-surface border border-border rounded-xl shadow-xs">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-surface-muted text-muted hover:text-foreground hover:bg-surface-muted/80"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input Box */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search catalog or brand..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted focus:outline-hidden focus:ring-2 focus:ring-primary/40 transition-all"
          />
        </div>
      </div>

      {/* Grid Display Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-surface border border-dashed border-border rounded-2xl text-center">
          <PackageOpen className="w-12 h-12 text-muted mb-3" />
          <h3 className="text-base font-semibold text-foreground mb-1">
            No products match your criteria
          </h3>
          <p className="text-sm text-muted max-w-sm mb-4">
            Try adjusting your search terms or selecting a different category filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
            }}
            className="px-4 py-2 rounded-lg bg-surface-muted hover:bg-surface-muted/80 text-foreground text-xs font-semibold transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
            />
          ))}
        </div>
      )}
    </div>
  );
};
