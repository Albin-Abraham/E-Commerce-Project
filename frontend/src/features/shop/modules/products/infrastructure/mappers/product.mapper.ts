/**
 * Product Infrastructure: DTO Mappers
 *
 * Maps Django REST Framework Product responses to CQRS Read Models and Domain Aggregates.
 */

import { Money } from "../../domain/value-objects/money.vo";
import { SKU } from "../../domain/value-objects/sku.vo";
import { StockLevel } from "../../domain/value-objects/stock-level.vo";
import { ProductStatus } from "../../domain/value-objects/product-status.vo";
import { ProductVariantEntity } from "../../domain/entities/product-variant.entity";
import { ProductAggregate } from "../../domain/aggregates/product.aggregate";
import type { ProductListItemModel } from "../../application/read-models/product-list-item.model";
import type { ProductDetailModel } from "../../application/read-models/product-detail.model";
import type { ProductVariantModel } from "../../application/read-models/product-variant.model";

export class ProductMapper {
  public static toListItem(dto: Record<string, unknown>): ProductListItemModel {
    const id = String(dto.id);
    const title = String(dto.title ?? dto.name ?? "Untitled Product");
    const slug = String(dto.slug ?? id);
    const brandName = (dto.brand_name ?? dto.brand ?? undefined) as string | undefined;
    const categoryName = (dto.category_name ?? dto.category ?? undefined) as string | undefined;

    const priceNum = Number(dto.price ?? 0);
    const compareAtNum = dto.compare_at_price ? Number(dto.compare_at_price) : undefined;
    const currency = String(dto.currency ?? "USD");

    const money = new Money(priceNum, currency);
    const compareMoney = compareAtNum ? new Money(compareAtNum, currency) : undefined;

    const savings = compareMoney ? money.calculateSavings(compareMoney) : undefined;

    const stockQty = Number(dto.stock ?? dto.available_quantity ?? 10);
    const stock = new StockLevel(stockQty);

    const primaryImageUrl =
      (dto.primary_image ?? dto.thumbnail ?? dto.image_url ?? "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80") as string;
    const hoverImageUrl = (dto.hover_image ?? undefined) as string | undefined;

    const badges: ProductListItemModel["badges"] = [];
    if (savings && savings.discountPercent > 0) {
      badges.push({ label: `-${savings.discountPercent}%`, tone: "sale" });
    }
    if (Boolean(dto.is_new)) {
      badges.push({ label: "NEW", tone: "new" });
    }
    if (Boolean(dto.is_bestseller)) {
      badges.push({ label: "BESTSELLER", tone: "bestseller" });
    }

    return {
      id,
      title,
      slug,
      brandName,
      categoryName,
      primaryImageUrl,
      hoverImageUrl,
      currentPrice: {
        amount: money.amount,
        currency: money.currency,
        formatted: money.format(),
      },
      originalPrice: compareMoney
        ? {
            amount: compareMoney.amount,
            currency: compareMoney.currency,
            formatted: compareMoney.format(),
          }
        : undefined,
      discountPercent: savings?.discountPercent,
      savingsFormatted: savings?.savingsAmount ? savings.savingsAmount.format() : undefined,
      rating: {
        average: Number(dto.rating ?? dto.average_rating ?? 4.8),
        count: Number(dto.review_count ?? dto.reviews_count ?? 128),
      },
      stockStatus: stock.state,
      stockQuantity: stock.quantity,
      badges,
      isWishlisted: Boolean(dto.is_wishlisted),
      hasVariants: Array.isArray(dto.variants) && dto.variants.length > 0,
      bopisEligible: Boolean(dto.bopis_eligible ?? true),
    };
  }

  public static toDetailModel(dto: Record<string, unknown>): ProductDetailModel {
    const base = this.toListItem(dto);

    const gallery: ProductDetailModel["gallery"] = Array.isArray(dto.images)
      ? dto.images.map((img: Record<string, unknown>, idx: number) => ({
          id: String(img.id ?? idx),
          url: String(img.url ?? img.image ?? base.primaryImageUrl),
          altText: String(img.alt_text ?? base.title),
          isPrimary: idx === 0,
        }))
      : [
          {
            id: "img-main",
            url: base.primaryImageUrl,
            altText: base.title,
            isPrimary: true,
          },
        ];

    const variants: ProductVariantModel[] = Array.isArray(dto.variants)
      ? dto.variants.map((v: Record<string, unknown>) => {
          const vPrice = new Money(Number(v.price ?? base.currentPrice.amount));
          const vCompare = v.compare_at_price
            ? new Money(Number(v.compare_at_price))
            : undefined;
          const vStock = Number(v.stock ?? v.available_quantity ?? 10);

          return {
            id: String(v.id),
            sku: String(v.sku ?? `SKU-${v.id}`),
            name: String(v.name ?? v.title ?? "Variant"),
            priceAmount: vPrice.amount,
            priceFormatted: vPrice.format(),
            compareAtPriceAmount: vCompare?.amount,
            compareAtPriceFormatted: vCompare?.format(),
            inStock: vStock > 0,
            stockQuantity: vStock,
            attributes: (v.attributes ?? {}) as Record<string, string>,
            imageUrl: typeof v.image_url === "string" ? v.image_url : undefined,
          };
        })
      : [];

    const specifications: Record<string, string> =
      (dto.specifications as Record<string, string>) || {
        "Brand": base.brandName || "Zenith Premium",
        "Category": base.categoryName || "General Goods",
        "Warranty": "2 Years International Manufacturer Warranty",
        "Shipping": "Free Standard Delivery on orders over $50",
      };

    return {
      ...base,
      sku: String(dto.sku ?? `SKU-${base.id}`),
      description: String(
        dto.description ??
          "Engineered with premium enterprise components, precision aesthetics, and full industrial warranty."
      ),
      gallery,
      variants,
      specifications,
      bopisAvailable: true,
      bopisBranchName: "Tokyo Flagship Store",
      bopisPickupWindow: "Ready in 2 hours",
      estimatedDeliveryDays: 2,
    };
  }

  public static toAggregate(dto: Record<string, unknown>): ProductAggregate {
    const id = String(dto.id);
    const sku = new SKU(String(dto.sku ?? `SKU-${id}`));
    const title = String(dto.title ?? dto.name ?? "Untitled");
    const slug = String(dto.slug ?? id);
    const description = String(dto.description ?? "");
    const brandName = (dto.brand_name ?? dto.brand ?? undefined) as string | undefined;
    const categoryName = (dto.category_name ?? dto.category ?? undefined) as string | undefined;

    const price = new Money(Number(dto.price ?? 0), String(dto.currency ?? "USD"));
    const compareAtPrice = dto.compare_at_price
      ? new Money(Number(dto.compare_at_price), String(dto.currency ?? "USD"))
      : undefined;

    const stock = new StockLevel(Number(dto.stock ?? dto.available_quantity ?? 0));
    const status = new ProductStatus((dto.status as any) ?? "ACTIVE");

    const images = Array.isArray(dto.images)
      ? dto.images.map((img: Record<string, unknown>, idx: number) => ({
          id: String(img.id ?? idx),
          url: String(img.url ?? img.image ?? ""),
          altText: String(img.alt_text ?? title),
          isPrimary: idx === 0,
        }))
      : [];

    const variants = Array.isArray(dto.variants)
      ? dto.variants.map(
          (v: Record<string, unknown>) =>
            new ProductVariantEntity({
              id: String(v.id),
              sku: new SKU(String(v.sku ?? `SKU-VAR-${v.id}`)),
              name: String(v.name ?? "Variant"),
              price: new Money(Number(v.price ?? price.amount)),
              compareAtPrice: v.compare_at_price ? new Money(Number(v.compare_at_price)) : undefined,
              stock: new StockLevel(Number(v.stock ?? 10)),
              barcode: typeof v.barcode === "string" ? v.barcode : undefined,
              attributes: [],
            })
        )
      : [];

    return new ProductAggregate({
      id,
      sku,
      title,
      slug,
      description,
      brandName,
      categoryName,
      price,
      compareAtPrice,
      stock,
      status,
      images,
      variants,
      tags: Array.isArray(dto.tags) ? (dto.tags as string[]) : [],
    });
  }
}
