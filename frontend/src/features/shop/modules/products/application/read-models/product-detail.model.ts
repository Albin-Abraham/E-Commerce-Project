/**
 * Product Application: CQRS Product Detail Read Model
 *
 * Rich editorial representation for the dual-column storefront product detail view.
 */

import type { ProductListItemModel } from "./product-list-item.model";
import type { ProductVariantModel } from "./product-variant.model";

export interface ProductGalleryImage {
  id: string;
  url: string;
  altText: string;
  isPrimary: boolean;
}

export interface ProductDetailModel extends ProductListItemModel {
  sku: string;
  description: string;
  gallery: ProductGalleryImage[];
  variants: ProductVariantModel[];
  specifications: Record<string, string>;
  bopisAvailable: boolean;
  bopisBranchName?: string;
  bopisPickupWindow?: string;
  estimatedDeliveryDays: number;
}
