import { useEffect } from "react";

import type { LazyRegistryStore } from "@ui/form/registry";
import type { FormDefinition } from "@ui/form/types";

/**
 * Preloads lazy field components for a set of form definitions.
 *
 * Call this at the route level to warm the field component cache
 * before the form renders — eliminates the loading skeleton flash.
 *
 * ## Usage
 * ```tsx
 * import { usePreloadFormFields } from "@ui/form/hooks/usePreloadFields";
 * import { createSplitRegistry } from "@ui/form/fields/lazy-registry-builder";
 *
 * function ProductPage() {
 *   usePreloadFormFields(productFormDef);
 *   return <Form definition={productFormDef} registry={createSplitRegistry()} />;
 * }
 * ```
 */
export function usePreloadFormFields(
  definitions: FormDefinition | FormDefinition[],
  registry?: LazyRegistryStore
) {
  useEffect(() => {
    if (!registry || typeof registry.preloadMany !== "function") return;

    const defs = Array.isArray(definitions) ? definitions : [definitions];
    const fields = defs.flatMap((d) => {
      const sections = (d as any).sections || [];
      return sections.flatMap((s: any) => s.fields || []);
    });

    const types = [...new Set(fields.map((f: any) => f.type).filter(Boolean))];
    if (types.length > 0) {
      registry.preloadMany(types).catch(() => {});
    }
  }, [definitions, registry]);
}
