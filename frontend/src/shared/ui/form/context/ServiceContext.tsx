import React, { createContext, useContext, useMemo } from "react";

/**
 * @file ServiceContext.tsx
 * @description Service Manager for injecting API services and external dependencies.
 */

export interface ServiceManagerValue {
  getService: <T>(serviceId: string) => T | undefined;
}

const ServiceContext = createContext<ServiceManagerValue | undefined>(
  undefined
);

export interface ServiceProviderProps {
  services?: Record<string, any>;
  children: React.ReactNode;
}

export const ServiceProvider: React.FC<ServiceProviderProps> = ({
  services = {},
  children,
}) => {
  const getService = React.useCallback(
    <T,>(serviceId: string): T | undefined => {
      return services[serviceId] as T | undefined;
    },
    [services]
  );

  const value = useMemo(() => ({ getService }), [getService]);

  return (
    <ServiceContext.Provider value={value}>{children}</ServiceContext.Provider>
  );
};

export const useServiceManager = (): ServiceManagerValue => {
  const ctx = useContext(ServiceContext);
  if (!ctx) {
    return {
      getService: () => undefined,
    };
  }
  return ctx;
};

export const useService = <T,>(serviceId: string): T | undefined => {
  const manager = useServiceManager();
  return manager.getService<T>(serviceId);
};
