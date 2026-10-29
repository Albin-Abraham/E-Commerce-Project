/**
 * URL Serializer & Query Parser Test Suite
 *
 * @issue [FEAT-ROUTER-SERIALIZER]
 * @bug [BUG-JSON-STRINGIFY]
 * @bug [BUG-PROTOTYPE-POLLUTION]
 *
 * Validates high-performance URL serialization using qs:
 *  1. Primitive coercion and preserving numeric strings with leading zeroes
 *  2. Bracketed object notation without native JSON.stringify
 *  3. Prototype pollution shielding
 */

import { describe, expect, it } from "vitest";
import {
  deserializeEntriesToObject,
  parseQueryArray,
  parseQueryPrimitive,
  serializeObjectToEntries,
  serializeQueryPrimitive,
  stringifyQuery,
  parseQuery,
} from "../url-serializer";

describe("url-serializer", () => {
  describe("parseQueryPrimitive", () => {
    it("parses boolean true and false", () => {
      expect(parseQueryPrimitive("true")).toBe(true);
      expect(parseQueryPrimitive("false")).toBe(false);
    });

    it("parses valid numbers", () => {
      expect(parseQueryPrimitive("123")).toBe(123);
      expect(parseQueryPrimitive("-45")).toBe(-45);
      expect(parseQueryPrimitive("3.14")).toBe(3.14);
      expect(parseQueryPrimitive("0")).toBe(0);
    });

    it("preserves strings that look like numeric codes (leading zeroes)", () => {
      expect(parseQueryPrimitive("007")).toBe("007");
      expect(parseQueryPrimitive("01234")).toBe("01234");
    });

    it("preserves standard string values", () => {
      expect(parseQueryPrimitive("active")).toBe("active");
      expect(parseQueryPrimitive("sys-001")).toBe("sys-001");
      expect(parseQueryPrimitive("john_doe")).toBe("john_doe");
    });
  });

  describe("parseQueryArray", () => {
    it("parses comma-separated values into typed primitives", () => {
      expect(parseQueryArray("a,b,c")).toEqual(["a", "b", "c"]);
      expect(parseQueryArray("1,2,3")).toEqual([1, 2, 3]);
      expect(parseQueryArray("true,false,active")).toEqual([true, false, "active"]);
    });

    it("handles already separated string arrays", () => {
      expect(parseQueryArray(["10", "true", "test"])).toEqual([10, true, "test"]);
    });

    it("handles empty values", () => {
      expect(parseQueryArray("")).toEqual([]);
    });
  });

  describe("serializeQueryPrimitive", () => {
    it("serializes primitives to strings", () => {
      expect(serializeQueryPrimitive("hello")).toBe("hello");
      expect(serializeQueryPrimitive(42)).toBe("42");
      expect(serializeQueryPrimitive(true)).toBe("true");
      expect(serializeQueryPrimitive(false)).toBe("false");
    });

    it("returns null for empty or nullish values", () => {
      expect(serializeQueryPrimitive(null)).toBeNull();
      expect(serializeQueryPrimitive(undefined)).toBeNull();
      expect(serializeQueryPrimitive("")).toBeNull();
    });
  });

  describe("serializeObjectToEntries", () => {
    it("flattens flat primitives into string entries", () => {
      const input = { search: "phones", page: 1, available: true };
      const result = serializeObjectToEntries(input);
      expect(result).toEqual({
        search: "phones",
        page: "1",
        available: "true",
      });
    });

    it("flattens nested objects into bracket notation without JSON.stringify", () => {
      const input = {
        filter: {
          status: "active",
          minPrice: 100,
        },
      };
      const result = serializeObjectToEntries(input);
      expect(result).toEqual({
        "filter[status]": "active",
        "filter[minPrice]": "100",
      });
    });

    it("handles arrays with repeat format", () => {
      const input = { tags: ["urgent", "review"] };
      const result = serializeObjectToEntries(input, { arrayFormat: "repeat" });
      expect(result).toEqual({
        tags: ["urgent", "review"],
      });
    });

    it("handles arrays with comma format", () => {
      const input = { tags: ["urgent", "review"] };
      const result = serializeObjectToEntries(input, { arrayFormat: "comma" });
      expect(result).toEqual({
        tags: "urgent,review",
      });
    });

    it("marks empty or nullish values as null for removal", () => {
      const input = { search: "", category: null, page: undefined };
      const result = serializeObjectToEntries(input);
      expect(result).toEqual({
        search: null,
        category: null,
        page: null,
      });
    });
  });

  describe("deserializeEntriesToObject", () => {
    it("deserializes flat params into typed objects", () => {
      const params = new URLSearchParams("search=tablets&page=2&active=true");
      const result = deserializeEntriesToObject(params);
      expect(result).toEqual({
        search: "tablets",
        page: 2,
        active: true,
      });
    });

    it("deserializes bracket notation into nested objects without JSON.parse", () => {
      const params = new URLSearchParams(
        "filter[status]=active&filter[minPrice]=100&filter[inStock]=true"
      );
      const result = deserializeEntriesToObject(params);
      expect(result).toEqual({
        filter: {
          status: "active",
          minPrice: 100,
          inStock: true,
        },
      });
    });

    it("deserializes comma-separated arrays into typed arrays", () => {
      const params = new URLSearchParams("status=active,pending&ids=1,2,3");
      const result = deserializeEntriesToObject(params);
      expect(result).toEqual({
        status: ["active", "pending"],
        ids: [1, 2, 3],
      });
    });

    it("deserializes repeated multi-value params", () => {
      const params = new URLSearchParams();
      params.append("tags", "red");
      params.append("tags", "blue");
      const result = deserializeEntriesToObject(params);
      expect(result).toEqual({
        tags: ["red", "blue"],
      });
    });
  });

  describe("stringifyQuery & parseQuery (qs integration)", () => {
    it("stringifies nested objects keeping colons and brackets clean", () => {
      const data = {
        "users:page": 1,
        filter: { status: "active", category: "electronics" },
      };
      const qs = stringifyQuery(data);
      expect(qs).toBe("users:page=1&filter[status]=active&filter[category]=electronics");
    });

    it("parses query string into typed JavaScript objects", () => {
      const qs = "users:page=3&filter[status]=active&filter[active]=true&filter[minPrice]=50";
      const parsed = parseQuery(qs);
      expect(parsed).toEqual({
        "users:page": 3,
        filter: {
          status: "active",
          active: true,
          minPrice: 50,
        },
      });
    });

    it("guards against prototype pollution", () => {
      const malicious = "__proto__[isAdmin]=true&constructor[prototype][polluted]=yes";
      parseQuery(malicious);
      expect((Object.prototype as any).isAdmin).toBeUndefined();
      expect((Object.prototype as any).polluted).toBeUndefined();
    });
  });
});

