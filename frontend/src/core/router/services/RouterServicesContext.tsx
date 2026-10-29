import { createContext, useContext } from "react";

import type { HttpClient } from "@core/http";
import { queryClient } from "@core/providers/queryClient";

import { httpClient } from "@services/http.instance";

/**
 * RouterHttpServices
 *
 * The minimal HTTP surface the router runtime needs (loader/action context
 * construction, lifecycle scope). Kept deliberately small so the router core
 * stays independent of the concrete HTTP client implementation.
 */
export interface RouterHttpServices {
  public: HttpClient;
  auth: HttpClient;
  queryClient?: typeof queryClient;
}

const defaultServices: RouterHttpServices = {
  public: httpClient.public as unknown as HttpClient,
  auth: httpClient.auth as unknown as HttpClient,
  queryClient,
};

const RouterServicesContext = createContext<RouterHttpServices>(defaultServices);

/**
 * Provided at router creation so route runtime adapters (lifecycle, loaders)
 * resolve services through injection rather than importing the global
 * httpClient singleton.
 */
export const RouterServicesProvider = RouterServicesContext.Provider;

export function useRouterServices(): RouterHttpServices {
  return useContext(RouterServicesContext);
}

export { RouterServicesContext, defaultServices as defaultRouterServices };
