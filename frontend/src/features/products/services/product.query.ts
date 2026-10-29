// domain/products/product.query.ts
import { queryOptions } from "@tanstack/react-query";

import type { BaseHTTPClientService } from "@services/http/core/http.client.service";

import { ProductRepository } from "./product.repository";

/**
 * Product Query Factory
 *
 * Centralizes TanStack Query configurations for the Product domain.
 * This ensures consistent query keys and data fetching logic across the app.
 */
export const ProductQuery = (http: BaseHTTPClientService) => {
  const repository = new ProductRepository(http);

  return {
    /**
     * Get all products query configuration
     */
    list: (limit: number = 20) =>
      queryOptions({
        queryKey: ["products", "list", { limit }],
        queryFn: () => repository.getProducts(limit),
        staleTime: 5 * 60 * 1000, // 5 minutes
      }),

    /**
     * Get single product query configuration
     */
    detail: (id: number) =>
      queryOptions({
        queryKey: ["products", "detail", id],
        queryFn: () => repository.getProductById(id),
        staleTime: 10 * 60 * 1000, // 10 minutes
      }),
  };
};
