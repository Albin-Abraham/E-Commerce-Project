/**
 * Product Infrastructure: Django Product Repository
 *
 * Implements ProductRepositoryPort with explicit environment modes.
 */

import { apiClient } from "@platform/networking";
import { runtimeConfig } from "@platform/configuration";
import type {
  ProductRepositoryPort,
  ProductCatalogFilter,
  PaginatedProductsResult,
} from "../../application/ports/product-repository.port";
import type { ProductListItemModel } from "../../application/read-models/product-list-item.model";
import type { ProductDetailModel } from "../../application/read-models/product-detail.model";
import type { ProductAggregate } from "../../domain/aggregates/product.aggregate";
import { ProductMapper } from "../mappers/product.mapper";

const SEEDED_MOCK_PRODUCTS: Record<string, unknown>[] = [
  {
    id: "prod-macbook-pro",
    sku: "SKU-MBP-16-M3",
    title: "MacBook Pro 16-inch M3 Max",
    slug: "macbook-pro-16-m3-max",
    description: "The most advanced Mac laptop ever, engineered for grueling workflows with Liquid Retina XDR display.",
    brand_name: "Apple",
    category_name: "Laptops & Computing",
    price: 3499.0,
    compare_at_price: 3999.0,
    stock: 14,
    rating: 4.9,
    review_count: 248,
    is_new: true,
    is_bestseller: true,
    primary_image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80",
    hover_image: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80",
    images: [
      { id: "img-1", url: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80", isPrimary: true },
      { id: "img-2", url: "https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&q=80" },
    ],
    variants: [
      { id: "var-1", sku: "SKU-MBP-16-512", name: "Space Black / 36GB / 512GB", price: 3499.0, stock: 10, attributes: { Color: "Space Black", Memory: "36GB" } },
      { id: "var-2", sku: "SKU-MBP-16-1TB", name: "Silver / 48GB / 1TB", price: 3999.0, stock: 4, attributes: { Color: "Silver", Memory: "48GB" } },
    ],
    specifications: {
      Processor: "Apple M3 Max (16-core CPU, 40-core GPU)",
      Memory: "36GB / 48GB Unified Memory",
      Display: "16.2-inch Liquid Retina XDR (3456x2234)",
      Battery: "Up to 22 hours Apple TV app movie playback",
      Weight: "4.7 lbs (2.14 kg)",
    },
  },
  {
    id: "prod-sony-wh1000xm5",
    sku: "SKU-SONY-XM5",
    title: "Sony WH-1000XM5 Wireless Noise-Canceling Headphones",
    slug: "sony-wh-1000xm5-wireless-headphones",
    description: "Industry-leading noise cancellation with two processors and 8 microphones for unparalleled calls and sound.",
    brand_name: "Sony",
    category_name: "Audio & Headphones",
    price: 398.0,
    compare_at_price: 449.0,
    stock: 22,
    rating: 4.8,
    review_count: 512,
    is_new: false,
    is_bestseller: true,
    primary_image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
    hover_image: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80",
    images: [
      { id: "img-1", url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80", isPrimary: true },
      { id: "img-2", url: "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80" },
    ],
    variants: [
      { id: "var-1", sku: "SKU-SONY-BLK", name: "Black", price: 398.0, stock: 15, attributes: { Color: "Black" } },
      { id: "var-2", sku: "SKU-SONY-SLV", name: "Silver", price: 398.0, stock: 7, attributes: { Color: "Silver" } },
    ],
    specifications: {
      Type: "Over-Ear Wireless",
      BatteryLife: "Up to 30 hours with ANC on",
      NoiseCanceling: "Dual Processor V1 + HD QN1",
      Connectivity: "Bluetooth 5.2, Multipoint",
    },
  },
  {
    id: "prod-studio-display",
    sku: "SKU-APPLE-STUDIO",
    title: "Apple Studio Display 27-inch 5K Retina",
    slug: "apple-studio-display-27-5k",
    description: "Immersive 27-inch 5K Retina display with 12MP Ultra Wide camera with Center Stage, studio-quality mics.",
    brand_name: "Apple",
    category_name: "Displays & Monitors",
    price: 1599.0,
    stock: 3, // LOW STOCK
    rating: 4.7,
    review_count: 89,
    is_new: false,
    is_bestseller: false,
    primary_image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80",
    images: [
      { id: "img-1", url: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80", isPrimary: true },
    ],
    variants: [],
    specifications: {
      ScreenSize: "27-inch diagonal",
      Resolution: "5120x2880 at 218 ppi",
      Brightness: "600 nits",
      Audio: "Six-speaker sound system with Spatial Audio",
    },
  },
  {
    id: "prod-mechanical-keyboard",
    sku: "SKU-KEYCHRON-Q1",
    title: "Keychron Q1 Pro Custom Mechanical Keyboard",
    slug: "keychron-q1-pro-mechanical-keyboard",
    description: "Full CNC aluminum custom wireless mechanical keyboard with QMK/VIA support and double-gasket design.",
    brand_name: "Keychron",
    category_name: "Accessories & Peripherals",
    price: 199.0,
    compare_at_price: 229.0,
    stock: 0, // OUT OF STOCK
    rating: 4.8,
    review_count: 67,
    is_new: true,
    is_bestseller: false,
    primary_image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80",
    images: [
      { id: "img-1", url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80", isPrimary: true },
    ],
    variants: [],
    specifications: {
      Layout: "75% ANSI",
      Body: "Full Aluminum 6063 CNC",
      Switch: "Keychron K Pro Red / Brown / Banana",
      Connectivity: "Bluetooth 5.1 & Type-C Wired",
    },
  },
];

export class DjangoProductRepository implements ProductRepositoryPort {
  public async getProducts(filter?: ProductCatalogFilter): Promise<PaginatedProductsResult> {
    try {
      const response = await apiClient.get<Record<string, unknown> | Array<Record<string, unknown>>>(
        "/shop/products/",
        {
          search: filter?.search,
          category: filter?.category,
          brand: filter?.brand,
          ordering: filter?.sort,
          page: filter?.page,
          page_size: filter?.pageSize,
        },
        { isPublicStorefront: true }
      );

      // Handle standard DRF { count, results } or flat array
      const rawItems = Array.isArray(response)
        ? response
        : Array.isArray(response.results)
        ? (response.results as Record<string, unknown>[])
        : [];

      const total = Array.isArray(response) ? response.length : Number(response.count ?? rawItems.length);
      const items = rawItems.map((item) => ProductMapper.toListItem(item));

      return {
        items,
        total,
        page: filter?.page ?? 1,
        pageSize: filter?.pageSize ?? 20,
        totalPages: Math.ceil(total / (filter?.pageSize ?? 20)),
      };
    } catch (err) {
      if (runtimeConfig.isDevelopment() || runtimeConfig.isTest() || runtimeConfig.isStorybook()) {
        let filtered = [...SEEDED_MOCK_PRODUCTS];

        if (filter?.search) {
          const q = filter.search.toLowerCase();
          filtered = filtered.filter(
            (p) =>
              String(p.title).toLowerCase().includes(q) ||
              String(p.brand_name).toLowerCase().includes(q)
          );
        }

        if (filter?.category) {
          filtered = filtered.filter(
            (p) => String(p.category_name).toLowerCase() === filter.category?.toLowerCase()
          );
        }

        const items = filtered.map((p) => ProductMapper.toListItem(p));
        return {
          items,
          total: items.length,
          page: 1,
          pageSize: 20,
          totalPages: 1,
        };
      }

      throw err;
    }
  }

  public async getProductById(id: string): Promise<ProductDetailModel | null> {
    try {
      const response = await apiClient.get<Record<string, unknown>>(
        `/shop/products/${id}/`,
        undefined,
        { isPublicStorefront: true }
      );
      return ProductMapper.toDetailModel(response);
    } catch (err) {
      if (runtimeConfig.isDevelopment() || runtimeConfig.isTest() || runtimeConfig.isStorybook()) {
        const found =
          SEEDED_MOCK_PRODUCTS.find((p) => p.id === id || p.slug === id) ||
          SEEDED_MOCK_PRODUCTS[0];
        return ProductMapper.toDetailModel(found);
      }
      throw err;
    }
  }

  public async getProductAggregate(id: string): Promise<ProductAggregate | null> {
    try {
      const response = await apiClient.get<Record<string, unknown>>(`/shop/products/${id}/`);
      return ProductMapper.toAggregate(response);
    } catch (err) {
      if (runtimeConfig.isDevelopment() || runtimeConfig.isTest()) {
        const found =
          SEEDED_MOCK_PRODUCTS.find((p) => p.id === id || p.slug === id) ||
          SEEDED_MOCK_PRODUCTS[0];
        return ProductMapper.toAggregate(found);
      }
      throw err;
    }
  }
}

export const productRepository = new DjangoProductRepository();
