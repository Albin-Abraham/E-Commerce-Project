import type { AppRoute, ModuleDefinition } from "../route.types";

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  severity: ValidationSeverity;
  code:
    | "duplicate-route-id"
    | "missing-route-id"
    | "missing-path"
    | "duplicate-module-id"
    | "duplicate-sibling-path"
    | "unknown-layout-id"
    | "unknown-parent-id";
  message: string;
  routeId?: string;
  moduleId?: string;
}

export interface ValidationResult {
  issues: ValidationIssue[];
  /** True when no error-severity issues were found. */
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

interface WalkContext {
  issues: ValidationIssue[];
  seenRouteIds: Set<string>;
  seenModuleIds: Set<string>;
  knownLayoutIds: Set<string>;
}

function walkRoutes(
  routes: AppRoute[],
  ctx: WalkContext,
  parentId?: string
): void {
  const siblingPaths = new Set<string>();

  for (const route of routes) {
    if (!route.id || typeof route.id !== "string") {
      ctx.issues.push({
        severity: "error",
        code: "missing-route-id",
        message: `Route at path "${route.path}" is missing a required stable id.`,
        routeId: route.id,
      });
    } else if (ctx.seenRouteIds.has(route.id)) {
      ctx.issues.push({
        severity: "error",
        code: "duplicate-route-id",
        message: `Duplicate route id "${route.id}". Route ids must be unique across the application.`,
        routeId: route.id,
      });
    } else {
      ctx.seenRouteIds.add(route.id);
    }

    if (!route.path && !route.index) {
      ctx.issues.push({
        severity: "error",
        code: "missing-path",
        message: `Route "${route.id}" must declare a path or be an index route.`,
        routeId: route.id,
      });
    }

    if (route.path) {
      if (siblingPaths.has(route.path)) {
        ctx.issues.push({
          severity: "error",
          code: "duplicate-sibling-path",
          message: `Duplicate sibling path "${route.path}" under parent "${parentId ?? "(root)"}".`,
          routeId: route.id,
        });
      }
      siblingPaths.add(route.path);
    }

    if (
      route.layoutId &&
      ctx.knownLayoutIds.size > 0 &&
      !ctx.knownLayoutIds.has(route.layoutId)
    ) {
      ctx.issues.push({
        severity: "warning",
        code: "unknown-layout-id",
        message: `Route "${route.id}" references unknown layoutId "${route.layoutId}".`,
        routeId: route.id,
      });
    }

    if (route.children && route.children.length > 0) {
      walkRoutes(route.children, ctx, route.id);
    }
  }
}

/**
 * validateRegistrations
 *
 * Composition-time validation of route and module registrations. Detects
 * duplicate route/module ids, missing ids, duplicate sibling paths, unknown
 * layout references, and orphaned parentIds (post-derivation).
 */
export function validateRegistrations(
  routes: AppRoute[],
  modules: ModuleDefinition[] = [],
  options: { knownLayoutIds?: string[] } = {}
): ValidationResult {
  const ctx: WalkContext = {
    issues: [],
    seenRouteIds: new Set(),
    seenModuleIds: new Set(),
    knownLayoutIds: new Set(options.knownLayoutIds ?? []),
  };

  for (const mod of modules) {
    if (!mod.id || typeof mod.id !== "string") {
      ctx.issues.push({
        severity: "error",
        code: "missing-route-id",
        message: "Module is missing a required stable id.",
      });
    } else if (ctx.seenModuleIds.has(mod.id)) {
      ctx.issues.push({
        severity: "error",
        code: "duplicate-module-id",
        message: `Duplicate module id "${mod.id}". Module ids must be unique.`,
        moduleId: mod.id,
      });
    } else {
      ctx.seenModuleIds.add(mod.id);
    }
  }

  walkRoutes(routes, ctx);

  // Orphaned parentId check (parentId is derived during composition; a value
  // referencing an unknown id indicates a manual override or a stale tree).
  const allIds = ctx.seenRouteIds;
  const checkOrphans = (list: AppRoute[]) => {
    for (const route of list) {
      if (route.parentId && !allIds.has(route.parentId)) {
        ctx.issues.push({
          severity: "error",
          code: "unknown-parent-id",
          message: `Route "${route.id}" references unknown parentId "${route.parentId}".`,
          routeId: route.id,
        });
      }
      if (route.children) checkOrphans(route.children);
    }
  };
  checkOrphans(routes);
  for (const mod of modules) checkOrphans(mod.routes);

  const errors = ctx.issues.filter((i) => i.severity === "error");
  const warnings = ctx.issues.filter((i) => i.severity === "warning");

  return {
    issues: ctx.issues,
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Formats a validation result into a single human-readable report.
 */
export function formatValidationReport(result: ValidationResult): string {
  return result.issues
    .map((i) => `[${i.severity.toUpperCase()}] ${i.code}: ${i.message}`)
    .join("\n");
}
