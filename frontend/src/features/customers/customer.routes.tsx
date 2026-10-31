import React from "react";
import { defineRoute } from "@core/router/route.types";
import type { AppRoute } from "@core/router/route.types";
import { AppPaths } from "@shell/paths";

const CustomerProfilePage = React.lazy(
  () => import("@shell/pages/customer/CustomerProfilePage")
);
const CustomerOrdersPage = React.lazy(
  () => import("@shell/pages/customer/CustomerOrdersPage")
);
const CustomerWishlistPage = React.lazy(
  () => import("@shell/pages/customer/CustomerWishlistPage")
);

const CustomerSettingsPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <h1 className="text-2xl font-black text-foreground">Security & Account Settings</h1>
      <p className="text-sm text-muted">
        Configure two-factor authentication, enterprise access tokens, and notification preferences.
      </p>
    </div>
  );
};

/**
 * Encapsulated Customer Account & Self-Service Routes
 *
 * Separated cleanly from RouterProvider into its own domain feature module.
 */
export const customerRoutes: AppRoute[] = [
  defineRoute({
    id: "account.profile",
    path: AppPaths.Account.Profile,
    page: CustomerProfilePage,
    meta: {
      title: "Customer Profile & Addresses",
      description: "Manage commercial customer profile and multi-facility address book",
    },
  }),
  defineRoute({
    id: "account.orders",
    path: AppPaths.Account.Orders,
    page: CustomerOrdersPage,
    meta: {
      title: "Orders & Shipment Tracking",
      description: "Track shipment milestones and view enterprise order history",
    },
  }),
  defineRoute({
    id: "account.wishlist",
    path: AppPaths.Account.Wishlist,
    page: CustomerWishlistPage,
    meta: {
      title: "Saved Products & Wishlist",
      description: "Review saved items and trigger rapid reordering",
    },
  }),
  defineRoute({
    id: "account.settings",
    path: AppPaths.Account.Settings,
    page: CustomerSettingsPage,
    meta: {
      title: "Security & Account Settings",
      description: "Configure identity credentials and security preferences",
    },
  }),
];
