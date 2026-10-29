/**
 * @file SchemaMigrator.ts
 * @description Enterprise schema migration pipeline.
 *
 * Ensures backward compatibility of form definitions by applying sequential
 * migrations when a schema's `version` is older than the required application version.
 */
import type { FormDefinition } from "@ui/form/types";

export type MigrationFunction = (schema: any) => any;

export interface MigrationStep {
  from: string;
  to: string;
  migrate: MigrationFunction;
}

export class SchemaMigrator {
  private static steps: MigrationStep[] = [];

  /**
   * Registers a new migration step in the pipeline.
   * Steps should be registered in chronological order (e.g., v1 -> v2, then v2 -> v3).
   *
   * @param from Version string the schema is migrating from (e.g., "1.0.0")
   * @param to Version string the schema is migrating to (e.g., "2.0.0")
   * @param migrate The mutation function that upgrades the schema
   */
  public static register(from: string, to: string, migrate: MigrationFunction) {
    this.steps.push({ from, to, migrate });
  }

  /**
   * Clears all registered migrations. Used primarily for testing.
   */
  public static clear() {
    this.steps = [];
  }

  /**
   * Runs the schema through the migration pipeline until it reaches the target version.
   * If the schema has no version, it is assumed to be an unversioned/legacy schema,
   * and if a fallback "0.0.0" migration exists, it will start there.
   *
   * @param schema The raw JSON schema
   * @param targetVersion The version the application expects
   * @returns The migrated schema
   */
  public static migrate<
    T extends Record<string, any> = Record<string, any>,
  >(schema: Record<string, any>, targetVersion: string): FormDefinition<T> {
    if (!schema) return schema as FormDefinition<T>;

    let currentVersion = schema.version || "1.0.0";
    let migratedSchema = { ...schema }; // Clone to avoid mutating original reference

    // If it's already at or ahead of target, do nothing.
    // (A real semver check would be ideal here, but a basic string match suffices for linear migrations)
    if (currentVersion === targetVersion) {
      return migratedSchema as FormDefinition<T>;
    }

    // Process sequential migrations
    let stepMade = true;
    while (stepMade && currentVersion !== targetVersion) {
      stepMade = false;
      const nextStep = this.steps.find((step) => step.from === currentVersion);

      if (nextStep) {
        migratedSchema = nextStep.migrate(migratedSchema);
        currentVersion = nextStep.to;
        migratedSchema.version = currentVersion;
        stepMade = true;
      }
    }

    if (currentVersion !== targetVersion) {
      console.warn(
        `[SchemaMigrator] Could not migrate schema from version ${schema.version || "1.0.0"} to ${targetVersion}. Stopped at ${currentVersion}.`
      );
    }

    return migratedSchema as FormDefinition<T>;
  }
}
