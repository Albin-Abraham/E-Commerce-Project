import { registerModule } from "@core/router/registries";
import { customersModule } from "./customers.module";

/**
 * Customers Feature Registration
 *
 * Registers the customers module (customer routes + navigation) via the
 * standard moduleRegistry without hardcoding routes into RouterProvider.
 */
export const registerCustomers = () => {
  registerModule(customersModule);
};
