import { createContext, useContext } from "react";

/**
 * FieldCompositionMode defines the explicit rendering contract for form fields:
 * - "standalone": Field owns its complete structure (Box, Label, InputWrapper, Surface, Feedback).
 * - "managed": Field is rendered inside an existing FieldShell or layout manager; skips outer chrome.
 * - "primitive": Field renders strictly the raw input control without any surrounding wrappers.
 */
export type FieldCompositionMode = "standalone" | "managed" | "primitive";

export interface FieldCompositionContextValue {
  mode: FieldCompositionMode;
}

export const FieldCompositionContext =
  createContext<FieldCompositionContextValue>({
    mode: "standalone",
  });

/**
 * Hook to access the current field composition contract.
 */
export function useFieldComposition(): FieldCompositionContextValue {
  return useContext(FieldCompositionContext);
}

export const useFieldCompositionContext = useFieldComposition;
