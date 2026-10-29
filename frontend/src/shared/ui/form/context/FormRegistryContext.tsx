import React from "react";

import type { Form } from "@form-core/form";

import { defaultRegistry } from "../fields/lazy-registry-builder";
import {
  FormOrchestratorProvider,
  useFormOrchestrator,
} from "./FormOrchestratorContext";

// Acts as a patcher for the orchestrator to preserve backward compatibility for isolated fields
export const FormRegistryProvider: React.FC<{
  value: any;
  children: React.ReactNode;
}> = ({ value, children }) => {
  const parent = useFormOrchestrator();
  return (
    <FormOrchestratorProvider value={{ ...parent, registry: value }}>
      {children}
    </FormOrchestratorProvider>
  );
};

export const useFormRegistry = () => {
  const orchestrator = useFormOrchestrator();
  if (!orchestrator?.registry) {
    return {
      registry: defaultRegistry,
      form: null as unknown as Form<any>,
    };
  }
  return orchestrator.registry;
};
