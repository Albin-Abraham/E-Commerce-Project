import { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import { useRouterComposition } from "../composition/CompositionContext";
import type {
  NavigateToRouteOptions,
  RouteNavigationPort,
} from "../ports/RouteNavigationPort";
import { stringifyQuery } from "../utils/url-serializer";

/**
 * Substitutes :param placeholders in a route path pattern.
 * Returns null when any required param is missing.
 */
export function substituteParams(
  path: string,
  params?: Record<string, string>
): string | null {
  let missing = false;
  const result = path.replace(/:([A-Za-z0-9_]+)/g, (_match, key: string) => {
    const value = params?.[key];
    if (value == null || value === "") {
      missing = true;
      return `:${key}`;
    }
    return encodeURIComponent(value);
  });
  return missing ? null : result;
}

function toSearchString(
  search: NavigateToRouteOptions["search"]
): string | undefined {
  if (search == null) return undefined;
  if (typeof search === "string") {
    return search.startsWith("?") ? search.slice(1) : search || undefined;
  }
  const qs = stringifyQuery(search as Record<string, unknown>);
  return qs || undefined;
}

/**
 * useRouteNavigation
 *
 * React Router adapter for the RouteNavigationPort. Resolves stable routeIds
 * into concrete paths through the composed route index and navigates via
 * React Router — features depend on the port, never on React Router directly.
 */
export function useRouteNavigation(): RouteNavigationPort {
  const navigate = useNavigate();
  const { routeIndex } = useRouterComposition();

  const resolveRoutePath = useCallback(
    (routeId: string, params?: Record<string, string>): string | null => {
      const route = routeIndex.get(routeId);
      if (!route) {
        console.warn(
          `[RouteNavigation] Unknown routeId "${routeId}". ` +
            `Register the route before referencing it from navigation.`
        );
        return null;
      }
      if (!route.path) {
        console.warn(
          `[RouteNavigation] Route "${routeId}" has no path (index routes cannot be navigation destinations).`
        );
        return null;
      }
      const resolved = substituteParams(route.path, params);
      if (resolved == null) {
        console.warn(
          `[RouteNavigation] Missing params for route "${routeId}" (${route.path}).`
        );
      }
      return resolved;
    },
    [routeIndex]
  );

  const navigateToRoute = useCallback(
    (routeId: string, options?: NavigateToRouteOptions): boolean => {
      const pathname = resolveRoutePath(routeId, options?.params);
      if (pathname == null) return false;

      navigate(
        {
          pathname,
          search: toSearchString(options?.search),
        },
        { replace: options?.replace }
      );
      return true;
    },
    [navigate, resolveRoutePath]
  );

  return useMemo(
    () => ({ navigateToRoute, resolveRoutePath }),
    [navigateToRoute, resolveRoutePath]
  );
}
