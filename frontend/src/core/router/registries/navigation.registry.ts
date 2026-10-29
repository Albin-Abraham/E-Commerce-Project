import type { NavigationContribution } from "../route.types";
import { BaseRegistry } from "./base.registry";

/**
 * NavigationRegistry
 *
 * Stores navigation contributions from application modules. Destinations
 * reference stable routeIds; the navigation layer resolves them through the
 * routing infrastructure so paths can change without touching nav items.
 * Application-scoped — see createRouterAppInstance.
 */
export class NavigationRegistry extends BaseRegistry<NavigationContribution> {
  /** Contributions filtered by group (insertion order preserved). */
  getByGroup(group: string): NavigationContribution[] {
    return this.getAll().filter((item) => item.group === group);
  }
}

export const navigationRegistry = new NavigationRegistry();
