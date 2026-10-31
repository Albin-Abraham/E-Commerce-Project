/**
 * Shared Auth: Type Contracts
 */

import type { UserProfile, UserSession } from "@platform/identity";

export type { UserProfile, UserSession };

export type PermissionRecord = Record<string, boolean | string[] | PermissionOverride>;

export interface PermissionOverride {
  required?: string[];
  override?: string[];
}

export interface IPermissionClass {
  can(permission: string, attributes?: Record<string, unknown>): boolean;
  has(action: string): boolean;
  canInBranch(permission: string, branchId: string | number): boolean;
  canInTenant(permission: string, companyId: string | number): boolean;
  all(): string[];
}
