import type { AppRoute, ModuleDefinition } from "../route.types";
import {
  formatValidationReport,
  validateRegistrations,
  type ValidationResult,
} from "../validation/validate-registrations";

/**
 * PlatformManifest (subset consumed by the composition layer).
 * The manifest configures modules and routing contributions — it is not a
 * second routing engine.
 */
export interface PlatformManifest {
  routes?: { path: string; meta?: Record<string, unknown> }[];
  /** Per-module configuration keyed by module id. */
  modules?: Record<string, { enabled?: boolean; meta?: Record<string, unknown> }>;
}

export interface ComposeApplicationInput {
  /** Shell/base routes defined directly by the application. */
  routes?: AppRoute[];
  /** Feature modules whose routes are contributed to the tree. */
  modules?: ModuleDefinition[];
  /**
   * Route id of the parent under which module routes are appended as
   * children. When omitted, module routes are appended as top-level
   * siblings.
   */
  attachModulesTo?: string;
  manifest?: PlatformManifest | null;
  /** Known layout ids for layoutId validation (Phase 4 wires the registry). */
  knownLayoutIds?: string[];
  /**
   * Error-severity issues throw in dev and are logged in production so boot
   * fails fast during development but stays recoverable for end users.
   */
  strict?: boolean;
}

export interface ComposedApplication {
  /** Flat list of root routes with parentId derived throughout the tree. */
  routes: AppRoute[];
  /** routeId → route lookup. */
  routeIndex: Map<string, AppRoute>;
  /** Validation outcome (kept for diagnostics/tests). */
  validation: ValidationResult;
}

/**
 * Applies module-level inheritance (layout, wrapper, guards, meta) to the
 * module's routes without overriding route-level values.
 */
function applyModuleInheritance(
  route: AppRoute,
  module: ModuleDefinition
): AppRoute {
  return {
    ...route,
    layout: route.layout ?? module.layout,
    wrapper: route.wrapper ?? module.wrapper,
    guards: [...(module.guards ?? []), ...(route.guards ?? [])],
    meta: { ...module.meta, ...route.meta },
  };
}

/**
 * Flattens module contributions into a route list, applying inheritance and
 * manifest-driven module enablement.
 */
function collectModuleRoutes(
  modules: ModuleDefinition[],
  manifest: PlatformManifest | null | undefined
): AppRoute[] {
  return modules.flatMap((mod) => {
    const manifestConfig = manifest?.modules?.[mod.id];
    const enabled = manifestConfig?.enabled ?? mod.enabled ?? true;
    if (!enabled) return [];

    const moduleForInheritance: ModuleDefinition = {
      ...mod,
      meta: { ...mod.meta, ...manifestConfig?.meta },
    };

    return mod.routes.map((route) =>
      applyModuleInheritance(route, moduleForInheritance)
    );
  });
}

/**
 * Recursively merges server manifest metadata overrides into route
 * definitions (matched by path).
 */
function applyManifestToRoutes(
  routes: AppRoute[],
  manifest: PlatformManifest | null | undefined
): AppRoute[] {
  if (!manifest?.routes || manifest.routes.length === 0) return routes;

  const manifestRouteMap = new Map<string, { meta?: Record<string, unknown> }>();
  for (const r of manifest.routes) {
    manifestRouteMap.set(r.path, r);
  }

  const mergeNode = (node: AppRoute): AppRoute => {
    const updatedNode = { ...node };

    if (node.path && manifestRouteMap.has(node.path)) {
      const serverConfig = manifestRouteMap.get(node.path)!;
      updatedNode.meta = {
        ...node.meta,
        ...serverConfig.meta,
      };
    }

    if (node.children) {
      updatedNode.children = node.children.map((child) => mergeNode(child));
    }

    return updatedNode;
  };

  return routes.map((r) => mergeNode(r));
}

/**
 * Derives parentId on every node from the children tree (Option A: the tree
 * is authoritative; parentId is derived, never hand-written).
 */
function deriveParentIds(
  routes: AppRoute[],
  parentId?: string
): AppRoute[] {
  return routes.map((route) => ({
    ...route,
    parentId,
    children: route.children
      ? deriveParentIds(route.children, route.id)
      : undefined,
  }));
}

function buildRouteIndex(routes: AppRoute[]): Map<string, AppRoute> {
  const index = new Map<string, AppRoute>();
  const walk = (list: AppRoute[]) => {
    for (const route of list) {
      if (route.id) index.set(route.id, route);
      if (route.children) walk(route.children);
    }
  };
  walk(routes);
  return index;
}

/**
 * Appends module-contributed routes as children of the route identified by
 * parentId (so they inherit its layout). Falls back to top-level siblings
 * when the parent cannot be found.
 */
function attachModuleRoutes(
  baseRoutes: AppRoute[],
  moduleRoutes: AppRoute[],
  parentId: string | undefined
): AppRoute[] {
  if (moduleRoutes.length === 0) return baseRoutes;
  if (!parentId) return [...baseRoutes, ...moduleRoutes];

  let attached = false;
  const attach = (routes: AppRoute[]): AppRoute[] =>
    routes.map((route) => {
      if (route.id === parentId) {
        attached = true;
        return {
          ...route,
          children: [...(route.children ?? []), ...moduleRoutes],
        };
      }
      if (route.children) {
        return { ...route, children: attach(route.children) };
      }
      return route;
    });

  const result = attach(baseRoutes);
  if (!attached) {
    console.warn(
      `[composeApplication] attachModulesTo parent "${parentId}" not found; ` +
        `module routes appended at the top level.`
    );
    return [...baseRoutes, ...moduleRoutes];
  }
  return result;
}

/**
 * composeApplication
 *
 * The routing composition pipeline:
 *   1. Collect registrations (base routes + module route fan-out)
 *   2. Validate registrations
 *   3. Apply manifest configuration (meta merge + module enablement)
 *   4. Derive parentId from the tree
 *   5. Build the routeId index
 *
 * Pure and synchronous — completes fully before the runtime router is
 * created. Throws in strict/dev mode on error-severity validation issues.
 */
export function composeApplication(
  input: ComposeApplicationInput
): ComposedApplication {
  const {
    routes: baseRoutes = [],
    modules = [],
    attachModulesTo,
    manifest = null,
    knownLayoutIds,
  } = input;

  const strict =
    input.strict ?? (typeof process !== "undefined" && process.env.NODE_ENV !== "production");

  // 1. Collect — module routes (with inheritance + enablement) attached to
  //    the designated parent so they inherit its layout.
  const moduleRoutes = collectModuleRoutes(modules, manifest);
  const collected: AppRoute[] = attachModuleRoutes(
    baseRoutes,
    moduleRoutes,
    attachModulesTo
  );

  // 2. Validate (against the pre-manifest tree for structure, post-collection)
  const validation = validateRegistrations(collected, modules, {
    knownLayoutIds,
  });

  if (validation.warnings.length > 0) {
    console.warn(
      `[composeApplication] Validation warnings:\n${formatValidationReport({
        ...validation,
        issues: validation.warnings,
      })}`
    );
  }

  if (!validation.valid) {
    const report = formatValidationReport(validation);
    if (strict) {
      throw new Error(
        `[composeApplication] Registration validation failed:\n${report}`
      );
    }
    console.error(
      `[composeApplication] Registration validation failed (continuing in production):\n${report}`
    );
  }

  // 3. Apply manifest metadata overrides
  const withManifest = applyManifestToRoutes(collected, manifest);

  // 4. Derive parentId from the tree
  const composedRoutes = deriveParentIds(withManifest);

  // 5. Build routeId index
  const routeIndex = buildRouteIndex(composedRoutes);

  return {
    routes: composedRoutes,
    routeIndex,
    validation,
  };
}
