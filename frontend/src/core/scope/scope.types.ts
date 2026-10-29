/**
 * Multi-Tenant Scope Hierarchy Contracts
 */

export interface OrgScope {
  id: string;
  name: string;
  code: string;
  logoUrl?: string;
}

export interface BranchScope {
  id: string;
  name: string;
  code: string;
  orgId: string;
  location?: string;
}

export interface FacilityScope {
  id: string;
  name: string;
  branchId: string;
}

export interface TenantContext {
  activeOrg: OrgScope | null;
  activeBranch: BranchScope | null;
  activeFacility: FacilityScope | null;
  availableOrgs: OrgScope[];
  availableBranches: BranchScope[];
  isScopeStable: boolean;
}
