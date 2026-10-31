/**
 * Shared Apps: useCurrentApp Hook
 */

import { useState, useCallback } from "react";
import { appRegistry } from "./app.registry";
import type { AppDescriptor, AppId } from "./app.descriptor";

export interface UseCurrentAppResult {
  currentApp: AppDescriptor;
  availableApps: AppDescriptor[];
  switchApp: (id: AppId) => void;
}

export const useCurrentApp = (): UseCurrentAppResult => {
  const [currentApp, setCurrentApp] = useState<AppDescriptor>(appRegistry.getActiveApp());

  const switchApp = useCallback((id: AppId) => {
    appRegistry.setActiveApp(id);
    setCurrentApp(appRegistry.getActiveApp());
  }, []);

  return {
    currentApp,
    availableApps: appRegistry.getAll(),
    switchApp,
  };
};
