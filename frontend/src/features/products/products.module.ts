import { defineModule } from "@core/router/route.types";

import { productRoutes } from "./product.routes";

/**
 * Products Feature Module
 *
 * Contributes product routes and navigation items through the standard
 * module contract. Navigation destinations reference stable routeIds; the
 * navigation layer resolves them into concrete paths.
 */
export const productsModule = defineModule({
  id: "products",
  label: "Products",
  routes: productRoutes,
  navigation: [
    {
      id: "nav.products.list",
      label: "All Products",
      routeId: "products.list",
      group: "catalog",
      order: 10,
    },
    {
      id: "nav.products.analytics",
      label: "Analytics",
      routeId: "products.analytics",
      parentId: "nav.products.list",
      group: "catalog",
      order: 20,
    },
    {
      id: "nav.products.inventory",
      label: "Inventory",
      routeId: "products.inventory",
      parentId: "nav.products.list",
      group: "catalog",
      order: 30,
    },
  ],
  tableBindings: [
    {
      tableId: "products-table",
      listRouteId: "products.list",
      detailsRouteId: "products.detail",
    },
  ],
});
