import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ShieldCheck, Truck, ArrowLeft } from "lucide-react";

import { productRepository } from "@features/shop/modules/products/infrastructure/repositories/django-product.repository";
import { GetProductDetailsQuery } from "@features/shop/modules/products/application/queries/get-product-details.query";
import { ProductImageGallery } from "@features/shop/presentation/shopping/ProductImageGallery";
import { ProductDetailBuyBox } from "@features/shop/presentation/shopping/ProductDetailBuyBox";
import { DetailRenderer } from "@shared/ui/detail/DetailRenderer";
import type { DetailSchema } from "@shared/ui/detail/detail.types";

const getProductDetailsQuery = new GetProductDetailsQuery(productRepository);

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<"specs" | "shipping" | "reviews">("specs");

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["shop", "product", id],
    queryFn: () => getProductDetailsQuery.execute(id || "1"),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-8">
        <div className="h-6 w-48 bg-surface-muted rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 aspect-editorial-gallery bg-surface-muted rounded-2xl" />
          <div className="lg:col-span-5 space-y-4">
            <div className="h-8 bg-surface-muted rounded w-3/4" />
            <div className="h-6 bg-surface-muted rounded w-1/3" />
            <div className="h-24 bg-surface-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Product Not Found</h2>
        <p className="text-sm text-muted">
          The requested product could not be found or has been discontinued.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Catalog</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-muted">
        <Link to="/products" className="hover:text-foreground transition-colors">
          Catalog
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-muted/60" />
        {product.categoryName && (
          <>
            <span className="hover:text-foreground transition-colors cursor-pointer">
              {product.categoryName}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-muted/60" />
          </>
        )}
        <span className="text-foreground truncate max-w-xs">{product.title}</span>
      </nav>

      {/* Dual-Column Editorial Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-7 sticky top-24">
          <ProductImageGallery images={product.gallery} title={product.title} />
        </div>

        {/* Right Column: Editorial Buy Box */}
        <div className="lg:col-span-5">
          <ProductDetailBuyBox
            product={product}
            onAddToCart={(p, v, q) => {
              console.log("[Storefront] Add to cart:", p.title, v?.name, q);
            }}
            onBuyNow={(p, v, q) => {
              console.log("[Storefront] Buy now:", p.title, v?.name, q);
            }}
          />
        </div>
      </div>

      {/* Bottom Section: Editorial Specifications & Reviews Tabs */}
      <div className="pt-8 border-t border-border/60 space-y-6">
        <div className="flex items-center gap-2 border-b border-border">
          <button
            type="button"
            onClick={() => setActiveTab("specs")}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === "specs"
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            Technical Specifications
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("shipping")}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === "shipping"
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            Shipping & BOPIS Pickup
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("reviews")}
            className={`pb-3 px-4 text-sm font-bold border-b-2 transition-all ${
              activeTab === "reviews"
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            Customer Reviews ({product.rating.count})
          </button>
        </div>

        {activeTab === "specs" && (
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground">Detailed Specifications</h3>
            <DetailRenderer.Grid
              schema={{
                id: `product-specs-${product.id}`,
                fields: [
                  {
                    id: "sku",
                    label: "Master SKU",
                    format: "mono",
                    value: () => product.sku,
                  },
                  {
                    id: "brand",
                    label: "Brand / Manufacturer",
                    format: "text",
                    value: () => product.brandName || "ZenOS Certified",
                  },
                  {
                    id: "category",
                    label: "Taxonomy Classification",
                    format: "text",
                    value: () => product.categoryName || "General Merchandise",
                  },
                  ...Object.entries(product.specifications).map(([key, val]) => ({
                    id: `spec-${key}`,
                    label: key,
                    format: "text" as const,
                    value: () => String(val),
                  })),
                ],
              }}
              data={product}
              columns={2}
              variant="subtle"
            />
          </div>
        )}

        {activeTab === "shipping" && (
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground">Delivery & Pickup Methods</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-4 rounded-xl bg-surface-muted/60 border border-border/60 space-y-2">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <Truck className="w-4 h-4 text-primary" />
                  <span>Standard & Express Courier</span>
                </div>
                <p className="text-xs text-muted">
                  Ships directly from central fulfillment center within 24 hours. Typical transit time is 2 business days.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-muted/60 border border-border/60 space-y-2">
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>BOPIS In-Store Pickup</span>
                </div>
                <p className="text-xs text-muted">
                  Collect free same-day pickup at your selected branch store when ordered before 3:00 PM local time.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-foreground">Customer Satisfaction</h3>
            <p className="text-sm text-muted">
              Rated <strong className="text-foreground">{product.rating.average.toFixed(1)} / 5.0</strong> based on{" "}
              {product.rating.count} verified purchases across all regional branches.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
