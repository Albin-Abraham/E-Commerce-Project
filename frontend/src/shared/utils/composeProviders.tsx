import React, { type ComponentType, type ReactNode } from "react";

type ProviderComponent = ComponentType<any>;

/**
 * Composite Pattern implementation for React Providers.
 * Flattens the "Provider Hell" pyramid.
 */
export function composeProviders(
  providers: Array<[ProviderComponent, Record<string, any>] | ProviderComponent>
): React.FC<{ children: ReactNode }> {
  return ({ children }) => {
    return providers.reduceRight(
      (child, providerEntry) => {
        if (Array.isArray(providerEntry)) {
          const [Provider, props] = providerEntry;
          return <Provider {...props}>{child}</Provider>;
        }
        const Provider = providerEntry;
        return <Provider>{child}</Provider>;
      },
      <>{children}</>
    );
  };
}
