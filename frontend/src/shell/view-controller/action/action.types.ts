/**
 * ── ACTION TYPES ──────────────────────────────────────────────────────────────
 *
 * Actions are first-class concepts. A surface does not run business logic —
 * it confirms an action. The ActionManager dispatches, services execute,
 * results produce surface effects.
 *
 * Flow:
 *   User Interaction
 *     → PlatformAction dispatched via useAction()
 *     → ActionManager validates permission + routes to handler
 *     → Handler calls service
 *     → ActionResult.surfaceEffect drives SurfaceManager
 */
import type { Surface } from "../surface/surface.types";

/** Where in the UI the action originated. */
export type ActionSource =
  | "toolbar"
  | "table-row"
  | "bulk-toolbar"
  | "drawer-toolbar"
  | "keyboard"
  | "context-menu"
  | "command-palette"
  | "programmatic";

/** A platform action — the intent before execution. */
export interface PlatformAction<
  TTarget = unknown,
  TPayload = unknown,
> {
  /** Unique action ID (auto-generated if not provided) */
  id?: string;
  /** What the action does. e.g. "approve", "open-drawer", "bulk-archive" */
  operation: string;
  /** What the action targets. e.g. { type: "Invoice", id: "INV-42" } */
  target?: TTarget;
  /** Where in the UI this was triggered */
  source: ActionSource;
  /** Additional parameters */
  payload?: TPayload;
  /** Permission key to check before executing. e.g. "invoice.approve" */
  permission?: string;
}

/** Result produced by an action handler. */
export interface ActionResult<TData = unknown> {
  actionId: string;
  status: "success" | "error" | "cancelled";
  data?: TData;
  /** Side effects to apply to the SurfaceManager after execution */
  surfaceEffect?: {
    /** Open a new surface */
    open?: Partial<Surface>;
    /** Close a surface by id */
    close?: string | string[];
    /** IDs of content regions to invalidate/refresh */
    refresh?: string[];
    /** Toast notification to show */
    notify?: {
      message: string;
      variant?: "success" | "error" | "warning" | "info";
      timeoutMs?: number;
    };
  };
}

/** Handler registered for an operation. */
export type ActionHandler<TTarget = unknown, TPayload = unknown, TData = unknown> = (
  action: PlatformAction<TTarget, TPayload>,
  context: ActionContext
) => Promise<ActionResult<TData>>;

/** Context passed to every action handler. */
export interface ActionContext {
  /** Current user permissions (populated by auth service) */
  permissions: string[];
  /** Signal to cancel long-running actions */
  signal?: AbortSignal;
}
