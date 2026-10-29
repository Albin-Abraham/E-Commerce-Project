import { useEffect } from "react";

import { commandBus } from "@core/events/CommandBus";
import { useEventRegistry } from "@core/events/stores/eventRegistry.store";

import { useRouteMeta } from "../components/RouteMetaProvider";

/**
 * useRouteShortcuts
 *
 * Synchronizes shortcuts defined in AppRoute metadata with the global EventRegistry.
 * As the user navigates, the active shortcuts are automatically updated based on
 * the parsed RouteMetaContext snapshot.
 */
export const useRouteShortcuts = () => {
  const { shortcuts } = useRouteMeta();
  const registerShortcut = useEventRegistry((s) => s.registerShortcut);
  const unregisterShortcut = useEventRegistry((s) => s.unregisterShortcut);

  useEffect(() => {
    const activeRouteShortcuts: string[] = [];

    // Map through pre-compiled and memoized shortcuts
    shortcuts.forEach((sc, scIndex) => {
      const keys = Array.isArray(sc.key) ? sc.key : [sc.key];

      keys.forEach((key, keyIndex) => {
        const id = `route-${sc.matchId}-${key}-${scIndex}-${keyIndex}`;
        activeRouteShortcuts.push(id);

        registerShortcut(id, {
          key,
          description: sc.description,
          enabled: true,
          priority: sc.routeIndex,
          scope: "page",
          command: {
            execute: (data) => {
              commandBus.emit(sc.command, data);
            },
          },
        });
      });
    });

    // Cleanup: Unregister all shortcuts added by this hook instance
    return () => {
      activeRouteShortcuts.forEach((id) => unregisterShortcut(id));
    };
  }, [shortcuts, registerShortcut, unregisterShortcut]);
};
