import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { PlatformCommand } from "@core/events/config/shortcuts";
import { defineRoute } from "@core/router/route.types";
import type { AppRoute } from "@core/router/route.types";
import PageLayout from "@shell/layouts/PageLayout";
import { AppPaths } from "@shell/paths";
import { Download } from "lucide-react";

import { Zenith } from "@shared/theme";

// Import local UI components
import { ProductNav, ProductStatus } from "./components/product.ui";
import { ProductRepository } from "./services/product.repository";
import { ListSkeleton } from "../../core/ui/skeletons/ListSkeleton";
const ProductList = React.lazy(() => import("@pages/products/product.list"));
const ProductDetail = React.lazy(
  () => import("@pages/products/product.detail")
);
const AnalyticsPage = React.lazy(
  () => import("@pages/products/product.analytics")
);

const ProductPolicyLink: React.FC = () => {
  const { t } = useTranslation("screens/products");
  return (
    <Link
      to="#"
      className="nav-zenith text-[10px] uppercase tracking-widest font-black text-primary"
    >
      {t("marketplace.productPolicy")}
    </Link>
  );
};

const AnalyticsHeaderAction: React.FC = () => {
  const { t } = useTranslation("screens/products");
  return (
    <button className={Zenith.button("outline") + " !h-10 px-4"}>
      <Download className="w-4 h-4 mr-2" /> {t("catalog.exportPdf")}
    </button>
  );
};

const InventoryPage: React.FC = () => {
  const { t } = useTranslation("screens/products");
  return (
    <div {...Zenith.section("inventory-view")}>
      <h1 className={Zenith.text("h2")}>{t("inventory.title")}</h1>
      <button className={Zenith.button("primary")}>
        {t("inventory.initializeAudit")}
      </button>
    </div>
  );
};

/**
 * Encapsulated Product Module Routes
 */
export const productRoutes: AppRoute[] = [
  defineRoute({
    id: "products.list",
    path: AppPaths.Products.List,
    page: ProductList,
    loader: async (ctx) => {
      const repository = new ProductRepository(ctx.services.public as any);
      const { products } = await repository.getProducts(12);
      return products;
    },
    skeleton: <ListSkeleton rows={8} />, // route‑level loading placeholder
    shortcuts: [
      {
        key: "alt+r",
        command: PlatformCommand.FocusSearch,
        description: "Reload Products",
      },
    ],
    slots: [
      { name: "sidebar-nav", component: ProductNav, priority: 100 },
      { name: "header-actions", component: ProductStatus, priority: 50 },
      {
        name: "footer-links",
        component: ProductPolicyLink,
        priority: 20,
      },
    ],
    meta: {
      title: "Our Products",
      description: "Browse the Zenith product catalog",
    },
  }),
  defineRoute({
    id: "products.detail",
    path: AppPaths.Products.Detail,
    page: ProductDetail,
    meta: {
      title: "Product Specifications",
    },
    slots: [{ name: "sidebar-nav", component: ProductNav, priority: 100 }],
  }),
  defineRoute({
    id: "products.analytics",
    path: AppPaths.Products.Analytics,
    page: AnalyticsPage,
    layout: PageLayout,
    meta: {
      title: "Analytics Intelligence",
      description:
        "Real-time market insights and product performance metrics across all regions.",
    },
    slots: [
      {
        name: "header-actions",
        priority: 200,
        component: AnalyticsHeaderAction,
      },
    ],
  }),
  {
    id: "products.inventory",
    path: AppPaths.Products.Inventory,
    page: InventoryPage,
  },
];
