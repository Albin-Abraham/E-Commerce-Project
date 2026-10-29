import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";

import { AppPaths } from "@shell/paths";
import { Activity, Box } from "lucide-react";

import { Zenith } from "@shared/theme";

import { Sidebar } from "@/shared/ui/navigation/sidebar/sidebar";

/**
 * Products Navigation Link
 */
export const ProductNav: React.FC = () => {
  const { t } = useTranslation("layouts/navigation");
  const location = useLocation();

  const isItemActive = (item: any) => location.pathname === item.href;
  const isParentActive = () => false;

  const items = [
    {
      id: "catalog",
      label: t("sidebar.productsCatalog"),
      href: AppPaths.Products.List,
      icon: Box,
    },
    {
      id: "analytics",
      label: t("sidebar.analytics"),
      href: AppPaths.Products.Analytics,
      icon: Activity,
    },
  ];

  return (
    <Sidebar.Menu
      items={items}
      isItemActive={isItemActive}
      isParentActive={isParentActive}
    />
  );
};

/**
 * Product Status Widget
 */
export const ProductStatus: React.FC = () => {
  const { t } = useTranslation("screens/products");

  return (
    <div
      className={
        Zenith.patterns.widgets.status +
        " bg-green-500/10 text-green-600 px-3 py-1 rounded-full border border-green-500/20 text-xs"
      }
    >
      <div
        className={
          Zenith.patterns.widgets.indicator + " bg-green-500 animate-pulse"
        }
      />
      <span>{t("inventory.liveInventory")}</span>
    </div>
  );
};
