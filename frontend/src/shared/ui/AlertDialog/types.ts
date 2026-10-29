import type React from "react";

export type DialogIntent = "success" | "warning" | "error" | "info" | "danger";

export interface ConfirmOptions {
  title: React.ReactNode;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  intent?: DialogIntent;
}

export interface AlertOptions {
  title: React.ReactNode;
  message: React.ReactNode;
  confirmLabel?: string;
  intent?: DialogIntent;
}

export interface AlertDialogState {
  isOpen: boolean;
  config:
    | (ConfirmOptions & { type: "confirm"; resolve: (value: boolean) => void })
    | null;
}

export interface AlertDialogContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions) => Promise<void>;
  destructive: (options: Omit<ConfirmOptions, "intent">) => Promise<boolean>;
}
