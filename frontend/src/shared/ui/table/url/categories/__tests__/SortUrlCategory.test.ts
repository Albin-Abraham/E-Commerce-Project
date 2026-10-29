import { describe, expect, it } from "vitest";

import { SortUrlCategory } from "../SortUrlCategory";

describe("SortUrlCategory", () => {
  describe("serialize", () => {
    it("serializes empty sorting state", () => {
      expect(SortUrlCategory.serialize([])).toEqual([]);
    });

    it("serializes single asc sort", () => {
      expect(SortUrlCategory.serialize([{ id: "name", desc: false }])).toEqual([
        "name",
      ]);
    });

    it("serializes single desc sort", () => {
      expect(SortUrlCategory.serialize([{ id: "name", desc: true }])).toEqual([
        "-name",
      ]);
    });

    it("serializes multiple sorts", () => {
      expect(
        SortUrlCategory.serialize([
          { id: "name", desc: false },
          { id: "age", desc: true },
        ])
      ).toEqual(["name", "-age"]);
    });
  });

  describe("deserialize", () => {
    it("deserializes empty array", () => {
      expect(SortUrlCategory.deserialize([])).toEqual([]);
    });

    it("deserializes compact format", () => {
      expect(SortUrlCategory.deserialize(["name", "-age"])).toEqual([
        { id: "name", desc: false },
        { id: "age", desc: true },
      ]);
    });

    it("deserializes legacy format", () => {
      expect(SortUrlCategory.deserialize(["name:asc", "age:desc"])).toEqual([
        { id: "name", desc: false },
        { id: "age", desc: true },
      ]);
    });

    it("drops empty entries silently", () => {
      expect(SortUrlCategory.deserialize(["name", "", "-email"])).toEqual([
        { id: "name", desc: false },
        { id: "email", desc: true },
      ]);
    });
  });

  describe("isOwnedKey", () => {
    it("returns true for matching key", () => {
      expect(SortUrlCategory.isOwnedKey("orders:sort", "orders:sort")).toBe(
        true
      );
    });

    it("returns false for non-matching key", () => {
      expect(SortUrlCategory.isOwnedKey("orders:page", "orders:sort")).toBe(
        false
      );
    });
  });
});
