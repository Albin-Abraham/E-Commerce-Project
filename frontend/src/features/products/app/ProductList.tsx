import React from "react";
import { useTranslation } from "react-i18next";

import { AnimatePresence, m } from "framer-motion";

import { type Product } from "@features/products/services/product.repository";

import { Plus, RefreshCw, Star } from "@shared/icons";
import { Zenith } from "@shared/theme";

import { useProducts } from "@hooks/products/useProducts";

import { CartDrawer } from "../components/CartDrawer";
import { useCartStore } from "../store/cart.store";

/**
 * Product List Component
 *
 * A high-performance, premium product grid that demonstrates
 * the automated API state management and federated cart integration.
 */
export const ProductList: React.FC = () => {
  const { t } = useTranslation("screens/products");
  const { products, isLoading, error, total, execute } = useProducts(12);
  const addItem = useCartStore((state) => state.addItem);
  const toggleCart = useCartStore((state) => state.toggleDrawer);

  if (isLoading && products.length === 0) {
    const loader = Zenith.loading(t("marketplace.syncing"));
    return (
      <div {...loader.containerProps}>
        <div {...loader.spinnerProps} />
        <p {...loader.textProps} />
      </div>
    );
  }

  if (error) {
    const errorState = Zenith.error(
      t("marketplace.connectionFailure"),
      error.message ||
        t("marketplace.connectionError"),
      () => execute()
    );
    return (
      <div {...errorState.containerProps}>
        <div {...errorState.iconProps}>⚠️</div>
        <h3 {...errorState.titleProps} />
        <p {...errorState.messageProps} />
        {errorState.actionProps && <button {...errorState.actionProps} />}
      </div>
    );
  }

  return (
    <div className={Zenith.patterns.motion.entrance}>
      <header className={Zenith.layout.header}>
        <div>
          <h2
            className={
              Zenith.text("h1", true) +
              " flex items-center gap-[var(--space-3)]"
            }
          >
            <span className="w-[var(--space-2)] h-[var(--space-8)] bg-primary rounded-full" />
            {t("marketplace.title")}
          </h2>
          <p
            className={
              Zenith.patterns.typography.caption + " ml-[var(--space-5)]"
            }
          >
            {t("marketplace.discovering", { total })}
          </p>
        </div>
        <div className="flex gap-[var(--space-4)]">
          <button
            onClick={() => execute()}
            className={
              Zenith.button("outline") +
              " rounded-full px-[var(--space-6)] group"
            }
          >
            <RefreshCw
              size={16}
              className="mr-[var(--space-2)] group-hover:rotate-180 transition-transform duration-[var(--motion-slow)]"
            />
            {t("marketplace.syncFeed")}
          </button>
        </div>
      </header>

      <div
        className={
          Zenith.grid({ base: 1, md: 2, lg: 3, xl: 4 }).className +
          " mt-[var(--space-10)]"
        }
      >
        <AnimatePresence mode="popLayout">
          {products.map((product: Product, index: number) => (
            <m.article
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              {...Zenith.card({
                variant: "glass",
                hover: true,
                interactive: true,
                id: `product-${product.id}`,
              })}
              className={
                Zenith.card({
                  variant: "glass",
                  hover: true,
                  interactive: true,
                }).className + " flex flex-col"
              }
            >
              <div className={Zenith.layout.media}>
                <img
                  src={product.thumbnail}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[var(--motion-slow)]"
                />
                <div className="absolute top-[var(--space-3)] right-[var(--space-3)] bg-surface/60 backdrop-blur-md px-[var(--space-2)] py-[var(--space-1)] rounded-[var(--radius-sm)] text-[10px] font-[var(--font-black)] text-primary uppercase tracking-[var(--tracking-widest)] border border-primary/20 shadow-xl">
                  {product.category}
                </div>
              </div>

              <div className="p-[var(--space-5)] flex-1 flex flex-col">
                <div className="flex justify-between items-start gap-[var(--space-4)] mb-[var(--space-2)]">
                  <h3
                    className={
                      Zenith.text("h3") +
                      " group-hover:text-primary transition-colors line-clamp-1"
                    }
                  >
                    {product.title}
                  </h3>
                  <div className="flex flex-col items-end">
                    <span className="text-[var(--text-xl)] font-[var(--font-black)] text-foreground">
                      ${product.price}
                    </span>
                    <span
                      className={
                        Zenith.patterns.typography.caption + " text-[8px]"
                      }
                    >
                      {t("marketplace.taxInc")}
                    </span>
                  </div>
                </div>

                <p
                  className={
                    Zenith.text("body") +
                    " opacity-60 line-clamp-2 mb-[var(--space-6)] flex-1"
                  }
                >
                  {product.description}
                </p>

                <div className="flex items-center justify-between gap-[var(--space-3)] pt-[var(--space-4)] border-t border-[var(--color-border)] mt-auto">
                  <div className="flex items-center gap-[var(--space-1-5)] px-[var(--space-2)] py-[var(--space-1)] bg-background/50 rounded-[var(--radius-md)] border border-border/10">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <span className="text-foreground text-xs font-[var(--font-bold)]">
                      {product.rating}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      addItem(product);
                      toggleCart(true);
                    }}
                    className={
                      Zenith.button("primary") + " flex-1 py-[var(--space-3)]"
                    }
                  >
                    <Plus size={14} className="mr-[var(--space-2)]" />
                    {t("marketplace.addToCart")}
                  </button>
                </div>
              </div>
            </m.article>
          ))}
        </AnimatePresence>
      </div>
      <CartDrawer />
    </div>
  );
};
