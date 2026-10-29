import type { ComponentType, LazyExoticComponent, ReactNode } from "react";

import type { PlatformCommand } from "@core/events/config/shortcuts";
import type { HttpClient } from "@core/http";
import type { GlobalState } from "@core/state";

export enum RouterEvent {
  RouteEntering = "RouteEntering",
  RouteEntered = "RouteEntered",
  RouteUpdating = "RouteUpdating",
  RouteLeaving = "RouteLeaving",
  RouteDisposed = "RouteDisposed",
}

/**
 * Loader Context (CSR Only)
 */
export interface LoaderContext<User = unknown, State = GlobalState> {
  params: Record<string, string>;
  search: URLSearchParams;
  signal?: AbortSignal;

  getUser: () => User | undefined;
  getPermissions: () => string[] | undefined;
  getTenant: () => Record<string, any> | undefined;
  state: () => State;

  /** Injected Services */
  services: {
    public: HttpClient;
    auth: HttpClient;
    queryClient: import("@tanstack/react-query").QueryClient;
  };
}

/**
 * Guard Types (Modern OOP)
 */
export type GuardHandler<User = unknown, State = GlobalState> = (
  ctx: LoaderContext<User, State>
) => boolean | string | Promise<boolean | string>;

export abstract class BaseGuard<User = unknown, State = GlobalState> {
  abstract id: string;
  abstract check: GuardHandler<User, State>;
}

/**
 * Component types
 */
export type PageComponent = ComponentType<any>;
export type LayoutComponent = ComponentType<{
  children: ReactNode;
  route?: AppRoute<any, any, any>;
}>;
export type WrapperComponent = ComponentType<{
  children: ReactNode;
  route?: AppRoute<any, any, any>;
}>;

/**
 * Permissions
 */
export interface RoutePermissions<
  Role extends string = string,
  User = unknown,
> {
  all?: Role[];
  any?: Role[];
  none?: Role[];
  bypass?: Role[];

  validate?: (user: User | undefined) => boolean | Promise<boolean>;
}

/**
 * Feature flags
 */
export interface RouteFeatureFlags<Flag extends string = string> {
  required?: Flag[];
  any?: Flag[];
  disabled?: Flag[];
  bypass?: Flag[];

  check?: (flags: Record<Flag, boolean>) => boolean;
}

/**
 * Guards
 */
export type GuardType = "permission" | "feature" | "custom";

export interface RouteGuard<User = unknown, State = GlobalState> {
  type: GuardType;
  handler: GuardHandler<User, State>;
  id?: string;
}

/**
 * Error Boundary Config
 */
export interface RouteErrorBoundaryConfig {
  component?: React.ComponentType<any>;
  onError?: (error: Error, context: LoaderContext<any, any>) => void;
  fallback?: "redirect-home" | "inline" | "full-page";
}

/**
 * SEO
 */
export interface RouteSEO {
  title?: string;
  description?: string;
  keywords?: string[];
}

/**
 * Analytics
 */
export interface RouteAnalytics {
  pageName?: string;
  eventName?: string;
  track?: boolean;
}

/**
 * Cache policy
 */
export interface RouteCachePolicy {
  ttl?: number;
  revalidate?: boolean;
}

/**
 * Route Presentation Layer (React UI concerns)
 */
export interface RoutePresentation {
  page?: PageComponent | LazyExoticComponent<PageComponent>;
  layout?: LayoutComponent;
  wrapper?: WrapperComponent;
  skeleton?: ReactNode;
  errorElement?: ReactNode;
  errorBoundary?: RouteErrorBoundaryConfig;
  suspense?: ReactNode;
  displayMode?: "page" | "modal" | "drawer" | "onCanvas";
  portalProps?: {
    title?: string;
    width?: string | number;
    showCloseButton?: boolean;
    closeOnOverlayClick?: boolean;
    offset?: { x: number; y: number };
  };
}

/**
 * Route Metadata Layer (Static properties for tools/capabilities)
 */
export interface RouteMetadata<Meta = Record<string, unknown>> {
  label?: string;
  icon?: ReactNode;
  moduleKey?: string;
  visibleInSidebar?: boolean;
  seo?: RouteSEO;
  analytics?: RouteAnalytics;
  meta?: Meta;
  breadcrumb?: string | ((data: any) => ReactNode);
  verboseLabel?: string;
  intent?: "create" | "edit" | "view" | "list" | "manage" | "dashboard";
  shortcuts?: {
    key: string | string[];
    command: PlatformCommand;
    description: string;
  }[];
  slots?: {
    name: string;
    component: React.ComponentType<any>;
    props?: Record<string, any>;
    priority?: number;
  }[];
}

/**
 * Route Runtime Layer (Execution, fetching, lifecycle)
 */
export interface RouteRuntime<
  User = unknown,
  State = GlobalState,
  LoaderResult = unknown,
  ActionResult = unknown,
> {
  loader?: (ctx: LoaderContext<User, State>) => Promise<LoaderResult>;
  action?: (ctx: LoaderContext<User, State>) => Promise<ActionResult>;
  lazy?: () => Promise<{
    Component: React.ComponentType<any>;
    loader?: (ctx: LoaderContext<User, State>) => Promise<any> | any;
    action?: (ctx: LoaderContext<User, State>) => Promise<any> | any;
  }>;
  preload?: () => Promise<any>;
  guards?: RouteGuard<User, State>[];
  permissions?: RoutePermissions<any, User>;
  featureFlags?: RouteFeatureFlags<any>;
  cache?: RouteCachePolicy;
  beforeEnter?: (ctx: LoaderContext<User, State>) => void | Promise<void>;
  onEnter?: (
    ctx: LoaderContext<User, State>
  ) => void | Promise<void> | (() => void);
  afterEnter?: (ctx: LoaderContext<User, State>) => void | Promise<void>;
  onUpdate?: (
    ctx: LoaderContext<User, State>,
    changes: {
      previous: {
        params: Record<string, string | undefined>;
        search: URLSearchParams;
      };
      current: {
        params: Record<string, string | undefined>;
        search: URLSearchParams;
      };
    }
  ) => void | Promise<void>;
  onBeforeLeave?: (ctx: LoaderContext<User, State>) => boolean;
  onLeave?: (ctx: LoaderContext<User, State>) => void | Promise<void>;
  afterLeave?: (ctx: LoaderContext<User, State>) => void | Promise<void>;
  onError?: (error: Error, ctx: LoaderContext<User, State>) => void;
  inheritance?: {
    layout?: boolean;
    permissions?: boolean;
    featureFlags?: boolean;
    seo?: boolean;
    analytics?: boolean;
    meta?: boolean;
  };
}

/**
 * Main AppRoute (Composes Presentation, Metadata, and Runtime)
 */
export interface AppRoute<
  LoaderResult = unknown,
  ActionResult = unknown,
  Meta = Record<string, unknown>,
  User = unknown,
  Role extends string = string,
  Flag extends string = string,
  State = GlobalState,
>
  extends
    RoutePresentation,
    RouteMetadata<Meta>,
    RouteRuntime<User, State, LoaderResult, ActionResult> {
  /** Stable, unique route identifier (e.g. "products.list"). Required. */
  id: string;
  /**
   * Route matching path. Required unless `index` is true (index routes match
   * the parent path and therefore have no path of their own).
   */
  path?: string;
  index?: boolean;
  redirectTo?: string;

  /**
   * Ancestry link to the parent route's id. Derived automatically during
   * composition from the `children` tree — do not set by hand.
   */
  parentId?: string;

  /** Stable identifier of a registered layout (resolved in a later phase). */
  layoutId?: string;

  children?: AppRoute<any, any, Meta, User, Role, Flag, State>[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Module contribution contracts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Navigation contribution contract.
 * Resolved through stable routeIds by the navigation layer (Phase 2).
 */
export interface NavigationContribution {
  id: string;
  label: string;
  /** Preferred internal destination reference. */
  routeId?: string;
  /** External destinations continue to use href. */
  href?: string;
  parentId?: string;
  group?: string;
  icon?: unknown;
  order?: number;
  target?: string;
}

/**
 * Layout contribution contract (registry resolution lands in Phase 4).
 */
export interface LayoutContribution {
  id: string;
  component: LayoutComponent;
  /** Layout-level feature configuration (e.g. breadcrumbs presentation). */
  features?: Record<string, unknown>;
}

/**
 * Slot contribution contract — a module's named UI extension points.
 */
export interface SlotContribution {
  name: string;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
  priority?: number;
}

/**
 * Table-to-route binding contract (registry lands in Phase 3).
 */
export interface TableRouteBinding {
  tableId: string;
  listRouteId: string;
  detailsRouteId?: string;
  createRouteId?: string;
  editRouteId?: string;
}

/**
 * ModuleDefinition
 *
 * A pure description of a feature module's contributions. Modules do not
 * self-register — the composition layer decides how contributions are
 * registered, validated, and assembled.
 */
export interface ModuleDefinition<
  Meta = Record<string, unknown>,
  User = unknown,
  Role extends string = string,
  Flag extends string = string,
  State = GlobalState,
> {
  id: string;
  label?: string;
  icon?: ReactNode;

  layout?: LayoutComponent;
  wrapper?: WrapperComponent;

  routes: AppRoute<any, any, Meta, User, Role, Flag, State>[];

  navigation?: NavigationContribution[];
  layouts?: LayoutContribution[];
  slots?: SlotContribution[];
  tableBindings?: TableRouteBinding[];

  meta?: Meta;
  guards?: RouteGuard<User, State>[];

  /** Manifest-controlled enablement. Defaults to true. */
  enabled?: boolean;
}

/** @deprecated Use ModuleDefinition. Kept as an alias for existing imports. */
export type RouteModule<
  Meta = Record<string, unknown>,
  User = unknown,
  Role extends string = string,
  Flag extends string = string,
  State = GlobalState,
> = ModuleDefinition<Meta, User, Role, Flag, State>;

export const defineRoute = <
  LR = unknown,
  AR = unknown,
  M = Record<string, unknown>,
  U = unknown,
  R extends string = string,
  F extends string = string,
  S = GlobalState,
>(
  route: AppRoute<LR, AR, M, U, R, F, S>
): AppRoute<LR, AR, M, U, R, F, S> => route;

export const defineModule = <
  M = Record<string, unknown>,
  U = unknown,
  R extends string = string,
  F extends string = string,
  S = GlobalState,
>(
  mod: ModuleDefinition<M, U, R, F, S>
): ModuleDefinition<M, U, R, F, S> => mod;
