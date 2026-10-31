import React from "react";
import { useQuery } from "@tanstack/react-query";
import { productRepository, GetProductsQuery, type ProductListItemModel } from "@features/shop/modules/products";
import { ProductGrid } from "@features/shop/presentation/storefront/ProductGrid";
import { Zenith } from "@shared/theme";

const getProductsQuery = new GetProductsQuery(productRepository);

export const ProductsPage: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["shop", "products"],
    queryFn: () => getProductsQuery.execute(),
  });

  const products = data?.items ?? [];

  const handleAddToCart = (product: ProductListItemModel) => {
    // Mini-cart drawer integration
    console.log("[Storefront] Added to cart:", product.title);
  };

  const handleToggleWishlist = (product: ProductListItemModel) => {
    console.log("[Storefront] Toggled wishlist for:", product.title);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-primary block mb-1">
            Zenith Commerce Catalog
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Featured Products & Hardware
          </h1>
          <p className="text-sm text-muted mt-1 max-w-xl">
            Explore industrial-grade hardware, computing gear, and peripherals with certified enterprise warranties.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-muted">
          <span>{products.length} Products Available</span>
        </div>
      </div>

      {/* Main Catalog Grid */}
      <ProductGrid
        products={products}
        isLoading={isLoading}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
      />
    </div>
  );
};

export default ProductsPage;
