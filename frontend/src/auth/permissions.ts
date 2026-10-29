// Permission system based on a user's profile
// src/auth/permissions.ts

/**
 * Represents the raw permission entries stored on a user profile.
 * The shape is deliberately flexible – each key is a permission name
 * and the value can be a boolean, a list of allowed actions, or an
 * object describing overrides.
 */
export type PermissionRecord = Record<string, boolean | string[] | PermissionOverride>;

/**
 * Allows fine‑grained overrides for a specific permission.
 * `required` – actions that MUST be present for the permission to be true.
 * `override` – actions that explicitly enable the permission even if the
 *           base check would be false.
 */
export interface PermissionOverride {
  required?: string[]; // e.g. ["read", "write"]
  override?: string[]; // e.g. ["admin"]
}

/**
 * Core permission evaluation API.
 *
 * `can(permission)` – returns true if the permission exists and is truthy.
 * `has(action)`      – checks whether a specific allowed action is present.
 * `all()`            – returns the full list of resolved actions for the user.
 * `override(action)` – forces an additional action to be considered granted.
 * `required(action)` – checks that the required action(s) are satisfied.
 */
export interface IPermissionClass {
  /** Does the user have the named permission? */
  can(permission: string): boolean;

  /** Does the user have the specific action within a permission set? */
  has(action: string): boolean;

  /** Returns all resolved actions (flattened) for the current user. */
  all(): string[];

  /** Temporarily add an action that bypasses the normal checks. */
  override(action: string): void;

  /** Verify that a required action is satisfied; throws if not. */
  required(action: string): void;
}

/**
 * Context‑aware permission helper that is instantiated with a profile.
 * The profile contains a `permissions` field respecting `PermissionRecord`.
 */
export interface IPermissionContextClass {
  /** The underlying profile object (could be JWT payload, API response, …). */
  profile: { permissions: PermissionRecord };

  /** Create an `IPermissionClass` bound to this profile. */
  createPermissionChecker(): IPermissionClass;
}

/**
 * Concrete implementation of `IPermissionClass`.
 * It resolves permissions by merging base booleans, explicit action lists,
 * and any overrides defined via `PermissionOverride`.
 */
export class PermissionChecker implements IPermissionClass {
  private overrides = new Set<string>();
  private readonly record: PermissionRecord;

  constructor(record: PermissionRecord) {
    this.record = record;
  }

  can(permission: string): boolean {
    const entry = this.record[permission];
    if (entry === undefined) return false;
    if (typeof entry === "boolean") return entry;
    // array or override object – treat truthy as granted
    return true;
  }

  has(action: string): boolean {
    // First check explicit overrides
    if (this.overrides.has(action)) return true;

    // Scan all permission entries for the action
    for (const value of Object.values(this.record)) {
      if (Array.isArray(value) && value.includes(action)) return true;
      if (typeof value === "object" && value !== null) {
        const ov = value as PermissionOverride;
        if (ov.override?.includes(action)) return true;
      }
    }
    return false;
  }

  all(): string[] {
    const actions = new Set<string>([...this.overrides]);
    for (const value of Object.values(this.record)) {
      if (Array.isArray(value)) {
        value.forEach(a => actions.add(a));
      } else if (typeof value === "object" && value !== null) {
        const ov = value as PermissionOverride;
        ov.override?.forEach(a => actions.add(a));
      }
    }
    return Array.from(actions);
  }

  override(action: string): void {
    this.overrides.add(action);
  }

  required(action: string): void {
    if (!this.has(action)) {
      throw new Error(`Required permission action "${action}" is missing`);
    }
  }
}

/**
 * Concrete implementation of `IPermissionContextClass`.
 */
export class PermissionContext implements IPermissionContextClass {
  profile: { permissions: PermissionRecord };

  constructor(profile: { permissions: PermissionRecord }) {
    this.profile = profile;
  }

  createPermissionChecker(): IPermissionClass {
    return new PermissionChecker(this.profile.permissions);
  }
}
