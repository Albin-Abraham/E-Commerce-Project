/**
 * Shared Auth: usePermissions Hook
 */

import { useContext } from "react";
import { PermissionContext } from "./PermissionProvider";
import { permissionEvaluator } from "@platform/authorization";
import type { IPermissionClass } from "./types";

export const usePermissions = (): IPermissionClass => {
  const context = useContext(PermissionContext);

  if (context) {
    return context;
  }

  // Fallback to singleton evaluator when outside react tree
  return {
    can: (perm: string, attrs?: Record<string, unknown>) => permissionEvaluator.can(perm, attrs),
    has: (action: string) => permissionEvaluator.has(action),
    canInBranch: (perm: string, branchId: string | number) =>
      permissionEvaluator.can(perm, { branchId }),
    canInTenant: (perm: string, companyId: string | number) =>
      permissionEvaluator.can(perm, { companyId }),
    all: () => permissionEvaluator.all(),
  };
};
