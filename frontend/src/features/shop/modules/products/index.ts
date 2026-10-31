/**
 * Product Bounded Context Public API
 */

// Domain
export { Money } from "./domain/value-objects/money.vo";
export { SKU } from "./domain/value-objects/sku.vo";
export { StockLevel, type StockState } from "./domain/value-objects/stock-level.vo";
export { ProductStatus, type ProductLifecycleStatus } from "./domain/value-objects/product-status.vo";
export { ProductVariantEntity, type VariantAttributeOption } from "./domain/entities/product-variant.entity";
export { ProductAggregate } from "./domain/aggregates/product.aggregate";

// Read Models
export type { ProductListItemModel, ProductPriceReadModel, ProductBadgeReadModel } from "./application/read-models/product-list-item.model";
export type { ProductDetailModel, ProductGalleryImage } from "./application/read-models/product-detail.model";
export type { ProductVariantModel } from "./application/read-models/product-variant.model";

// Application Queries & Ports
export type { ProductRepositoryPort, ProductCatalogFilter, PaginatedProductsResult } from "./application/ports/product-repository.port";
export { GetProductsQuery } from "./application/queries/get-products.query";
export { GetProductDetailsQuery } from "./application/queries/get-product-details.query";

// Infrastructure
export { DjangoProductRepository, productRepository } from "./infrastructure/repositories/django-product.repository";
export { ProductMapper } from "./infrastructure/mappers/product.mapper";
