/**
 * ── SURFACE MANAGER ──────────────────────────────────────────────────────────
 *
 * Zustand store that owns the full lifecycle of every platform surface.
 * Single source of truth for: what surfaces exist, their state, their stack order.
 *
 * Responsibilities:
 *   - Register / deregister surfaces
 *   - Transition lifecycle (mounting → open → closing → closed)
 *   - Maintain a priority-ordered visual stack
 *   - Derive the "active" surface (top blocking, or top non-blocking)
 *
 * NOT responsible for:
 *   - Layout geometry  → LayoutCoordinator
 *   - Business logic   → ActionManager / Feature services
 *   - Rendering        → Surface renderer components
 */
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import type { Surface, SurfaceKind, SurfaceLifecycle } from "./surface.types";
import { SurfacePresets } from "./surface.types";

// ── State shape ───────────────────────────────────────────────────────────────

interface SurfaceManagerState {
  /** All registered surfaces keyed by id */
  surfaces: Record<string, Surface>;
  /** Priority-ordered list of surface IDs (highest-priority last → renders on top) */
  visualStack: string[];

  // ── Mutations ──────────────────────────────────────────────────────────────

  /** Open or replace a surface. Lifecycle starts at "mounting". */
  open: (surface: Surface) => void;
  /** Update a surface's payload without changing lifecycle. */
  update: (id: string, payload: Record<string, unknown>) => void;
  /** Drive the lifecycle state machine. */
  transition: (id: string, lifecycle: SurfaceLifecycle) => void;
  /** Close (set lifecycle="closing", then auto-remove after animation window). */
  close: (id: string) => void;
  /** Immediately remove without animation — use for navigation resets. */
  remove: (id: string) => void;
  /** Close all surfaces of a given kind (except "navigation"). */
  closeKind: (kind: SurfaceKind) => void;
  /** Close all drawers on route change (called by router integration). */
  closeOnNavigate: () => void;
  /** Collapse / expand the navigation surface. */
  setNavigationState: (state: "expanded" | "collapsed" | "temporary") => void;

  // ── Queries ────────────────────────────────────────────────────────────────

  getSurface: (id: string) => Surface | undefined;
  /** Top-of-stack blocking surface, or top non-blocking if none. */
  getActiveSurface: () => Surface | undefined;
  getByKind: (kind: SurfaceKind) => Surface[];
  hasBlocking: () => boolean;
}

// ── Stack ordering ────────────────────────────────────────────────────────────

const KIND_ORDER: Record<SurfaceKind, number> = {
  navigation: 0,
  "action-bar": 1,
  drawer: 2,
  popover: 3,
  overlay: 4,
  notification: 5,
};

function buildStack(surfaces: Record<string, Surface>): string[] {
  return Object.values(surfaces)
    .filter((s) => s.lifecycle !== "closed")
    .sort((a, b) => {
      const kindDiff = KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
      return kindDiff !== 0 ? kindDiff : a.priority - b.priority;
    })
    .map((s) => s.id);
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useSurfaceManager = create<SurfaceManagerState>()(
  subscribeWithSelector((set, get) => ({
    // Seed with navigation surface so it always exists
    surfaces: { navigation: SurfacePresets.navigation() },
    visualStack: ["navigation"],

    // ── Mutations ────────────────────────────────────────────────────────────

    open: (surface) =>
      set((state) => {
        const next = { ...state.surfaces, [surface.id]: surface };
        return { surfaces: next, visualStack: buildStack(next) };
      }),

    update: (id, payload) =>
      set((state) => {
        if (!state.surfaces[id]) return state;
        const next = {
          ...state.surfaces,
          [id]: { ...state.surfaces[id], payload: { ...state.surfaces[id].payload, ...payload } },
        };
        return { surfaces: next };
      }),

    transition: (id, lifecycle) =>
      set((state) => {
        if (!state.surfaces[id]) return state;
        const next = {
          ...state.surfaces,
          [id]: { ...state.surfaces[id], lifecycle },
        };
        return { surfaces: next, visualStack: buildStack(next) };
      }),

    close: (id) => {
      // 1. Set to "closing" so renderers can animate out
      set((state) => {
        if (!state.surfaces[id]) return state;
        const next = {
          ...state.surfaces,
          [id]: { ...state.surfaces[id], lifecycle: "closing" as SurfaceLifecycle },
        };
        return { surfaces: next, visualStack: buildStack(next) };
      });
      // 2. Auto-remove after animation window (300ms matches typical CSS transitions)
      setTimeout(() => get().remove(id), 320);
    },

    remove: (id) =>
      set((state) => {
        if (id === "navigation") return state; // Navigation is immortal
        const { [id]: _removed, ...rest } = state.surfaces;
        return { surfaces: rest, visualStack: buildStack(rest) };
      }),

    closeKind: (kind) => {
      const { surfaces, close } = get();
      Object.values(surfaces)
        .filter((s) => s.kind === kind && s.kind !== "navigation")
        .forEach((s) => close(s.id));
    },

    closeOnNavigate: () => {
      const { surfaces, close } = get();
      // Close surfaces with "user-or-navigation" policy UNLESS they opted into persistence
      Object.values(surfaces)
        .filter(
          (s) =>
            s.dismissal.policy === "user-or-navigation" && !s.persistOnNavigation
        )
        .forEach((s) => close(s.id));
    },

    setNavigationState: (navState) =>
      set((state) => {
        const nav = state.surfaces["navigation"];
        if (!nav) return state;
        const width = navState === "collapsed" ? 64 : navState === "temporary" ? 0 : 280;
        const next = {
          ...state.surfaces,
          navigation: {
            ...nav,
            payload: { ...nav.payload, state: navState },
            geometry: { ...nav.geometry, width },
          },
        };
        return { surfaces: next };
      }),

    // ── Queries ──────────────────────────────────────────────────────────────

    getSurface: (id) => get().surfaces[id],

    getActiveSurface: () => {
      const { surfaces, visualStack } = get();
      // Prefer the topmost blocking surface
      const blocking = [...visualStack]
        .reverse()
        .map((id) => surfaces[id])
        .find((s) => s?.interaction === "blocking" && s.lifecycle !== "closed");
      if (blocking) return blocking;
      // Fallback: topmost open non-blocking surface
      return [...visualStack]
        .reverse()
        .map((id) => surfaces[id])
        .find((s) => s && s.lifecycle !== "closed");
    },

    getByKind: (kind) =>
      Object.values(get().surfaces).filter(
        (s) => s.kind === kind && s.lifecycle !== "closed"
      ),

    hasBlocking: () =>
      Object.values(get().surfaces).some(
        (s) => s.interaction === "blocking" && s.lifecycle !== "closed"
      ),
  }))
);
