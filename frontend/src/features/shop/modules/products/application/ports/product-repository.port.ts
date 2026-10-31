/**
 * Product Application: Repository Port Contract (Dependency Inversion)
 */

import type { ProductListItemModel } from "../read-models/product-list-item.model";
import type { ProductDetailModel } from "../read-models/product-detail.model";
import type { ProductAggregate } from "../../domain/aggregates/product.aggregate";

export interface ProductCatalogFilter {
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sort?: "price_asc" | "price_desc" | "rating" | "newest";
  page?: number;
  pageSize?: number;
}

export interface PaginatedProductsResult {
  items: ProductListItemModel[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProductRepositoryPort {
  getProducts(filter?: ProductCatalogFilter): Promise<PaginatedProductsResult>;
  getProductById(id: string): Promise<ProductDetailModel | null>;
  getProductAggregate(id: string): Promise<ProductAggregate | null>;
}
