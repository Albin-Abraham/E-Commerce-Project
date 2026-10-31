/**
 * Platform Authorization: Cached Fast Evaluator
 */

import { AuthorizationPolicy, type AuthorizationContext } from "./authorization-policy";
import type { UserProfile } from "../identity/user-session.model";

export class PermissionEvaluator {
  private cache = new Map<string, boolean>();
  private currentUser: UserProfile | null = null;
  private currentContext: Omit<AuthorizationContext, "user"> = {};

  public setUser(user: UserProfile | null): void {
    this.currentUser = user;
    this.invalidateCache();
  }

  public setContext(context: Omit<AuthorizationContext, "user">): void {
    this.currentContext = context;
    this.invalidateCache();
  }

  public invalidateCache(): void {
    this.cache.clear();
  }

  public can(permission: string, attributes?: Record<string, unknown>): boolean {
    const context: AuthorizationContext = {
      user: this.currentUser,
      ...this.currentContext,
      attributes: attributes ?? this.currentContext.attributes,
    };

    // If dynamic attributes are provided, bypass cache to evaluate ABAC rules accurately
    if (attributes && Object.keys(attributes).length > 0) {
      return AuthorizationPolicy.evaluate(permission, context);
    }

    const cacheKey = `${permission}::${context.companyId ?? ""}::${context.branchId ?? ""}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const granted = AuthorizationPolicy.evaluate(permission, context);
    this.cache.set(cacheKey, granted);
    return granted;
  }

  public has(action: string): boolean {
    if (!this.currentUser) return false;
    if (this.currentUser.isSuperuser || this.currentUser.roles.includes("admin")) return true;

    return this.currentUser.permissions.some((p) => p.endsWith(`:${action}`) || p === action);
  }

  public all(): string[] {
    return this.currentUser?.permissions ?? [];
  }
}

export const permissionEvaluator = new PermissionEvaluator();
