import { useEffect, useState } from "react";
import { useTablePhysics } from "../core/TablePhysicsContext";
import { useTableView } from "../core/TableViewContext";
import type { TableDensity } from "../core/createTablePhysicsStore";
import type { ViewMode } from "../types";

export interface UseTablePreferencesOptions {
  tableId: string;
  syncTo?: "localStorage" | "url" | "both";
  defaultDensity?: TableDensity;
  defaultView?: ViewMode;
}

export function useTablePreferences({
  tableId,
  syncTo = "localStorage",
  defaultDensity,
  defaultView,
}: UseTablePreferencesOptions) {
  const density = useTablePhysics((s) => s.density);
  const setDensity = useTablePhysics((s) => s.setDensity);
  const { activeView, setView } = useTableView();
  const [isHydrated, setIsHydrated] = useState(false);

  const storageKey = `zenith_table_pref_${tableId}`;

  // Hydrate preferences on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (syncTo === "localStorage" || syncTo === "both") {
      try {
        const raw = localStorage.getItem(storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.density) setDensity(parsed.density);
          if (parsed.view) setView(parsed.view);
        } else {
          if (defaultDensity) setDensity(defaultDensity);
          if (defaultView) setView(defaultView);
        }
      } catch (err) {
        console.warn("[ZenithTable] Error hydrating table preferences:", err);
      }
    }
    setIsHydrated(true);
  }, [tableId, storageKey, syncTo, defaultDensity, defaultView, setDensity, setView]);

  // Persist preferences on change
  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;

    if (syncTo === "localStorage" || syncTo === "both") {
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            density,
            view: activeView,
            updatedAt: Date.now(),
          })
        );
      } catch (err) {
        console.warn("[ZenithTable] Error persisting table preferences:", err);
      }
    }
  }, [storageKey, syncTo, density, activeView, isHydrated]);

  return {
    density,
    activeView,
    setDensity,
    setView,
    isHydrated,
  };
}
