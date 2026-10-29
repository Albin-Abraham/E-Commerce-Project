import { buildHeroUIClasses } from "@ui/form/utils/form-styles";
import {
  getGridClassName,
  groupFieldsIntoRows,
} from "@ui/form/utils/row-layout";
import { describe, expect, it } from "vitest";

import type { FormDefinition } from "../types";

// Mock schema based on user request
const onboardingSchema: FormDefinition = {
  id: "onboarding-demo",
  title: { en: "Employee Onboarding", es: "Incorporación de Empleados" },
  description: "New hire registration form.",
  submitLabel: "Complete Registration",
  settings: {
    width: "centered",
    density: "comfortable",
  },
  sections: [
    {
      id: "personal-details",
      title: "Personal Details",
      layout: { type: "grid", columns: 12, gap: 6 },
      fields: [
        {
          id: "first_name",
          name: "first_name",
          type: "text",
          label: "First Name",
          required: true,
          layout: { columnSpan: 6 },
          meta: { ui: { variant: "outlined" } },
        },
        {
          id: "last_name",
          name: "last_name",
          type: "text",
          label: "Last Name",
          required: true,
          layout: { columnSpan: 6 },
          meta: { ui: { variant: "filled" } },
        },
        {
          id: "email",
          name: "email",
          type: "email",
          label: "Email",
          required: true,
          layout: { columnSpan: 12 },
        },
      ],
    },
  ],
};

describe("Form Style System", () => {
  describe("Row Layout Utilities", () => {
    it("should correctly group fields into rows based on columnSpan", () => {
      const fields = onboardingSchema.sections![0].fields! as any;
      const rows = groupFieldsIntoRows(fields);

      // Expect 2 rows:
      // Row 1: First Name (6) + Last Name (6) = 12
      // Row 2: Email (12)
      expect(rows).toHaveLength(2);
      expect(rows[0].fields).toHaveLength(2); // First & Last Name
      expect(rows[1].fields).toHaveLength(1); // Email
    });

    it("should generate correct static grid classes", () => {
      // Test static map integrity (no dynamic interpolation)
      expect(getGridClassName(6)).toBe("col-span-12 md:col-span-6");
      expect(getGridClassName(12)).toBe("col-span-12");
      expect(getGridClassName(3)).toBe("col-span-12 md:col-span-3");

      // Resilience check
      expect(getGridClassName(99)).toBe("col-span-12"); // Safe fallback
    });
  });

  describe("HeroUI Style Generation (buildHeroUIClasses)", () => {
    it("should generate base classes for inputs", () => {
      const firstNameField = onboardingSchema.sections![0].fields![0] as any;
      const classes = buildHeroUIClasses(firstNameField);

      expect(classes.base).toContain("flex flex-col");
      expect(classes.label).toContain("text-sm");
      expect(classes.inputWrapper).toContain("rounded-[var(--radius-md)]"); // Default border radius
    });

    it("should apply variant styles correctly", () => {
      const firstName = onboardingSchema.sections![0].fields![0]; // Outlined
      const lastName = onboardingSchema.sections![0].fields![1]; // Filled

      const firstClasses = buildHeroUIClasses(firstName as any);
      const lastClasses = buildHeroUIClasses(lastName as any);

      // Outlined (defaultish) should have border
      expect(firstClasses.inputWrapper).toContain("border");
      expect(firstClasses.inputWrapper).toContain("bg-surface");

      // Filled should have different bg
      expect(lastClasses.inputWrapper).toContain("border-none");
      expect(lastClasses.inputWrapper).toContain("bg-subtle");
    });

    it("should handle validation error state", () => {
      const firstName = onboardingSchema.sections![0].fields![0];
      const classes = buildHeroUIClasses(firstName as any, false, true); // hasError = true

      expect(classes.inputWrapper).toContain("border-danger");
    });
  });
});
