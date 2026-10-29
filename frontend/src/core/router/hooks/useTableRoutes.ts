import { useCallback, useMemo } from "react";

import type { NavigateToRouteOptions } from "../ports/RouteNavigationPort";
import { tableRouteBindingRegistry } from "../registries/table-route-binding.registry";
import type { TableRouteBinding } from "../route.types";
import { useRouteNavigation } from "./useRouteNavigation";

/**
 * Resolved table destinations — a binding with all routeIds resolved into
 * concrete paths/hrefs through the routing infrastructure.
 */
export interface ResolvedTableRoutes {
  binding: TableRouteBinding | null;
  listHref: string | null;
  createHref: string | null;
  detailsHref: (params?: Record<string, string>) => string | null;
  editHref: (params?: Record<string, string>) => string | null;

  navigateToList: (options?: NavigateToRouteOptions) => boolean;
  navigateToDetails: (
    params: Record<string, string>,
    options?: NavigateToRouteOptions
  ) => boolean;
  navigateToCreate: (options?: NavigateToRouteOptions) => boolean;
  navigateToEdit: (
    params: Record<string, string>,
    options?: NavigateToRouteOptions
  ) => boolean;
}

/**
 * useTableRoutes
 *
 * Resolves a registered TableRouteBinding into concrete destinations via the
 * RouteNavigationPort. Tables and feature pages depend on this hook for
 * row/detail/create/edit navigation instead of hardcoding paths.
 */
export function useTableRoutes(tableId: string): ResolvedTableRoutes {
  const routeNav = useRouteNavigation();
  const binding = tableRouteBindingRegistry.getBinding(tableId) ?? null;

  const listHref = useMemo(
    () =>
      binding?.listRouteId
        ? routeNav.resolveRoutePath(binding.listRouteId)
        : null,
    [binding, routeNav]
  );

  const createHref = useMemo(
    () =>
      binding?.createRouteId
        ? routeNav.resolveRoutePath(binding.createRouteId)
        : null,
    [binding, routeNav]
  );

  const detailsHref = useCallback(
    (params?: Record<string, string>) =>
      binding?.detailsRouteId
        ? routeNav.resolveRoutePath(binding.detailsRouteId, params)
        : null,
    [binding, routeNav]
  );

  const editHref = useCallback(
    (params?: Record<string, string>) =>
      binding?.editRouteId
        ? routeNav.resolveRoutePath(binding.editRouteId, params)
        : null,
    [binding, routeNav]
  );

  const navigateToList = useCallback(
    (options?: NavigateToRouteOptions) =>
      binding?.listRouteId
        ? routeNav.navigateToRoute(binding.listRouteId, options)
        : false,
    [binding, routeNav]
  );

  const navigateToDetails = useCallback(
    (params: Record<string, string>, options?: NavigateToRouteOptions) =>
      binding?.detailsRouteId
        ? routeNav.navigateToRoute(binding.detailsRouteId, {
            ...options,
            params,
          })
        : false,
    [binding, routeNav]
  );

  const navigateToCreate = useCallback(
    (options?: NavigateToRouteOptions) =>
      binding?.createRouteId
        ? routeNav.navigateToRoute(binding.createRouteId, options)
        : false,
    [binding, routeNav]
  );

  const navigateToEdit = useCallback(
    (params: Record<string, string>, options?: NavigateToRouteOptions) =>
      binding?.editRouteId
        ? routeNav.navigateToRoute(binding.editRouteId, { ...options, params })
        : false,
    [binding, routeNav]
  );

  return useMemo(
    () => ({
      binding,
      listHref,
      createHref,
      detailsHref,
      editHref,
      navigateToList,
      navigateToDetails,
      navigateToCreate,
      navigateToEdit,
    }),
    [
      binding,
      listHref,
      createHref,
      detailsHref,
      editHref,
      navigateToList,
      navigateToDetails,
      navigateToCreate,
      navigateToEdit,
    ]
  );
}
