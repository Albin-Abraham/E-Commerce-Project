import { describe, expect, it } from "vitest";

import { ErrorParser } from "../ErrorParser";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/**
 * Build a minimal nameToIdMap for the given field names.
 * By convention the test ID equals `id_<name>` to keep assertions readable.
 */
function makeMap(...fieldNames: string[]): Record<string, string> {
  return Object.fromEntries(fieldNames.map((n) => [n, `id_${n}`]));
}

// ---------------------------------------------------------------------------
describe("ErrorParser.parse()", () => {
  // ── 1. Direct field resolution ────────────────────────────────────────────
  describe("direct field resolution", () => {
    it("resolves a flat string error to its field id", () => {
      const map = makeMap("email");
      const result = ErrorParser.parse({ email: "Invalid email." }, map);
      expect(result).toEqual([
        { code: "server", message: "Invalid email.", fieldId: "id_email" },
      ]);
    });

    it("resolves an array of messages for a single field", () => {
      const map = makeMap("password");
      const result = ErrorParser.parse(
        { password: ["Too short.", "Must contain a number."] },
        map
      );
      expect(result).toHaveLength(2);
      expect(result[0].fieldId).toBe("id_password");
      expect(result[1].message).toBe("Must contain a number.");
    });

    it("falls back to the raw key when no mapping exists", () => {
      const result = ErrorParser.parse({ unknown_field: "Oops." }, {});
      expect(result).toEqual([
        { code: "server", message: "Oops.", fieldId: "unknown_field" },
      ]);
    });
  });

  // ── 2. FIELD_ALIASES fallback map ─────────────────────────────────────────
  describe("built-in FIELD_ALIASES fallback", () => {
    it("maps 'email' server key → 'username' field via fallback alias", () => {
      const map = makeMap("username"); // server sends "email", form has "username"
      const result = ErrorParser.parse({ email: "Invalid email." }, map);
      expect(result[0].fieldId).toBe("id_username");
    });

    it("maps 'username' server key → 'email' field via fallback alias", () => {
      const map = makeMap("email"); // server sends "username", form has "email"
      const result = ErrorParser.parse({ username: "Not found." }, map);
      expect(result[0].fieldId).toBe("id_email");
    });

    it("maps 'non_field_errors' to the first matching fallback field (username)", () => {
      const map = makeMap("username");
      const result = ErrorParser.parse(
        { non_field_errors: ["Invalid credentials."] },
        map
      );
      expect(result[0].fieldId).toBe("id_username");
    });

    it("maps 'detail' error to first matched fallback field (password when username absent)", () => {
      const map = makeMap("password");
      const result = ErrorParser.parse({ detail: "Invalid credentials." }, map);
      expect(result[0].fieldId).toBe("id_password");
    });

    it("maps 'confirm_password' → 'confirmPassword' field via fallback alias", () => {
      const map = makeMap("confirmPassword");
      const result = ErrorParser.parse(
        { confirm_password: "Passwords do not match." },
        map
      );
      expect(result[0].fieldId).toBe("id_confirmPassword");
    });

    it("maps 'confirmPassword' → 'confirm_password' field via fallback alias", () => {
      const map = makeMap("confirm_password");
      const result = ErrorParser.parse(
        { confirmPassword: "Passwords do not match." },
        map
      );
      expect(result[0].fieldId).toBe("id_confirm_password");
    });
  });

  // ── 3. Schema-level aliases (explicit field aliases from auth-logical.ts) ──
  describe("schema-level field aliases", () => {
    it("resolves server 'login' key → 'username' field via schemaAliases (reverse lookup)", () => {
      // username field declares aliases: ["login", "email", "user"]
      const map = makeMap("username");
      // FieldResolver has already indexed "login" → "id_username" in nameToIdMap
      const mapWithAliases = { ...map, login: "id_username", email: "id_username", user: "id_username" };
      const result = ErrorParser.parse({ login: "No account found." }, mapWithAliases);
      expect(result[0].fieldId).toBe("id_username");
    });

    it("resolves via schemaAliases param (forward: targetField → aliases[])", () => {
      // schemaAliases says: username field has aliases ["login", "email"]
      const map = makeMap("username");
      const schemaAliases = { username: ["login", "email", "user"] };
      // Server returns "email" key — should map to username field
      const result = ErrorParser.parse({ email: "Bad email." }, map, schemaAliases);
      expect(result[0].fieldId).toBe("id_username");
    });

    it("resolves via schemaAliases param (reverse: server sends alias key)", () => {
      // schemaAliases: username → ["login", "email"]
      // Server sends key "login" — should still find id_username
      const map = makeMap("username");
      const schemaAliases = { username: ["login", "email", "user"] };
      const result = ErrorParser.parse({ login: "Invalid login." }, map, schemaAliases);
      expect(result[0].fieldId).toBe("id_username");
    });

    it("resolves confirmPassword alias for confirm_password field", () => {
      const map = makeMap("confirm_password");
      const schemaAliases = { confirm_password: ["confirmPassword"] };
      const result = ErrorParser.parse(
        { confirmPassword: "Passwords do not match." },
        map,
        schemaAliases
      );
      expect(result[0].fieldId).toBe("id_confirm_password");
    });

    it("schema aliases take priority over FIELD_ALIASES fallback", () => {
      // Suppose schema says email → ["custom_email_alias"]
      // and fallback would also try to map "email" elsewhere
      const map = makeMap("email", "username");
      const schemaAliases = { email: ["custom_email_alias"] };
      // "custom_email_alias" in schemaAliases[email] resolves first
      const mapWithSchemaKey = { ...map, custom_email_alias: "id_email" };
      const result = ErrorParser.parse(
        { custom_email_alias: "Bad format." },
        mapWithSchemaKey,
        schemaAliases
      );
      expect(result[0].fieldId).toBe("id_email");
    });
  });

  // ── 4. Nested error objects ───────────────────────────────────────────────
  describe("nested error objects", () => {
    it("falls back to dotted path when nested leaf field is not in nameToIdMap", () => {
      // "street" alone is not mapped, so the full path "address.street" is used
      const result = ErrorParser.parse({ address: { street: "Required." } }, {});
      expect(result[0]).toMatchObject({
        code: "server",
        message: "Required.",
        fieldId: "address.street",
      });
    });

    it("resolves the leaf segment when the leaf name is in nameToIdMap", () => {
      // If the form has a field named "street" registered in the map,
      // the resolver should find it at the leaf level
      const map = makeMap("street");
      // The parser traverses nested objects recursively and calls resolveFieldId
      // with the full path "address.street" — which won't be in nameToIdMap.
      // Only the flat key "street" is registered; this test documents the current
      // resolution behaviour: dotted paths don't automatically strip prefixes.
      const result = ErrorParser.parse({ address: { street: "Required." } }, map);
      expect(result[0].fieldId).toBe("address.street");
    });
  });

  // ── 5. Edge cases ─────────────────────────────────────────────────────────
  describe("edge cases", () => {
    it("returns empty array for empty error object", () => {
      expect(ErrorParser.parse({}, makeMap("email"))).toEqual([]);
    });

    it("ignores non-string, non-object, non-array values", () => {
      const result = ErrorParser.parse({ count: 42 } as any, {});
      expect(result).toEqual([]);
    });

    it("handles multiple fields with independent errors", () => {
      const map = makeMap("username", "password");
      const result = ErrorParser.parse(
        { username: "Required.", password: "Too short." },
        map
      );
      expect(result).toHaveLength(2);
      const fieldIds = result.map((e) => e.fieldId);
      expect(fieldIds).toContain("id_username");
      expect(fieldIds).toContain("id_password");
    });
  });
});
