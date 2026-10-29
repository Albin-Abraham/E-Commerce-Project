import React from "react";

import type { AppRoute, RouteFeatureFlags, RouteGuard, RouteModule } from "../route.types";

// ─────────────────────────────────────────────────────────────────────────────
// React Router adapter (moved to adapters/ReactRouterAdapter).
// Re-exported here for backward compatibility with existing import sites.
// ─────────────────────────────────────────────────────────────────────────────
export {
  buildRouteObject,
  createAppRouterFromRoutes,
  runGuards,
  type RouterServiceBag,
} from "../adapters/ReactRouterAdapter";

// --------------------- Module Handling --------------------- //

export function applyModuleInheritance(
  route: AppRoute,
  module: RouteModule
): AppRoute {
  return {
    ...route,
    layout: route.layout ?? module.layout,
    wrapper: route.wrapper ?? module.wrapper,
    guards: [...(module.guards ?? []), ...(route.guards ?? [])],
    meta: { ...module.meta, ...route.meta },
  };
}

// --------------------- Guard Factories --------------------- //

export function permissionGuard(perms: {
  all?: string[];
  any?: string[];
  none?: string[];
  bypass?: string[];
  validate?: (user: any) => boolean | Promise<boolean>;
}): RouteGuard {
  return {
    type: "permission",
    id: "rbac-guard",
    handler: async (ctx) => {
      const user = ctx.getUser();
      if (!user) return false;

      if (perms.validate) {
        return await perms.validate(user);
      }

      const userRoles = (user as any).roles || [];
      if (perms.all) {
        return perms.all.every((r) => userRoles.includes(r));
      }
      if (perms.any) {
        return perms.any.some((r) => userRoles.includes(r));
      }
      if (perms.none) {
        return !perms.none.some((r) => userRoles.includes(r));
      }

      return true;
    },
  };
}

export function featureFlagGuard(_flags: RouteFeatureFlags): RouteGuard {
  return {
    type: "feature",
    id: "feature-flag-guard",
    handler: (_ctx) => {
      return true;
    },
  };
}

// --------------------- Logical Guard Combinators --------------------- //

/**
 * allOf (Logical AND)
 *
 * Aggregates multiple guards into a single conjunct guard.
 * Evaluates sequentially and short-circuits on the first failure.
 */
export function allOf<User = any, State = any>(
  ...guards: RouteGuard<User, State>[]
): RouteGuard<User, State> {
  return {
    type: "custom",
    id: `allOf(${guards.map((g) => g.id || "unnamed").join(", ")})`,
    handler: async (ctx) => {
      for (const guard of guards) {
        if (!(await guard.handler(ctx))) {
          return false;
        }
      }
      return true;
    },
  };
}

/**
 * anyOf (Logical OR)
 *
 * Aggregates multiple guards into a single disjunct guard.
 * Evaluates sequentially and short-circuits on the first success.
 */
export function anyOf<User = any, State = any>(
  ...guards: RouteGuard<User, State>[]
): RouteGuard<User, State> {
  return {
    type: "custom",
    id: `anyOf(${guards.map((g) => g.id || "unnamed").join(", ")})`,
    handler: async (ctx) => {
      for (const guard of guards) {
        if (await guard.handler(ctx)) {
          return true;
        }
      }
      return false;
    },
  };
}

/**
 * noneOf (Logical NOT / NOR)
 *
 * Aggregates multiple guards into a single negative guard.
 * Evaluates sequentially and short-circuits to false if any guard passes.
 */
export function noneOf<User = any, State = any>(
  ...guards: RouteGuard<User, State>[]
): RouteGuard<User, State> {
  return {
    type: "custom",
    id: `noneOf(${guards.map((g) => g.id || "unnamed").join(", ")})`,
    handler: async (ctx) => {
      for (const guard of guards) {
        if (await guard.handler(ctx)) {
          return false;
        }
      }
      return true;
    },
  };
}

/**
 * lazyWithPreload
 *
 * Elegant wrapper around React.lazy that attaches a public preloader promise function.
 * Enables the routing framework to preload dynamic page chunks safely and robustly.
 */
export function lazyWithPreload<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  const Component = React.lazy(factory);
  (Component as any).preload = factory;
  return Component as React.LazyExoticComponent<T> & {
    preload: () => Promise<any>;
  };
}
