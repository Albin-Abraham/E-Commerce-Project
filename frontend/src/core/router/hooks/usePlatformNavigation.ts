import { useCallback, useMemo } from "react";
import {
  useLocation,
  useNavigate,
  useNavigation,
  useParams,
} from "react-router-dom";

import { AppPaths } from "@shell/paths";

import { PlatformUrlAdapters } from "../adapters/PlatformUrlAdapters";
import type { PlatformUrlPort } from "../ports/PlatformUrlPort";
import type { RouteNavigationPort } from "../ports/RouteNavigationPort";
import { parseQuery } from "../utils/url-serializer";
import { useRouteNavigation } from "./useRouteNavigation";

/**
 * usePlatformNavigation
 *
 * Industrial-grade navigation hook providing a unified, type-safe API
 * for managing route state, transitions, and URL query port integration.
 * Internal destinations prefer stable routeIds via the RouteNavigationPort;
 * raw-path navigation (goTo) remains available for dynamic/external targets.
 */
export const usePlatformNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  let navigation: any = { state: "idle", location: undefined };
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    navigation = useNavigation();
  } catch {
    // Fallback for non-DataRouter contexts (e.g. basic MemoryRouter in tests)
  }
  const routeNav: RouteNavigationPort = useRouteNavigation();

  // Connect universal URL port to current route context
  const urlPort = PlatformUrlAdapters.useReactRouter();
  const query = useMemo(() => parseQuery(location.search), [location.search]);

  const goTo = useCallback(
    (
      path: string | number,
      options?: { replace?: boolean; state?: any; target?: "_blank" | "_self" }
    ) => {
      if (typeof path === "number") {
        navigate(path);
        return;
      }

      if (options?.target === "_blank") {
        window.open(path, "_blank", "noopener,noreferrer");
        return;
      }

      navigate(path, options);
    },
    [navigate]
  );

  const isActive = useCallback(
    (path: string, exact = false) => {
      if (exact) {
        return location.pathname === path;
      }
      return location.pathname.startsWith(path);
    },
    [location.pathname]
  );

  const helpers = useMemo(
    () => ({
      goHome: () => {
        if (!routeNav.navigateToRoute("root")) navigate(AppPaths.Root);
      },
      goBack: () => navigate(-1),
      openProducts: () => {
        if (!routeNav.navigateToRoute("products.list"))
          navigate(AppPaths.Products.List);
      },
      openAnalytics: () => {
        if (!routeNav.navigateToRoute("products.analytics"))
          navigate(AppPaths.Products.Analytics);
      },
      openBuilder: () => {
        if (!routeNav.navigateToRoute("builder")) navigate(AppPaths.Builder);
      },
    }),
    [navigate, routeNav]
  );

  /**
   * getLinkProps
   * Returns accessible data and aria attributes to turn any element
   * into a delegated navigation target with dynamic state.
   */
  const getLinkProps = useCallback(
    (
      path: string,
      options?: { target?: "_blank" | "_self"; label?: string; exact?: boolean }
    ) => {
      const active = isActive(path, options?.exact);
      const pending = navigation.location?.pathname === path;

      return {
        "data-delegated-action": "navigate",
        "data-path": path,
        "data-target": options?.target || "_self",
        "data-state": pending ? "pending" : active ? "active" : "idle",
        role: "link",
        tabIndex: 0,
        "aria-label": options?.label,
        "aria-current": active ? ("page" as const) : undefined,
        "aria-busy": pending ? true : undefined,
      };
    },
    [isActive, navigation.location?.pathname]
  );

  return {
    goTo,
    isActive,
    location,
    params,
    navigation,
    url: urlPort,
    /** RouteId-based navigation port (navigateToRoute / resolveRoutePath). */
    routes: routeNav,
    query,
    isPending: navigation.state === "loading",
    state: {
      isNavigatingTo: navigation.location?.pathname || null,
      currentPath: location.pathname,
    },
    getLinkProps,
    ...helpers,
  };
};

/**
 * usePlatformUrlParams
 *
 * Specialized hook for managing platform-level query parameters.
 * Backed by universal PlatformUrlPort and `qs` for non-destructive, RFC-compliant updates.
 */
export const usePlatformUrlParams = (
  options: { scope?: string; isGlobal?: boolean; debounceMs?: number } = {}
) => {
  const { scope: manualScope, isGlobal = false, debounceMs = 300 } = options;

  const port: PlatformUrlPort = PlatformUrlAdapters.useReactRouter({
    scope: manualScope,
    isGlobal,
    debounceMs,
  });

  const searchParams = port.snapshot();
  const search = port.get("search") || "";
  const scope = port.scope || "";
  const parsed = useMemo(() => parseQuery(searchParams), [searchParams]);

  const setParam = useCallback(
    (key: string, value: string | null, immediate = false) => {
      port.set({ [key]: value }, { immediate });
    },
    [port]
  );

  return {
    search,
    scope,
    port,
    parsed,
    setSearch: (value: string | null, immediate = false) =>
      setParam("search", value, immediate),
    setTab: (value: string | null, immediate = true) =>
      setParam("tab", value, immediate),
    setQuery: (value: string | null, immediate = false) =>
      setParam("query", value, immediate),
    getParam: (key: string) => port.get(key),
    setParam,
    searchParams,
    set: port.set,
    delete: port.delete,
  };
};
