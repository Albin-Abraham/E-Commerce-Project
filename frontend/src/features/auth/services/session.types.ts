/**
 * Organizational Hierarchy Types
 *
 * Defines the tiered context for a user session.
 * 1. Company (Global Entity)
 * 2. Business Unit (Regional/Functional Division)
 * 3. Branch (Physical Operational Site)
 */

export interface Company {
  id: string;
  name: string;
  code: string;
  logoUrl?: string;
}

export interface BusinessUnit {
  id: string;
  name: string;
  code?: string;
  companyId: string;
  isActive?: boolean;
}

export interface Branch {
  id: string;
  name: string;
  code?: string;
  businessUnitId: string;
  address?: string;
  timezone?: string;
  isActive?: boolean;
}

/**
 * Session Context State
 * Represents the currently selected hierarchy of identities.
 *
 * Stability is achieved with a 2-tier model: Company + Business Unit.
 * Branch is optional and can be selected after the session is stable.
 */
export interface SessionContext {
  company: Company | null;
  businessUnit: BusinessUnit | null;
  /** Optional — branch selection is deferred or skipped */
  branch: Branch | null;

  /** True when company and businessUnit are both selected */
  isStable: boolean;
}
