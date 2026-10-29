import React, { createContext, useContext } from "react";

import type { Form } from "@form-core/form";
import { useFieldAtom } from "../hooks/useFieldAtom";

/**
 * Dependency Injection (DI) Context for the Form Engine
 *
 * Instead of forcing developers to use the JSON Schema `routing.renderField`,
 * this context injects the pure Engine into the component tree. This allows
 * developers to build highly bespoke, custom UIs using standard React
 * components while still benefiting from the atomic state performance.
 */
interface FormDIContextValue {
  engine: Form<any> | null;
}

const FormDIContext = createContext<FormDIContextValue>({ engine: null });

/**
 * The Provider that wraps a custom UI area.
 */
export const FormDIProvider: React.FC<{
  engine: Form<any>;
  children: React.ReactNode;
}> = ({ engine, children }) => {
  return (
    <FormDIContext.Provider value={{ engine }}>
      {children}
    </FormDIContext.Provider>
  );
};

/**
 * Hook to grab the engine from DI
 */
export const useFormEngine = () => {
  const { engine } = useContext(FormDIContext);
  if (!engine) {
    throw new Error("useFormEngine must be used within a FormDIProvider");
  }
  return engine;
};

/**
 * Helper hook: Combines DI and Atomic Subscription
 * Allows a custom component to subscribe to exactly one field's state
 * without needing to pass the engine reference manually.
 */
export const useInjectedField = (fieldId: string) => {
  const engine = useFormEngine();
  // We grab the value atomically. The component calling this will ONLY
  // re-render when `fieldId` changes, bypassing standard React Context waterfall.
  const value = useFieldAtom(fieldId);

  return {
    value,
    setValue: (val: any) => engine.setValue(fieldId, val),
    setTouched: () => engine.setTouched(fieldId),
    error: engine.validity[fieldId],
  };
};
