/**
 * ── ACTION MANAGER ────────────────────────────────────────────────────────────
 *
 * Zustand store that manages action dispatch, execution state, and result routing.
 *
 * Key invariant:
 *   Surfaces don't approve invoices — they confirm actions.
 *   ActionManager is the only layer that calls business services.
 *
 * Surface effects from ActionResult are applied here, keeping the coupling
 * from business logic → SurfaceManager unidirectional.
 */
import { create } from "zustand";

import { useSurfaceManager } from "../surface/SurfaceManager";
import { SurfacePresets } from "../surface/surface.types";
import type {
  ActionContext,
  ActionHandler,
  ActionResult,
  PlatformAction,
} from "./action.types";

/** Tiny inline id generator — avoids adding nanoid as a dep. */
const genId = () => Math.random().toString(36).slice(2, 10);

// ── Execution record (for audit / optimistic UI) ──────────────────────────────

interface ActionRecord {
  id: string;
  operation: string;
  status: "pending" | "success" | "error" | "cancelled";
  startedAt: number;
  finishedAt?: number;
  result?: ActionResult;
}

interface ActionManagerState {
  /** In-flight and recently completed actions */
  history: Record<string, ActionRecord>;
  /** Registered handlers keyed by operation name */
  handlers: Record<string, ActionHandler<any, any, any>>;
  /** Current user's permission set — set by auth flow */
  permissions: string[];

  // ── Setup ──────────────────────────────────────────────────────────────────
  setPermissions: (permissions: string[]) => void;
  registerHandler: (operation: string, handler: ActionHandler) => void;
  unregisterHandler: (operation: string) => void;

  // ── Dispatch ───────────────────────────────────────────────────────────────
  /**
   * Dispatch a PlatformAction.
   * - Checks permission
   * - Calls registered handler
   * - Applies surfaceEffect from the result
   * - Returns the ActionResult
   */
  dispatch: <T = unknown>(action: PlatformAction) => Promise<ActionResult<T>>;

  // ── Queries ────────────────────────────────────────────────────────────────
  isPending: (operation: string) => boolean;
  getResult: (actionId: string) => ActionRecord | undefined;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useActionManager = create<ActionManagerState>()((set, get) => ({
  history: {},
  handlers: {},
  permissions: [],

  setPermissions: (permissions) => set({ permissions }),

  registerHandler: (operation, handler) =>
    set((s) => ({ handlers: { ...s.handlers, [operation]: handler } })),

  unregisterHandler: (operation) =>
    set((s) => {
      const { [operation]: _removed, ...rest } = s.handlers;
      return { handlers: rest };
    }),

  dispatch: async <T = unknown>(action: PlatformAction): Promise<ActionResult<T>> => {
    const id = action.id ?? genId();
    const { handlers, permissions } = get();
    const surfaceMgr = useSurfaceManager.getState();

    // 1. Permission check
    if (action.permission && !permissions.includes(action.permission)) {
      const result: ActionResult = {
        actionId: id,
        status: "error",
        surfaceEffect: {
          notify: {
            message: `Permission denied: ${action.permission}`,
            variant: "error",
          },
        },
      };
      applyEffect(result, surfaceMgr);
      return result as ActionResult<T>;
    }

    // 2. Record as pending
    set((s) => ({
      history: {
        ...s.history,
        [id]: { id, operation: action.operation, status: "pending", startedAt: Date.now() },
      },
    }));

    // 3. Find and run handler
    const handler = handlers[action.operation];
    let result: ActionResult;

    if (!handler) {
      console.warn(`[ActionManager] No handler registered for operation: "${action.operation}"`);
      result = { actionId: id, status: "error" };
    } else {
      const context: ActionContext = { permissions, signal: undefined };
      try {
        result = await handler({ ...action, id }, context);
      } catch (err) {
        result = {
          actionId: id,
          status: "error",
          surfaceEffect: {
            notify: {
              message: err instanceof Error ? err.message : "Action failed",
              variant: "error",
            },
          },
        };
      }
    }

    // 4. Update history
    set((s) => ({
      history: {
        ...s.history,
        [id]: { ...s.history[id], status: result.status, finishedAt: Date.now(), result },
      },
    }));

    // 5. Apply surface effects
    applyEffect(result, surfaceMgr);

    return result as ActionResult<T>;
  },

  isPending: (operation) =>
    Object.values(get().history).some(
      (r) => r.operation === operation && r.status === "pending"
    ),

  getResult: (actionId) => get().history[actionId],
}));

// ── Surface effect applicator ─────────────────────────────────────────────────

function applyEffect(
  result: ActionResult,
  surfaceMgr: ReturnType<typeof useSurfaceManager.getState>
) {
  const { surfaceEffect } = result;
  if (!surfaceEffect) return;

  if (surfaceEffect.open) {
    surfaceMgr.open(surfaceEffect.open as any);
  }

  if (surfaceEffect.close) {
    const ids = Array.isArray(surfaceEffect.close)
      ? surfaceEffect.close
      : [surfaceEffect.close];
    ids.forEach((id) => surfaceMgr.close(id));
  }

  if (surfaceEffect.notify) {
    const { message, variant = "info", timeoutMs = 4000 } = surfaceEffect.notify;
    surfaceMgr.open(
      SurfacePresets.notification({
        id: `notify-${Date.now()}`,
        type: variant,
        payload: { message, variant },
        timeoutMs,
      })
    );
  }
}
