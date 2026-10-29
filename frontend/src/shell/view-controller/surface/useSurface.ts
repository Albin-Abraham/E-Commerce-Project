/**
 * ── useSurface hooks ─────────────────────────────────────────────────────────
 *
 * Consumer-facing API for the SurfaceManager.
 * Feature modules should import from here, never from SurfaceManager directly.
 */
import { useCallback, useMemo } from "react";

import { useSurfaceManager } from "./SurfaceManager";
import type { Surface, SurfaceKind } from "./surface.types";
import { SurfacePresets } from "./surface.types";

// ── Read hooks ────────────────────────────────────────────────────────────────

/** Get a single surface by id. Returns undefined if not open. */
export function useSurface(id: string): Surface | undefined {
  return useSurfaceManager((s) => s.surfaces[id]);
}

/** Get all surfaces of a given kind. */
export function useSurfacesByKind(kind: SurfaceKind): Surface[] {
  const surfaces = useSurfaceManager((s) => s.surfaces);
  return useMemo(
    () =>
      Object.values(surfaces).filter(
        (s) => s.kind === kind && s.lifecycle !== "closed"
      ),
    [surfaces, kind]
  );
}

/** Whether any blocking overlay is currently active. */
export function useHasBlockingSurface(): boolean {
  return useSurfaceManager((s) => s.hasBlocking());
}

/** The currently "active" surface (top blocking, fallback to top non-blocking). */
export function useActiveSurface(): Surface | undefined {
  return useSurfaceManager((s) => s.getActiveSurface());
}

/** Navigation surface state. */
export function useNavigationSurface() {
  const nav = useSurfaceManager((s) => s.surfaces["navigation"]);
  const setNavigationState = useSurfaceManager((s) => s.setNavigationState);
  const navState = (nav?.payload?.state as string) ?? "expanded";

  return {
    surface: nav,
    isExpanded: navState === "expanded",
    isCollapsed: navState === "collapsed",
    isTemporary: navState === "temporary",
    width: (nav?.geometry?.width as number) ?? 280,
    expand: useCallback(() => setNavigationState("expanded"), [setNavigationState]),
    collapse: useCallback(() => setNavigationState("collapsed"), [setNavigationState]),
    setTemporary: useCallback(() => setNavigationState("temporary"), [setNavigationState]),
    toggle: useCallback(
      () => setNavigationState(navState === "expanded" ? "collapsed" : "expanded"),
      [navState, setNavigationState]
    ),
  };
}

// ── Write hooks ───────────────────────────────────────────────────────────────

/** Full surface dispatch API. */
export function useSurfaceActions() {
  const open = useSurfaceManager((s) => s.open);
  const close = useSurfaceManager((s) => s.close);
  const remove = useSurfaceManager((s) => s.remove);
  const update = useSurfaceManager((s) => s.update);
  const closeKind = useSurfaceManager((s) => s.closeKind);
  const transition = useSurfaceManager((s) => s.transition);

  return {
    open,
    close,
    remove,
    update,
    closeKind,
    transition,

    // ── Shorthand helpers ──────────────────────────────────────────────────
    openDrawer: useCallback(
      (opts: Parameters<typeof SurfacePresets.drawer>[0]) => open(SurfacePresets.drawer(opts)),
      [open]
    ),
    openOverlay: useCallback(
      (opts: Parameters<typeof SurfacePresets.overlay>[0]) => open(SurfacePresets.overlay(opts)),
      [open]
    ),
    openNotification: useCallback(
      (opts: Parameters<typeof SurfacePresets.notification>[0]) =>
        open(SurfacePresets.notification(opts)),
      [open]
    ),
    openPopover: useCallback(
      (opts: Parameters<typeof SurfacePresets.popover>[0]) => open(SurfacePresets.popover(opts)),
      [open]
    ),
    openActionBar: useCallback(
      (opts: Parameters<typeof SurfacePresets.actionBar>[0]) =>
        open(SurfacePresets.actionBar(opts)),
      [open]
    ),

    /** Confirm / acknowledge a surface — transitions it to "open" after mounting animation. */
    acknowledge: useCallback(
      (id: string) => transition(id, "open"),
      [transition]
    ),
  };
}

/** Convenience hook for features that only need to open/close drawers. */
export function useDrawer(id: string) {
  const surface = useSurface(id);
  const { openDrawer, close } = useSurfaceActions();

  return {
    isOpen: surface !== undefined && surface.lifecycle !== "closed",
    surface,
    open: (opts: Omit<Parameters<typeof SurfacePresets.drawer>[0], "id">) =>
      openDrawer({ id, ...opts }),
    close: () => close(id),
  };
}

/** Convenience hook for overlay (dialog/confirmation) management. */
export function useOverlay(id: string) {
  const surface = useSurface(id);
  const { openOverlay, close } = useSurfaceActions();

  return {
    isOpen: surface !== undefined && surface.lifecycle !== "closed",
    surface,
    open: (opts: Omit<Parameters<typeof SurfacePresets.overlay>[0], "id">) =>
      openOverlay({ id, ...opts }),
    close: () => close(id),
  };
}
