/**
 * WorkspacePage
 *
 * A standalone, full-viewport screen at /workspace that lets an
 * already-authenticated user set up / switch their active Company / Business
 * Unit server session.
 *
 * Registered as a TOP-LEVEL route (sibling of the Root shell), so it renders
 * on its own WITHOUT the RootLayout shell (header / sidebar).
 *  - Resets the current context on mount so the picker always shows fresh
 *  - Navigates to "/" (inside the Root shell) after a successful "Launch"
 */
import React, { Suspense, lazy, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { AppPaths } from "@shell/paths";
import { PageSkeleton } from "@ui/PageSkeleton";

import { authManager } from "@features/auth/services/auth-manager";

const SessionContextPicker = lazy(
  () => import("@features/auth/components/SessionContextPicker")
);

const WorkspacePage: React.FC = () => {
  const navigate = useNavigate();

  // Reset the active session context so the picker always starts fresh —
  // the user is explicitly switching, not re-confirming an existing selection.
  useEffect(() => {
    authManager.resetContext();
  }, []);

  return (
    <div
      id="workspace-page"
      className="bg-background text-foreground bg-architectural-grid flex items-center justify-center min-h-screen relative p-6 box-border"
    >
      <Suspense fallback={<PageSkeleton />}>
        {/*
         * Pass an onLaunch callback so the picker can navigate to "/"
         * after the session is committed, instead of staying on /workspace.
         */}
        <SessionContextPicker
          onLaunch={() => navigate(AppPaths.Root, { replace: true })}
        />
      </Suspense>
    </div>
  );
};

export default WorkspacePage;
