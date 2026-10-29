import { useMemo } from "react";

import { useAlertDialog } from "@shared/ui/AlertDialog";
import type { AlertOptions, ConfirmOptions } from "@shared/ui/AlertDialog";
import {
  toastError,
  toastInfo,
  toastSuccess,
  toastWarning,
} from "@shared/ui/Toast";

export interface UseFeedbackReturn {
  toast: {
    success: (msg: string) => string;
    error: (msg: string) => string;
    warning: (msg: string) => string;
    info: (msg: string) => string;
  };
  dialog: {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
    alert: (options: AlertOptions) => Promise<void>;
    destructive: (options: Omit<ConfirmOptions, "intent">) => Promise<boolean>;
  };
}

export function useFeedback(): UseFeedbackReturn {
  const { confirm, alert, destructive } = useAlertDialog();

  return useMemo(
    () => ({
      toast: {
        success: toastSuccess,
        error: toastError,
        warning: toastWarning,
        info: toastInfo,
      },
      dialog: {
        confirm,
        alert,
        destructive,
      },
    }),
    [confirm, alert, destructive]
  );
}
