import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import type { RouteMatch } from "../helpers/breadcrumb.utils";
import type { BreadcrumbItem, BreadcrumbState } from "../types/breadcrumb.types";

export type { BreadcrumbItem, BreadcrumbState } from "../types/breadcrumb.types";

/**
 * useBreadcrumbResolution
 *
 * High-fidelity hook for resolving breadcrumb segments asynchronously.
 * Prevents screen flash by returning an immediate skeleton list derived from static
 * labels, resolving functional or Promise-based dynamic names afterwards.
 */
export function useBreadcrumbResolution(
  matches: RouteMatch[]
): BreadcrumbState {
  const filteredMatches = (matches || []).filter(
    (m) => m && m.handle && (m.handle.label || m.handle.breadcrumb)
  );

  // Initialize immediately with the static label fallbacks (Skeleton mode)
  const initialCrumbs: BreadcrumbItem[] = filteredMatches.map((match, index) => {
    const { handle, pathname } = match;
    const isLast = index === filteredMatches.length - 1;
    return {
      id: match.id || String(index),
      path: pathname,
      label: handle.label || "...",
      icon: handle.icon,
      active: isLast,
      intent: handle.intent,
    };
  });

  const [state, setState] = useState<BreadcrumbState>({
    status: "loading",
    crumbs: initialCrumbs,
  });

  useEffect(() => {
    let cancelled = false;

    const resolveAll = async () => {
      const resolvedSegments = await Promise.all(
        filteredMatches.map(async (match, index) => {
          const { handle, data, pathname } = match;
          const isLast = index === filteredMatches.length - 1;

          let resolvedLabel: ReactNode = handle.label || "";

          try {
            if (typeof handle.breadcrumb === "string") {
              resolvedLabel = handle.breadcrumb;
            } else if (typeof handle.breadcrumb === "function") {
              const res = handle.breadcrumb(data);
              resolvedLabel = res instanceof Promise ? await res : res;
            } else if (handle.verboseLabel) {
              resolvedLabel = handle.verboseLabel;
            }
          } catch (error) {
            console.error(
              "Failed to resolve dynamic breadcrumb segment:",
              error
            );
            resolvedLabel = handle.label || "Error";
          }

          return {
            id: match.id || String(index),
            path: pathname,
            label: resolvedLabel,
            icon: handle.icon,
            active: isLast,
            intent: handle.intent,
          };
        })
      );

      if (!cancelled) {
        setState({
          status: "ready",
          crumbs: resolvedSegments,
        });
      }
    };

    resolveAll();

    return () => {
      cancelled = true;
    };
  }, [matches]);

  return state;
}

export default useBreadcrumbResolution;
