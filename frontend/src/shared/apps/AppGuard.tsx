/**
 * Shared Apps: Declarative App Guard
 *
 * Verifies that the user has entitlement to view the designated application.
 */

import React from "react";
import { appRegistry } from "./app.registry";
import { usePermissions } from "../auth/usePermissions";
import type { AppId } from "./app.descriptor";

export interface AppGuardProps {
  appId: AppId;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const AppGuard: React.FC<AppGuardProps> = ({
  appId,
  fallback = null,
  children,
}) => {
  const { can } = usePermissions();
  const descriptor = appRegistry.get(appId);

  if (!descriptor) {
    return <>{fallback}</>;
  }

  if (descriptor.requiredPermission && !can(descriptor.requiredPermission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
