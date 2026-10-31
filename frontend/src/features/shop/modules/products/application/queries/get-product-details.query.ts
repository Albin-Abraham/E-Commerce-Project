/**
 * Product Application: Get Product Details Query Handler
 */

import type { ProductRepositoryPort } from "../ports/product-repository.port";
import type { ProductDetailModel } from "../read-models/product-detail.model";

export class GetProductDetailsQuery {
  constructor(private readonly repository: ProductRepositoryPort) {}

  public execute(id: string): Promise<ProductDetailModel | null> {
    return this.repository.getProductById(id);
  }
}
