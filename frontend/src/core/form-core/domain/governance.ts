/**
 * @file governance.ts
 * @description Domain contracts for the Governance pillar in MetaConfig v2.
 *
 * Encapsulates compliance, security, concurrency, audit trails, and access control.
 * Strictly framework-agnostic (Clean Architecture / Domain Layer).
 *
 * @module DomainGovernance
 */

export type FieldAccessLevel = "editable" | "readOnly" | "hidden" | "masked";

export interface FieldAccessRule {
  fieldId: string;
  roles?: string[];
  access: FieldAccessLevel;
  condition?: string;
}

export interface RolePermissions {
  roles: string[];
  defaultAccess?: FieldAccessLevel;
  rules?: FieldAccessRule[];
}

export interface AuditConfig {
  trackChanges: boolean;
  requireReasonOnEdit?: boolean;
  excludeFields?: string[];
  metadata?: Record<string, unknown>;
}

export interface ConcurrencyConfig {
  mode: "optimistic" | "pessimistic" | "lastWriteWins";
  versionField?: string;
  onConflict?: "reject" | "diff" | "overwrite";
}

export interface ComplianceConfig {
  maskPII?: boolean;
  maskedFields?: string[];
  dataRetentionDays?: number;
  gdprSubjectField?: string;
}

export interface GovernanceDefinition {
  /** Access control and role-based permissions */
  permissions?: RolePermissions;

  /** Change-tracking and audit log policies */
  audit?: AuditConfig;

  /** Optimistic locking and concurrency conflict resolution */
  concurrency?: ConcurrencyConfig;

  /** Compliance, privacy, and PII policies */
  compliance?: ComplianceConfig;

  /** Target schema version for migration contracts */
  schemaVersion?: number;
}
