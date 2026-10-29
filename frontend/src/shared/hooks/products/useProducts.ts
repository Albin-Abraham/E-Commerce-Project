// hooks/products/useProducts.ts
import { useMemo } from "react";
import { useEffect } from "react";

import { useQuery } from "@tanstack/react-query";

import { LoaderFactory } from "@services/helpers/loading-factory";
import { UIScope } from "@services/helpers/loading-ui.enum";

import { ProductQuery } from "@features/products/services/product.query";

import { useHttp } from "@hooks/useHttp";

/**
 * 3-Tier Product Hook
 *
 * Pattern: Hook (Orchestration) -> Query (Configuration) -> Repository (Data)
 */
export const useProducts = (limit: number = 20) => {
  const { public: http } = useHttp();

  // 1. Initialize Query Object
  const productQuery = useMemo(() => ProductQuery(http), [http]);

  // 2. Consume via TanStack
  const query = useQuery(productQuery.list(limit));

  // 3. Optional: Industrial Loading Context Integration
  // This keeps the Zenith global loading bars in sync with the query
  useEffect(() => {
    const loader = LoaderFactory.create("PRODUCTS_LIST", UIScope.Page);
    if (query.isLoading) loader.start();
    if (query.isSuccess) loader.success();
    if (query.isError) loader.error((query.error as any)?.message);
  }, [query.isLoading, query.isSuccess, query.isError, query.error]);

  return {
    products: query.data?.products ?? [],
    total: query.data?.total ?? 0,
    execute: query.refetch,
    ...query,
  };
};
