/**
 * Product Domain: Product Variant Entity
 */

import { SKU } from "../value-objects/sku.vo";
import { Money } from "../value-objects/money.vo";
import { StockLevel } from "../value-objects/stock-level.vo";

export interface VariantAttributeOption {
  name: string; // e.g. "Color", "Storage", "Size"
  value: string; // e.g. "Space Black", "512GB", "Large"
}

export interface ProductVariantProps {
  id: string;
  sku: SKU;
  name: string;
  price: Money;
  compareAtPrice?: Money;
  stock: StockLevel;
  barcode?: string;
  attributes: VariantAttributeOption[];
  imageUrl?: string;
}

export class ProductVariantEntity {
  public readonly id: string;
  public readonly sku: SKU;
  public readonly name: string;
  public readonly price: Money;
  public readonly compareAtPrice?: Money;
  public readonly stock: StockLevel;
  public readonly barcode?: string;
  public readonly attributes: VariantAttributeOption[];
  public readonly imageUrl?: string;

  constructor(props: ProductVariantProps) {
    this.id = props.id;
    this.sku = props.sku;
    this.name = props.name;
    this.price = props.price;
    this.compareAtPrice = props.compareAtPrice;
    this.stock = props.stock;
    this.barcode = props.barcode;
    this.attributes = props.attributes;
    this.imageUrl = props.imageUrl;
  }

  public isAvailable(): boolean {
    return this.stock.isAvailable();
  }

  public getAttribute(name: string): string | undefined {
    return this.attributes.find(
      (a) => a.name.toLowerCase() === name.toLowerCase()
    )?.value;
  }
}
