/**
 * Wishlist Module: Zustand State Store
 */

import { create } from "zustand";
import type { ProductListItemModel } from "../products/application/read-models/product-list-item.model";

export interface WishlistState {
  items: ProductListItemModel[];
  addItem: (item: ProductListItemModel) => void;
  removeItem: (id: string) => void;
  toggleItem: (item: ProductListItemModel) => void;
  isWishlisted: (id: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],

  addItem: (item) => {
    if (!get().isWishlisted(item.id)) {
      set({ items: [...get().items, item] });
    }
  },

  removeItem: (id) => {
    set({ items: get().items.filter((i) => i.id !== id) });
  },

  toggleItem: (item) => {
    if (get().isWishlisted(item.id)) {
      get().removeItem(item.id);
    } else {
      get().addItem(item);
    }
  },

  isWishlisted: (id) => {
    return get().items.some((i) => i.id === id);
  },

  clear: () => set({ items: [] }),
}));
