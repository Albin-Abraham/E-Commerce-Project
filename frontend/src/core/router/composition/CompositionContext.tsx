import { createContext, useContext } from "react";

import type { AppRoute } from "../route.types";

/**
 * RouterComposition
 *
 * Runtime snapshot of the composed route model produced by
 * composeApplication. Provided at boot so navigation adapters can resolve
 * stable routeIds into concrete paths without importing registries.
 */
export interface RouterComposition {
  routeIndex: Map<string, AppRoute>;
}

const emptyComposition: RouterComposition = { routeIndex: new Map() };

const CompositionContext = createContext<RouterComposition>(emptyComposition);

export const CompositionProvider = CompositionContext.Provider;

export function useRouterComposition(): RouterComposition {
  return useContext(CompositionContext);
}
