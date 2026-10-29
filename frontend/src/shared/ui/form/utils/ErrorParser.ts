import type { DetailedError } from "@form-core/engine";

/**
 * Fallback alias map for common server ↔ form field name mismatches.
 * Constructed once at module load — not per parse call.
 *
 * Keys   = server error field paths that the API may return.
 * Values = ordered list of local field names to try resolving against.
 */
const FIELD_ALIASES: Readonly<Record<string, readonly string[]>> = {
  email: ["username", "login", "user"],
  username: ["email", "login", "user"],
  first_name: ["firstName", "name"],
  last_name: ["lastName"],
  confirm_password: ["confirmPassword"],
  confirmPassword: ["confirm_password"],
  non_field_errors: ["username", "email", "login", "password"],
  nonFieldErrors: ["username", "email", "login", "password"],
  detail: ["username", "email", "login", "password"],
};

/**
 * ErrorParser
 *
 * Responsibility: Transforms complex, nested API error responses into the flat
 * DetailedError format required by the Form Engine.
 */
export class ErrorParser {
  /**
   * Transforms a nested error object into a flat array of DetailedError.
   *
   * @param errors - The raw API error response (nested objects or arrays).
   * @param nameToIdMap - A map of field names to their internal field IDs.
   * @param schemaAliases - Explicit per-field aliases declared in the schema.
   * @returns A flat array of DetailedError ready for Form.setErrors().
   */
  static parse(
    errors: Record<string, any>,
    nameToIdMap: Record<string, string> = {},
    schemaAliases: Record<string, string[]> = {}
  ): DetailedError[] {
    const standardErrors: DetailedError[] = [];

    const resolveFieldId = (path: string): string => {
      // Direct field name or direct indexed alias lookup (O(1))
      if (nameToIdMap[path]) return nameToIdMap[path];

      // Check explicit schema-provided field aliases
      if (schemaAliases[path]) {
        for (const target of schemaAliases[path]) {
          if (nameToIdMap[target]) return nameToIdMap[target];
        }
      }
      for (const [targetFieldName, aliases] of Object.entries(schemaAliases)) {
        if (Array.isArray(aliases) && aliases.includes(path)) {
          if (nameToIdMap[targetFieldName]) return nameToIdMap[targetFieldName];
        }
      }

      // Check common fallback aliases (module-scoped, allocated once)
      const fallback = FIELD_ALIASES[path];
      if (fallback) {
        for (const alias of fallback) {
          if (nameToIdMap[alias]) return nameToIdMap[alias];
        }
      }

      return path;
    };

    const flatten = (obj: any, path = "") => {
      if (!obj || typeof obj !== "object") return;

      Object.entries(obj).forEach(([key, value]) => {
        const currentPath = path ? `${path}.${key}` : key;

        if (Array.isArray(value)) {
          // Handle Array of messages: { email: ["Err 1", "Err 2"] }
          value.forEach((msg) => {
            if (typeof msg === "string") {
              const fieldId = resolveFieldId(currentPath);
              standardErrors.push({
                code: "server",
                message: msg,
                fieldId,
              });
            }
          });
        } else if (value && typeof value === "object") {
          // Handle Nested Objects: { profile: { name: "Err" } }
          flatten(value, currentPath);
        } else if (typeof value === "string") {
          // Handle Single Message: { email: "Err" }
          const fieldId = resolveFieldId(currentPath);
          standardErrors.push({
            code: "server",
            message: value,
            fieldId,
          });
        }
      });
    };

    flatten(errors);
    return standardErrors;
  }
}
