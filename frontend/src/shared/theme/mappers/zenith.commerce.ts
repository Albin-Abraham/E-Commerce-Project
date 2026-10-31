/**
 * Zenith Theme: Commerce Helper Mapper
 *
 * Provides typed CSS classes and style mappings for pricing, stock urgency,
 * product badges, and layout primitives.
 */

export const ZenithCommerce = {
  price: {
    hero: "price-hero tabular-nums font-bold",
    card: "price-card tabular-nums font-semibold",
    strike: "price-strike tabular-nums",
    savings: "savings-pill tabular-nums",
  },
  stock: {
    inStock: "stock-pill stock-pill-in",
    lowStock: "stock-pill stock-pill-low",
    outOfStock: "stock-pill stock-pill-out",
  },
  badge: {
    sale: "badge-commerce badge-sale",
    new: "badge-commerce badge-new",
    bestseller: "badge-commerce badge-bestseller",
    bopis: "badge-commerce badge-bopis",
  },
  card: {
    container: "group relative bg-surface border border-border rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:border-primary/40 flex flex-col justify-between overflow-hidden",
    imageWrapper: "relative w-full aspect-product-card overflow-hidden rounded-lg bg-surface-muted mb-3 flex items-center justify-center",
    image: "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
    title: "font-semibold text-foreground text-sm line-clamp-2 min-h-[2.5rem] group-hover:text-primary transition-colors",
    ratingRow: "flex items-center gap-1.5 my-2 text-xs text-muted",
    priceRow: "flex items-baseline gap-2 mt-auto pt-2",
  },
};

export type IZenithCommerce = typeof ZenithCommerce;
