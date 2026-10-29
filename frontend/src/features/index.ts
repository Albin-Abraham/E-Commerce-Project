import { moduleRegistry } from "@core/router/registries/module.registry";
import { navigationRegistry } from "@core/router/registries/navigation.registry";
import { tableRouteBindingRegistry } from "@core/router/registries/table-route-binding.registry";

import { registerAuth } from "./auth/register";
import { registerProducts } from "./products/register";

/**
 * Global Feature Registry
 *
 * Orchestrates the registration of all feature modules into the core system.
 * Resets registries first to prevent duplicate registrations during HMR.
 */
export const registerAllFeatures = () => {
  moduleRegistry.reset();
  navigationRegistry.reset();
  tableRouteBindingRegistry.reset();

  registerAuth();
  registerProducts();
};
