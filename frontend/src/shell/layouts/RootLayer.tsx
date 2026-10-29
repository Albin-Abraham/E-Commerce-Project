import React from "react";
import { RouterProvider } from "react-aria-components";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";

import { NavigationManager } from "@core/router/NavigationManager";
import { RouteMetaProvider } from "@core/router/components/RouteMetaProvider";
import { useRouteShortcuts } from "@core/router/hooks/useRouteShortcuts";
import { useRouteSlots } from "@core/router/hooks/useRouteSlots";
import { AppPaths } from "@shell/paths";
import ProgressBar from "@ui/ProgressBar";
import { ErrorBoundary } from "@ui/common/ErrorBoundary";
import { AnimatePresence } from "framer-motion";

import { useSessionFlow } from "@features/auth/services/useSessionFlow";

import { Zenith } from "@shared/theme";
import { PageSkeleton } from "@shared/ui";

import { FramerMotion } from "@libs/react-motion";

import { GlobalHeader } from "../components/GlobalHeader";
import { GlobalSidebar } from "../components/GlobalSidebar";
import { PageFooter } from "../components/PageFooter";
import { ModuleCrashState } from "../components/errors/ModuleCrashState";
import { DrawerSurface } from "../components/surfaces/DrawerSurface";
import { NotificationSurface } from "../components/surfaces/NotificationSurface";
import { OverlaySurface } from "../components/surfaces/OverlaySurface";
import {
  NavigationSurfaceSync,
  ViewControllerProvider,
} from "../view-controller/ViewController";
import { useCssVars } from "../view-controller/layout/useLayout";

/**
 * Redirects an authenticated user to /workspace to set up their session
 * whenever the company / business unit context is not stable yet.
 * Keeps the user on /workspace (no redirect loop) while they configure it.
 */
function WorkspaceRedirect() {
  const location = useLocation();
  const { isStable, isLoading } = useSessionFlow();

  if (isLoading) return null;

  const onWorkspace =
    location.pathname === AppPaths.Workspace ||
    location.pathname.startsWith(AppPaths.Workspace + "/");

  if (!isStable && !onWorkspace) {
    return <Navigate to={AppPaths.Workspace} replace />;
  }

  return null;
}

export default function RootLayout() {
  return (
    <RouteMetaProvider>
      {/* Bootstrap LayoutCoordinator subscription + router sync */}
      <ViewControllerProvider>
        <RootLayoutContent />
      </ViewControllerProvider>
    </RouteMetaProvider>
  );
}

function RootLayoutContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const cssVars = useCssVars(); // ← LayoutCoordinator geometry as CSS variables
  useRouteShortcuts();
  useRouteSlots();

  return (
    <RouterProvider navigate={navigate}>
      {/* CSS variables injected here propagate to all children */}
      <div className={Zenith.shell("root")} style={cssVars as React.CSSProperties}>
        <WorkspaceRedirect />

        {/* Close drawers on route change */}
        <NavigationSurfaceSync />

        <NavigationManager />
        <GlobalHeader />

        <div className={Zenith.shell("shell")}>
          {/* Navigation surface — reads from SurfaceManager via useNavigationSurface */}
          <GlobalSidebar />

          {/* Left-docked drawers (e.g. filter panel) */}
          <DrawerSurface side="left" />

          <main
            className={Zenith.cn(
              Zenith.shell("main"),
              Zenith.shell("content"),
              "bg-muted/5 hide-scrollbar"
            )}
          >
            <ProgressBar />
            <React.Suspense fallback={<PageSkeleton />}>
              <AnimatePresence mode="wait">
                <FramerMotion key={location.pathname}>
                  <ErrorBoundary fallback={<ModuleCrashState />}>
                    <Outlet />
                  </ErrorBoundary>
                </FramerMotion>
              </AnimatePresence>
            </React.Suspense>

            <PageFooter />
          </main>

          {/* Right-docked drawers (record inspector, activity panel) */}
          <DrawerSurface side="right" />
        </div>

        {/* Overlay stack — sits above layout, doesn't affect geometry */}
        <OverlaySurface />

        {/* Notification stack — always on top, outside layout geometry */}
        <NotificationSurface />
      </div>
    </RouterProvider>
  );
}

