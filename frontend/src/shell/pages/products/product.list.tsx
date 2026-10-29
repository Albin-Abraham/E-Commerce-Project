import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAsyncValue, useLoaderData } from "react-router-dom";

import {
  usePlatformNavigation,
  usePlatformUrlParams,
} from "@core/router/hooks/usePlatformNavigation";
import { useTableRoutes } from "@core/router/hooks/useTableRoutes";
import { ProductCatalogPdfMapper } from "@features/products/services/product.pdf-mapper";
import { AppPaths } from "@shell/paths";
import { PdfDownloadButton, usePdfDownload } from "@ui/pdf";
import { motion } from "framer-motion";

import { Zenith } from "@shared/theme";

const pdfMapper = new ProductCatalogPdfMapper(10);

interface ProductsPageProps {
  loaderData?: any;
}

const ProductsPage: React.FC<ProductsPageProps> = ({ loaderData: propData }) => {
  const { t } = useTranslation("screens/products");
  const asyncValue = useAsyncValue();
  const rawLoaderData = useLoaderData() as any;

  // Resolve products array across all React Router deferred & sync loading modes
  const data = useMemo(() => {
    if (Array.isArray(propData)) return propData;
    if (Array.isArray(asyncValue)) return asyncValue;
    if (Array.isArray(rawLoaderData)) return rawLoaderData;
    if (rawLoaderData && Array.isArray(rawLoaderData.__deferredData)) return rawLoaderData.__deferredData;
    return [];
  }, [propData, asyncValue, rawLoaderData]);

  // 1. Enterprise Navigation Adapter (Provides isPending, getLinkProps, etc.)
  const { isPending, getLinkProps, goTo } = usePlatformNavigation();

  // Table-route binding: destinations resolved from stable routeIds with a
  // static-path fallback when the binding is not registered (e.g. tests).
  const tableRoutes = useTableRoutes("products-table");

  // 2. Debounced URL Params for Search (Prevents Layout Thrashing!)
  const { search, setSearch } = usePlatformUrlParams({ scope: "products" });

  // Simple local filter based on URL state
  const filteredData = useMemo(() => {
    if (!search || !Array.isArray(data)) return data;
    return data.filter((p) =>
      p.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  // 3. PDF Export Hook for Top 10 Products
  const { downloadFromDefinition, isGenerating } = usePdfDownload();

  const handleExportPdf = React.useCallback(async () => {
    const productsToExport = filteredData.length > 0 ? filteredData : data;
    const pdfDef = pdfMapper.map(productsToExport);
    await downloadFromDefinition(pdfDef);
  }, [filteredData, data, downloadFromDefinition]);

  return (
    // 3. Smooth Page Transitions
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      {...Zenith.container("products-list-page")}
      className={`py-[var(--space-12)] transition-opacity duration-300 ${isPending ? "opacity-50" : "opacity-100"}`}
    >
      <div className="flex flex-col md:flex-row justify-between items-center mb-[var(--space-12)] gap-4">
        <h1 className={Zenith.text("h1")}>{t("catalog.title")}</h1>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* 4. PDF Catalog Export Button (Top 10 Limit) */}
          <PdfDownloadButton
            onClick={handleExportPdf}
            loading={isGenerating}
            labels={{ download: t("catalog.exportPdf"), generating: t("catalog.generatingPdf") }}
            variant="outline"
          />

          {/* 5. The Debounced Search Input */}
          <input
            type="search"
            placeholder={t("catalog.searchPlaceholder")}
            defaultValue={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-border/30 rounded-lg p-2 bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>
      </div>

      {!Array.isArray(filteredData) || filteredData.length === 0 ? (
        <div {...Zenith.section("empty-state")} className="text-center py-12">
          <p className={Zenith.text("body")}>
            {search
              ? t("catalog.emptyState")
              : t("catalog.syncingState")}
          </p>
        </div>
      ) : (
        <div {...Zenith.grid({ base: 1, sm: 2, lg: 3, xl: 4 })}>
          {filteredData.map((p: any) => {
            const detailPath =
              tableRoutes.detailsHref({ id: String(p.id) }) ??
              AppPaths.Products.Detail.replace(":id", p.id);
            return (
              <div
                key={p.id}
                {...Zenith.card({
                  variant: "glass",
                  hover: true,
                  interactive: true,
                  id: `product-${p.id}`,
                })}
                // 5. Delegated Navigation Properties (Handles ARIA and Pending States)
                {...getLinkProps(detailPath)}
                onClick={() => goTo(detailPath)}
                className="flex flex-col h-full cursor-pointer"
              >
                <div className="flex-1">
                  <div
                    className="font-[var(--font-bold)] text-[var(--text-lg)] tracking-[var(--tracking-tight)] mb-[var(--space-2)] line-clamp-1"
                    title={p.title}
                  >
                    {p.title}
                  </div>
                  <div className="text-[var(--text-sm)] text-muted-foreground line-clamp-3 mb-[var(--space-4)]">
                    {p.description}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-[var(--space-6)] pt-[var(--space-4)] border-t border-border/10">
                  <div className="text-[var(--text-xl)] font-[var(--font-black)] text-primary">
                    ${p.price}
                  </div>
                  <div
                    className={
                      Zenith.button("ghost") +
                      " !px-2 !py-1 text-xs pointer-events-none"
                    }
                  >
                    {t("catalog.viewDetails")}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default ProductsPage;
