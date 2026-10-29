import { describe, expect, it } from "vitest";

import { SearchParser } from "../SearchParser";

describe("SearchParser", () => {
  describe("parse", () => {
    it("returns empty result for empty string", () => {
      const result = SearchParser.parse("");
      expect(result).toEqual({
        ok: true,
        value: { raw: "", normalized: "", terms: [], isEmpty: true },
      });
    });

    it("returns empty result for whitespace only", () => {
      const result = SearchParser.parse("   ");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.isEmpty).toBe(true);
        expect(result.value.terms).toEqual([]);
      }
    });

    it("fails when input exceeds maxLength", () => {
      const result = SearchParser.parse("a".repeat(201));
      expect(result.ok).toBe(false);
    });

    it("respects custom maxLength", () => {
      const result = SearchParser.parse("abcde", {
        maxLength: 3,
        minTermLength: 1,
      });
      expect(result.ok).toBe(false);
    });

    it("parses single term", () => {
      const result = SearchParser.parse("hello");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.terms).toEqual(["hello"]);
        expect(result.value.isEmpty).toBe(false);
      }
    });

    it("parses multiple terms", () => {
      const result = SearchParser.parse("hello world");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.terms).toEqual(["hello", "world"]);
      }
    });

    it("normalizes whitespace", () => {
      const result = SearchParser.parse("  hello   world  ");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.normalized).toBe("hello world");
      }
    });

    it("filters out terms shorter than minTermLength", () => {
      const result = SearchParser.parse("a hello bb", {
        maxLength: 200,
        minTermLength: 2,
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.terms).toEqual(["hello", "bb"]);
      }
    });

    it("returns isEmpty when all terms filtered", () => {
      const result = SearchParser.parse("a b c", {
        maxLength: 200,
        minTermLength: 2,
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.isEmpty).toBe(true);
        expect(result.value.terms).toEqual([]);
      }
    });
  });

  describe("format", () => {
    it("trims whitespace", () => {
      expect(SearchParser.format("  hello  ")).toBe("hello");
    });

    it("collapses multiple spaces", () => {
      expect(SearchParser.format("hello   world")).toBe("hello world");
    });

    it("returns empty string for empty input", () => {
      expect(SearchParser.format("")).toBe("");
    });

    it("returns empty string for null/undefined", () => {
      expect(SearchParser.format(null as any)).toBe("");
      expect(SearchParser.format(undefined as any)).toBe("");
    });
  });

  describe("matches", () => {
    it("returns true for empty search", () => {
      const result = SearchParser.parse("");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(SearchParser.matches(result.value, "anything")).toBe(true);
      }
    });

    it("matches case-insensitively", () => {
      const result = SearchParser.parse("hello");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(SearchParser.matches(result.value, "Hello World")).toBe(true);
      }
    });

    it("matches partial strings", () => {
      const result = SearchParser.parse("ell");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(SearchParser.matches(result.value, "hello")).toBe(true);
      }
    });

    it("returns false when target does not contain term", () => {
      const result = SearchParser.parse("xyz");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(SearchParser.matches(result.value, "hello")).toBe(false);
      }
    });

    it("requires all terms to match", () => {
      const result = SearchParser.parse("hello world");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(SearchParser.matches(result.value, "hello")).toBe(false);
        expect(SearchParser.matches(result.value, "hello world")).toBe(true);
      }
    });

    it("handles null/undefined target gracefully", () => {
      const result = SearchParser.parse("hello");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(SearchParser.matches(result.value, null as any)).toBe(false);
        expect(SearchParser.matches(result.value, undefined as any)).toBe(
          false
        );
      }
    });
  });

  describe("default config", () => {
    it("accepts single-char terms (minTermLength=1)", () => {
      const result = SearchParser.parse("a");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.terms).toEqual(["a"]);
        expect(result.value.isEmpty).toBe(false);
      }
    });

    it("accepts single-char terms in multi-term input", () => {
      const result = SearchParser.parse("a x hello");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.terms).toEqual(["a", "x", "hello"]);
        expect(result.value.isEmpty).toBe(false);
      }
    });
  });
});
