import type { FormDefinition } from "../types";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  const serialized = keys.map(
    (key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`
  );
  return `{${serialized.join(",")}}`;
}

export function buildSchemaStructuralSignature(
  definition: FormDefinition
): string {
  const snapshot = {
    id: definition.id,
    version: definition.version,
    title: definition.title,
    description: definition.description,
    layout: definition.layout,
    sections: definition.sections,
    fields: definition.fields,
    containers: definition.containers,
    settings: definition.settings,
    metadata: definition.metadata,
    events: definition.events,
    validation: definition.validation,
  };

  return stableStringify(snapshot);
}
