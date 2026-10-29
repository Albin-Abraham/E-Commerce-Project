import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

/**
 * SurfaceContext
 *
 * Manages application-shell concerns only:
 * - Layout mode (dashboard, portal, fullscreen, drawer, modal, inline)
 * - Page shell feature enrollment (header / footer)
 * - Page metadata (title, description)
 *
 * Replaces the shell portion of the old LayoutContext.
 * Does NOT include wizard navigation (see WizardContext).
 */

export type LayoutMode =
  | "dashboard"
  | "portal"
  | "fullscreen"
  | "drawer"
  | "modal"
  | "inline";

export interface SurfaceContextValue {
  /** Current macro-layout mode for the application shell. */
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;

  /** Page Shell feature enrollment */
  isPageHeaderActive: boolean;
  isPageFooterActive: boolean;
  setFeatures: (features: { header?: boolean; footer?: boolean }) => void;

  /** Page metadata hand-offs */
  pageTitle?: string;
  setPageTitle: (title: string) => void;
  pageDescription?: string;
  setPageDescription: (desc: string) => void;
}

const SurfaceContext = createContext<SurfaceContextValue | undefined>(
  undefined
);

export const SurfaceProvider: React.FC<{
  children: React.ReactNode;
  initialMode?: LayoutMode;
}> = ({ children, initialMode = "dashboard" }) => {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>(initialMode);
  const [features, setFeaturesState] = useState({
    header: false,
    footer: false,
  });
  const [pageTitle, setPageTitle] = useState<string>();
  const [pageDescription, setPageDescription] = useState<string>();

  const setFeatures = useCallback(
    (f: { header?: boolean; footer?: boolean }) => {
      setFeaturesState((prev) => {
        const hasChanges =
          (f.header !== undefined && f.header !== prev.header) ||
          (f.footer !== undefined && f.footer !== prev.footer);
        if (!hasChanges) return prev;
        return { ...prev, ...f };
      });
    },
    []
  );

  const value: SurfaceContextValue = useMemo(
    () => ({
      layoutMode,
      setLayoutMode,
      isPageHeaderActive: features.header,
      isPageFooterActive: features.footer,
      setFeatures,
      pageTitle,
      setPageTitle,
      pageDescription,
      setPageDescription,
    }),
    [
      layoutMode,
      features.header,
      features.footer,
      setFeatures,
      pageTitle,
      pageDescription,
    ]
  );

  return (
    <SurfaceContext.Provider value={value}>{children}</SurfaceContext.Provider>
  );
};

export const useSurface = (): SurfaceContextValue => {
  const ctx = useContext(SurfaceContext);
  if (!ctx) {
    // Safe fallback for standalone / Storybook usage
    return {
      layoutMode: "dashboard",
      setLayoutMode: () => {},
      isPageHeaderActive: false,
      isPageFooterActive: false,
      setFeatures: () => {},
      setPageTitle: () => {},
      setPageDescription: () => {},
    };
  }
  return ctx;
};
