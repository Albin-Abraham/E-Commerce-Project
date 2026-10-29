import React, { createContext, useCallback, useContext, useMemo } from "react";

/**
 * @file ExpressionContext.tsx
 * @description Expression Context for evaluating dynamic conditions and expressions in the UI.
 */

export interface ExpressionContextValue {
  evaluate: (expression: string, localContext?: Record<string, any>) => any;
  registerGlobal: (key: string, value: any) => void;
}

const ExpressionContext = createContext<ExpressionContextValue | undefined>(
  undefined
);

export const ExpressionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const globals = React.useRef<Record<string, any>>({});

  const evaluate = useCallback(
    (expression: string, localContext?: Record<string, any>) => {
      // Basic placeholder evaluation for now - delegates to FormCore in actual implementation
      try {
        const context = { ...globals.current, ...localContext };
        return new Function(...Object.keys(context), `return ${expression}`)(
          ...Object.values(context)
        );
      } catch (e) {
        console.warn(
          `[ExpressionContext] Failed to evaluate: ${expression}`,
          e
        );
        return false;
      }
    },
    []
  );

  const registerGlobal = useCallback((key: string, value: any) => {
    globals.current[key] = value;
  }, []);

  const value = useMemo(
    () => ({ evaluate, registerGlobal }),
    [evaluate, registerGlobal]
  );

  return (
    <ExpressionContext.Provider value={value}>
      {children}
    </ExpressionContext.Provider>
  );
};

export const useExpressionContext = (): ExpressionContextValue => {
  const ctx = useContext(ExpressionContext);
  if (!ctx) {
    return {
      evaluate: () => false,
      registerGlobal: () => {},
    };
  }
  return ctx;
};
