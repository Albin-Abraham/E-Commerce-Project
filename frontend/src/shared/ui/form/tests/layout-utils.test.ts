import {
  getFieldLayout,
  getFormLayoutTree,
  getFieldOptions,
  getFieldPlaceholder,
  getFieldIcon,
} from "@ui/form/utils/form-layout-utils";
import { describe, expect, it } from "vitest";

import type { FormField } from "../fields";
import type { FormDefinition } from "../types";

describe("Form Layout Utilities", () => {
  describe("getFieldLayout", () => {
    it("should extract basic layout properties correctly", () => {
      const field: FormField = {
        id: "field-1",
        name: "test-field",
        type: "text",
        label: "Test Label",
        description: "Test Description",
        properties: {
          placeholder: "Enter something",
        },
        meta: {
          ui: {
            classNames: {
              base: "custom-class",
            },
          },
        },
      };

      const layout = getFieldLayout(field);

      expect(layout.id).toBe("field-1");
      expect(layout.label).toBe("Test Label");
      expect(layout.placeholder).toBe("Enter something");
      expect(layout.helpText).toBe("Test Description");
      expect(layout.className).toBe("custom-class");
    });

    it("should handle enabled/disabled state", () => {
      const field: FormField = {
        id: "f1",
        name: "n1",
        type: "text",
        enabled: false,
        label: "Test 1",
      };
      const layout = getFieldLayout(field);
      expect(layout.disabled).toBe(true);

      const field2: FormField = {
        id: "f2",
        name: "n2",
        type: "text",
        enabled: true,
        label: "Test 2",
      };
      const layout2 = getFieldLayout(field2);
      expect(layout2.disabled).toBe(false);
    });
  });

  describe("getFormLayoutTree", () => {
    it("should convert sections and fields into a hierarchical tree", () => {
      const definition: FormDefinition = {
        id: "form-1",
        title: "Test Form",
        sections: [
          {
            id: "section-1",
            title: "Section 1",
            fields: [
              { id: "f1", name: "field1", type: "text", label: "Field 1" },
            ],
            subSections: [
              {
                id: "sub-1",
                title: "Sub Section",
                fields: [
                  { id: "f2", name: "field2", type: "text", label: "Field 2" },
                ],
              },
            ],
          },
        ],
      };

      const tree = getFormLayoutTree(definition);

      expect(tree).toHaveLength(1);
      const rootSectionField = tree[0];
      expect(rootSectionField.type).toBe("section");
      expect(rootSectionField.fields).toHaveLength(2); // f1 + sub-1 (mapped to field)

      const subSectionField = rootSectionField.fields?.find(
        (f) => f.id === "sub-1"
      );
      expect(subSectionField).toBeDefined();
      expect(subSectionField?.fields).toHaveLength(1);
      expect(subSectionField?.fields?.[0].id).toBe("f2");
    });

    it("should map card layout sections to 'card' field type", () => {
      const definition: FormDefinition = {
        id: "form-1",
        title: "Test Form",
        sections: [
          {
            id: "card-sec",
            title: "Card Section",
            layout: { type: "card" },
            fields: [],
          },
        ],
      };

      const tree = getFormLayoutTree(definition);
      expect(tree[0].type).toBe("card");
    });
  });

  describe("Phase 3: Canonical Attribute Extractors", () => {
    describe("getFieldOptions", () => {
      it("prioritizes direct props.options over field definition options", () => {
        const field = { options: [{ value: "1", label: "One" }] };
        const props = { options: [{ value: "2", label: "Two" }] };
        const result = getFieldOptions(field, props);
        expect(result).toEqual([{ value: "2", label: "Two" }]);
      });

      it("falls back to field.options when props.options is missing", () => {
        const field = { options: [{ value: "1", label: "One" }] };
        const result = getFieldOptions(field);
        expect(result).toEqual([{ value: "1", label: "One" }]);
      });

      it("falls back to field.meta.options.options", () => {
        const field = { meta: { options: { options: [{ value: "meta", label: "Meta" }] } } };
        const result = getFieldOptions(field);
        expect(result).toEqual([{ value: "meta", label: "Meta" }]);
      });

      it("returns empty array when no options exist", () => {
        expect(getFieldOptions({})).toEqual([]);
      });
    });

    describe("getFieldPlaceholder", () => {
      it("prioritizes direct props.placeholder", () => {
        const field = { properties: { placeholder: "Field Placeholder" } };
        const props = { placeholder: "Direct Placeholder" };
        expect(getFieldPlaceholder(field, props)).toBe("Direct Placeholder");
      });

      it("falls back to layout.placeholder", () => {
        const layout = { placeholder: "Layout Placeholder" };
        expect(getFieldPlaceholder({}, {}, layout)).toBe("Layout Placeholder");
      });
    });

    describe("getFieldIcon", () => {
      it("extracts startIcon and endIcon canonically from props and meta", () => {
        const props = { startIcon: "search", endIcon: "check" };
        const icons = getFieldIcon({}, props);
        expect(icons.startIcon).toBe("search");
        expect(icons.endIcon).toBe("check");
        expect(icons.rightIcon).toBe("check");
      });
    });
  });
});
