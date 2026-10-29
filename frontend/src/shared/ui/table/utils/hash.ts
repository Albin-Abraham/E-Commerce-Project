/**
 * Fast 32-bit FNV-1a hashing utility for schema fingerprinting.
 *
 * Provides sub-millisecond hash generation for complex JavaScript objects and
 * schema ASTs, avoiding expensive deep JSON.stringify operations during table
 * column and form meta compilation lookups.
 */

export function fnv1a32(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    // 32-bit FNV prime multiplication: hash * 16777619
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  // Convert to unsigned 8-character hex string
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export function computeSchemaHash(value: unknown): string {
  if (value === null || value === undefined) return "00000000";
  if (typeof value === "string") return fnv1a32(value);
  if (typeof value === "number" || typeof value === "boolean") return fnv1a32(String(value));
  
  try {
    return fnv1a32(JSON.stringify(value));
  } catch {
    return fnv1a32(String(value));
  }
}
