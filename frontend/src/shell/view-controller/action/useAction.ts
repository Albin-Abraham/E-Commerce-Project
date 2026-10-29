/**
 * ── useAction hooks ───────────────────────────────────────────────────────────
 * Consumer API for the ActionManager.
 */
import { useCallback } from "react";

import { useActionManager } from "./ActionManager";
import type { ActionHandler, PlatformAction } from "./action.types";

/** Dispatch a platform action and await its result. */
export function useDispatch() {
  return useActionManager((s) => s.dispatch);
}

/** Whether an operation is currently pending. */
export function useActionPending(operation: string): boolean {
  return useActionManager((s) => s.isPending(operation));
}

/**
 * Register an action handler for a given operation.
 * Unregisters automatically when the component unmounts.
 *
 * Usage:
 *   useActionHandler("approve-invoice", async (action, ctx) => {
 *     await invoiceService.approve(action.target.id);
 *     return { actionId: action.id!, status: "success",
 *              surfaceEffect: { close: "overlay:confirm-approve" } };
 *   });
 */
export function useActionHandler(operation: string, handler: ActionHandler) {
  const register = useActionManager((s) => s.registerHandler);
  const unregister = useActionManager((s) => s.unregisterHandler);

  // Register on mount, unregister on unmount
  // Using useCallback to keep stable reference across re-renders
  const stableRegister = useCallback(() => {
    register(operation, handler);
    return () => unregister(operation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operation]);

  // Execute registration side effect
  // Note: in React 18 strict mode this fires twice in dev — that's fine,
  // registerHandler is idempotent per operation key.
  return stableRegister;
}

/** Convenient typed dispatch builder for a specific operation. */
export function useOperationDispatch<TTarget = unknown, TPayload = unknown>(
  operation: string
) {
  const dispatch = useDispatch();
  return useCallback(
    (opts: Omit<PlatformAction<TTarget, TPayload>, "operation">) =>
      dispatch({ ...opts, operation }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [operation, dispatch]
  );
}
