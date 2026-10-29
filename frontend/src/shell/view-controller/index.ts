/**
 * ── VIEW CONTROLLER — PUBLIC API ─────────────────────────────────────────────
 *
 * Feature modules import from here. Never import directly from sub-modules.
 */

// ── Surface ───────────────────────────────────────────────────────────────────
export type {
  Surface,
  SurfaceKind,
  SurfacePresentation,
  SurfaceLifecycle,
  InteractionMode,
  DismissalPolicy,
  SurfaceGeometry,
} from "./surface/surface.types";
export { SurfacePresets } from "./surface/surface.types";
export { useSurfaceManager } from "./surface/SurfaceManager";
export {
  useSurface,
  useSurfacesByKind,
  useSurfaceActions,
  useHasBlockingSurface,
  useActiveSurface,
  useNavigationSurface,
  useDrawer,
  useOverlay,
} from "./surface/useSurface";

// ── Layout ────────────────────────────────────────────────────────────────────
export { useLayout, useCssVars, useSidebarWidth, useHasBlockingOverlay } from "./layout/useLayout";

// ── Action ────────────────────────────────────────────────────────────────────
export type { PlatformAction, ActionResult, ActionHandler, ActionSource } from "./action/action.types";
export { useActionManager } from "./action/ActionManager";
export { useDispatch, useActionPending, useActionHandler, useOperationDispatch } from "./action/useAction";

// ── ViewController ────────────────────────────────────────────────────────────
export { ViewControllerProvider, NavigationSurfaceSync } from "./ViewController";
