import React from "react";

import { ManifestRegistry, manifestRegistry } from "@form-core/ManifestRegistry";
import {
  FormOrchestratorProvider,
  useFormOrchestrator,
} from "./FormOrchestratorContext";

export const ManifestRegistryProvider: React.FC<{
  value?: ManifestRegistry;
  children: React.ReactNode;
}> = ({ value, children }) => {
  const parent = useFormOrchestrator();
  return (
    <FormOrchestratorProvider
      value={{
        ...parent,
        manifest: { manifestRegistry: value ?? manifestRegistry },
      }}
    >
      {children}
    </FormOrchestratorProvider>
  );
};

export const useManifestRegistry = () => {
  const orchestrator = useFormOrchestrator();
  if (!orchestrator?.manifest) {
    return { manifestRegistry };
  }
  return orchestrator.manifest;
};
