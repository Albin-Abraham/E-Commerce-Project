import { describe, expect, it } from "vitest";

import { FilterParser } from "../FilterParser";

describe("FilterParser", () => {
  describe("parseOne", () => {
    it("parses valid string filter", () => {
      const result = FilterParser.parseOne("role", "admin");
      expect(result).toEqual({
        ok: true,
        value: {
          colId: "role",
          value: "admin",
          asNumber: undefined,
          asBoolean: undefined,
          asDate: undefined,
        },
      });
    });

    it("parses numeric value", () => {
      const result = FilterParser.parseOne("age", "25");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.asNumber).toBe(25);
      }
    });

    it("parses boolean true", () => {
      const result = FilterParser.parseOne("active", "true");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.asBoolean).toBe(true);
      }
    });

    it("parses boolean false", () => {
      const result = FilterParser.parseOne("active", "false");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.asBoolean).toBe(false);
      }
    });

    it("parses date value", () => {
      const result = FilterParser.parseOne("date", "2024-01-15");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.asDate).toBeInstanceOf(Date);
      }
    });

    it("sets asNumber to undefined for non-numeric strings", () => {
      const result = FilterParser.parseOne("name", "hello");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.asNumber).toBeUndefined();
      }
    });

    it("fails on empty colId", () => {
      const result = FilterParser.parseOne("", "value");
      expect(result.ok).toBe(false);
    });

    it("fails on invalid colId characters", () => {
      const result = FilterParser.parseOne("name;", "value");
      expect(result.ok).toBe(false);
    });

    it("fails on empty value", () => {
      const result = FilterParser.parseOne("role", "");
      expect(result.ok).toBe(false);
    });

    it("fails on whitespace-only value", () => {
      const result = FilterParser.parseOne("role", "   ");
      expect(result.ok).toBe(false);
    });

    it("fails on value exceeding maxLength", () => {
      const result = FilterParser.parseOne("role", "a".repeat(201));
      expect(result.ok).toBe(false);
    });

    it("fails when colId not in allowedCols", () => {
      const result = FilterParser.parseOne("name", "value", {
        maxLength: 200,
        maxFilters: 10,
        allowedCols: ["age"],
      });
      expect(result.ok).toBe(false);
    });

    it("passes when colId is in allowedCols", () => {
      const result = FilterParser.parseOne("age", "25", {
        maxLength: 200,
        maxFilters: 10,
        allowedCols: ["age", "name"],
      });
      expect(result.ok).toBe(true);
    });
  });

  describe("parseOneCompact", () => {
    it("parses compact format colId:value", () => {
      const result = FilterParser.parseOneCompact("role:admin");
      expect(result).toEqual({
        ok: true,
        value: {
          colId: "role",
          value: "admin",
          asNumber: undefined,
          asBoolean: undefined,
          asDate: undefined,
        },
      });
    });

    it("parses value with colon in it", () => {
      const result = FilterParser.parseOneCompact("time:10:30");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.colId).toBe("time");
        expect(result.value.value).toBe("10:30");
      }
    });

    it("fails on missing colon", () => {
      const result = FilterParser.parseOneCompact("roleadmin");
      expect(result.ok).toBe(false);
    });

    it("fails on empty colId", () => {
      const result = FilterParser.parseOneCompact(":admin");
      expect(result.ok).toBe(false);
    });
  });

  describe("parseFromParams", () => {
    it("extracts filters from compact format (multi-value key)", () => {
      const params = new URLSearchParams();
      params.append("filter", "role:admin");
      params.append("filter", "status:active");
      const result = FilterParser.parseFromParams(params, "filter");
      expect(result).toHaveLength(2);
      expect(result[0].colId).toBe("role");
      expect(result[1].colId).toBe("status");
    });

    it("extracts filters from legacy bracket notation", () => {
      const params = new URLSearchParams({
        "filter[role]": "admin",
        "filter[status]": "active",
      });
      const result = FilterParser.parseFromParams(params, "filter");
      expect(result).toHaveLength(2);
    });

    it("ignores non-matching keys", () => {
      const params = new URLSearchParams({
        page: "1",
        sort: "name",
      });
      const result = FilterParser.parseFromParams(params, "filter");
      expect(result).toHaveLength(0);
    });

    it("respects maxFilters limit", () => {
      const params = new URLSearchParams();
      params.append("filter", "a:1");
      params.append("filter", "b:2");
      params.append("filter", "c:3");
      const result = FilterParser.parseFromParams(params, "filter", {
        maxLength: 200,
        maxFilters: 2,
      });
      expect(result).toHaveLength(2);
    });

    it("skips invalid filter entries", () => {
      const params = new URLSearchParams();
      params.append("filter", "role:admin");
      params.append("filter", "bad;:value");
      const result = FilterParser.parseFromParams(params, "filter");
      expect(result).toHaveLength(1);
      expect(result[0].colId).toBe("role");
    });
  });

  describe("toTanStack", () => {
    it("converts ParsedFilter[] to ColumnFiltersState", () => {
      const parsed = [
        { colId: "role", value: "admin" },
        { colId: "status", value: "active" },
      ];
      const result = FilterParser.toTanStack(parsed);
      expect(result).toEqual([
        { id: "role", value: "admin" },
        { id: "status", value: "active" },
      ]);
    });

    it("returns empty array for empty input", () => {
      expect(FilterParser.toTanStack([])).toEqual([]);
    });
  });

  describe("format", () => {
    it("converts ColumnFiltersState to compact format", () => {
      const filters = [{ id: "role", value: "admin" }];
      const result = FilterParser.format(filters, "filter");
      expect(result).toEqual({ filter: ["role:admin"] });
    });

    it("formats multiple filters as array", () => {
      const filters = [
        { id: "role", value: "admin" },
        { id: "status", value: "active" },
      ];
      const result = FilterParser.format(filters, "filter");
      expect(result).toEqual({ filter: ["role:admin", "status:active"] });
    });

    it("filters out empty values", () => {
      const filters = [{ id: "role", value: "" }];
      const result = FilterParser.format(filters, "filter");
      expect(result).toEqual({});
    });

    it("filters out null values", () => {
      const filters = [{ id: "role", value: null }];
      const result = FilterParser.format(filters, "filter");
      expect(result).toEqual({});
    });

    it("returns empty object for empty input", () => {
      expect(FilterParser.format([], "filter")).toEqual({});
    });
  });

  describe("isOwnedKey", () => {
    it("returns true for compact filter key", () => {
      expect(FilterParser.isOwnedKey("filter", "filter")).toBe(true);
    });

    it("returns true for legacy bracket notation", () => {
      expect(FilterParser.isOwnedKey("filter[role]", "filter")).toBe(true);
    });

    it("returns false for non-matching prefix", () => {
      expect(FilterParser.isOwnedKey("sort[name]", "filter")).toBe(false);
    });
  });
});
