/**
 * @file index.ts
 * @description Form Runtime & Composition Contexts
 *
 * Encapsulates the 22 reactive context providers, manager hooks, and state stores
 * orchestrating the ZenOS Form Runtime.
 */

// ── Orchestrator & Runtime Composition Root ─────────────────────────
export {
  FormRuntimeProvider,
  type FormRuntimeConfig,
} from "./FormRuntimeProvider";
export {
  FormOrchestratorContext,
  FormOrchestratorProvider,
  useFormOrchestrator,
  usePrimitiveRuntime,
  type FormOrchestratorValue,
  type RoutingRenderProps,
} from "./FormOrchestratorContext";

// ── Scoped Layout & Surface Contexts ────────────────────────────────
export {
  SurfaceProvider,
  useSurface,
  type SurfaceContextValue,
  type LayoutMode,
} from "./SurfaceContext";
export {
  WizardProvider,
  useWizard,
  type WizardContextValue,
} from "./WizardContext";
export {
  LayoutManagerProvider,
  useLayoutManager,
  useTabsNode,
  useAccordionNode,
  type LayoutManagerContextValue,
} from "./LayoutManagerContext";
export {
  LayoutProvider,
  useLayout,
  type LayoutContextValue,
} from "./LayoutContext";
export {
  FormSpacingProvider,
  useFormSpacing,
  withFormSpacing,
} from "./FormSpacingContext";
export {
  createLayoutStore,
  type LayoutState,
  type LayoutStore,
} from "./createLayoutStore";

// ── Core Service & Dependency Injection Contexts ────────────────────
export {
  ControlProvider,
  useControlManager,
  useFieldControl,
  type ControlManagerValue,
} from "./ControlContext";
export {
  PermissionProvider,
  usePermissionManager,
  useFieldPermission,
  type PermissionManagerValue,
  type FieldPermission,
  type FieldPermissionResult,
  type PermissionMap,
} from "./PermissionContext";
export {
  DataSourceProvider,
  useDataSourceManager,
  useDataSource,
  type DataSourceManagerValue,
  type FieldDataSourceResult,
} from "./DataSourceContext";
export {
  ActionProvider,
  useFormActionManager,
  useFormAction,
  type FormActionManagerValue,
  type FormActionHandler,
} from "./ActionContext";
export {
  ServiceProvider,
  useServiceManager,
  useService,
  type ServiceManagerValue,
  type ServiceProviderProps,
} from "./ServiceContext";
export {
  ExpressionProvider,
  useExpressionContext,
  type ExpressionContextValue,
} from "./ExpressionContext";
export {
  BindingProvider,
  useBindingManager,
  useFieldBinding,
  type BindingManagerValue,
} from "./BindingContext";

// ── Registry, Theme & Routing Providers ─────────────────────────────
export {
  FormRegistryProvider,
  useFormRegistry,
} from "./FormRegistryContext";
export {
  ManifestRegistryProvider,
  useManifestRegistry,
} from "./ManifestRegistryContext";
export {
  FormThemeProvider,
  useFormTheme,
  useStyleAdapter,
} from "./FormThemeContext";
export {
  FormRoutingProvider,
  useFieldRouter,
  useStructureRenderer,
} from "./FormRoutingContext";
export {
  FormShellProvider,
  useFormShell,
} from "./FormShellContext";
export {
  FormDIProvider,
  useFormEngine,
  useInjectedField,
} from "./FormDIProvider";
export {
  FieldCompositionContext,
  FieldCompositionProvider,
  useFieldComposition,
  useFieldCompositionContext,
  type FieldCompositionMode,
  type FieldCompositionContextValue,
} from "./FieldCompositionContext";
