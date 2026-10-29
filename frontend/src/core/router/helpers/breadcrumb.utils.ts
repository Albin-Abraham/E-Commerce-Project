import type { ReactNode } from "react";

import type { AppRoute } from "../route.types";
import type { BreadcrumbItem } from "../types/breadcrumb.types";

export type { BreadcrumbItem } from "../types/breadcrumb.types";

export interface RouteMatch {
  id: string;
  pathname: string;
  data: any;
  handle: AppRoute;
}

/**
 * buildBreadcrumbs
 *
 * Maps the current location matches into a human-readable
 * breadcrumb trail using dynamic resolvers.
 */
export function buildBreadcrumbs(matches: RouteMatch[]): BreadcrumbItem[] {
  return matches
    .filter(
      (match) => match.handle && (match.handle.label || match.handle.breadcrumb)
    )
    .map((match, index, array) => {
      const { handle, data, pathname } = match;
      const isLast = index === array.length - 1;

      // 1. Resolve Label (Dynamic Resolver or Static Label)
      let resolvedLabel: ReactNode = handle.label || "";

      if (typeof handle.breadcrumb === "string") {
        resolvedLabel = handle.breadcrumb;
      } else if (typeof handle.breadcrumb === "function") {
        resolvedLabel = handle.breadcrumb(data);
      } else if (handle.verboseLabel) {
        resolvedLabel = handle.verboseLabel;
      }

      return {
        id: match.id,
        path: pathname,
        label: resolvedLabel,
        icon: handle.icon,
        active: isLast,
        intent: handle.intent,
      };
    });
}

/**
 * getWorkflowTrail
 *
 * Specifically filters the trail for only the "Inline/OnCanvas"
 * portion of the workflow.
 */
export function getWorkflowTrail(matches: RouteMatch[]): BreadcrumbItem[] {
  const all = buildBreadcrumbs(matches);
  return all;
}
