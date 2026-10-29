/**
 * ── useLayout hooks ───────────────────────────────────────────────────────────
 * Consumer API for LayoutCoordinator geometry.
 */
import { useLayoutCoordinator } from "./LayoutCoordinator";

export function useLayout() {
  return useLayoutCoordinator((s) => ({
    sidebarWidth: s.sidebarWidth,
    drawerRightWidth: s.drawerRightWidth,
    drawerLeftWidth: s.drawerLeftWidth,
    actionBarHeight: s.actionBarHeight,
    hasBlockingOverlay: s.hasBlockingOverlay,
    cssVars: s.cssVars,
  }));
}

export function useCssVars() {
  return useLayoutCoordinator((s) => s.cssVars);
}

export function useSidebarWidth() {
  return useLayoutCoordinator((s) => s.sidebarWidth);
}

export function useHasBlockingOverlay() {
  return useLayoutCoordinator((s) => s.hasBlockingOverlay);
}
