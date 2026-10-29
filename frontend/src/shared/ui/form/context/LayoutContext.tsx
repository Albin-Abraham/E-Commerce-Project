/**
 * @file LayoutContext.tsx
 * @description Backward-compatible composition of SurfaceContext + WizardContext.
 *
 * ## Migration
 * - New code should import `useSurface` from `./SurfaceContext` for shell concerns.
 * - New code should import `useWizard` from `./WizardContext` for step navigation.
 * - `useLayout()` is kept for backward compatibility but is now a merged view of both.
 *
 * ## Architecture (Phase 2 of Runtime Context refactor)
 * The old LayoutContext mixed shell state (layoutMode, pageTitle, header/footer) with
 * wizard navigation (currentStepId, history, navigation). These are now separate contexts
 * with distinct scopes — SurfaceContext for the application shell, WizardContext for
 * step-by-step flows — then composed here for backward compatibility.
 */
import React, { useMemo } from "react";

import { type LayoutMode, SurfaceProvider, useSurface } from "./SurfaceContext";
import { WizardProvider, useWizard } from "./WizardContext";

// Re-export so existing imports continue to work
export type { LayoutMode };
export { useSurface, useWizard };

/**
 * @deprecated Prefer `useSurface()` for shell concerns and `useWizard()` for navigation.
 * This merged interface is kept for backward-compatibility only.
 */
export interface LayoutContextValue {
  // Surface concerns
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  isPageHeaderActive: boolean;
  isPageFooterActive: boolean;
  setFeatures: (features: { header?: boolean; footer?: boolean }) => void;
  pageTitle?: string;
  setPageTitle: (title: string) => void;
  pageDescription?: string;
  setPageDescription: (desc: string) => void;

  // Wizard concerns
  currentStepId: string;
  history: string[];
  isWizard: boolean;
  navigation: {
    next: (nextId: string | null) => void;
    back: () => void;
    jump: (stepId: string) => void;
    reset: (startStepId: string) => void;
  };
}

/**
 * `LayoutProvider` — composes SurfaceProvider + WizardProvider.
 *
 * Replaces the old monolithic LayoutContext.Provider.
 * Existing consumers of `useLayout()` continue to work unchanged.
 */
export const LayoutProvider: React.FC<{
  children: React.ReactNode;
  initialMode?: LayoutMode;
  initialStepId?: string;
  isWizard?: boolean;
}> = ({
  children,
  initialMode = "dashboard",
  initialStepId = "",
  isWizard = false,
}) => {
  return (
    <SurfaceProvider initialMode={initialMode}>
      <WizardProvider initialStepId={initialStepId} isWizard={isWizard}>
        {children}
      </WizardProvider>
    </SurfaceProvider>
  );
};

/**
 * @deprecated Use `useSurface()` + `useWizard()` instead.
 * Returns a merged view of both contexts for backward compatibility.
 */
export const useLayout = (): LayoutContextValue => {
  const surface = useSurface();
  const wizard = useWizard();

  return useMemo(
    () => ({
      // Surface
      layoutMode: surface.layoutMode,
      setLayoutMode: surface.setLayoutMode,
      isPageHeaderActive: surface.isPageHeaderActive,
      isPageFooterActive: surface.isPageFooterActive,
      setFeatures: surface.setFeatures,
      pageTitle: surface.pageTitle,
      setPageTitle: surface.setPageTitle,
      pageDescription: surface.pageDescription,
      setPageDescription: surface.setPageDescription,
      // Wizard
      currentStepId: wizard.currentStepId,
      history: wizard.history,
      isWizard: wizard.isWizard,
      navigation: wizard.navigation,
    }),
    [surface, wizard]
  );
};
