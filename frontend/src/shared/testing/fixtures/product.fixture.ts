import { ProductSchema, type Product } from "@features/products/services/product.repository";
import { createValidatedFixture } from "./fixture-factory";

const DEFAULT_PRODUCT: Product = {
  id: 101,
  title: "Zenith Pro Display",
  price: 799,
  stock: 25,
  category: "monitors",
  brand: "Zenith",
  description: "Ultra HD IPS Panel",
  rating: 4.8,
  discountPercentage: 0,
};

export const createProductFixture = createValidatedFixture<Product>(
  ProductSchema,
  DEFAULT_PRODUCT
);
