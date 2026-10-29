import { useMemo } from "react";

import { navigationRegistry } from "../registries/navigation.registry";
import type { NavigationContribution } from "../route.types";
import { useRouteNavigation } from "./useRouteNavigation";

/**
 * Resolved navigation item — a contribution with its destination resolved
 * through the routing infrastructure (routeId → concrete href).
 */
export interface ResolvedNavigationItem
  extends Omit<NavigationContribution, "href"> {
  /** Concrete destination: resolved from routeId, or the external href. */
  href: string | null;
  children?: ResolvedNavigationItem[];
}

export interface UseNavigationItemsOptions {
  /** Only include items belonging to this group. */
  group?: string;
  /**
   * Registry override for tests / alternate app instances. Defaults to the
   * application-scoped navigationRegistry.
   */
  registry?: { getAll(): NavigationContribution[] };
}

function buildHierarchy(
  items: NavigationContribution[],
  resolveHref: (item: NavigationContribution) => string | null
): ResolvedNavigationItem[] {
  const byId = new Map<string, ResolvedNavigationItem>();
  for (const item of items) {
    byId.set(item.id, { ...item, href: resolveHref(item) });
  }

  const roots: ResolvedNavigationItem[] = [];
  for (const item of items) {
    const node = byId.get(item.id)!;
    if (item.parentId && byId.has(item.parentId)) {
      const parent = byId.get(item.parentId)!;
      parent.children = parent.children ?? [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortByOrder = (list: ResolvedNavigationItem[]) => {
    list.sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return a.label.localeCompare(b.label);
    });
    for (const node of list) {
      if (node.children) sortByOrder(node.children);
    }
  };
  sortByOrder(roots);

  return roots;
}

/**
 * useNavigationItems
 *
 * Resolves registered navigation contributions into a hierarchy ready for
 * presentation: destinations resolved through stable routeIds, ordered by
 * `order`, children nested under parents. UI layers own rendering; this hook
 * owns destination resolution and structure.
 */
export function useNavigationItems(
  options: UseNavigationItemsOptions = {}
): ResolvedNavigationItem[] {
  const { group, registry = navigationRegistry } = options;
  const routeNav = useRouteNavigation();

  return useMemo(() => {
    const items = registry
      .getAll()
      .filter((item) => (group ? item.group === group : true));

    return buildHierarchy(items, (item) => {
      if (item.routeId) return routeNav.resolveRoutePath(item.routeId);
      return item.href ?? null;
    });
  }, [registry, group, routeNav]);
}
