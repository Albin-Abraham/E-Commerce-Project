/**
 * Product Application: Get Products Query Handler
 */

import type {
  ProductRepositoryPort,
  ProductCatalogFilter,
  PaginatedProductsResult,
} from "../ports/product-repository.port";

export class GetProductsQuery {
  constructor(private readonly repository: ProductRepositoryPort) {}

  public execute(filter?: ProductCatalogFilter): Promise<PaginatedProductsResult> {
    return this.repository.getProducts(filter);
  }
}
