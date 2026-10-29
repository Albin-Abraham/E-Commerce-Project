/**
 * RouteNavigationPort
 *
 * Navigation contract decoupling features from React Router. Features depend
 * on this port for routeId-based destination resolution and navigation; the
 * React Router adapter implements it (see hooks/useRouteNavigation).
 */
export interface NavigateToRouteOptions {
  params?: Record<string, string>;
  search?: Record<string, unknown> | string;
  replace?: boolean;
}

export interface RouteNavigationPort {
  /**
   * Navigates to the route identified by routeId, substituting path params.
   * Returns false (and warns) when the routeId is unknown or required
   * params are missing.
   */
  navigateToRoute(routeId: string, options?: NavigateToRouteOptions): boolean;

  /**
   * Resolves the concrete pathname for a routeId (with params substituted).
   * Returns null when the routeId is unknown or required params are missing.
   */
  resolveRoutePath(
    routeId: string,
    params?: Record<string, string>
  ): string | null;
}
