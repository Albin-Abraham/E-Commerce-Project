import { describe, expect, it, beforeEach } from "vitest";

import type { ModuleDefinition } from "../../route.types";
import { defineModule } from "../../route.types";
import {
  createRouterAppInstance,
  registerModule,
} from "../index";
import { navigationRegistry } from "../navigation.registry";

describe("NavigationRegistry", () => {
  beforeEach(() => {
    navigationRegistry.reset();
  });

  it("registers and retrieves navigation contributions", () => {
    navigationRegistry.register({
      id: "nav.home",
      label: "Home",
      routeId: "root",
    });

    expect(navigationRegistry.get("nav.home")?.routeId).toBe("root");
    expect(navigationRegistry.getAll()).toHaveLength(1);
  });

  it("filters contributions by group", () => {
    navigationRegistry.registerAll([
      { id: "a", label: "A", group: "catalog" },
      { id: "b", label: "B", group: "system" },
    ]);

    expect(navigationRegistry.getByGroup("catalog")).toHaveLength(1);
    expect(navigationRegistry.getByGroup("system")).toHaveLength(1);
    expect(navigationRegistry.getByGroup("missing")).toHaveLength(0);
  });

  it("overwrites duplicate ids and resets cleanly", () => {
    navigationRegistry.register({ id: "dup", label: "First" });
    navigationRegistry.register({ id: "dup", label: "Second" });

    expect(navigationRegistry.size).toBe(1);
    expect(navigationRegistry.get("dup")?.label).toBe("Second");

    navigationRegistry.reset();
    expect(navigationRegistry.size).toBe(0);
  });
});

describe("registerModule fan-out", () => {
  it("registers the module and its navigation contributions into the app instance", () => {
    const app = createRouterAppInstance();
    const mod: ModuleDefinition = defineModule({
      id: "catalog",
      routes: [{ id: "catalog.list", path: "/catalog" }],
      navigation: [
        { id: "nav.catalog", label: "Catalog", routeId: "catalog.list" },
      ],
    });

    registerModule(mod, app);

    expect(app.modules.get("catalog")).toBeDefined();
    expect(app.navigation.get("nav.catalog")?.routeId).toBe("catalog.list");
  });

  it("does not leak state between app instances", () => {
    const appA = createRouterAppInstance();
    const appB = createRouterAppInstance();

    registerModule(
      defineModule({
        id: "isolated",
        routes: [],
        navigation: [{ id: "nav.isolated", label: "Iso" }],
      }),
      appA
    );

    expect(appA.navigation.size).toBe(1);
    expect(appB.navigation.size).toBe(0);
  });
});
