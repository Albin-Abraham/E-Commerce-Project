import type { FormField } from "../domain";

/**
 * Resolves the effective UI type of a field for style and pipeline decisions.
 * Decouples logical domain type from presentation override.
 */
export function resolveEffectiveFieldType(
  field: Pick<FormField, "type" | "meta">
): string {
  const uiComponent = field.meta?.ui?.component;
  if (uiComponent && typeof uiComponent === "string") return uiComponent;
  return field.type;
}
