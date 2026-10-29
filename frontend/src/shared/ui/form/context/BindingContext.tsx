import React, { createContext, useContext, useMemo } from "react";

import { useFormRegistry } from "./FormRegistryContext";

/**
 * @file BindingContext.tsx
 * @description Binding Manager for resolving data bindings. Wraps FormCore value proxies.
 */

export interface BindingManagerValue {
  getValue: (bindingId: string) => any;
  setValue: (bindingId: string, value: any) => void;
}

const BindingContext = createContext<BindingManagerValue | undefined>(
  undefined
);

export const BindingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { form } = useFormRegistry();

  const getValue = React.useCallback(
    (bindingId: string) => {
      return form?.values?.[bindingId];
    },
    [form]
  );

  const setValue = React.useCallback(
    (bindingId: string, value: any) => {
      form?.setValue(bindingId, value);
    },
    [form]
  );

  const value = useMemo(() => ({ getValue, setValue }), [getValue, setValue]);

  return (
    <BindingContext.Provider value={value}>{children}</BindingContext.Provider>
  );
};

export const useBindingManager = (): BindingManagerValue => {
  const ctx = useContext(BindingContext);
  if (!ctx) {
    return {
      getValue: () => undefined,
      setValue: () => {},
    };
  }
  return ctx;
};

export const useFieldBinding = (bindingId: string) => {
  const manager = useBindingManager();
  return {
    value: manager.getValue(bindingId),
    onChange: (val: any) => manager.setValue(bindingId, val),
  };
};
