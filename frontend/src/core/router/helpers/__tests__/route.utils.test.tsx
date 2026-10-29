import { type ReactNode } from "react";

import { describe, expect, it, vi } from "vitest";

import { AppPaths } from "@/shell/paths";

import type { AppRoute, RouteGuard, RouteModule } from "../../route.types";
import { prefetchManager } from "../prefetch";
import {
  allOf,
  anyOf,
  applyModuleInheritance,
  buildRouteObject,
  noneOf,
} from "../route.utils";

// Mocks
const MockPage = () => <div>Page</div>;
const MockLayout = ({ children }: { children: ReactNode }) => (
  <div>Layout {children}</div>
);
const MockWrapper = ({ children }: { children: ReactNode }) => (
  <div>Wrapper {children}</div>
);

const mockServices = {
  public: {} as any,
  auth: {} as any,
};

describe("Router Utils", () => {
  describe("applyModuleInheritance", () => {
    it("should inherit layout and wrapper from module if not present in route", () => {
      const module: RouteModule = {
        id: "test",
        layout: MockLayout,
        wrapper: MockWrapper,
        routes: [],
      };

      const route: AppRoute = {
        id: "test-route",
        path: "/test",
      };

      const result = applyModuleInheritance(route, module);

      expect(result.layout).toBe(MockLayout);
      expect(result.wrapper).toBe(MockWrapper);
    });

    it("should override module layout and wrapper if present in route", () => {
      const RouteLayout = ({ children }: { children: ReactNode }) => (
        <div>Route {children}</div>
      );
      const module: RouteModule = {
        id: "test",
        layout: MockLayout,
        routes: [],
      };

      const route: AppRoute = {
        id: "test-route",
        path: "/test",
        layout: RouteLayout,
      };

      const result = applyModuleInheritance(route, module);

      expect(result.layout).toBe(RouteLayout);
    });

    it("should merge guards", () => {
      const moduleGuard: RouteGuard = { type: "custom", handler: () => true };
      const routeGuard: RouteGuard = { type: "custom", handler: () => false };

      const module: RouteModule = {
        id: "test",
        guards: [moduleGuard],
        routes: [],
      };

      const route: AppRoute = {
        id: "test-route",
        path: "/test",
        guards: [routeGuard],
      };

      const result = applyModuleInheritance(route, module);

      expect(result.guards).toHaveLength(2);
      expect(result.guards?.[0]).toBe(moduleGuard);
      expect(result.guards?.[1]).toBe(routeGuard);
    });

    it("should merge meta", () => {
      const module: RouteModule = {
        id: "test",
        meta: { role: "admin" },
        routes: [],
      };

      const route: AppRoute = {
        id: "test-route",
        path: "/test",
        meta: { title: "Dashboard" },
      };

      const result = applyModuleInheritance(route, module);

      expect(result.meta).toEqual({ role: "admin", title: "Dashboard" });
    });
  });

  describe("buildRouteObject", () => {
    it("should create a redirect route", () => {
      const route: AppRoute = {
        id: "old-route",
        path: "/old",
        redirectTo: "/new",
      };

      const result = buildRouteObject(route, mockServices);

      expect(result.path).toBe("/old");
      expect(result.element).toBeDefined();
      expect(result.children).toBeUndefined();
    });

    it("should create a leaf route with element", () => {
      const route: AppRoute = {
        id: "home-route",
        path: "/home",
        page: MockPage,
      };

      const result = buildRouteObject(route, mockServices);

      expect(result.path).toBe("/home");
      expect(result.element).toBeDefined();
      expect(result.children).toBeUndefined();
    });

    it("should create nested routes", () => {
      const route: AppRoute = {
        id: "root-route",
        path: AppPaths.Root,
        children: [{ id: "analytics-route", path: "analytics", page: MockPage }],
      };

      const result = buildRouteObject(route, mockServices);

      expect(result.path).toBe("/");
      expect(result.children).toHaveLength(1);
      expect(result.children?.[0].path).toBe("analytics");
    });

    it("should generate index route if parent has a page", () => {
      const route: AppRoute = {
        id: "root-route",
        path: AppPaths.Root,
        page: MockPage,
        children: [{ id: "settings-route", path: "settings", page: MockPage }],
      };

      const result = buildRouteObject(route, mockServices);

      expect(result.children).toBeDefined();
      // Expect index route + children
      // The implementation unshifts the index route, so it should be first
      expect(result.children?.[0].index).toBe(true);
      expect(result.children?.[1].path).toBe("settings");
    });

    it("should attach loader if present", () => {
      const loader = async () => "data";
      const route: AppRoute = {
        id: "data-route",
        path: "/data",
        page: MockPage,
        loader,
      };

      const result = buildRouteObject(route, mockServices);

      expect(result.loader).toBeDefined();
    });

    it("should compile a lazy route using React Router lazy structure", async () => {
      const lazyFn = async () => ({
        Component: MockPage,
        loader: async () => "lazy-loaded-data",
      });
      const route: AppRoute = {
        id: "lazy-route",
        path: "/lazy-page",
        lazy: lazyFn,
      };

      const result = buildRouteObject(route, mockServices);

      expect(result.path).toBe("/lazy-page");
      expect(result.lazy).toBeDefined();

      // Trigger the lazy compilation function
      const resolved = await (result.lazy as any)!();
      expect(resolved.Component).toBeDefined();
      expect(resolved.loader).toBeDefined();

      const loaderRes = await resolved.loader!({
        request: new Request("http://localhost/lazy-page"),
        params: {},
      } as any);
      expect(loaderRes).toBe("lazy-loaded-data");
    });

    it("should automatically defer route loader promises if route has a skeleton definition", async () => {
      const loader = async () => "slow-loaded-data";
      const route: AppRoute = {
        id: "deferred-route",
        path: "/deferred-page",
        page: MockPage,
        skeleton: <div>Loading...</div>,
        loader,
      };

      const result = buildRouteObject(route, mockServices);
      expect(result.loader).toBeDefined();

      const loaderRes = await (result.loader as any)!({
        request: new Request("http://localhost/deferred-page"),
        params: {},
      } as any);

      expect(loaderRes).toBeDefined();
      expect(typeof loaderRes).toBe("object");
      expect((loaderRes as any).__deferredData).toBeInstanceOf(Promise);
    });

    it("should resolve splash screen if skeleton is configured as 'splash'", () => {
      const route: AppRoute = {
        id: "splash-route",
        path: "/splash-page",
        page: MockPage,
        skeleton: "splash",
      };

      const result = buildRouteObject(route, mockServices);
      expect(result.element).toBeDefined();

      const element = result.element as any;
      expect(element.props.fallback).toBeDefined();
      expect(element.props.fallback.type.name).toBe("ZenosBootSplash");
    });
  });

  describe("Logical Guard Combinators", () => {
    const passGuard = {
      type: "custom" as const,
      handler: () => true,
      id: "pass",
    };
    const failGuard = {
      type: "custom" as const,
      handler: () => false,
      id: "fail",
    };
    const mockCtx = {} as any;

    describe("allOf (AND)", () => {
      it("should pass if all inner guards pass", async () => {
        const combined = allOf(passGuard, passGuard);
        const res = await combined.handler(mockCtx);
        expect(res).toBe(true);
      });

      it("should fail if at least one inner guard fails", async () => {
        const combined = allOf(passGuard, failGuard);
        const res = await combined.handler(mockCtx);
        expect(res).toBe(false);
      });

      it("should short-circuit and not execute subsequent guards after first failure", async () => {
        let called = false;
        const trackingGuard = {
          type: "custom" as const,
          handler: () => {
            called = true;
            return true;
          },
        };
        const combined = allOf(failGuard, trackingGuard);
        await combined.handler(mockCtx);
        expect(called).toBe(false);
      });
    });

    describe("anyOf (OR)", () => {
      it("should pass if at least one inner guard passes", async () => {
        const combined = anyOf(failGuard, passGuard);
        const res = await combined.handler(mockCtx);
        expect(res).toBe(true);
      });

      it("should fail if all inner guards fail", async () => {
        const combined = anyOf(failGuard, failGuard);
        const res = await combined.handler(mockCtx);
        expect(res).toBe(false);
      });

      it("should short-circuit and not execute subsequent guards after first success", async () => {
        let called = false;
        const trackingGuard = {
          type: "custom" as const,
          handler: () => {
            called = true;
            return true;
          },
        };
        const combined = anyOf(passGuard, trackingGuard);
        await combined.handler(mockCtx);
        expect(called).toBe(false);
      });
    });

    describe("noneOf (NOT / NOR)", () => {
      it("should pass if all inner guards fail", async () => {
        const combined = noneOf(failGuard, failGuard);
        const res = await combined.handler(mockCtx);
        expect(res).toBe(true);
      });

      it("should fail if at least one inner guard passes", async () => {
        const combined = noneOf(failGuard, passGuard);
        const res = await combined.handler(mockCtx);
        expect(res).toBe(false);
      });

      it("should short-circuit and stop on the first passing guard", async () => {
        let called = false;
        const trackingGuard = {
          type: "custom" as const,
          handler: () => {
            called = true;
            return false;
          },
        };
        const combined = noneOf(passGuard, trackingGuard);
        await combined.handler(mockCtx);
        expect(called).toBe(false);
      });
    });
  });

  describe("PrefetchManager & PlatformLink", () => {
    const mockServices = {
      public: {} as any,
      auth: {} as any,
    };

    it("should initialize prefetch manager with route tree and construct loader prefetch promises", async () => {
      const loader = vi.fn().mockResolvedValue("prefetched-data");
      const routes: AppRoute[] = [
        {
          id: "products-route",
          path: "/products",
          loader,
          page: () => <div>Products</div>,
        },
      ];

      prefetchManager.init(routes, mockServices);
      prefetchManager.clear();

      // Trigger prefetch on hover
      prefetchManager.prefetch("/products");

      // Verify that loader was called and cached promise exists
      const cached = prefetchManager.getCachedPromise("/products");
      expect(cached).toBeInstanceOf(Promise);

      const resolved = await cached;
      expect(resolved).toBe("prefetched-data");
      expect(loader).toHaveBeenCalledTimes(1);
    });

    it("should respect cache time-to-live and expire entries", async () => {
      const routes: AppRoute[] = [
        {
          id: "expired-route",
          path: "/expired",
          loader: async () => "expired-data",
          page: () => <div>Expired</div>,
        },
      ];

      prefetchManager.init(routes, mockServices);
      prefetchManager.clear();

      prefetchManager.prefetch("/expired");

      // Mock expired cache entry by shifting the timestamp back by 11 seconds
      const cacheKey = "/expired";
      const cachedEntry = (prefetchManager as any).cache.get(cacheKey);
      expect(cachedEntry).toBeDefined();
      cachedEntry.timestamp = Date.now() - 11000; // Force expiry

      const expired = prefetchManager.getCachedPromise("/expired");
      expect(expired).toBeNull();
    });

    it("should eliminate dynamic waterfalls by automatically chaining loader execution after lazy chunk resolves", async () => {
      const mockLoader = vi.fn().mockResolvedValue("lazy-waterfall-data");
      const lazyFn = async () => ({
        Component: () => <div>Lazy</div>,
        loader: mockLoader,
      });

      const routes: AppRoute[] = [
        {
          id: "lazy-waterfall-route",
          path: "/lazy-waterfall",
          lazy: lazyFn,
        },
      ];

      prefetchManager.init(routes, mockServices);
      prefetchManager.clear();

      prefetchManager.prefetch("/lazy-waterfall");

      // Wait for the dynamic import microtask queue to empty and execute loader chaining
      await new Promise((resolve) => setTimeout(resolve, 10));

      const cached = prefetchManager.getCachedPromise("/lazy-waterfall");
      expect(cached).toBeInstanceOf(Promise);

      const resolved = await cached;
      expect(resolved).toBe("lazy-waterfall-data");
      expect(mockLoader).toHaveBeenCalledTimes(1);
    });

    it("should dynamically inject <link rel='modulepreload'> into document head on lazy prefetch trigger", async () => {
      const originalAppendChild = document.head.appendChild;

      const appendedElements: HTMLElement[] = [];
      document.head.appendChild = vi.fn().mockImplementation((el: any) => {
        appendedElements.push(el);
        return el;
      });

      const lazyFn = async () => ({
        Component: () => <div>Preload</div>,
      });
      lazyFn.toString = () => "() => import('/assets/chunks/ProductList.js')";

      const routes: AppRoute[] = [
        {
          id: "preload-route",
          path: "/preload-module",
          lazy: lazyFn,
        },
      ];

      prefetchManager.init(routes, mockServices);
      prefetchManager.clear();

      prefetchManager.prefetch("/preload-module");

      const preloadLink = appendedElements.find(
        (el: any) => el.tagName === "LINK" && el.rel === "modulepreload"
      ) as HTMLLinkElement;

      expect(preloadLink).toBeDefined();
      expect(preloadLink.href).toContain("/assets/chunks/ProductList.js");

      document.head.appendChild = originalAppendChild;
    });
  });
});
