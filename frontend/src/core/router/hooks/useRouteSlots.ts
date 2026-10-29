import { useEffect } from "react";

import { slotRegistry } from "@core/slots";

import { useRouteMeta } from "../components/RouteMetaProvider";

/**
 * useRouteSlots
 *
 * Industrial-grade hook that synchronizes declarative slot definitions
 * from route metadata with the SlotRegistry using the parsed RouteMetaContext snapshot.
 */
export const useRouteSlots = () => {
  const { slots } = useRouteMeta();

  useEffect(() => {
    const activeRouteSlots: string[] = [];

    // Register active slots gathered by RouteMetaProvider
    slots.forEach((s, sIndex) => {
      const id = `route-${s.matchId}-${s.name}-${sIndex}`;
      activeRouteSlots.push(`${s.name}|${id}`);

      slotRegistry.register(s.name, {
        id,
        component: s.component,
        props: s.props,
        priority: s.priority ?? s.routeIndex,
      });
    });

    // Cleanup: Remove slots when navigating away
    return () => {
      activeRouteSlots.forEach((combinedId) => {
        const [name, id] = combinedId.split("|");
        slotRegistry.unregister(name, id);
      });
    };
  }, [slots]);
};
