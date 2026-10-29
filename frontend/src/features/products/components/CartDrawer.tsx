import React from "react";
import { useTranslation } from "react-i18next";

import { AnimatePresence, m } from "framer-motion";

import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Trash2,
  X,
} from "@shared/icons";

import { type CartItem, useCartStore } from "../store/cart.store";

/**
 * Premium Cart Drawer
 *
 * A high-end sliding panel that manages the shopping cart items.
 * Uses Framer Motion for buttery-smooth transitions and glassmorphic UI.
 */
export const CartDrawer: React.FC = () => {
  const { t } = useTranslation("screens/products");
  const {
    items,
    isOpen,
    toggleDrawer,
    updateQuantity,
    removeItem,
    totalValue,
    itemCount,
  } = useCartStore();
  const cartItems = Object.values(items);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => toggleDrawer(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[var(--z-overlay)]"
          />

          {/* Drawer Panel */}
          <m.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-950 border-l border-slate-800 shadow-2xl z-[var(--z-modal)] flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="bg-sky-500/10 p-2 rounded-xl text-sky-400">
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">
                    {t("cart.title")}
                  </h2>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                    {t("cart.itemsSecured", { count: itemCount })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => toggleDrawer(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Cart Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center text-slate-700">
                    <ShoppingCart size={40} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-300">
                      {t("cart.emptyTitle")}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {t("cart.emptySubtitle")}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleDrawer(false)}
                    className="text-sky-500 font-bold hover:underline"
                  >
                    {t("cart.continueShopping")}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item: CartItem) => (
                    <m.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="group flex gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all"
                    >
                      <div className="w-20 h-20 bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-sm font-bold text-slate-100 truncate">
                            {item.title}
                          </h4>
                          <span className="text-sm font-black text-white">
                            ${item.price * item.quantity}
                          </span>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-8 text-center text-xs font-black text-white">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </m.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer / Summary */}
            {cartItems.length > 0 && (
              <div className="p-6 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{t("cart.subtotal")}</span>
                    <span className="text-slate-100 font-bold">
                      ${totalValue.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{t("cart.shipping")}</span>
                    <span className="text-emerald-400 font-bold uppercase text-[10px] tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded">
                      {t("cart.free")}
                    </span>
                  </div>
                  <div className="flex justify-between items-end pt-2 border-t border-slate-800">
                    <span className="text-lg font-bold text-white tracking-tight">
                      {t("cart.total")}
                    </span>
                    <span className="text-2xl font-black text-white">
                      ${totalValue.toFixed(2)}
                    </span>
                  </div>
                </div>

                <button className="w-full bg-sky-600 hover:bg-sky-500 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-sky-600/30 group">
                  {t("cart.secureCheckout")}
                  <ArrowRight
                    size={18}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>
                <div className="flex items-center justify-center gap-2 text-[10px] text-slate-600 font-bold uppercase tracking-tight">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  {t("cart.sslSecured")}
                </div>
              </div>
            )}
          </m.aside>
        </>
      )}
    </AnimatePresence>
  );
};
