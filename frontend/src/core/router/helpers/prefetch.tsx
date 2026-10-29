import React from "react";
import {
  type LinkProps,
  Link as RouterLink,
  matchPath,
} from "react-router-dom";

import { getGlobalState } from "@core/state";

import type { AppRoute } from "../route.types";

interface PrefetchCacheEntry {
  promise: Promise<any>;
  timestamp: number;
}

class PrefetchManager {
  private cache = new Map<string, PrefetchCacheEntry>();
  private routes: AppRoute[] = [];
  private services: any = null;

  init(routes: AppRoute[], services: any) {
    this.routes = routes;
    this.services = services;
  }

  /**
   * Constructs a mock context for loader pre-fetching
   */
  private createLoaderContext(path: string, params: Record<string, string>) {
    const mockRequest = new Request(`http://localhost${path}`);
    return {
      params,
      search: new URL(mockRequest.url).searchParams,
      signal: mockRequest.signal,
      getUser: () => {
        const state = getGlobalState();
        return state.auth?.user || null;
      },
      getPermissions: () => {
        const state = getGlobalState();
        const user = state.auth?.user as any;
        return user?.permissions || user?.roles || [];
      },
      getTenant: () => {
        const state = getGlobalState();
        return (state as any).tenant || {};
      },
      state: () => getGlobalState(),
      services: this.services,
    };
  }

  /**
   * Triggers asset prefetching and loader prefetching on hover
   */
  prefetch(path: string) {
    if (!this.routes.length) return;

    // 🚀 CONNECTION & DATA-SAVER GUARD: Skip prefetch if on slow/limited connections
    if (typeof navigator !== "undefined" && (navigator as any).connection) {
      const conn = (navigator as any).connection;
      if (conn.saveData) {
        return;
      }
      const slowConnections = ["slow-2g", "2g", "3g"];
      if (slowConnections.includes(conn.effectiveType || "")) {
        return;
      }
    }

    const matched = this.matchRoute(path);
    if (!matched) return;

    const { route, params } = matched;
    const cacheKey = this.getCacheKey(path);

    // 1. Prefetch dynamic module and chain co-located loaders to eliminate execution waterfalls
    if (route.lazy) {
      // Dynamic link rel="modulepreload" injection for prioritised resource scheduling
      if (typeof document !== "undefined") {
        try {
          const lazyStr = route.lazy.toString();
          const importMatch = lazyStr.match(
            /import\s*\(\s*['"`](.*?)['"`]\s*\)/
          );
          if (importMatch && importMatch[1]) {
            const assetUrl = importMatch[1];
            const existing = document.querySelector(`link[href="${assetUrl}"]`);
            if (!existing) {
              const link = document.createElement("link");
              link.rel = "modulepreload";
              link.href = assetUrl;
              document.head.appendChild(link);
            }
          }
        } catch (e) {
          console.warn(
            "⚠️ [PrefetchManager]: Failed to parse dynamic import path for preloading:",
            e
          );
        }
      }

      const lazyPromise = Promise.resolve(route.lazy());

      lazyPromise
        .then((module: any) => {
          if (module && module.loader && !this.cache.has(cacheKey)) {
            const ctx = this.createLoaderContext(path, params);
            try {
              const promise = Promise.resolve(module.loader(ctx as any));
              this.cache.set(cacheKey, {
                promise,
                timestamp: Date.now(),
              });
            } catch (err) {
              console.error(
                "🚀 [PrefetchManager]: Co-located loader execution failed:",
                err
              );
            }
          }
        })
        .catch((err) => {
          console.error("🚀 [PrefetchManager]: Lazy chunk import failed:", err);
        });
    } else if (route.page) {
      const lazyComponent = route.page as any;
      // 🚀 SAFE PRELOAD: Check for official custom lazyWithPreload wrapper first
      if (lazyComponent && typeof lazyComponent.preload === "function") {
        lazyComponent.preload();
      }
      // LEGACY FALLBACK: Fallback to React internal _init if no custom wrapper is used
      else if (
        lazyComponent &&
        lazyComponent._payload &&
        lazyComponent._payload._result
      ) {
        if (typeof lazyComponent._init === "function") {
          try {
            lazyComponent._init(lazyComponent._payload);
          } catch (e) {
            // ignore or let it load
          }
        }
      }
    }

    // 3. Trigger custom framework preloader hook if present on the route definition
    if (route.preload) {
      route.preload().catch(() => {});
    }

    // 2. Prefetch static loader instantly in parallel (Absolute Zero-Waterfall Track)
    if (route.loader) {
      if (!this.cache.has(cacheKey)) {
        const ctx = this.createLoaderContext(path, params);
        try {
          const promise = Promise.resolve(route.loader(ctx as any));
          this.cache.set(cacheKey, {
            promise,
            timestamp: Date.now(),
          });
        } catch (err) {
          console.error(
            "🚀 [PrefetchManager]: Static loader execution failed:",
            err
          );
        }
      }
    }
  }

  /**
   * Retrieves a cached data promise if it exists and hasn't expired (Custom/Configured TTL)
   */
  getCachedPromise(path: string): Promise<any> | null {
    const cacheKey = this.getCacheKey(path);
    const entry = this.cache.get(cacheKey);

    if (entry) {
      // 🚀 DYNAMIC TTL: Resolve customized route-specific TTL or fallback to 10s default
      const matched = this.matchRoute(path);
      const ttl = matched?.route?.cache?.ttl ?? 10000;

      if (Date.now() - entry.timestamp < ttl) {
        return entry.promise;
      }
      this.cache.delete(cacheKey);
    }
    return null;
  }

  clear() {
    this.cache.clear();
  }

  private getCacheKey(path: string): string {
    return path.split("?")[0];
  }

  /**
   * Matches a URL path against the registered dynamic AppRoute config tree
   */
  private matchRoute(
    path: string
  ): { route: AppRoute; params: Record<string, string> } | null {
    const pathname = path.split("?")[0];

    const searchTree = (
      nodes: AppRoute[],
      parentPath = ""
    ): { route: AppRoute; params: Record<string, string> } | null => {
      for (const node of nodes) {
        // Resolve absolute path shape
        let currentPath = node.path || "";
        if (currentPath.startsWith("/")) {
          // absolute path
        } else {
          currentPath =
            parentPath === "/"
              ? `/${currentPath}`
              : `${parentPath}/${currentPath}`;
        }

        const match = matchPath({ path: currentPath, end: true }, pathname);
        if (match) {
          return {
            route: node,
            params: match.params as Record<string, string>,
          };
        }

        if (node.children) {
          const childMatch = searchTree(node.children, currentPath);
          if (childMatch) return childMatch;
        }
      }
      return null;
    };

    return searchTree(this.routes);
  }
}

export const prefetchManager = new PrefetchManager();

/**
 * PlatformLink: Smart prefetching anchor component that intercepts hover and focus inputs
 */
export const PlatformLink = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ onMouseEnter, onFocus, to, ...props }, ref) => {
    const handlePrefetch = () => {
      if (typeof to === "string") {
        prefetchManager.prefetch(to);
      }
    };

    const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
      handlePrefetch();
      if (onMouseEnter) onMouseEnter(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLAnchorElement>) => {
      handlePrefetch();
      if (onFocus) onFocus(e);
    };

    return (
      <RouterLink
        ref={ref}
        to={to}
        onMouseEnter={handleMouseEnter}
        onFocus={handleFocus}
        {...props}
      />
    );
  }
);

