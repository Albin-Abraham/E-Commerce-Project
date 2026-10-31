/**
 * Product Application: CQRS Product List Item Read Model
 *
 * Lightweight, presentation-optimized model for high-throughput
 * storefront catalogs, category collections, search facets, and recommendation carousels.
 */

export interface ProductPriceReadModel {
  amount: number;
  currency: string;
  formatted: string;
}

export interface ProductBadgeReadModel {
  label: string;
  tone: "sale" | "new" | "bestseller" | "bopis";
}

export interface ProductListItemModel {
  id: string;
  title: string;
  slug: string;
  brandName?: string;
  categoryName?: string;
  primaryImageUrl: string;
  hoverImageUrl?: string;
  currentPrice: ProductPriceReadModel;
  originalPrice?: ProductPriceReadModel;
  discountPercent?: number;
  savingsFormatted?: string;
  rating: {
    average: number;
    count: number;
  };
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  stockQuantity: number;
  badges: ProductBadgeReadModel[];
  isWishlisted: boolean;
  hasVariants: boolean;
  bopisEligible?: boolean;
}
