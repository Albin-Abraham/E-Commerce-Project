/**
 * Product Domain: Product Root Aggregate
 *
 * Enforces business invariants:
 * - Title and valid URL slug are required.
 * - Selling price must be valid Money.
 * - Compare-at price (if provided) cannot be less than selling price.
 * - Manages child variants collection and overall active status.
 */

import { Money } from "../value-objects/money.vo";
import { SKU } from "../value-objects/sku.vo";
import { StockLevel } from "../value-objects/stock-level.vo";
import { ProductStatus } from "../value-objects/product-status.vo";
import { ProductVariantEntity } from "../entities/product-variant.entity";

export interface ProductAggregateProps {
  id: string;
  sku: SKU;
  title: string;
  slug: string;
  description: string;
  brandName?: string;
  categoryName?: string;
  price: Money;
  compareAtPrice?: Money;
  stock: StockLevel;
  status: ProductStatus;
  images: Array<{ id: string; url: string; altText: string; isPrimary: boolean }>;
  variants: ProductVariantEntity[];
  tags: string[];
}

export class ProductAggregate {
  public readonly id: string;
  public readonly sku: SKU;
  public title: string;
  public slug: string;
  public description: string;
  public brandName?: string;
  public categoryName?: string;
  public price: Money;
  public compareAtPrice?: Money;
  public stock: StockLevel;
  public status: ProductStatus;
  public images: Array<{ id: string; url: string; altText: string; isPrimary: boolean }>;
  private _variants: ProductVariantEntity[];
  public tags: string[];

  constructor(props: ProductAggregateProps) {
    if (!props.title || props.title.trim().length === 0) {
      throw new Error("Product title is required.");
    }

    if (props.compareAtPrice && props.compareAtPrice.amount < props.price.amount) {
      throw new Error(
        `Compare-at price (${props.compareAtPrice.format()}) cannot be less than regular price (${props.price.format()}).`
      );
    }

    this.id = props.id;
    this.sku = props.sku;
    this.title = props.title.trim();
    this.slug = props.slug.trim().toLowerCase();
    this.description = props.description;
    this.brandName = props.brandName;
    this.categoryName = props.categoryName;
    this.price = props.price;
    this.compareAtPrice = props.compareAtPrice;
    this.stock = props.stock;
    this.status = props.status;
    this.images = props.images;
    this._variants = props.variants;
    this.tags = props.tags;
  }

  public get variants(): ReadonlyArray<ProductVariantEntity> {
    return this._variants;
  }

  public get primaryImage(): string {
    const primary = this.images.find((img) => img.isPrimary);
    return primary?.url || this.images[0]?.url || "";
  }

  public get discountPercent(): number {
    if (!this.compareAtPrice) return 0;
    return this.price.calculateSavings(this.compareAtPrice).discountPercent;
  }

  public hasVariants(): boolean {
    return this._variants.length > 0;
  }

  public findVariantBySku(skuValue: string): ProductVariantEntity | undefined {
    return this._variants.find((v) => v.sku.value === skuValue.toUpperCase());
  }

  public isAvailable(): boolean {
    if (this.hasVariants()) {
      return this._variants.some((v) => v.isAvailable());
    }
    return this.stock.isAvailable();
  }
}
