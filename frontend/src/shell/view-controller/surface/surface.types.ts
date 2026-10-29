/**
 * ── SURFACE TYPES ────────────────────────────────────────────────────────────
 *
 * Surfaces are first-class platform citizens — data structures that describe
 * what exists, its behavior, and how it affects geometry.
 *
 * Rule: surfaces are data, not booleans.
 * Bad:  isDrawerOpen: true, isDismissible: true
 * Good: Surface { kind, lifecycle, dismissal: { policy } }
 */

/** The structural category of a surface. */
export type SurfaceKind =
  | "navigation"    // Sidebar — always present; state drives icon-only vs expanded
  | "drawer"        // Docked panel — record inspector, filter panel, activity feed
  | "overlay"       // Sits above all content — dialog, confirmation, command palette
  | "popover"       // Non-blocking anchored surface — filter, context menu, dropdown
  | "notification"  // Toast stack — lives outside layout geometry
  | "action-bar";   // Contextual toolbar — bulk actions, workflow steps

/**
 * How the surface is physically presented relative to the layout.
 * docked   → claims geometry (affects Viewport/content width)
 * floating → sits above without changing geometry
 * inline   → rendered inside content flow
 */
export type SurfacePresentation = "docked" | "floating" | "inline";

/**
 * What causes a surface to close. A policy — not a boolean.
 */
export type DismissalPolicy =
  | "explicit-action"           // Must press a button (confirmation, blocking dialog)
  | "outside-click-or-escape"   // Popovers, non-blocking dropdowns
  | "user-or-navigation"        // Drawers — stay open within route, close on navigate
  | "timed"                     // Auto-dismiss notifications
  | "never";                    // Navigation surface — always present

/** Mount/unmount animation lifecycle. */
export type SurfaceLifecycle = "mounting" | "open" | "closing" | "closed";

/**
 * Whether the surface blocks interaction behind it.
 * blocking     → disables interaction with content below (confirmation, modal)
 * non-blocking → content remains interactive (drawers, toasts, command palette)
 */
export type InteractionMode = "blocking" | "non-blocking";

/** Geometry hints — only meaningful for docked surfaces. */
export interface SurfaceGeometry {
  width?: number | string;
  height?: number | string;
  side?: "left" | "right" | "bottom";
  minWidth?: number;
  maxWidth?: number;
}

/** A Surface — the canonical unit managed by the SurfaceManager. */
export interface Surface {
  /** Unique stable identifier. e.g. "navigation", "drawer:record-inspector:INV-42" */
  id: string;
  kind: SurfaceKind;
  /**
   * Semantic type within the kind.
   * e.g. kind="overlay", type="confirmation"
   *      kind="drawer",  type="record-inspector"
   */
  type: string;
  presentation: SurfacePresentation;
  lifecycle: SurfaceLifecycle;
  interaction: InteractionMode;
  dismissal: {
    policy: DismissalPolicy;
    timeoutMs?: number; // Only for policy="timed"
  };
  /** Visual stacking priority within kind group. Higher = rendered on top. */
  priority: number;
  /** Arbitrary data the surface renderer needs. */
  payload?: Record<string, unknown>;
  /** Layout hints — only relevant for presentation="docked". */
  geometry?: SurfaceGeometry;
  /**
   * When true, this surface survives route changes even if its dismissal
   * policy is "user-or-navigation".
   *
   * Use for surfaces that represent in-page context switches
   * (e.g. a record inspector that remains open while the user switches
   * between detail tabs) rather than genuine navigation to a new route.
   */
  persistOnNavigation?: boolean;
}

// ── Factory helpers ───────────────────────────────────────────────────────────

export const SurfacePresets = {
  navigation(): Surface {
    return {
      id: "navigation",
      kind: "navigation",
      type: "sidebar",
      presentation: "docked",
      lifecycle: "open",
      interaction: "non-blocking",
      dismissal: { policy: "never" },
      priority: 0,
      geometry: { width: 280, side: "left" },
      payload: { state: "expanded" },
    };
  },

  drawer(opts: {
    id: string;
    type: string;
    payload?: Record<string, unknown>;
    geometry?: Partial<SurfaceGeometry>;
    interaction?: InteractionMode;
  }): Surface {
    return {
      id: opts.id,
      kind: "drawer",
      type: opts.type,
      presentation: "docked",
      lifecycle: "mounting",
      interaction: opts.interaction ?? "non-blocking",
      dismissal: { policy: "user-or-navigation" },
      priority: 10,
      geometry: { width: 420, side: "right", ...opts.geometry },
      payload: opts.payload,
    };
  },

  overlay(opts: {
    id: string;
    type: string;
    payload?: Record<string, unknown>;
    blocking?: boolean;
    dismissal?: DismissalPolicy;
  }): Surface {
    return {
      id: opts.id,
      kind: "overlay",
      type: opts.type,
      presentation: "floating",
      lifecycle: "mounting",
      interaction: opts.blocking !== false ? "blocking" : "non-blocking",
      dismissal: { policy: opts.dismissal ?? "explicit-action" },
      priority: 20,
      payload: opts.payload,
    };
  },

  // Command Palette surface preset
  commandPalette(opts: {
    id?: string;
    payload?: Record<string, unknown>;
  } = {}): Surface {
    return {
      id: opts.id ?? `command-palette-${Date.now()}`,
      kind: "overlay",
      type: "command-palette",
      presentation: "floating",
      lifecycle: "mounting",
      interaction: "non-blocking",
      dismissal: { policy: "outside-click-or-escape" },
      priority: 25,
      payload: opts.payload,
    };
  },

  notification(opts: {
    id: string;
    type?: string;
    payload: Record<string, unknown>;
    timeoutMs?: number;
  }): Surface {
    return {
      id: opts.id,
      kind: "notification",
      type: opts.type ?? "toast",
      presentation: "floating",
      lifecycle: "mounting",
      interaction: "non-blocking",
      dismissal: { policy: "timed", timeoutMs: opts.timeoutMs ?? 4000 },
      priority: 30,
      payload: opts.payload,
    };
  },

  popover(opts: {
    id: string;
    type: string;
    payload?: Record<string, unknown>;
  }): Surface {
    return {
      id: opts.id,
      kind: "popover",
      type: opts.type,
      presentation: "floating",
      lifecycle: "mounting",
      interaction: "non-blocking",
      dismissal: { policy: "outside-click-or-escape" },
      priority: 15,
      payload: opts.payload,
    };
  },

  actionBar(opts: {
    id: string;
    type: string;
    payload?: Record<string, unknown>;
  }): Surface {
    return {
      id: opts.id,
      kind: "action-bar",
      type: opts.type,
      presentation: "docked",
      lifecycle: "mounting",
      interaction: "non-blocking",
      dismissal: { policy: "explicit-action" },
      priority: 5,
      geometry: { height: 56, side: "bottom" },
      payload: opts.payload,
    };
  },
} as const;
