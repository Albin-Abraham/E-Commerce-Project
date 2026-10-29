import type { ReactNode } from "react";

import { describe, expect, it, vi } from "vitest";

import type { AppRoute, ModuleDefinition } from "../../route.types";
import { defineModule, defineRoute } from "../../route.types";
import { composeApplication } from "../compose-application";

const MockPage = () => null;
const MockLayout = ({ children }: { children: ReactNode }) => children;

const rootRoute = (): AppRoute =>
  defineRoute({
    id: "root",
    path: "/",
    layout: MockLayout,
    children: [
      { id: "home", index: true, page: MockPage },
    ],
  });

describe("composeApplication", () => {
  it("returns base routes unchanged structurally", () => {
    const composed = composeApplication({
      routes: [rootRoute()],
      strict: true,
    });

    expect(composed.routes).toHaveLength(1);
    expect(composed.routes[0].id).toBe("root");
  });

  it("derives parentId from the children tree", () => {
    const composed = composeApplication({
      routes: [rootRoute()],
      strict: true,
    });

    const home = composed.routeIndex.get("home");
    expect(home?.parentId).toBe("root");
  });

  it("builds a routeId index spanning nested routes", () => {
    const composed = composeApplication({
      routes: [
        defineRoute({
          id: "root",
          path: "/",
          children: [
            defineRoute({
              id: "account",
              path: "account",
              children: [{ id: "account.profile", path: "profile", page: MockPage }],
            }),
          ],
        }),
      ],
      strict: true,
    });

    expect(composed.routeIndex.has("root")).toBe(true);
    expect(composed.routeIndex.has("account")).toBe(true);
    expect(composed.routeIndex.has("account.profile")).toBe(true);
    expect(composed.routeIndex.get("account.profile")?.parentId).toBe("account");
  });

  it("collects module routes and attaches them under attachModulesTo", () => {
    const productsModule = defineModule({
      id: "products",
      routes: [
        defineRoute({ id: "products.list", path: "/products", page: MockPage }),
      ],
    });

    const composed = composeApplication({
      routes: [rootRoute()],
      modules: [productsModule],
      attachModulesTo: "root",
      strict: true,
    });

    const root = composed.routeIndex.get("root");
    expect(root?.children?.some((c) => c.id === "products.list")).toBe(true);
    expect(composed.routeIndex.get("products.list")?.parentId).toBe("root");
  });

  it("applies module inheritance (layout, guards, meta) to module routes", () => {
    const moduleGuard = { type: "custom" as const, handler: () => true };
    const mod = defineModule<Record<string, unknown>>({
      id: "mod",
      layout: MockLayout,
      guards: [moduleGuard],
      meta: { tenant: "acme" },
      routes: [
        defineRoute({
          id: "mod.page",
          path: "/mod",
          page: MockPage,
          meta: { title: "Mod" },
        }),
      ],
    });

    const composed = composeApplication({
      routes: [rootRoute()],
      modules: [mod],
      attachModulesTo: "root",
      strict: true,
    });

    const route = composed.routeIndex.get("mod.page");
    expect(route?.layout).toBe(MockLayout);
    expect(route?.guards).toContain(moduleGuard);
    expect(route?.meta).toEqual({ tenant: "acme", title: "Mod" });
  });

  it("skips modules disabled in the manifest", () => {
    const mod = defineModule({
      id: "disabled-mod",
      routes: [defineRoute({ id: "dm.page", path: "/dm", page: MockPage })],
    });

    const composed = composeApplication({
      routes: [rootRoute()],
      modules: [mod],
      attachModulesTo: "root",
      manifest: { modules: { "disabled-mod": { enabled: false } } },
      strict: true,
    });

    expect(composed.routeIndex.has("dm.page")).toBe(false);
  });

  it("merges manifest route meta by path", () => {
    const composed = composeApplication({
      routes: [
        defineRoute({
          id: "root",
          path: "/",
          meta: { title: "Static" },
          page: MockPage,
        }),
      ],
      manifest: {
        routes: [{ path: "/", meta: { title: "From Manifest" } }],
      },
      strict: true,
    });

    expect(composed.routes[0].meta).toMatchObject({
      title: "From Manifest",
    });
  });

  it("throws in strict mode on validation errors", () => {
    expect(() =>
      composeApplication({
        routes: [
          { id: "dup", path: "/a" },
          { id: "dup", path: "/b" },
        ] as AppRoute[],
        strict: true,
      })
    ).toThrow(/duplicate-route-id/);
  });

  it("does not throw in non-strict mode but records validation errors", () => {
    const composed = composeApplication({
      routes: [
        { id: "dup", path: "/a" },
        { id: "dup", path: "/b" },
      ] as AppRoute[],
      strict: false,
    });

    expect(composed.validation.valid).toBe(false);
    expect(composed.routes).toHaveLength(2);
  });

  it("warns and falls back to top-level when attachModulesTo parent is missing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const mod: ModuleDefinition = defineModule({
      id: "orphan-mod",
      routes: [defineRoute({ id: "om.page", path: "/om", page: MockPage })],
    });

    const composed = composeApplication({
      routes: [rootRoute()],
      modules: [mod],
      attachModulesTo: "does-not-exist",
      strict: true,
    });

    expect(composed.routes.some((r) => r.id === "om.page")).toBe(true);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
