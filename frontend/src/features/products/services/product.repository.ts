// domain/products/product.repository.ts
import { z } from "zod";

import type { HttpClient } from "@core/http/http.client.interface";
import type { BaseHTTPClientService } from "@services/http/core/http.client.service";

// 1. Domain Schemas
export const ProductSchema = z.object({
  id: z.number(),
  title: z.string(),
  price: z.number().optional().default(0),
  description: z.string().optional().default(""),
  category: z.string().optional().default("unknown"),
  brand: z.string().optional().default("unknown"),
  thumbnail: z.string().optional(),
  discountPercentage: z.number().optional().default(0),
  rating: z.number().optional().default(0),
  stock: z.number().optional().default(0),
});

export const ProductListSchema = z.object({
  products: z.array(ProductSchema),
  total: z.number(),
});

export type Product = z.infer<typeof ProductSchema>;

/**
 * Product Repository
 *
 * Authoritative data source for Product domain.
 * Handles API interaction and data integrity enforcement.
 */
export class ProductRepository {
  /**
   * Injected HTTP client, kept as the DI seam for the transport. The current
   * read paths call the upstream API directly, so this is not yet consumed
   * here — exposed publicly rather than left as an unused private field.
   */
  constructor(readonly http?: BaseHTTPClientService | HttpClient) {}
  /**
   * Fetches products with validation from dummyjson.com
   */
  async getProducts(
    limit: number = 20
  ): Promise<{ products: Product[]; total: number }> {
    const res = await fetch(`https://dummyjson.com/products?limit=${limit}`);
    if (!res.ok) throw new Error(`Failed to fetch dummyjson products: ${res.statusText}`);
    const json = await res.json();
    return ProductListSchema.parse(json);
  }

  /**
   * Fetches single product from dummyjson.com
   */
  async getProductById(id: number): Promise<Product> {
    const res = await fetch(`https://dummyjson.com/products/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch dummyjson product #${id}: ${res.statusText}`);
    const json = await res.json();
    return ProductSchema.parse(json);
  }
}
