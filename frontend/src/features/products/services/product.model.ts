// src/domain/products/product.model.ts

/**
 * Product Domain Entity
 *
 * Represents a product in the system. Following DDD-lite, this entity
 * enforces its own invariants and contains business logic related to products.
 */
export interface Product {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly price: number;
  readonly category?: string;
  readonly createdAt?: string;
  readonly updatedAt?: string;
}

/**
 * Value Object for Product ID
 * Simple example of a value object if we wanted to enforce ID format.
 */
export type ProductId = string;

/**
 * Domain Logic: Check if a product is expensive
 */
export const isPremiumProduct = (product: Product): boolean => {
  return product.price > 1000;
};

/**
 * Domain Logic: Validate product data
 * Ensures that domain rules are met regardless of the source of data.
 */
export const validateProduct = (data: Partial<Product>): string[] => {
  const errors: string[] = [];
  if (data.price !== undefined && data.price < 0) {
    errors.push("Product price cannot be negative");
  }
  if (data.name !== undefined && data.name.trim() === "") {
    errors.push("Product name cannot be empty");
  }
  return errors;
};
