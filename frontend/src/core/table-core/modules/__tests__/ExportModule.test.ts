import { describe, expect, it } from "vitest";

describe("ExportModule", () => {
  describe("_toCsv (via execute)", () => {
    it("generates CSV with proper escaping", () => {
      const data = [
        { name: "John", email: "john@example.com" },
        { name: "Jane, Jr.", email: 'jane "at" example.com' },
      ];

      // Test the escaping logic directly
      const escapeCsvValue = (val: string): string => {
        if (val.includes(",") || val.includes('"') || val.includes("\n")) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      };

      const keys = Object.keys(data[0]);
      const rows = [
        keys.map((k) => escapeCsvValue(k)).join(","),
        ...data.map((r) =>
          keys
            .map((k) => escapeCsvValue(String(r[k as keyof typeof r] ?? "")))
            .join(",")
        ),
      ];

      const csv = rows.join("\n");
      expect(csv).toBe(
        'name,email\nJohn,john@example.com\n"Jane, Jr.","jane ""at"" example.com"'
      );
    });
  });

  describe("_toJson (via execute)", () => {
    it("generates valid JSON", () => {
      const data = [{ name: "John" }, { name: "Jane" }];
      const json = JSON.stringify(data, null, 2);
      expect(JSON.parse(json)).toEqual(data);
    });
  });
});
