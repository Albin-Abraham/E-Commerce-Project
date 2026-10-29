import React, { createContext, useContext, useMemo } from "react";

import { httpClient } from "@services/http.instance";
import type { BaseHTTPClientService } from "@services/http/core/http.client.service";

/**
 * HTTP Context Interface
 */
interface HttpContextValue {
  /** Public client for unauthenticated requests */
  public: BaseHTTPClientService;
  /** Auth client for authenticated requests */
  auth: BaseHTTPClientService;
}

/**
 * HTTP Context
 */
const HttpContext = createContext<HttpContextValue | null>(null);

/**
 * HTTP Provider Props
 */
interface HttpProviderProps {
  children: React.ReactNode;
  /** Optional override for the public client (useful for testing) */
  publicClient?: BaseHTTPClientService;
  /** Optional override for the auth client (useful for testing) */
  authClient?: BaseHTTPClientService;
}

/**
 * HTTP Context Provider
 *
 * Provides HTTP client services to the application via React Context.
 * Supports Dependency Injection for testing.
 */
export const HttpProvider: React.FC<HttpProviderProps> = ({
  children,
  publicClient,
  authClient,
}) => {
  const value = useMemo(
    () => ({
      public: publicClient || httpClient.public,
      auth: authClient || httpClient.auth,
    }),
    [publicClient, authClient]
  );

  return <HttpContext.Provider value={value}>{children}</HttpContext.Provider>;
};

/**
 * Internal hook to access the HTTP context
 * @private
 */
export const useHttpContext = () => {
  const context = useContext(HttpContext);
  if (!context) {
    throw new Error("useHttpContext must be used within an HttpProvider");
  }
  return context;
};
