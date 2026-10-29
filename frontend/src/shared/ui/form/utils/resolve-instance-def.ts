/**
 * @file resolve-instance-def.ts
 * @description InstanceDefinition resolver utility.
 *
 * Merges manifest-level type defaults with schema-level field configuration to
 * produce a complete InstanceDefinition. Replaces ad-hoc options resolution
 * (e.g. `options || field.options || field.meta?.options?.options || []`)
 * in SelectField, RadioField, and RemoteOptionsManager.
 *
 * @module ResolveInstanceDef
 */
import { useManifestRegistry } from "../context/ManifestRegistryContext";
import type { ManifestRegistry } from "@form-core/ManifestRegistry";
import { manifestRegistry as defaultRegistry } from "@form-core/ManifestRegistry";
import type { FormField } from "../fields";
import type { InstanceDefinition } from "../types/manifest";

/**
 * Resolves an InstanceDefinition for a given field.
 *
 * Merges (in order, later wins):
 * 1. Manifest-level type defaults (via `manifestRegistry.getInstanceDefaults`).
 * 2. Schema-level `field.remoteOptions` → sets `options.source = "remote"` and configures the remote block.
 * 3. Schema-level `field.options` / `field.meta?.options?.options` → sets `options.source = "static"` and `items`.
 * 4. Schema-level `field.creatable` / `field.clearable` → merges into `selection`.
 *
 * @param field - The schema field definition.
 * @param registry - Optional ManifestRegistry instance (defaults to the global singleton).
 * @returns A merged InstanceDefinition object.
 */
export function resolveInstanceDefinition(
  field: FormField,
  registry: ManifestRegistry = defaultRegistry
): InstanceDefinition {
  const defaults = registry.getInstanceDefaults(field.type);

  let def: InstanceDefinition = {};

  if (defaults) {
    def = defaults(field);
  }

  // Merge schema-level options/remoteOptions over manifest defaults
  if (field.remoteOptions) {
    def.options = {
      ...def.options,
      source: "remote",
      remote: {
        url: field.remoteOptions.url,
        method: field.remoteOptions.method || "GET",
        params: field.remoteOptions.params,
        headers: field.remoteOptions.headers,
        watch: field.remoteOptions.watch,
        mapping: field.remoteOptions.mapping as any,
      },
    };
  } else if (field.options || field.meta?.options?.options) {
    def.options = {
      ...def.options,
      source: "static",
      items: (field.options || field.meta?.options?.options || []) as any[],
    };
  }

  // Merge selection config
  if (field.creatable) {
    def.selection = { ...def.selection, creatable: true } as any;
  }
  if (field.clearable !== undefined) {
    def.selection = { ...def.selection, clearable: field.clearable } as any;
  }

  return def;
}

/**
 * Hook version of `resolveInstanceDefinition`.
 *
 * Returns the resolved InstanceDefinition for a field. Resolves the
 * ManifestRegistry from React context (falls back to the global singleton
 * when called outside a ManifestRegistryProvider tree).
 *
 * @param field - The schema field definition.
 * @returns A merged InstanceDefinition object.
 */
export function useInstanceDefinition(field: FormField): InstanceDefinition {
  const { manifestRegistry } = useManifestRegistry();
  return resolveInstanceDefinition(field, manifestRegistry);
}
