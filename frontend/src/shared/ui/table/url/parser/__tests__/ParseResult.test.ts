import { describe, expect, it } from "vitest";

import { fail, ok } from "../ParseResult";

describe("ParseResult", () => {
  describe("ok", () => {
    it("wraps a string value", () => {
      const result = ok("hello");
      expect(result).toEqual({ ok: true, value: "hello" });
    });

    it("wraps a number value", () => {
      const result = ok(42);
      expect(result).toEqual({ ok: true, value: 42 });
    });

    it("wraps null", () => {
      const result = ok(null);
      expect(result).toEqual({ ok: true, value: null });
    });

    it("wraps an empty string", () => {
      const result = ok("");
      expect(result).toEqual({ ok: true, value: "" });
    });

    it("wraps an object", () => {
      const result = ok({ key: "val" });
      expect(result).toEqual({ ok: true, value: { key: "val" } });
    });
  });

  describe("fail", () => {
    it("creates error with auto-generated message", () => {
      const result = fail("Search", "abc", "TOO_LONG");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toEqual({
          code: "TOO_LONG",
          field: "Search",
          raw: "abc",
          message: '[TableUrl.Search] TOO_LONG: "abc"',
        });
      }
    });

    it("uses custom message when provided", () => {
      const result = fail("Filter.value", "val", "EMPTY", "Value is required");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.message).toBe("Value is required");
      }
    });

    it("creates error with EMPTY code", () => {
      const result = fail("Filter.value", "", "EMPTY");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("EMPTY");
      }
    });

    it("creates error with MALFORMED code", () => {
      const result = fail("Sort", "bad", "MALFORMED");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("MALFORMED");
      }
    });

    it("creates error with INVALID_VALUE code", () => {
      const result = fail("Filter.colId", "bad;", "INVALID_VALUE");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.code).toBe("INVALID_VALUE");
      }
    });
  });
});
