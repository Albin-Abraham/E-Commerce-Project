import { describe, expect, it } from "vitest";

import { SortParser } from "../SortParser";

describe("SortParser", () => {
  describe("parseOne", () => {
    it("parses compact asc format (no prefix)", () => {
      const result = SortParser.parseOne("name");
      expect(result).toEqual({ ok: true, value: { id: "name", dir: "asc" } });
    });

    it("parses compact desc format (-prefix)", () => {
      const result = SortParser.parseOne("-email");
      expect(result).toEqual({ ok: true, value: { id: "email", dir: "desc" } });
    });

    it("parses legacy asc format (name:asc)", () => {
      const result = SortParser.parseOne("name:asc");
      expect(result).toEqual({ ok: true, value: { id: "name", dir: "asc" } });
    });

    it("parses legacy desc format (name:desc)", () => {
      const result = SortParser.parseOne("email:desc");
      expect(result).toEqual({ ok: true, value: { id: "email", dir: "desc" } });
    });

    it("fails on empty string", () => {
      const result = SortParser.parseOne("");
      expect(result.ok).toBe(false);
    });

    it("fails on bare hyphen (no ID)", () => {
      const result = SortParser.parseOne("-");
      expect(result.ok).toBe(false);
    });

    it("fails on invalid direction in legacy format", () => {
      const result = SortParser.parseOne("name:up");
      expect(result.ok).toBe(false);
    });

    it("fails on too-long input", () => {
      const result = SortParser.parseOne("a".repeat(101));
      expect(result.ok).toBe(false);
    });

    it("respects custom separator for legacy format", () => {
      const result = SortParser.parseOne("name.asc", {
        separator: ".",
        maxFields: 5,
      });
      expect(result).toEqual({ ok: true, value: { id: "name", dir: "asc" } });
    });

    it("validates against allowed IDs", () => {
      const result = SortParser.parseOne("name", {
        separator: ":",
        maxFields: 5,
        allowedIds: ["email", "date"],
      });
      expect(result.ok).toBe(false);
    });

    it("validates against allowed IDs with desc prefix", () => {
      const result = SortParser.parseOne("-name", {
        separator: ":",
        maxFields: 5,
        allowedIds: ["email", "date"],
      });
      expect(result.ok).toBe(false);
    });
  });

  describe("parseMany", () => {
    it("parses multiple compact sort strings", () => {
      const result = SortParser.parseMany(["name", "-email"]);
      expect(result).toEqual([
        { id: "name", dir: "asc" },
        { id: "email", dir: "desc" },
      ]);
    });

    it("drops empty entries silently", () => {
      const result = SortParser.parseMany(["name", "", "-email"]);
      expect(result).toEqual([
        { id: "name", dir: "asc" },
        { id: "email", dir: "desc" },
      ]);
    });

    it("respects maxFields limit", () => {
      const result = SortParser.parseMany(["a", "b", "c", "d", "e", "f"], {
        separator: ":",
        maxFields: 3,
      });
      expect(result).toHaveLength(3);
    });
  });

  describe("format", () => {
    it("formats asc as plain id", () => {
      expect(SortParser.format({ id: "name", dir: "asc" })).toBe("name");
    });

    it("formats desc as -id", () => {
      expect(SortParser.format({ id: "name", dir: "desc" })).toBe("-name");
    });
  });

  describe("toTanStack / fromTanStack", () => {
    it("round-trips through TanStack format", () => {
      const parsed = [
        { id: "name", dir: "asc" as const },
        { id: "email", dir: "desc" as const },
      ];
      const tanStack = SortParser.toTanStack(parsed);
      expect(tanStack).toEqual([
        { id: "name", desc: false },
        { id: "email", desc: true },
      ]);

      const roundTripped = SortParser.fromTanStack(tanStack);
      expect(roundTripped).toEqual(parsed);
    });
  });
});
