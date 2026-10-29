/**
 * ── LAYOUT COORDINATOR ───────────────────────────────────────────────────────
 *
 * Pure derivation layer — answers only one question:
 * "Given which surfaces are open and docked, how much space does content get?"
 *
 * Subscribes to SurfaceManager and recomputes geometry on every surface change.
 * Components read geometry via useLayout() — never compute it themselves.
 *
 * Output shape maps directly to CSS custom properties injected on the root div.
 */
import { create } from "zustand";

import { useSurfaceManager } from "../surface/SurfaceManager";
import type { Surface } from "../surface/surface.types";

// ── Geometry shape ────────────────────────────────────────────────────────────

export interface ViewportGeometry {
  /** Width of the navigation surface in px (280 | 64 | 0) */
  sidebarWidth: number;
  /** Width of the primary right drawer in px (0 | 420 | etc.) */
  drawerRightWidth: number;
  /** Width of the primary left drawer in px (0 | ...) */
  drawerLeftWidth: number;
  /** Height of the action bar in px (0 | 56) */
  actionBarHeight: number;
  /** Whether any blocking overlay dims the layout */
  hasBlockingOverlay: boolean;
  /** CSS custom property map — inject directly onto the root element */
  cssVars: Record<string, string>;
}

interface LayoutState extends ViewportGeometry {
  /** Called by the subscription whenever surfaces change */
  recompute: (surfaces: Record<string, Surface>) => void;
}

// ── Derivation ────────────────────────────────────────────────────────────────

function derive(surfaces: Record<string, Surface>): ViewportGeometry {
  const all = Object.values(surfaces).filter((s) => s.lifecycle !== "closed");

  const nav = surfaces["navigation"];
  const sidebarWidth =
    nav?.presentation === "docked" ? ((nav.geometry?.width as number) ?? 280) : 0;

  // Docked right drawers
  const rightDrawers = all.filter(
    (s) => s.kind === "drawer" && s.presentation === "docked" && s.geometry?.side === "right"
  );
  const drawerRightWidth = rightDrawers.reduce(
    (sum, s) => sum + ((s.geometry?.width as number) ?? 0),
    0
  );

  // Docked left drawers (not navigation)
  const leftDrawers = all.filter(
    (s) => s.kind === "drawer" && s.presentation === "docked" && s.geometry?.side === "left"
  );
  const drawerLeftWidth = leftDrawers.reduce(
    (sum, s) => sum + ((s.geometry?.width as number) ?? 0),
    0
  );

  // Action bar
  const actionBar = all.find((s) => s.kind === "action-bar" && s.presentation === "docked");
  const actionBarHeight = actionBar ? ((actionBar.geometry?.height as number) ?? 56) : 0;

  // Blocking overlay
  const hasBlockingOverlay = all.some(
    (s) => s.interaction === "blocking" && s.lifecycle !== "closed"
  );

  const cssVars: Record<string, string> = {
    "--vc-sidebar-width": `${sidebarWidth}px`,
    "--vc-drawer-right-width": `${drawerRightWidth}px`,
    "--vc-drawer-left-width": `${drawerLeftWidth}px`,
    "--vc-action-bar-height": `${actionBarHeight}px`,
    "--vc-content-width": `calc(100vw - ${sidebarWidth}px - ${drawerRightWidth}px - ${drawerLeftWidth}px)`,
  };

  return {
    sidebarWidth,
    drawerRightWidth,
    drawerLeftWidth,
    actionBarHeight,
    hasBlockingOverlay,
    cssVars,
  };
}

// ── Zustand store ─────────────────────────────────────────────────────────────

export const useLayoutCoordinator = create<LayoutState>()((set) => ({
  sidebarWidth: 280,
  drawerRightWidth: 0,
  drawerLeftWidth: 0,
  actionBarHeight: 0,
  hasBlockingOverlay: false,
  cssVars: {
    "--vc-sidebar-width": "280px",
    "--vc-drawer-right-width": "0px",
    "--vc-drawer-left-width": "0px",
    "--vc-action-bar-height": "0px",
    "--vc-content-width": "calc(100vw - 280px)",
  },
  recompute: (surfaces) => set(derive(surfaces)),
}));

// ── Bootstrap subscription ────────────────────────────────────────────────────
// Called once by LayoutProvider — wires SurfaceManager → LayoutCoordinator.

export function bootstrapLayoutSubscription(): () => void {
  // Run once immediately with current surfaces (synchronous — must be before first paint)
  useLayoutCoordinator
    .getState()
    .recompute(useSurfaceManager.getState().surfaces);

  // Subscribe to all future surface changes.
  // Wrapped in startTransition so rapid surface mutations (drawer + notification
  // opening simultaneously) are batched as a single low-priority layout update
  // rather than two synchronous Zustand state flushes.
  const scheduleRecompute =
    typeof window !== "undefined" && "startTransition" in window
      ? (surfaces: Record<string, Surface>) => {
          const { startTransition } = window as any;
          if (typeof startTransition === "function") {
            startTransition(() =>
              useLayoutCoordinator.getState().recompute(surfaces)
            );
          } else {
            useLayoutCoordinator.getState().recompute(surfaces);
          }
        }
      : (surfaces: Record<string, Surface>) =>
          useLayoutCoordinator.getState().recompute(surfaces);

  return useSurfaceManager.subscribe(
    (state) => state.surfaces,
    (surfaces) => scheduleRecompute(surfaces)
  );
}
