import { describe, expect, it, beforeEach } from "vitest";

import type { ModuleDefinition } from "../../route.types";
import { defineModule } from "../../route.types";
import { createRouterAppInstance, registerModule } from "../index";
import { tableRouteBindingRegistry } from "../table-route-binding.registry";

describe("TableRouteBindingRegistry", () => {
  beforeEach(() => {
    tableRouteBindingRegistry.reset();
  });

  it("registers a binding keyed by tableId", () => {
    tableRouteBindingRegistry.registerBinding({
      tableId: "products-table",
      listRouteId: "products.list",
      detailsRouteId: "products.detail",
    });

    const binding = tableRouteBindingRegistry.getBinding("products-table");
    expect(binding?.listRouteId).toBe("products.list");
    expect(binding?.detailsRouteId).toBe("products.detail");
    expect(binding?.id).toBe("products-table");
  });

  it("supports optional create/edit destinations", () => {
    tableRouteBindingRegistry.registerBinding({
      tableId: "orders-table",
      listRouteId: "orders.list",
      createRouteId: "orders.create",
      editRouteId: "orders.edit",
    });

    const binding = tableRouteBindingRegistry.getBinding("orders-table");
    expect(binding?.createRouteId).toBe("orders.create");
    expect(binding?.editRouteId).toBe("orders.edit");
    expect(binding?.detailsRouteId).toBeUndefined();
  });

  it("overwrites duplicate tableIds and resets cleanly", () => {
    tableRouteBindingRegistry.registerBinding({
      tableId: "dup",
      listRouteId: "a.list",
    });
    tableRouteBindingRegistry.registerBinding({
      tableId: "dup",
      listRouteId: "b.list",
    });

    expect(tableRouteBindingRegistry.size).toBe(1);
    expect(tableRouteBindingRegistry.getBinding("dup")?.listRouteId).toBe(
      "b.list"
    );

    tableRouteBindingRegistry.reset();
    expect(tableRouteBindingRegistry.getBinding("dup")).toBeUndefined();
  });

  it("returns undefined for unknown table ids", () => {
    expect(tableRouteBindingRegistry.getBinding("ghost")).toBeUndefined();
  });
});

describe("registerModule tableBindings fan-out", () => {
  it("registers table bindings into the app instance", () => {
    const app = createRouterAppInstance();
    const mod: ModuleDefinition = defineModule({
      id: "orders",
      routes: [],
      tableBindings: [
        {
          tableId: "orders-table",
          listRouteId: "orders.list",
          detailsRouteId: "orders.detail",
        },
      ],
    });

    registerModule(mod, app);

    expect(app.tableBindings.getBinding("orders-table")?.listRouteId).toBe(
      "orders.list"
    );
  });

  it("does not leak bindings between app instances", () => {
    const appA = createRouterAppInstance();
    const appB = createRouterAppInstance();

    registerModule(
      defineModule({
        id: "iso",
        routes: [],
        tableBindings: [{ tableId: "iso-table", listRouteId: "iso.list" }],
      }),
      appA
    );

    expect(appA.tableBindings.size).toBe(1);
    expect(appB.tableBindings.size).toBe(0);
  });
});
