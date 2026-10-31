/**
 * Shared Auth: Declarative Permission Guard
 *
 * Conditionally renders UI elements based on permission evaluation.
 * Invariant: Frontend permission guards are for UX convenience;
 * backend Django permission classes enforce true security.
 */

import React from "react";
import { usePermissions } from "./usePermissions";

export interface PermissionGuardProps {
  permission: string;
  attributes?: Record<string, unknown>;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  attributes,
  fallback = null,
  children,
}) => {
  const { can } = usePermissions();

  const isGranted = can(permission, attributes);

  if (!isGranted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
