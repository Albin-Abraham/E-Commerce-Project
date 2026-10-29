import { useCallback } from "react";
import { useScopeStore } from "./scope.store";

export function useScope() {
  const activeOrg = useScopeStore((s) => s.activeOrg);
  const activeBranch = useScopeStore((s) => s.activeBranch);
  const activeFacility = useScopeStore((s) => s.activeFacility);
  const availableOrgs = useScopeStore((s) => s.availableOrgs);
  const availableBranches = useScopeStore((s) => s.availableBranches);
  const isScopeStable = useScopeStore((s) => s.isScopeStable);

  const selectOrg = useScopeStore((s) => s.selectOrg);
  const selectBranch = useScopeStore((s) => s.selectBranch);
  const selectFacility = useScopeStore((s) => s.selectFacility);
  const resetScope = useScopeStore((s) => s.resetScope);

  /**
   * Helper to append current org and branch scope into TanStack Query keys.
   * Prevents cross-tenant cache collisions.
   */
  const scopeQueryKey = useCallback(
    <T extends readonly unknown[]>(key: T): [...T, { orgId?: string; branchId?: string }] => {
      return [
        ...key,
        {
          orgId: activeOrg?.id,
          branchId: activeBranch?.id,
        },
      ];
    },
    [activeOrg?.id, activeBranch?.id]
  );

  return {
    activeOrg,
    activeBranch,
    activeFacility,
    availableOrgs,
    availableBranches,
    isScopeStable,
    selectOrg,
    selectBranch,
    selectFacility,
    resetScope,
    scopeQueryKey,
  };
}
