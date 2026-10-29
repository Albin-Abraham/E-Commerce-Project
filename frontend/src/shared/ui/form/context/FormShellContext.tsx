import React, { createContext, useContext, useMemo } from "react";

import type { FormSurfaceShell } from "@ui/form/shell/surface-shell";
import type { FormDefinition } from "@ui/form/types";

interface FormShellContextValue {
  definition: FormDefinition;
  form: any;
  slots: Record<string, string>;
  className: string;
  debug: boolean;
  isSubmitting: boolean;
  visibility: Record<string, boolean>;
  getComponentProps: (fieldId: string) => any;
  actionClasses: string;
  submitBtnClass: string;
  cancelButtonClass: string;
  onExecuteSubmit: () => Promise<boolean>;
  handleDelegatedChange: (e: React.FormEvent) => void;
  handleDelegatedBlur: (e: React.FocusEvent) => void;
  /** Optional chrome adapter (e.g. ModalShell) wrapping header/body/footer. */
  shell?: FormSurfaceShell;
  secondaryActions?: React.ReactNode;
}

const FormShellContext = createContext<FormShellContextValue | null>(null);

interface FormShellProviderProps extends FormShellContextValue {
  children: React.ReactNode;
}

export function FormShellProvider({
  children,
  ...value
}: FormShellProviderProps) {
  const stable = useMemo(
    () => value,
    [
      value.definition,
      value.form,
      value.slots,
      value.className,
      value.debug,
      value.isSubmitting,
      value.visibility,
      value.getComponentProps,
      value.actionClasses,
      value.submitBtnClass,
      value.cancelButtonClass,
      value.onExecuteSubmit,
      value.handleDelegatedChange,
      value.handleDelegatedBlur,
      value.shell,
      value.secondaryActions,
    ]
  );
  return (
    <FormShellContext.Provider value={stable}>
      {children}
    </FormShellContext.Provider>
  );
}

export function useFormShell(): FormShellContextValue {
  const ctx = useContext(FormShellContext);
  if (!ctx) {
    throw new Error("useFormShell must be used within a FormShellProvider");
  }
  return ctx;
}
