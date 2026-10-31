/**
 * Shared Auth: Permission Provider
 */

import React, { createContext, useMemo } from "react";
import { permissionEvaluator } from "@platform/authorization/permission-evaluator";
import type { IPermissionClass } from "./types";

export const PermissionContext = createContext<IPermissionClass | null>(null);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const permissionEngine = useMemo<IPermissionClass>(
    () => ({
      can: (permission: string, attributes?: Record<string, unknown>): boolean => {
        return permissionEvaluator.can(permission, attributes);
      },
      has: (action: string): boolean => {
        return permissionEvaluator.has(action);
      },
      canInBranch: (permission: string, branchId: string | number): boolean => {
        return permissionEvaluator.can(permission, { branchId });
      },
      canInTenant: (permission: string, companyId: string | number): boolean => {
        return permissionEvaluator.can(permission, { companyId });
      },
      all: (): string[] => {
        return permissionEvaluator.all();
      },
    }),
    []
  );

  return (
    <PermissionContext.Provider value={permissionEngine}>
      {children}
    </PermissionContext.Provider>
  );
};
