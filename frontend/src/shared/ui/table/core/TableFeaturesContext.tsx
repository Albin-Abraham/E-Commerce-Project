import React, { createContext, useContext, useEffect, useMemo, useRef } from "react";

import type { TableFeature, TableFeatureContext } from "@ui/table/types";
import { useTableDOM } from "./TableDOMContext";
import { useTableEngine } from "./TableEngineContext";
import { useTableMeta } from "./TableMetaContext";
import { useTableView } from "./TableViewContext";

/**
 * TableFeaturesContext — Microkernel Plugin Lifecycle & API Registry
 *
 * Hosts runtime state and imperative APIs exposed by composable TableFeatures.
 * Handles unified setup and teardown across view mode and lifecycle transitions.
 */

interface TableFeaturesContextValue {
  features: Record<string, unknown>;
  getFeature: <TApi = unknown>(name: string) => TApi | undefined;
}

const TableFeaturesContext = createContext<TableFeaturesContextValue | null>(null);

export function useFeatures(): Record<string, unknown> {
  const ctx = useContext(TableFeaturesContext);
  return ctx ? ctx.features : {};
}

export const useTableFeatures = useFeatures;

export function useFeature<TApi = unknown>(featureName: string): TApi | undefined {
  const ctx = useContext(TableFeaturesContext);
  return ctx?.getFeature<TApi>(featureName);
}

export interface TableFeaturesProviderProps<T = any> {
  features?: TableFeature<T>[];
  children: React.ReactNode;
}

export function TableFeaturesProvider<T = any>({
  features = [],
  children,
}: TableFeaturesProviderProps<T>) {
  const engine = useTableEngine<T>();
  const domRefs = useTableDOM();
  const { activeView } = useTableView();
  const meta = useTableMeta();

  // Stable aggregated APIs map
  const featureApis = useMemo(() => {
    const map: Record<string, unknown> = {};
    for (const f of features) {
      if (f.api) {
        map[f.name] = f.api;
      }
    }
    return map;
  }, [features]);

  const contextValue = useMemo<TableFeaturesContextValue>(
    () => ({
      features: featureApis,
      getFeature: <TApi = unknown>(name: string): TApi | undefined =>
        featureApis[name] as TApi | undefined,
    }),
    [featureApis]
  );

  // Setup / destroy lifecycle management
  const cleanupsRef = useRef<(() => void)[]>([]);

  useEffect(() => {
    // Teardown previous run
    cleanupsRef.current.forEach((cleanup) => {
      try {
        cleanup();
      } catch (err) {
        console.error("[ZenithTable] Error during feature cleanup:", err);
      }
    });
    cleanupsRef.current = [];

    const context: TableFeatureContext<T> = {
      tableId: meta.id,
      engine,
      domRefs,
      viewMode: activeView,
      meta,
    };

    // Setup active features
    for (const feature of features) {
      try {
        const cleanup = feature.setup?.(context);
        if (typeof cleanup === "function") {
          cleanupsRef.current.push(cleanup);
        }
      } catch (err) {
        console.error(`[ZenithTable] Error setting up feature "${feature.name}":`, err);
      }
    }

    return () => {
      cleanupsRef.current.forEach((cleanup) => {
        try {
          cleanup();
        } catch (err) {
          console.error("[ZenithTable] Error during feature teardown:", err);
        }
      });
      cleanupsRef.current = [];

      for (const feature of features) {
        try {
          feature.destroy?.();
        } catch (err) {
          console.error(`[ZenithTable] Error destroying feature "${feature.name}":`, err);
        }
      }
    };
  }, [features, meta.id, activeView, engine, domRefs, meta]);

  return (
    <TableFeaturesContext.Provider value={contextValue}>
      {children}
    </TableFeaturesContext.Provider>
  );
}
