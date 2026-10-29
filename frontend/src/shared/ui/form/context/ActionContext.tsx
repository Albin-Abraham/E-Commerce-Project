import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";

/**
 * @file ActionContext.tsx
 * @description Form-local Action Manager for triggering submit/cancel/custom form actions.
 *
 * FormFooter dispatches `submit` and `cancel` by id. Hosts register those
 * handlers via `<Form actions={{ submit, cancel }} />`.
 *
 * ─── Naming Alignment (TD4, TD5, TD6) ────────────────────────────────────────
 * Previously this file exported `useActionManager` and `useAction`, which
 * collided with the platform-level `useActionManager` (Zustand) in
 * shell/view-controller/action/ActionManager.ts.
 *
 * Canonical names (use these in new code):
 *   useFormActionManager  — was useActionManager
 *   useFormAction         — was useAction
 *   registerHandler       — was registerAction
 *   unregisterHandler     — was removeAction
 *
 * Deprecated re-exports are kept below for backward compatibility.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type FormActionHandler = (payload?: any) => Promise<any>;

export interface FormActionManagerValue {
  executeAction: (actionId: string, payload?: any) => Promise<any>;
  /** TD5: was registerAction */
  registerHandler: (actionId: string, handler: FormActionHandler) => void;
  /** TD5: was removeAction */
  unregisterHandler: (actionId: string) => void;
}

const ActionContext = createContext<FormActionManagerValue | undefined>(undefined);

export const ActionProvider: React.FC<{
  children: React.ReactNode;
  actions?: Record<string, FormActionHandler>;
}> = ({ children, actions }) => {
  const handlers = React.useRef<Map<string, FormActionHandler>>(
    new Map(Object.entries(actions || {}))
  );

  useEffect(() => {
    handlers.current = new Map(Object.entries(actions || {}));
  }, [actions]);

  const executeAction = useCallback(async (actionId: string, payload?: any) => {
    const handler = handlers.current.get(actionId);
    if (handler) {
      return handler(payload);
    }
    console.warn(`[ActionContext] Action ${actionId} not found.`);
  }, []);

  // TD5: renamed registerAction → registerHandler (aligned with shell ActionManager)
  const registerHandler = useCallback(
    (actionId: string, handler: FormActionHandler) => {
      handlers.current.set(actionId, handler);
    },
    []
  );

  // TD5: renamed removeAction → unregisterHandler (aligned with shell ActionManager)
  const unregisterHandler = useCallback((actionId: string) => {
    handlers.current.delete(actionId);
  }, []);

  const value = useMemo(
    () => ({ executeAction, registerHandler, unregisterHandler }),
    [executeAction, registerHandler, unregisterHandler]
  );

  return (
    <ActionContext.Provider value={value}>{children}</ActionContext.Provider>
  );
};

/**
 * TD4: Canonical hook — use this in new code.
 * Replaces the old `useActionManager` which collided with the shell Zustand store.
 */
export const useFormActionManager = (): FormActionManagerValue => {
  const ctx = useContext(ActionContext);
  if (!ctx) {
    return {
      executeAction: async () => {},
      registerHandler: () => {},
      unregisterHandler: () => {},
    };
  }
  return ctx;
};

/**
 * TD4: Canonical hook — use this in new code.
 * Replaces the old `useAction` to make the form-local scope explicit.
 */
export const useFormAction = (actionId: string) => {
  const manager = useFormActionManager();
  return useCallback(
    (payload?: any) => manager.executeAction(actionId, payload),
    [manager, actionId]
  );
};

