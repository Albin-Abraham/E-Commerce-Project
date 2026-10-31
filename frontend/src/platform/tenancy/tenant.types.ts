/**
 * Platform Tenancy: Multi-Tenant Hierarchy Contracts
 *
 * Models Company -> Branch -> Facility scoping relationships.
 */

export interface TenantCompany {
  id: string | number;
  name: string;
  code: string;
  currency?: string;
  isDefault?: boolean;
}

export interface TenantBranch {
  id: string | number;
  companyId: string | number;
  name: string;
  code: string;
  isDefault?: boolean;
}

export interface TenantFacility {
  id: string | number;
  branchId: string | number;
  name: string;
}

export interface TenantState {
  activeCompany: TenantCompany | null;
  activeBranch: TenantBranch | null;
  activeFacility: TenantFacility | null;
  availableCompanies: TenantCompany[];
  availableBranches: TenantBranch[];
}
