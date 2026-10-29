import React, { createContext, useContext, useEffect, useMemo } from "react";

import { EventDelegator } from "./EventDelegator";
import { initGlobalEvents } from "./config/init";
import { KeyboardDelegationStrategy } from "./strategies/KeyboardDelegationStrategy";
import { MouseDelegationStrategy } from "./strategies/MouseDelegationStrategy";

const EventDelegatorContext = createContext<EventDelegator | null>(null);

// One-time initialization
initGlobalEvents();

export const useEventDelegator = () => {
  const context = useContext(EventDelegatorContext);
  if (!context) {
    throw new Error(
      "useEventDelegator must be used within a GlobalEventProvider"
    );
  }
  return context;
};

interface GlobalEventProviderProps {
  children: React.ReactNode;
}

/**
 * GlobalEventProvider
 * Initializes the EventDelegator and manages its lifecycle (BOM attachment/detachment).
 */
export const GlobalEventProvider: React.FC<GlobalEventProviderProps> = ({
  children,
}) => {
  const delegator = useMemo(() => {
    return new EventDelegator()
      .registerStrategy(new KeyboardDelegationStrategy())
      .registerStrategy(new MouseDelegationStrategy());
  }, []);

  useEffect(() => {
    // Start listening on mount
    delegator.start();

    // Cleanup on unmount (Critical for HMR and memory)
    return () => {
      delegator.stop();
    };
  }, [delegator]);

  return (
    <EventDelegatorContext.Provider value={delegator}>
      {children}
    </EventDelegatorContext.Provider>
  );
};
