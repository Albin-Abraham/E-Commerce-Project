import React, { type ReactNode, Suspense, useEffect, useRef } from "react";
import {
  Await,
  Navigate,
  Outlet,
  createBrowserRouter,
  redirect,
  useBlocker,
  useLoaderData,
  useParams,
  useSearchParams,
} from "react-router-dom";
import type { RouteObject } from "react-router-dom";

import { eventBus } from "@core/events";
import type { HttpClient } from "@core/http";
import { queryClient } from "@core/providers/queryClient";
import { type GlobalState, getGlobalState } from "@core/state";
import { PageSkeleton } from "@ui/PageSkeleton";

import { ZenosBootSplash } from "@shared/ui/ZenosBootSplash";

import { RouteErrorBoundary } from "../components/RouteErrorBoundary";
import type { AppRoute, LoaderContext, RouteGuard } from "../route.types";
import { RouterEvent } from "../route.types";
import { useRouterServices } from "../services/RouterServicesContext";
import { prefetchManager } from "../helpers/prefetch";

export interface RouterServiceBag {
  public: HttpClient;
  auth: HttpClient;
}

/**
 * Resolves fallback skeleton or splash screen for suspense blocks
 */
function getFallback(route: AppRoute<any, any, any>): ReactNode {
  if (
    route.skeleton === "splash" ||
    route.suspense === "splash" ||
    (route.meta as any)?.useSplash === true
  ) {
    return <ZenosBootSplash />;
  }
  return (
    (route.skeleton as ReactNode) ??
    (route.suspense as ReactNode) ?? <PageSkeleton />
  );
}

function redirectTo(path: string) {
  throw redirect(path);
}

function shallowCompare(obj1: any, obj2: any) {
  if (Object.is(obj1, obj2)) return true;
  if (
    typeof obj1 !== "object" ||
    obj1 === null ||
    typeof obj2 !== "object" ||
    obj2 === null
  ) {
    return false;
  }
  const keysA = Object.keys(obj1);
  const keysB = Object.keys(obj2);
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    if (obj1[keysA[i]] !== obj2[keysA[i]]) return false;
  }
  return true;
}

// --------------------- Guard Runner --------------------- //

export async function runGuards<User, State>(
  guards: RouteGuard<User, State>[] | undefined,
  ctx: LoaderContext<User, State>
): Promise<string | true> {
  if (!guards || guards.length === 0) return true;
  for (const guard of guards) {
    const passed = await guard.handler(ctx);
    if (passed !== true) return typeof passed === "string" ? passed : "/403";
  }
  return true;
}

// --------------------- Loader & Action --------------------- //

function buildLoader<User, State = GlobalState>(
  loaderFn: ((ctx: LoaderContext<User, State>) => any) | undefined,
  route: AppRoute<any, any, any, User, any, any, State>,
  services: RouterServiceBag
) {
  if (!loaderFn && !route.guards && !route.redirectTo && !route.onEnter)
    return undefined;

  return async ({ request, params }: any) => {
    if (route.redirectTo) redirectTo(route.redirectTo);

    const ctx: LoaderContext<User, State> = {
      params,
      search: new URL(request.url).searchParams,
      signal: request.signal,
      getUser: () => {
        const state = getGlobalState();
        return state.auth?.user as unknown as User;
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
      state: () => getGlobalState() as unknown as State,
      services: {
        ...services,
        queryClient,
      },
    };

    // Run guards
    const guardResult = await runGuards(route.guards, ctx);
    if (guardResult !== true) redirectTo(guardResult);

    // 🔥 EXECUTE BEFORE_ENTER BEFORE REACT RENDERS
    eventBus.emit(RouterEvent.RouteEntering, { route, ctx });
    if (route.beforeEnter) {
      await route.beforeEnter(ctx);
    }

    // Check prefetch cache first to achieve 0ms transition latency
    const cachePath = new URL(request.url).pathname;
    const cachedPromise = prefetchManager.getCachedPromise(cachePath);
    if (cachedPromise) {
      if (route.skeleton) {
        return {
          __deferredData: cachedPromise,
        };
      }
      return cachedPromise;
    }

    if (loaderFn) {
      if (route.skeleton) {
        return {
          __deferredData: loaderFn(ctx),
        };
      }

      try {
        return await loaderFn(ctx);
      } catch (err) {
        console.error("Loader failed for route:", route.path, err);
        throw err;
      }
    }

    return null;
  };
}

function buildAction<User, State = GlobalState>(
  actionFn: ((ctx: LoaderContext<User, State>) => any) | undefined,
  route: AppRoute<any, any, any, User, any, any, State>,
  services: RouterServiceBag
) {
  if (!actionFn && !route.guards) return undefined;

  return async ({ request, params }: any) => {
    const ctx: LoaderContext<User, State> = {
      params,
      search: new URL(request.url).searchParams,
      signal: request.signal,
      getUser: () => {
        const state = getGlobalState();
        return state.auth?.user as unknown as User;
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
      state: () => getGlobalState() as unknown as State,
      services: {
        ...services,
        queryClient,
      },
    };

    const allowed = await runGuards(route.guards, ctx);
    if (allowed !== true) redirectTo(allowed);

    if (actionFn) {
      try {
        return await actionFn(ctx);
      } catch (err) {
        console.error("Action failed for route:", route.path, err);
        throw err;
      }
    }

    return null;
  };
}

// --------------------- Elements --------------------- //

// ─── 1. Lifecycle Adapter (Owns Runtime Execution) ───
const RouteLifecycleAdapter: React.FC<{
  route: AppRoute;
  children: ReactNode;
}> = ({ route, children }) => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const services = useRouterServices();
  const prevParamsRef = useRef(params);
  const prevSearchRef = useRef(searchParams);
  const hasFiredEnter = useRef(false);
  const activeCleanupRef = useRef<(() => void) | null>(null);

  const runtimeScope = useRef<LoaderContext<any, any>>({
    params: params as Record<string, string>,
    search: searchParams,
    signal: undefined,
    getUser: () => getGlobalState().auth?.user,
    getPermissions: () => {
      const user = getGlobalState().auth?.user as any;
      return user?.permissions || user?.roles || [];
    },
    getTenant: () => (getGlobalState() as any).tenant || {},
    state: () => getGlobalState(),
    services: {
      public: services.public,
      auth: services.auth,
      queryClient,
    },
  }).current;

  runtimeScope.params = params as Record<string, string>;
  runtimeScope.search = searchParams;

  useEffect(() => {
    if (!hasFiredEnter.current) {
      hasFiredEnter.current = true;
      eventBus.emit(RouterEvent.RouteEntered, { route, ctx: runtimeScope });
      if (route.onEnter) {
        const cleanup = route.onEnter(runtimeScope);
        if (typeof cleanup === "function") {
          activeCleanupRef.current = cleanup as any;
        }
      }
      if (route.afterEnter) {
        route.afterEnter(runtimeScope);
      }
      return;
    }

    const paramsChanged = !shallowCompare(prevParamsRef.current, params);
    const searchChanged =
      prevSearchRef.current.toString() !== searchParams.toString();

    if (paramsChanged || searchChanged) {
      const changes = {
        previous: {
          params: prevParamsRef.current,
          search: prevSearchRef.current,
        },
        current: { params, search: searchParams },
      };
      eventBus.emit(RouterEvent.RouteUpdating, {
        route,
        ctx: runtimeScope,
        ...changes,
      });
      if (route.onUpdate) {
        route.onUpdate(runtimeScope, changes);
      }
    }

    prevParamsRef.current = params;
    prevSearchRef.current = searchParams;
  }, [route, params, searchParams, runtimeScope]);

  useEffect(() => {
    return () => {
      eventBus.emit(RouterEvent.RouteLeaving, { route, ctx: runtimeScope });
      if (route.onLeave) {
        route.onLeave(runtimeScope);
      }
      if (activeCleanupRef.current) {
        activeCleanupRef.current();
      }
      hasFiredEnter.current = false;
      if (route.afterLeave) {
        route.afterLeave(runtimeScope);
      }
      eventBus.emit(RouterEvent.RouteDisposed, { route, ctx: runtimeScope });
    };
  }, [route, runtimeScope]);

  // ── 3. Navigation Guards (onBeforeLeave) ──
  useBlocker(({ currentLocation, nextLocation }) => {
    if (
      currentLocation.pathname !== nextLocation.pathname &&
      route.onBeforeLeave
    ) {
      // route.onBeforeLeave returns true if the user can leave, false to block.
      // useBlocker expects true to BLOCK navigation.
      const canLeave = route.onBeforeLeave(runtimeScope);
      return !canLeave;
    }
    return false;
  });

  return <>{children}</>;
};

// ─── 2. Data & Suspense Adapter (Owns React Rendering Flow) ───
const DeferredDataAdapter: React.FC<{
  Component: React.ComponentType<any>;
  fallback: ReactNode;
  [key: string]: any;
}> = ({ Component, fallback, ...props }) => {
  const data = useLoaderData() as any;
  if (data && data.__deferredData instanceof Promise) {
    return (
      <Suspense fallback={fallback}>
        <Await resolve={data.__deferredData}>
          {(resolvedValue) => (
            <Component loaderData={resolvedValue} {...props} />
          )}
        </Await>
      </Suspense>
    );
  }
  return <Component {...props} />;
};

// ─── 3. Orchestrator (Composes the layers) ───
const RouteExecutionAdapter: React.FC<{
  Component: React.ComponentType<any>;
  fallback: ReactNode;
  route: AppRoute;
  [key: string]: any;
}> = ({ Component, fallback, route, ...props }) => {
  let element = <Component {...props} />;

  // 1. Pay-for-play: Only wrap in Suspense/Await if a loader or skeleton exists
  if (route.loader || route.skeleton) {
    element = (
      <DeferredDataAdapter
        Component={Component}
        fallback={fallback}
        {...props}
      />
    );
  }

  // 2. Pay-for-play: Only inject the heavy RuntimeScope if lifecycle hooks are actually defined
  if (route.onEnter || route.onLeave || route.onUpdate || route.onBeforeLeave) {
    element = (
      <RouteLifecycleAdapter route={route}>{element}</RouteLifecycleAdapter>
    );
  }

  return <>{element}</>;
};

function buildElement(route: AppRoute, content: ReactNode = <Outlet />) {
  let element = content;

  if (route.wrapper) element = <route.wrapper>{element}</route.wrapper>;
  if (route.layout)
    element = <route.layout route={route}>{element}</route.layout>;

  return element;
}

function buildIndexRoute(route: AppRoute, services: RouterServiceBag) {
  if (!route.page) return null;

  return {
    index: true,
    loader: buildLoader(route.loader, route, services),
    action: buildAction(route.action, route, services),
    element: (
      <RouteExecutionAdapter
        Component={route.page}
        fallback={getFallback(route)}
        route={route}
      />
    ),
    handle: route,
  };
}

// --------------------- Route Object Builder --------------------- //

export function buildRouteObject(
  route: AppRoute<any, any, any>,
  services: RouterServiceBag
): RouteObject {
  if (route.redirectTo && !route.page && !route.children) {
    return {
      path: route.path,
      element: <Navigate to={route.redirectTo} replace />,
    };
  }

  let elementContent: ReactNode = <Outlet />;
  let children: RouteObject[] | undefined = undefined;

  switch (true) {
    case !!route.page && (!route.children || route.children.length === 0):
      elementContent = (
        <RouteExecutionAdapter
          Component={route.page}
          fallback={getFallback(route)}
          route={route}
        />
      );
      break;

    case !!route.children && route.children.length > 0:
      children = route.children.map((c) =>
        buildRouteObject(c as any, services)
      );

      if (route.page) {
        const indexRoute = buildIndexRoute(route, services);
        if (indexRoute) children.unshift(indexRoute as RouteObject);
      }
      break;

    default:
      elementContent = <Outlet />;
  }

  if (route.lazy) {
    return {
      path: route.index ? undefined : route.path,
      index: route.index,
      lazy: async () => {
        const module = await route.lazy!();
        return {
          Component: (props: any) => (
            <RouteExecutionAdapter
              Component={module.Component}
              fallback={getFallback(route)}
              route={route}
              {...props}
            />
          ),
          loader: buildLoader(module.loader, route, services),
          action: buildAction(module.action, route, services),
          errorElement: route.errorBoundary ? (
            <RouteErrorBoundary config={route.errorBoundary} />
          ) : (
            route.errorElement
          ),
        };
      },
      handle: route,
      children: children,
    } as RouteObject;
  }

  return {
    path: route.index ? undefined : route.path,
    index: route.index,
    loader: buildLoader(route.loader, route, services),
    action: buildAction(route.action, route, services),
    element: buildElement(route, elementContent),
    errorElement: route.errorBoundary ? (
      <RouteErrorBoundary config={route.errorBoundary} />
    ) : (
      route.errorElement
    ),
    handle: route,
    children: children,
  } as RouteObject;
}

// --------------------- Router Factory --------------------- //

export function createAppRouterFromRoutes(
  routes: AppRoute[],
  services: RouterServiceBag
) {
  if (!routes || routes.length === 0) {
    console.error("❌ [ROUTING ERROR]: Router initialized with zero routes.");
  }

  // Initialize Prefetch Manager globally with compiled routes
  prefetchManager.init(routes, services);

  // 🚀 AUTOMATION: Auto-prefetch the matched route and its co-located loaders for the landing path
  if (typeof window !== "undefined") {
    const currentPath = window.location.pathname + window.location.search;
    prefetchManager.prefetch(currentPath);
  }

  try {
    const routeObjects = routes.map((r) => buildRouteObject(r, services));
    return createBrowserRouter(routeObjects);
  } catch (error) {
    console.error(
      "❌ [ROUTING ERROR]: Failed to construct browser router:",
      error
    );
    throw error;
  }
}
