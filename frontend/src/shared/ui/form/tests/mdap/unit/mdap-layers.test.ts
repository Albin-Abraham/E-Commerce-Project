import { describe, expect, it } from "vitest";

import { compileEntityToFormDef } from "../../../utils/mdap-compiler";
import type { EntityDefinition } from "../../../types/application";

describe("MDAP Form Layers: Unit Suite", () => {
  describe("Layer 1: Content Layer", () => {
    it("preserves field hierarchy, labels, and types independently of UI styling", () => {
      const entity: EntityDefinition = {
        id: "ent-content-test",
        name: "Content Test",
        content: {
          id: "c-1",
          title: "Content Test Title",
          sections: [
            {
              id: "sec_a",
              title: "Section A",
              fields: [
                { id: "f_a", name: "f_a", type: "text", label: "Field A", required: true },
                { id: "f_b", name: "f_b", type: "number", label: "Field B", defaultValue: 42 },
              ],
            },
          ],
        },
      };

      const compiled = compileEntityToFormDef(entity, "content-form", "Save");
      expect(compiled.sections?.[0]?.fields[0]?.label).toBe("Field A");
      expect((compiled.sections?.[0]?.fields[1] as any)?.defaultValue).toBe(42);
    });
  });

  describe("Layer 3: Surface & Density Layer", () => {
    it("maps density and shell settings from SurfaceDefinition to compiled form settings", () => {
      const entity: EntityDefinition = {
        id: "ent-surface-test",
        name: "Surface Test",
        content: {
          id: "c-2",
          title: "Surface",
          sections: [],
        },
        surface: {
          ui: {
            density: "compact",
            maxHeight: "500px",
            shell: {
              header: { show: true, title: "Custom Header" },
              footer: { show: true, submitText: "Proceed" },
            } as any,
          },
        },
      };

      const compiled = compileEntityToFormDef(entity, "surface-form", "Proceed");
      expect(compiled.settings?.density).toBe("compact");
      expect(compiled.settings?.maxHeight).toBe("500px");
      expect((compiled.shell as any)?.header?.title).toBe("Custom Header");
    });
  });

  describe("Layer 4: Presentation & Style Layer", () => {
    it("maps style attributes into the compiled form configuration", () => {
      const entity: EntityDefinition = {
        id: "ent-pres-test",
        name: "Presentation Test",
        content: {
          id: "c-3",
          title: "Pres Title",
          sections: [],
        },
        presentation: {
          style: {
            cardVariant: "glass",
            density: "spacious",
          } as any,
        },
      };

      const compiled = compileEntityToFormDef(entity, "pres-form", "Save");
      expect((compiled.style as any)?.cardVariant).toBe("glass");
      expect((compiled.style as any)?.density).toBe("spacious");
    });
  });
});
