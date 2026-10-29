import { GlobalSearch } from "@shared/components/Search/GlobalSearch";

import { slotRegistry } from "./registry";

/**
 * Global Slot Registrations
 *
 * Registers core platform components that are not specific to any feature.
 * Resets the registry first to prevent duplicate registrations during HMR.
 */
export const registerGlobalSlots = () => {
  slotRegistry.reset();

  slotRegistry.register("header-search", {
    id: "core-global-search",
    component: GlobalSearch,
    priority: 1000,
  });
};
