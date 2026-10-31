import { describe, expect, it } from "vitest";
import { customerRoutes } from "../customer.routes";
import { customersModule } from "../customers.module";
import { moduleRegistry } from "@core/router/registries/module.registry";
import { registerCustomers } from "../register";

describe("Customer Routes & Feature Module Isolation", () => {
  it("defines encapsulated customer routes separated from RouterProvider", () => {
    expect(customerRoutes).toBeDefined();
    expect(customerRoutes.length).toBe(4);

    const routeIds = customerRoutes.map((r) => r.id);
    expect(routeIds).toContain("account.profile");
    expect(routeIds).toContain("account.orders");
    expect(routeIds).toContain("account.wishlist");
    expect(routeIds).toContain("account.settings");
  });

  it("defines customersModule and registers cleanly into moduleRegistry", () => {
    expect(customersModule.id).toBe("customers");
    expect(customersModule.routes).toBe(customerRoutes);

    moduleRegistry.reset();
    registerCustomers();

    const registered = moduleRegistry.get("customers");
    expect(registered).toBeDefined();
    expect(registered?.id).toBe("customers");
    expect(registered?.navigation).toHaveLength(4);
  });
});
