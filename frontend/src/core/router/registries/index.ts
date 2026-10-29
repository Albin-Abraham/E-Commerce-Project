import { slotRegistry, SlotRegistry } from "@core/slots/registry";

import {
  RouteRegistry,
  RouteRegistryEngine,
  type IRouteRegistry,
} from "../route.registry";
import type { ModuleDefinition } from "../route.types";
import { ModuleRegistry, moduleRegistry } from "./module.registry";
import { NavigationRegistry, navigationRegistry } from "./navigation.registry";
import {
  TableRouteBindingRegistry,
  tableRouteBindingRegistry,
} from "./table-route-binding.registry";

export { BaseRegistry } from "./base.registry";
export { ModuleRegistry, moduleRegistry } from "./module.registry";
export { NavigationRegistry, navigationRegistry } from "./navigation.registry";
export {
  TableRouteBindingRegistry,
  tableRouteBindingRegistry,
  type TableRouteBindingEntry,
} from "./table-route-binding.registry";

/**
 * RouterAppInstance
 *
 * A coherent, application-scoped bundle of routing registries. Registries are
 * instantiated together so state never leaks between application instances
 * (tests, SSR requests, multiple mounts).
 */
export interface RouterAppInstance {
  routes: IRouteRegistry;
  modules: ModuleRegistry;
  navigation: NavigationRegistry;
  tableBindings: TableRouteBindingRegistry;
  slots: SlotRegistry;
}

/**
 * Creates a fresh, isolated set of routing registries for one application
 * instance.
 */
export function createRouterAppInstance(): RouterAppInstance {
  return {
    routes: new RouteRegistryEngine(),
    modules: new ModuleRegistry(),
    navigation: new NavigationRegistry(),
    tableBindings: new TableRouteBindingRegistry(),
    slots: new SlotRegistry(),
  };
}

/**
 * Default application instance backing the current CSR boot. Reuses the
 * existing default registry instances so current registration entry points
 * (registerGlobalSlots, registerAllFeatures) stay wired. Tests and future
 * SSR paths should call createRouterAppInstance() instead.
 */
export const defaultRouterApp: RouterAppInstance = {
  routes: RouteRegistry,
  modules: moduleRegistry,
  navigation: navigationRegistry,
  tableBindings: tableRouteBindingRegistry,
  slots: slotRegistry,
};

/**
 * Registers a module and fans its contributions out into the focused
 * registries (navigation and table bindings now; slots/layouts as those
 * layers land). Routes are collected from modules by the composition
 * pipeline.
 */
export function registerModule(
  mod: ModuleDefinition,
  app: RouterAppInstance = defaultRouterApp
): void {
  app.modules.register(mod);

  for (const item of mod.navigation ?? []) {
    app.navigation.register(item);
  }

  for (const binding of mod.tableBindings ?? []) {
    app.tableBindings.registerBinding(binding);
  }
}
