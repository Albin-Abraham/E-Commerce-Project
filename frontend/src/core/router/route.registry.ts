import type { AppRoute } from "./route.types";

/**
 * IRouteRegistry
 *
 * Interface for the route registry to allow Dependency Inversion (DIP).
 * This enables injecting mock registries during testing.
 */
export interface IRouteRegistry {
  register(routes: AppRoute | AppRoute[]): void;
  getRoutes(): AppRoute[];
  reset(): void;
}

/**
 * RouteRegistryEngine
 *
 * Application-scoped store for feature-contributed route definitions.
 * Instantiated per application instance (see createRouterAppInstance);
 * the exported RouteRegistry is the default instance backing the CSR boot.
 */
export class RouteRegistryEngine implements IRouteRegistry {
  private registeredRoutes: AppRoute[] = [];

  /**
   * Clears all registered routes. Called before re-registration during HMR
   * to prevent duplicate route accumulation.
   */
  public reset(): void {
    this.registeredRoutes = [];
  }

  /**
   * Registers a route or array of routes dynamically.
   */
  public register(routes: AppRoute | AppRoute[]) {
    const list = Array.isArray(routes) ? routes : [routes];
    this.registeredRoutes.push(...list);
  }

  /**
   * Returns all currently registered dynamic feature routes.
   */
  public getRoutes(): AppRoute[] {
    return this.registeredRoutes;
  }
}

// Default application-instance registry. Duplicate detection is enforced by
// the composition-time validation layer (validation/validate-registrations).
export const RouteRegistry: IRouteRegistry = new RouteRegistryEngine();
