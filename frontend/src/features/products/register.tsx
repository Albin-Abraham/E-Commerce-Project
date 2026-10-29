import { registerModule } from "@core/router/registries";

import { productsModule } from "./products.module";

/**
 * Product Feature Registration
 *
 * Registers the products module (routes + navigation contributions) via the
 * standard registerModule fan-out.
 */
export const registerProducts = () => {
  registerModule(productsModule);
};
