/**
 * Primitive Migration Guard
 *
 * Golden snapshot tests that capture the FULL className output of
 * buildHeroUIClasses() for every field type, variant, density, and
 * edge case. These snapshots serve as the baseline before migrating
 * form wrappers (withAtom, InputWrapper, OuterWrapper) to Box/Flex/Grid
 * primitives.
 *
 * After each migration step, re-run this test. If snapshots match,
 * the migration is safe. If any snapshot mismatches, investigate
 * before proceeding.
 */
import type { FormField } from "@ui/form/fields";
import { buildHeroUIClasses } from "@ui/form/utils/form-styles";
import { describe, expect, it } from "vitest";

// ── Helper ────────────────────────────────────────────────────────
function field(overrides: Partial<FormField>): FormField {
  return {
    id: "test",
    name: "test",
    type: "text",
    label: "Test",
    ...overrides,
  } as FormField;
}

// ══════════════════════════════════════════════════════════════════
// CATEGORY 1: Primitive fields (withAtom-wrapped)
// ══════════════════════════════════════════════════════════════════
describe("Primitive Migration Guard", () => {
  describe("Category 1: Primitive fields", () => {
    const primitiveCases: [string, Partial<FormField>, boolean?][] = [
      // ── Text field variations ──
      ["text/default", { type: "text" }],
      ["text/compact", { type: "text", settings: { density: "compact" } }],
      ["text/spacious", { type: "text", settings: { density: "spacious" } }],
      [
        "text/intent-danger",
        { type: "text", properties: { intent: "danger" } },
      ],
      [
        "text/intent-primary",
        { type: "text", properties: { intent: "primary" } },
      ],
      [
        "text/radius-full",
        { type: "text", properties: { borderRadius: "full" } },
      ],
      [
        "text/radius-sm",
        { type: "text", properties: { borderRadius: "small" } },
      ],
      [
        "text/custom-classNames",
        {
          type: "text",
          meta: {
            ui: {
              classNames: {
                base: "my-custom-base",
                input: "my-custom-input",
                inputWrapper: "my-custom-surface",
              },
            },
          },
        },
      ],
      ["text/error-state", { type: "text" }, true],
      [
        "text/intent+error",
        { type: "text", properties: { intent: "danger" } },
        true,
      ],

      // ── Textarea ──
      ["textarea/default", { type: "textarea" }],
      [
        "textarea/custom-classNames",
        {
          type: "textarea",
          meta: { ui: { classNames: { base: "ta-base" } } },
        },
      ],

      // ── Select variants ──
      [
        "select/outlined",
        { type: "select", meta: { ui: { variant: "outlined" } } },
      ],
      [
        "select/filled",
        { type: "select", meta: { ui: { variant: "filled" } } },
      ],
      [
        "select/underlined",
        { type: "select", meta: { ui: { variant: "underlined" } } },
      ],
      ["select/error", { type: "select" }, true],

      // ── Checkbox / Radio / Switch ──
      ["checkbox/default", { type: "checkbox" }],
      [
        "checkbox/compact",
        { type: "checkbox", settings: { density: "compact" } },
      ],
      ["radio/default", { type: "radio" }],
      ["switch/default", { type: "switch" }],

      // ── Advanced fields ──
      ["multiselect/default", { type: "multiselect" }],
      ["range/default", { type: "range" }],
      ["file/default", { type: "file" }],

      // ── Special options ──
      ["search_input/no-label", { type: "search_input" }],
      ["table_filter/no-label", { type: "table_filter" }],

      // ── Aliases (all map to WrappedTextField) ──
      ["email/alias", { type: "email" }],
      ["number/alias", { type: "number" }],
      ["password/alias", { type: "password" }],
      ["phone/alias", { type: "phone" }],
      ["url/alias", { type: "url" }],
      ["date/alias", { type: "date" }],
    ];

    primitiveCases.forEach(([name, overrides, hasError]) => {
      it(`styles snapshot: ${name}`, () => {
        const styles = buildHeroUIClasses(
          field(overrides),
          false,
          hasError ?? false
        );
        expect(styles).toMatchSnapshot();
      });
    });
  });

  // ════════════════════════════════════════════════════════════════
  // CATEGORY 2: Static fields (wrapOuter: false — skip wrapper trinity)
  // ════════════════════════════════════════════════════════════════
  describe("Category 2: Static fields (no wrapper)", () => {
    const staticCases: [string, Partial<FormField>][] = [
      ["header", { type: "header" }],
      ["paragraph", { type: "paragraph" }],
      ["image", { type: "image" }],
      [
        "button/primary",
        { type: "button", properties: { intent: "primary", submit: true } },
      ],
      ["button/danger", { type: "button", properties: { intent: "danger" } }],
      ["button/subtle", { type: "button", properties: { intent: "subtle" } }],
    ];

    staticCases.forEach(([name, overrides]) => {
      it(`styles snapshot: ${name}`, () => {
        const styles = buildHeroUIClasses(field(overrides));
        expect(styles).toMatchSnapshot();
      });
    });
  });

  // ════════════════════════════════════════════════════════════════
  // CATEGORY 3: Structure fields
  // ════════════════════════════════════════════════════════════════
  describe("Category 3: Structure fields", () => {
    const structureCases: [string, Partial<FormField>][] = [
      [
        "container/flex",
        {
          type: "container",
          properties: { display: "flex", direction: "col", gap: "4" },
        },
      ],
      [
        "container/grid",
        {
          type: "container",
          properties: { display: "grid", columns: 12 },
        },
      ],
      ["container/default", { type: "container" }],
      ["card/default", { type: "card" }],
      ["card/elevation-sm", { type: "card" }],
      ["accordion/default", { type: "accordion" }],
      ["fieldset/default", { type: "fieldset" }],
      ["group/default", { type: "group" }],
    ];

    structureCases.forEach(([name, overrides]) => {
      it(`structure snapshot: ${name}`, () => {
        const styles = buildHeroUIClasses(field(overrides));
        expect(styles).toMatchSnapshot();
      });
    });
  });

  // ════════════════════════════════════════════════════════════════
  // CATEGORY 4: Edge cases
  // ════════════════════════════════════════════════════════════════
  describe("Category 4: Edge cases", () => {
    it("headless mode produces base styles", () => {
      const styles = buildHeroUIClasses(
        field({ type: "text", headless: true })
      );
      expect(styles).toMatchSnapshot();
    });

    it("side label placement", () => {
      const styles = buildHeroUIClasses(
        field({ type: "text", properties: { labelPlacement: "side" } })
      );
      expect(styles).toMatchSnapshot();
    });

    it("hidden label", () => {
      const styles = buildHeroUIClasses(
        field({ type: "text", properties: { labelPlacement: "hidden" } })
      );
      expect(styles).toMatchSnapshot();
    });

    it("field with description", () => {
      const styles = buildHeroUIClasses(
        field({ type: "text", description: "Help text" })
      );
      expect(styles).toMatchSnapshot();
    });

    it("field with placeholder", () => {
      const styles = buildHeroUIClasses(
        field({ type: "text", placeholder: "Enter value..." })
      );
      expect(styles).toMatchSnapshot();
    });

    // ── Variant × Intent matrix (18 combinations) ──
    const variants = ["outlined", "filled", "underlined"] as const;
    const intents = [
      "primary",
      "secondary",
      "danger",
      "success",
      "warning",
      "subtle",
    ] as const;

    describe("variant × intent matrix", () => {
      variants.forEach((variant) => {
        intents.forEach((intent) => {
          it(`${variant} + ${intent}`, () => {
            const styles = buildHeroUIClasses(
              field({
                type: "text",
                meta: { ui: { variant } },
                properties: { intent },
              })
            );
            expect(styles).toMatchSnapshot();
          });
        });
      });
    });

    // ── Density × variant matrix ──
    const densities = ["compact", "comfortable", "spacious"] as const;

    describe("density × variant matrix", () => {
      densities.forEach((density) => {
        variants.forEach((variant) => {
          it(`${density} + ${variant}`, () => {
            const styles = buildHeroUIClasses(
              field({
                type: "text",
                settings: { density },
                meta: { ui: { variant } },
              })
            );
            expect(styles).toMatchSnapshot();
          });
        });
      });
    });
  });
});
