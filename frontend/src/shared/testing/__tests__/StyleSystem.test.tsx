import { Form } from "@ui/form/Form";
import type { FormDefinition } from "@ui/form/types";
import { buildHeroUIClasses } from "@ui/form/utils/form-styles";
import { describe, expect, it } from "vitest";

import { StyleDriver } from "../drivers/StyleDriver";
import { renderWithProviders } from "../test-utils";

describe("Style System: HeroUI Engine", () => {
  describe("Logic: buildHeroUIClasses", () => {
    it("should resolve default classes for a standard text field", () => {
      const field = {
        id: "f1",
        type: "text",
        name: "test",
        label: "Test",
      } as any;
      const styles = buildHeroUIClasses(field);

      expect(styles.base).toContain("form-field");
      // Default variant is "outlined", which provides "bg-surface" in the default theme.
      expect(styles.inputWrapper).toContain("bg-surface");
      expect(styles.input).toContain("bg-transparent");
      expect(styles.label).toContain("font-bold");
    });

    it("should correctly parse heuristic classes into slots", () => {
      const field = {
        id: "f1",
        type: "text",
        name: "test",
        label: "Test",
        properties: {
          customClasses: "mb-8 text-blue-500 font-black border-red-500",
        },
      } as any;

      const styles = buildHeroUIClasses(field);

      // mb-8 should go to base
      expect(styles.base).toContain("mb-8");
      // text-blue-500 and font-black should go to input (typography)
      expect(styles.input).toContain("text-blue-500");
      expect(styles.input).toContain("font-black");
      // border-red-500 should go to inputWrapper (decoration)
      expect(styles.inputWrapper).toContain("border-red-500");
    });

    it("should apply density overlays correctly", () => {
      const field = {
        id: "f1",
        type: "text",
        name: "test",
        label: "Test",
      } as any;

      const compactStyles = buildHeroUIClasses(field, false, false, {
        density: "compact",
      } as any);
      const spaciousStyles = buildHeroUIClasses(field, false, false, {
        density: "spacious",
      } as any);

      expect(compactStyles.base).toContain("mb-2");
      expect(compactStyles.inputWrapper).toContain("min-h-[32px]");
      expect(compactStyles.input).toContain("text-xs");

      expect(spaciousStyles.base).toContain("mb-6");
      expect(spaciousStyles.inputWrapper).toContain("min-h-[48px]");
      expect(spaciousStyles.input).toContain("text-base");
    });
  });

  describe("Regression: Double Surface (Ghost Rectangles)", () => {
    it("should ensure a singular surface in Dashboard mode", async () => {
      const definition: FormDefinition = {
        id: "regression-test",
        title: "Regression",
        settings: { layoutMode: "dashboard" },
        sections: [
          {
            id: "s1",
            title: "Regression Section",
            fields: [
              {
                id: "field1",
                name: "field1",
                type: "text",
                label: "Singular Surface",
              },
            ],
          },
        ],
      };

      const { container } = renderWithProviders(
        <Form definition={definition} />
      );
      const styleDriver = new StyleDriver(container);

      // Verify fix: No hardcoded glass bg, only authoritative slot bg
      await styleDriver.expectSingularSurface("field1");
    });

    it("should maintain layout boundaries in side-label mode", async () => {
      const definition: FormDefinition = {
        id: "grid-test",
        title: "Grid",
        sections: [
          {
            id: "s1",
            title: "Side Label Section",
            fields: [
              {
                id: "field1",
                name: "field1",
                type: "text",
                label: "Side Label",
                properties: { labelPlacement: "side" },
              },
            ],
          },
        ],
      };

      const { container } = renderWithProviders(
        <Form definition={definition} />
      );
      const styleDriver = new StyleDriver(container);

      // Verify that the inner wrapper has the correct grid gap (the fix adjusted md:gap-x-12)
      await styleDriver.expectSlotClass("field1", "base", "form-field");

      const innerWrapper = container.querySelector(".form-field-inner");
      expect(innerWrapper?.className).toContain("md:gap-x-12");
    });
  });

  describe("Integration: withAtom Style Injection", () => {
    it("should inject internal padding into the inputWrapper via density", async () => {
      const definition: FormDefinition = {
        id: "padding-test",
        title: "Padding",
        settings: { density: "spacious" },
        sections: [
          {
            id: "s1",
            title: "Padding Section",
            fields: [{ id: "f1", name: "f1", type: "text", label: "Spacious" }],
          },
        ],
      };

      const { container } = renderWithProviders(
        <Form definition={definition} />
      );
      const styleDriver = new StyleDriver(container);

      // Spacious should have min-h-[48px] px-4 py-2.5 on the OuterWrapper surface
      await styleDriver.expectSlotClass("f1", "inputWrapper", "px-4");
      await styleDriver.expectSlotClass("f1", "inputWrapper", "py-2.5");
      await styleDriver.expectSlotClass("f1", "inputWrapper", "min-h-[48px]");
    });
  });
});
