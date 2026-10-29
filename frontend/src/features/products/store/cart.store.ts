import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Product } from "@features/products/services/product.repository";

/**
 * Cart Item Model
 * Extends Product with quantity tracking
 */
export interface CartItem extends Product {
  quantity: number;
}

/**
 * Cart State Definition
 */
export interface CartState {
  /** Map of product IDs to items for O(1) lookups */
  items: Record<string, CartItem>;
  /** Total item count (sum of all quantities) */
  itemCount: number;
  /** Total monetary value of the cart */
  totalValue: number;
  /** True if the cart drawer is open */
  isOpen: boolean;

  /** Actions */
  addItem: (product: Product) => void;
  removeItem: (productId: number | string) => void;
  updateQuantity: (productId: number | string, delta: number) => void;
  clearCart: () => void;
  toggleDrawer: (open?: boolean) => void;
}

/**
 * Shopping Cart Store
 *
 * An atomic store that manages the e-commerce cart state.
 * Uses localStorage persistence to ensure carts survive session changes.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: {},
      itemCount: 0,
      totalValue: 0,
      isOpen: false,

      addItem: (product) => {
        const { items } = get();
        const existing = items[product.id];

        const newItems = {
          ...items,
          [product.id]: existing
            ? { ...existing, quantity: existing.quantity + 1 }
            : { ...product, quantity: 1 },
        };

        const totalItems = (Object.values(newItems) as CartItem[]).reduce(
          (sum: number, item: CartItem) => sum + item.quantity,
          0
        );
        const totalValue = (Object.values(newItems) as CartItem[]).reduce(
          (sum: number, item: CartItem) => sum + item.price * item.quantity,
          0
        );

        set({ items: newItems, itemCount: totalItems, totalValue });
      },

      removeItem: (productId) => {
        const { items } = get();
        const { [String(productId)]: _, ...newItems } = items;

        const totalItems = (Object.values(newItems) as CartItem[]).reduce(
          (sum: number, item: CartItem) => sum + item.quantity,
          0
        );
        const totalValue = (Object.values(newItems) as CartItem[]).reduce(
          (sum: number, item: CartItem) => sum + item.price * item.quantity,
          0
        );

        set({ items: newItems, itemCount: totalItems, totalValue });
      },

      updateQuantity: (productId, delta) => {
        const { items } = get();
        const item = items[String(productId)];
        if (!item) return;

        const newQuantity = Math.max(0, item.quantity + delta);
        if (newQuantity === 0) {
          get().removeItem(productId);
          return;
        }

        const newItems = {
          ...items,
          [productId]: { ...item, quantity: newQuantity },
        };

        const totalItems = (Object.values(newItems) as CartItem[]).reduce(
          (sum: number, item: CartItem) => sum + item.quantity,
          0
        );
        const totalValue = (Object.values(newItems) as CartItem[]).reduce(
          (sum: number, item: CartItem) => sum + item.price * item.quantity,
          0
        );

        set({ items: newItems, itemCount: totalItems, totalValue });
      },

      clearCart: () => set({ items: {}, itemCount: 0, totalValue: 0 }),

      toggleDrawer: (open) =>
        set((state) => ({ isOpen: open !== undefined ? open : !state.isOpen })),
    }),
    {
      name: "zenith-cart-storage",
      partialize: (state) => ({
        items: state.items,
        itemCount: state.itemCount,
        totalValue: state.totalValue,
      }),
    }
  )
);
