import React, { type ReactNode } from "react";

import { DEFAULT_FORM_THEME, type FormTheme } from "@ui/form/styles/FormTheme";
import type { StyleAdapter } from "@ui/form/styles/style-adapter";
import { defaultTailwindAdapter } from "@ui/form/styles/tailwind-adapter";

import {
  FormOrchestratorProvider,
  useFormOrchestrator,
} from "./FormOrchestratorContext";

export const FormThemeProvider: React.FC<{
  theme?: FormTheme;
  adapter?: StyleAdapter;
  children: ReactNode;
}> = ({ theme, adapter, children }) => {
  const parent = useFormOrchestrator();
  return (
    <FormOrchestratorProvider
      value={{
        ...parent,
        theme: theme || DEFAULT_FORM_THEME,
        styleAdapter: adapter || parent.styleAdapter || defaultTailwindAdapter,
      }}
    >
      {children}
    </FormOrchestratorProvider>
  );
};

export const useFormTheme = () => {
  const orchestrator = useFormOrchestrator();
  if (!orchestrator?.theme) {
    return DEFAULT_FORM_THEME;
  }
  return orchestrator.theme;
};

/**
 * Returns the active StyleAdapter from the orchestrator context.
 * Falls back to TailwindAdapter if no adapter is set.
 */
export const useStyleAdapter = (): StyleAdapter => {
  const orchestrator = useFormOrchestrator();
  return orchestrator?.styleAdapter || defaultTailwindAdapter;
};
