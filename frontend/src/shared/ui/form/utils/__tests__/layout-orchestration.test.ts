import type { FormField } from "@ui/form/fields";
import { describe, expect, it } from "vitest";

import { getLayoutItemClasses } from "../layout-generator";
import { getGridClassName } from "../row-layout";

describe("Layout Orchestration Scaling Logic", () => {
  describe("getGridClassName", () => {
    it("should return responsive col-span classes for standard 12-column grid", () => {
      const cls = getGridClassName(12);
      expect(cls).toBe("col-span-12");
    });

    it("should return responsive col-span classes for nested 6-span field", () => {
      const cls = getGridClassName(6);
      expect(cls).toContain("col-span-12");
      expect(cls).toContain("md:col-span-6");
    });

    it("should return static col-span classes for non-12-column grid to prevent mobile breakage", () => {
      const cls = getGridClassName(1, 2);
      expect(cls).toBe("col-span-1");
      expect(cls).not.toContain("md:");
    });
  });

  describe("getLayoutItemClasses (Scaled Spans)", () => {
    const mockField = (span: number): FormField =>
      ({
        id: "test",
        type: "text",
        layout: { columnSpan: span },
      }) as any;

    it("should return standard col-span-6 for 50% width in 12-col grid", () => {
      const field = mockField(6);
      const classes = getLayoutItemClasses(field, {
        type: "grid",
        columns: 12,
      });
      expect(classes).toContain("md:col-span-6");
    });

    it("should scale 6/12 span to 1/2 in a 2-column grid", () => {
      const field = mockField(6);
      const classes = getLayoutItemClasses(field, {
        type: "container",
        columns: 2,
      } as any);
      expect(classes).toBe("col-span-1");
    });

    it("should scale 12/12 span to 2/2 in a 2-column grid", () => {
      const field = mockField(12);
      const classes = getLayoutItemClasses(field, {
        type: "container",
        columns: 2,
      } as any);
      expect(classes).toBe("col-span-2");
    });

    it("should handle headers as full-width candidates regardless of span", () => {
      const headerField: FormField = {
        id: "h1",
        type: "header",
        layout: {},
      } as any;
      const classes = getLayoutItemClasses(headerField, {
        type: "grid",
        columns: 12,
      });
      expect(classes).toBe("col-span-12");
    });

    it("should resolve fullWidth flag and semantic span strings", () => {
      const fullWidthField: FormField = {
        id: "custom",
        type: "text",
        layout: { fullWidth: true },
      } as any;
      const classes = getLayoutItemClasses(fullWidthField, {
        type: "grid",
        columns: 12,
      });
      expect(classes).toBe("col-span-12");

      const halfSpanField: FormField = {
        id: "custom-half",
        type: "text",
        layout: { span: "half" } as any,
      } as any;
      const halfClasses = getLayoutItemClasses(halfSpanField, {
        type: "grid",
        columns: 12,
      });
      expect(halfClasses).toContain("md:col-span-6");
    });

    it("should properly infer full-width for file, code, and org_name", () => {
      const fileField: FormField = { id: "upload", type: "file" } as any;
      const codeField: FormField = { id: "snippet", type: "code" } as any;
      const orgField: FormField = { id: "org_name", type: "text" } as any;

      const gridLayout = { type: "grid" as const, columns: 12 };
      expect(getLayoutItemClasses(fileField, gridLayout)).toBe("col-span-12");
      expect(getLayoutItemClasses(codeField, gridLayout)).toBe("col-span-12");
      expect(getLayoutItemClasses(orgField, gridLayout)).toBe("col-span-12");
    });

    it("should size switch as half-width by default and full-width with description", () => {
      const cleanSwitch: FormField = { id: "active", type: "switch" } as any;
      const switchWithDesc: FormField = {
        id: "notifications",
        type: "switch",
        description: "Receive real-time alerts",
      } as any;

      const gridLayout = { type: "grid" as const, columns: 12 };
      expect(getLayoutItemClasses(cleanSwitch, gridLayout)).toContain("md:col-span-6");
      expect(getLayoutItemClasses(switchWithDesc, gridLayout)).toBe("col-span-12");
    });

    it("should size radio and multiselect as half-width by default", () => {
      const radioField: FormField = { id: "role", type: "radio" } as any;
      const multiField: FormField = { id: "tags", type: "multiselect" } as any;

      const gridLayout = { type: "grid" as const, columns: 12 };
      expect(getLayoutItemClasses(radioField, gridLayout)).toContain("md:col-span-6");
      expect(getLayoutItemClasses(multiField, gridLayout)).toContain("md:col-span-6");
    });
  });
});
