import React from "react";
import { useNavigate } from "react-router-dom";

import { PlatformCommand } from "@core/events/config/shortcuts";
import { AppPaths } from "@shell/paths";

import { type NavigationCommands, useCommandBus } from "./hooks/useCommandBus";
import { useRouteNavigation } from "./hooks/useRouteNavigation";

/**
 * NavigationManager
 *
 * A headless orchestration component that bridges the global CommandBus
 * with the React Router instance. This allows navigation to be triggered
 * via keyboard shortcuts, voice commands, or other platform events
 * without requiring direct access to the navigate hook.
 * Destinations are resolved through stable routeIds via the
 * RouteNavigationPort, with AppPaths fallbacks for resilience.
 */
export const NavigationManager: React.FC = () => {
  const navigate = useNavigate();
  const routeNav = useRouteNavigation();

  // Explicit type-safe command listener registration
  useCommandBus<NavigationCommands>({
    [PlatformCommand.GoHome]: (payload) => {
      if (!routeNav.navigateToRoute("workspace", { replace: payload?.replace })) {
        navigate(AppPaths.Workspace, { replace: payload?.replace });
      }
    },
    [PlatformCommand.OpenBuilder]: (payload) => {
      const base = routeNav.resolveRoutePath("builder") ?? AppPaths.Builder;
      const target = payload?.templateId
        ? `${base}/${payload.templateId}`
        : base;
      navigate(target);
    },
    [PlatformCommand.Logout]: () => {},
    [PlatformCommand.ToggleSidebar]: () => {},
    [PlatformCommand.FocusSearch]: () => {},
  });

  return null; // Headless component
};

export default NavigationManager;
