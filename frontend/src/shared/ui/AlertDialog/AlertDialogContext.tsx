import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { AlertDialogRoot } from "./AlertDialog";
import type {
  AlertDialogContextValue,
  AlertOptions,
  ConfirmOptions,
  DialogIntent,
} from "./types";

interface DialogState {
  isOpen: boolean;
  intent: DialogIntent;
  title: React.ReactNode;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  type: "confirm" | "alert";
  resolve: ((value?: any) => void) | null;
}

export const AlertDialogContext = createContext<AlertDialogContextValue | null>(null);

export function useAlertDialog(): AlertDialogContextValue {
  const context = useContext(AlertDialogContext);
  if (!context) {
    throw new Error(
      "useAlertDialog must be used within an AlertDialogProvider"
    );
  }
  return context;
}

export function useOptionalAlertDialog(): AlertDialogContextValue | null {
  return useContext(AlertDialogContext);
}

interface AlertDialogProviderProps {
  children: React.ReactNode;
}

export function AlertDialogProvider({ children }: AlertDialogProviderProps) {
  const [state, setState] = useState<DialogState>({
    isOpen: false,
    intent: "info",
    title: "",
    message: "",
    type: "confirm",
    resolve: null,
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        intent: options.intent || "info",
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel,
        cancelLabel: options.cancelLabel,
        type: "confirm",
        resolve,
      });
    });
  }, []);

  const alert = useCallback((options: AlertOptions): Promise<void> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        intent: options.intent || "info",
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel,
        type: "alert",
        resolve: resolve as (value: boolean | void) => void,
      });
    });
  }, []);

  const destructive = useCallback(
    (options: Omit<ConfirmOptions, "intent">): Promise<boolean> => {
      return confirm({ ...options, intent: "danger" });
    },
    [confirm]
  );

  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (!isOpen) {
      setState((prev) => {
        if (prev.type === "confirm") {
          prev.resolve?.(false);
        } else {
          prev.resolve?.();
        }
        return { ...prev, isOpen: false };
      });
    }
  }, []);

  const handleConfirm = useCallback(() => {
    setState((prev) => {
      if (prev.type === "confirm") {
        prev.resolve?.(true);
      } else {
        prev.resolve?.();
      }
      return { ...prev, isOpen: false };
    });
  }, []);

  const value = useMemo(
    () => ({ confirm, alert, destructive }),
    [confirm, alert, destructive]
  );

  return (
    <AlertDialogContext.Provider value={value}>
      {children}
      {state.isOpen && (
        <AlertDialogRoot
          isOpen={state.isOpen}
          onOpenChange={handleOpenChange}
          intent={state.intent}
          title={state.title}
          message={state.message}
          confirmLabel={state.confirmLabel}
          cancelLabel={state.cancelLabel}
          onConfirm={handleConfirm}
        />
      )}
    </AlertDialogContext.Provider>
  );
}
