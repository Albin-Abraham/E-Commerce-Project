import { create } from "zustand";
import { storeRegistry } from "@core/state/StoreRegistry";
import type { BranchScope, FacilityScope, OrgScope, TenantContext } from "./scope.types";

export interface ScopeStoreState extends TenantContext {
  setAvailableOrgs: (orgs: OrgScope[]) => void;
  setAvailableBranches: (branches: BranchScope[]) => void;
  selectOrg: (org: OrgScope | null) => void;
  selectBranch: (branch: BranchScope | null) => void;
  selectFacility: (facility: FacilityScope | null) => void;
  resetScope: () => void;
}

const INITIAL_STATE: TenantContext = {
  activeOrg: null,
  activeBranch: null,
  activeFacility: null,
  availableOrgs: [],
  availableBranches: [],
  isScopeStable: false,
};

export const useScopeStore = create<ScopeStoreState>((set) => ({
  ...INITIAL_STATE,

  setAvailableOrgs: (availableOrgs) => set({ availableOrgs }),

  setAvailableBranches: (availableBranches) => set({ availableBranches }),

  selectOrg: (activeOrg) =>
    set((state) => {
      // Cascading reset: changing org invalidates branch and facility
      const orgChanged = state.activeOrg?.id !== activeOrg?.id;
      return {
        activeOrg,
        activeBranch: orgChanged ? null : state.activeBranch,
        activeFacility: orgChanged ? null : state.activeFacility,
        isScopeStable: Boolean(activeOrg),
      };
    }),

  selectBranch: (activeBranch) =>
    set((state) => {
      const branchChanged = state.activeBranch?.id !== activeBranch?.id;
      return {
        activeBranch,
        activeFacility: branchChanged ? null : state.activeFacility,
        isScopeStable: Boolean(state.activeOrg && activeBranch),
      };
    }),

  selectFacility: (activeFacility) => set({ activeFacility }),

  resetScope: () => set(INITIAL_STATE),
}));

// Register with central store registry for clean GrayBox test resets
storeRegistry.register(
  "scopeStore",
  () => useScopeStore.getState(),
  () => useScopeStore.getState().resetScope()
);
