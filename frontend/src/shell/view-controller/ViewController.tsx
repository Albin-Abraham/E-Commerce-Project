/**
 * ── VIEW CONTROLLER ───────────────────────────────────────────────────────────
 *
 * Top-level orchestrator. Composes:
 *   SurfaceManager (already a Zustand store — no Provider needed)
 *   LayoutCoordinator (bootstrapped here via subscription)
 *   Router-aware navigation surface cleanup
 *
 * Renders the structural skeleton:
 *   Navigation | [Left Drawer] | Main | [Right Drawer]
 *   Overlay Stack
 *   Notification Stack
 */
import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { bootstrapLayoutSubscription } from "./layout/LayoutCoordinator";
import { useSurfaceManager } from "./surface/SurfaceManager";

interface ViewControllerProps {
  children: React.ReactNode;
}

/**
 * ViewControllerProvider
 *
 * Wrap this around RootLayoutContent to activate the ViewController system.
 * Bootstraps the LayoutCoordinator subscription and wires router navigation
 * events to surface dismissal.
 */
export const ViewControllerProvider: React.FC<ViewControllerProps> = ({ children }) => {
  // Bootstrap LayoutCoordinator → SurfaceManager subscription (once)
  useEffect(() => {
    const unsubscribe = bootstrapLayoutSubscription();
    return unsubscribe;
  }, []);

  return <>{children}</>;
};

/**
 * NavigationSurfaceSync
 *
 * Watches the router location and closes surfaces with "user-or-navigation"
 * dismissal policy (drawers) on route change.
 *
 * Mount this inside the Router context (inside RootLayoutContent).
 */
export const NavigationSurfaceSync: React.FC = () => {
  const location = useLocation();
  const closeOnNavigate = useSurfaceManager((s) => s.closeOnNavigate);

  useEffect(() => {
    closeOnNavigate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return null;
};
