// src/auth/permissions.ts
/**
 * Backwards compatibility re-export.
 * Core permission contracts and implementations are now centralized in `@shared/auth`.
 */

export * from "@shared/auth";

// Legacy class re-export for compatibility
import { permissionEvaluator } from "@platform/authorization";
import type { IPermissionClass } from "@shared/auth";

export class PermissionChecker implements IPermissionClass {
  can(permission: string, attributes?: Record<string, unknown>): boolean {
    return permissionEvaluator.can(permission, attributes);
  }
  has(action: string): boolean {
    return permissionEvaluator.has(action);
  }
  canInBranch(permission: string, branchId: string | number): boolean {
    return permissionEvaluator.can(permission, { branchId });
  }
  canInTenant(permission: string, companyId: string | number): boolean {
    return permissionEvaluator.can(permission, { companyId });
  }
  all(): string[] {
    return permissionEvaluator.all();
  }
  override(): void {}
  required(action: string): void {
    if (!this.has(action)) {
      throw new Error(`Required action '${action}' missing.`);
    }
  }
}
