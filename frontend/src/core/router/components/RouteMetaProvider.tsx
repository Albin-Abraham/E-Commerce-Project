import React, { createContext, useContext, useMemo } from "react";
import { useMatches } from "react-router-dom";

import type { AppRoute } from "../route.types";

interface RouteMetaSnapshot {
  matches: any[];
  shortcuts: {
    matchId: string;
    routeIndex: number;
    key: string | string[];
    command: any;
    description: string;
  }[];
  slots: {
    matchId: string;
    routeIndex: number;
    name: string;
    component: React.ComponentType<any>;
    props?: Record<string, any>;
    priority?: number;
  }[];
}

const RouteMetaContext = createContext<RouteMetaSnapshot | null>(null);

/**
 * RouteMetaProvider
 *
 * Performance-optimized context provider that processes React Router matches
 * exactly once per navigation change, producing a memoized metadata snapshot
 * of active shortcuts, dynamic slots, and route paths.
 */
export const RouteMetaProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const matches = useMatches();

  const snapshot = useMemo<RouteMetaSnapshot>(() => {
    const shortcuts: RouteMetaSnapshot["shortcuts"] = [];
    const slots: RouteMetaSnapshot["slots"] = [];

    matches.forEach((match, index) => {
      const route = match.handle as AppRoute;

      // 1. Gather declared shortcuts
      if (route?.shortcuts) {
        route.shortcuts.forEach((sc) => {
          shortcuts.push({
            matchId: match.id || String(index),
            routeIndex: index,
            key: sc.key,
            command: sc.command,
            description: sc.description,
          });
        });
      }

      // 2. Gather declared slots
      if (route?.slots) {
        route.slots.forEach((sl) => {
          slots.push({
            matchId: match.id || String(index),
            routeIndex: index,
            name: sl.name,
            component: sl.component,
            props: sl.props,
            priority: sl.priority,
          });
        });
      }
    });

    return {
      matches,
      shortcuts,
      slots,
    };
  }, [matches]);

  return (
    <RouteMetaContext.Provider value={snapshot}>
      {children}
    </RouteMetaContext.Provider>
  );
};

/**
 * Hook to consume the parsed route metadata snapshot
 */
export const useRouteMeta = (): RouteMetaSnapshot => {
  const context = useContext(RouteMetaContext);
  if (!context) {
    throw new Error("useRouteMeta must be consumed within a RouteMetaProvider");
  }
  return context;
};
