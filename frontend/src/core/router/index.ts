export type {
  PlatformUrlPort,
  PlatformUrlSetOptions,
  PlatformUrlDeleteOptions,
} from "./ports/PlatformUrlPort";

export {
  PlatformUrlAdapters,
  type PlatformUrlAdapterOptions,
} from "./adapters/PlatformUrlAdapters";

export {
  usePlatformNavigation,
  usePlatformUrlParams,
} from "./hooks/usePlatformNavigation";

export {
  parseQueryPrimitive,
  parseQueryArray,
  serializeQueryPrimitive,
  serializeObjectToEntries,
  deserializeEntriesToObject,
  stringifyQuery,
  parseQuery,
  type SerializeOptions,
  type DeserializeOptions,
} from "./utils/url-serializer";

export {
  composeApplication,
  type ComposeApplicationInput,
  type ComposedApplication,
  type PlatformManifest,
} from "./composition/compose-application";

export {
  validateRegistrations,
  formatValidationReport,
  type ValidationIssue,
  type ValidationResult,
  type ValidationSeverity,
} from "./validation/validate-registrations";

export {
  createRouterAppInstance,
  defaultRouterApp,
  registerModule,
  ModuleRegistry,
  moduleRegistry,
  NavigationRegistry,
  navigationRegistry,
  TableRouteBindingRegistry,
  tableRouteBindingRegistry,
  type TableRouteBindingEntry,
  type RouterAppInstance,
} from "./registries";

export type {
  RouteNavigationPort,
  NavigateToRouteOptions,
} from "./ports/RouteNavigationPort";

export type {
  TableUrlState,
  TableUrlStatePort,
  TableUrlStateUpdateOptions,
} from "./ports/TableUrlStatePort";

export {
  useRouteNavigation,
  substituteParams,
} from "./hooks/useRouteNavigation";

export {
  useNavigationItems,
  type ResolvedNavigationItem,
  type UseNavigationItemsOptions,
} from "./hooks/useNavigationItems";

export {
  useTableUrlState,
  type UseTableUrlStateOptions,
} from "./hooks/useTableUrlState";

export {
  useTableRoutes,
  type ResolvedTableRoutes,
} from "./hooks/useTableRoutes";

export {
  CompositionProvider,
  useRouterComposition,
  type RouterComposition,
} from "./composition/CompositionContext";

export {
  RouterServicesProvider,
  useRouterServices,
  type RouterHttpServices,
} from "./services/RouterServicesContext";

export {
  buildRouteObject,
  createAppRouterFromRoutes,
  type RouterServiceBag,
} from "./adapters/ReactRouterAdapter";

export { AppPaths } from "@shell/paths";
