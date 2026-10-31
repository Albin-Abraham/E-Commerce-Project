/**
 * Platform Identity: User Session & Identity Contracts
 *
 * Models authenticated identity, tenant memberships, contact information, and roles.
 */

export interface TenantMembership {
  companyId: string | number;
  companyName: string;
  isDefault?: boolean;
  branches: Array<{
    branchId: string | number;
    branchName: string;
    isDefault?: boolean;
  }>;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  isStaff: boolean;
  isSuperuser: boolean;
  roles: string[];
  permissions: string[];
  memberships: TenantMembership[];
}

export interface UserSession {
  user: UserProfile | null;
  isAuthenticated: boolean;
  accessToken?: string;
  expiresAt?: string;
}
