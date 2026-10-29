/**
 * Shared normalization utilities used by both SchemaNormalizer (render tree)
 * and normalizeFormDefinition (engine flat maps).
 */

export function hashString(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return Math.abs(hash >>> 0).toString(36);
}

export function getDeterministicId(seed: string): string {
  return `fld_${hashString(seed)}`;
}

/**
 * Resolves field identity from key/id/name with consistent priority.
 * Both normalizers call this to avoid drift in id/name generation.
 */
export function resolveFieldIdentity(
  field: {
    id?: string;
    name?: string;
    key?: string;
    type?: string;
    label?: string;
  },
  pathSeed: string,
  counter: { value: number }
): { id: string; name: string } {
  let id = field.id;
  let name = field.name;

  if (field.key) {
    if (!id) id = field.key;
    if (!name) name = field.key;
  }

  if (!id) {
    id = field.name || `${field.type || "field"}_${++counter.value}`;
  }

  const resolvedId =
    id ||
    getDeterministicId(
      `${pathSeed}:${field.type || "unknown"}:${field.label || ""}`
    );
  return {
    id: resolvedId,
    name: name || resolvedId,
  };
}
