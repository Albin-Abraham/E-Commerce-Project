/**
 * Product Application: CQRS Product Variant Read Model
 */

export interface ProductVariantModel {
  id: string;
  sku: string;
  name: string;
  priceFormatted: string;
  priceAmount: number;
  compareAtPriceFormatted?: string;
  compareAtPriceAmount?: number;
  inStock: boolean;
  stockQuantity: number;
  attributes: Record<string, string>; // e.g. { "Color": "Midnight Blue", "Storage": "256GB" }
  imageUrl?: string;
}
