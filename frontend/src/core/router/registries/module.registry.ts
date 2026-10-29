import type { ModuleDefinition } from "../route.types";
import { BaseRegistry } from "./base.registry";

/**
 * ModuleRegistry
 *
 * Tracks application modules and their contributions (routes, navigation,
 * layouts, slots, table bindings). Application-scoped — instantiate via
 * createRouterAppInstance; the exported default instance backs the current
 * CSR boot.
 */
export class ModuleRegistry extends BaseRegistry<ModuleDefinition> {
  /**
   * Returns modules that are not explicitly disabled. Manifest-level
   * enablement is applied by the composition layer before this filter.
   */
  getEnabledModules(): ModuleDefinition[] {
    return this.getAll().filter((m) => m.enabled !== false);
  }
}

export const moduleRegistry = new ModuleRegistry();
