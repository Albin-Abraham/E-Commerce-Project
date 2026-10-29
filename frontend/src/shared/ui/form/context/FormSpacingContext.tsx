import React from "react";

import {
  SpacingCalculator,
  type SpacingConfig,
} from "@ui/form/utils/spacing-calculator";

/**
 * FORM SPACING CONTEXT
 *
 * Provides spacing configuration to all form components.
 * Eliminates prop drilling of spacing config.
 */

import {
  FormOrchestratorProvider,
  useFormOrchestrator,
} from "./FormOrchestratorContext";

export const FormSpacingProvider: React.FC<{
  spacing: SpacingConfig;
  children: React.ReactNode;
}> = ({ spacing, children }) => {
  const parent = useFormOrchestrator();
  return (
    <FormOrchestratorProvider value={{ ...parent, spacing }}>
      {children}
    </FormOrchestratorProvider>
  );
};

export const useFormSpacing = (): SpacingConfig => {
  const orchestrator = useFormOrchestrator();
  return orchestrator?.spacing || SpacingCalculator.getDefaultSpacing();
};

/**
 * HOC to inject spacing as prop
 */
export function withFormSpacing<P extends { spacing?: SpacingConfig }>(
  Component: React.ComponentType<P>
): React.FC<Omit<P, "spacing">> {
  return (props) => {
    const spacing = useFormSpacing();
    return <Component {...(props as P)} spacing={spacing} />;
  };
}
