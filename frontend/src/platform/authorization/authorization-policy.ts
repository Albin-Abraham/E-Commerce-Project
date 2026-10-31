/**
 * Platform Authorization: RBAC + ABAC Policy Engine
 *
 * Evaluates role-based and attribute-based access control policies.
 */

import { PermissionVO } from "./permission.vo";
import type { UserProfile } from "../identity/user-session.model";

export interface AuthorizationContext {
  user: UserProfile | null;
  tenantId?: string | number;
  companyId?: string | number;
  branchId?: string | number;
  attributes?: Record<string, unknown>;
}

export type PolicyRule = (
  permission: string,
  context: AuthorizationContext
) => boolean;

export class AuthorizationPolicy {
  private static customRules: PolicyRule[] = [];

  public static registerRule(rule: PolicyRule): void {
    this.customRules.push(rule);
  }

  /**
   * Core evaluator combining RBAC and ABAC checks
   */
  public static evaluate(
    permission: string,
    context: AuthorizationContext
  ): boolean {
    const { user } = context;
    if (!user) return false;

    // Superusers have unconditional access
    if (user.isSuperuser) return true;

    // Check custom ABAC rules first
    for (const rule of this.customRules) {
      if (rule(permission, context)) {
        return true;
      }
    }

    // Role-based wildcard check
    if (user.roles.includes("admin")) {
      return true;
    }

    // Direct permission list check with wildcard matching
    const target = new PermissionVO(permission);
    for (const granted of user.permissions) {
      try {
        const grantedVO = new PermissionVO(granted);
        if (grantedVO.matches(target.value)) {
          return true;
        }
      } catch {
        if (granted === permission || granted === "*") return true;
      }
    }

    // Tenant/Branch-specific membership verification
    if (context.companyId !== undefined) {
      const membership = user.memberships.find(
        (m) => String(m.companyId) === String(context.companyId)
      );
      if (!membership) return false;

      if (context.branchId !== undefined) {
        const branch = membership.branches.find(
          (b) => String(b.branchId) === String(context.branchId)
        );
        if (!branch) return false;
      }
    }

    return false;
  }
}
