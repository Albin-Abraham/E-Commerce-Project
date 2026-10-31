import { defineModule } from "@core/router/route.types";
import { customerRoutes } from "./customer.routes";

/**
 * Customers Feature Module
 *
 * Contributes customer profile, order history, and wishlist routes through the
 * core module contract, fully decoupled from shell RouterProvider.
 */
export const customersModule = defineModule({
  id: "customers",
  label: "Customer Account",
  routes: customerRoutes,
  navigation: [
    {
      id: "nav.account.profile",
      label: "Account Profile",
      routeId: "account.profile",
      group: "account",
      order: 10,
    },
    {
      id: "nav.account.orders",
      label: "Order History",
      routeId: "account.orders",
      group: "account",
      order: 20,
    },
    {
      id: "nav.account.wishlist",
      label: "Wishlist",
      routeId: "account.wishlist",
      group: "account",
      order: 30,
    },
    {
      id: "nav.account.settings",
      label: "Account Settings",
      routeId: "account.settings",
      group: "account",
      order: 40,
    },
  ],
});
