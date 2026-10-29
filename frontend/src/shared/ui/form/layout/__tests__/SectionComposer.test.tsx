import { waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Form } from "@ui/form/Form";
import type { FormDefinition } from "@ui/form/types";
import { SpacingCalculator } from "@ui/form/utils/spacing-calculator";

import { renderWithProviders } from "../../../../testing/test-utils";

/**
 * START · Automatic section spacing
 *
 * Verifies the layered spacing precedence:
 * 1. Author override (layout.gap/rowGap/colGap) wins and preserves margins.
 * 2. Calculator idiom defaults power grid-like sections, and the section gap
 *    becomes the single vertical spacing authority (field margins stripped).
 * 3. Block / flex layouts never take vertical-spacing authority.
 */
async function getGridContainer(container: HTMLElement): Promise<HTMLElement> {
  let el: HTMLElement | null = null;
  await waitFor(() => {
    // auto-rows-min is added by SectionContent to its own content grid.
    el = container.querySelector("div.grid.grid-cols-12.auto-rows-min");
    if (!el) throw new Error("section content grid not found");
  });
  return el as unknown as HTMLElement;
}

/**
 * The FieldRouter ensemble (outer) and the withAtom Box (inner) both carry
 * data-field-id. Authored/auto field margins (`styles.base`) live on the inner
 * `form-field-container` Box — the last matching element in document order.
 */
function getFieldCore(
  container: HTMLElement,
  fieldId: string
): HTMLElement {
  const nodes = container.querySelectorAll(`[data-field-id="${fieldId}"]`);
  for (let i = nodes.length - 1; i >= 0; i--) {
    if ((nodes[i] as HTMLElement).className.includes("form-field-container")) {
      return nodes[i] as HTMLElement;
    }
  }
  return nodes[nodes.length - 1] as HTMLElement;
}

const baseField = (index: number, extra: Record<string, unknown> = {}) => ({
  id: `f${index}`,
  name: `f${index}`,
  type: "text",
  label: `Field ${index}`,
  ...extra,
});

describe("SpacingCalculator tokens", () => {
  it("exposes exact grid gap tokens aligned with the density scale", () => {
    const cfg = SpacingCalculator.calculateSpacing({
      totalFields: 10,
      totalSections: 1,
      maxNestingDepth: 1,
      averageFieldsPerRow: 2,
      hasRepeaters: false,
      density: "comfortable",
    });
    expect(cfg.fieldGapX).toBe("gap-x-[var(--space-4)]");
    expect(cfg.fieldGapY).toBe("gap-y-[var(--space-4)]");

    const defaults = SpacingCalculator.getDefaultSpacing();
    expect(defaults.fieldGapX).toBe("gap-x-[var(--space-4)]");
    expect(defaults.fieldGapY).toBe("gap-y-[var(--space-4)]");
  });
});

describe("Section composer automatic spacing", () => {
  it("applies the calculator grid gap (not gap-4) and strips field margins", async () => {
    const definition: FormDefinition = {
      id: "auto-gap-test",
      title: "Auto Gap Test",
      sections: [
        {
          id: "sec1",
          title: "Auto Gap Section",
          layout: { type: "grid", columns: 12 } as any,
          fields: [
            baseField(1, {
              meta: {
                ui: { className: "", classNames: { base: "mb-2 sm:mb-2.5" } },
              },
            }),
            baseField(2, { properties: { marginBottom: "md" } }),
            baseField(3),
            baseField(4),
            baseField(5),
            baseField(6),
          ],
        },
      ],
    };

    const { container } = renderWithProviders(
      <Form definition={definition} />
    );
    const grid = await getGridContainer(container);

    // Exact automatic tokens, not the hardcoded gap-4 from the parser.
    expect(grid.className).toContain("gap-x-[var(--space-4)]");
    expect(grid.className).toContain("gap-y-[var(--space-4)]");
    const classes = grid.className.split(/\s+/);
    expect(classes.some((c) => c === "gap-4" || c === "gap-[var(--space-4)]")).toBe(
      false
    );

    // Grid owns vertical spacing → authored/auto per-field margins are stripped
    // from the inner field container.
    await waitFor(() => {
      const f1 = getFieldCore(container, "f1");
      expect(f1.className).not.toContain("mb-2");
      expect(f1.className).not.toContain("sm:mb-2.5");
    });

    // Wrapper margins (properties.margin*) are stripped on the FieldRouter
    // ensemble (outer data-field-id element).
    await waitFor(() => {
      const f2Ensemble = container.querySelector(
        '[data-field-id="f2"][data-testid]'
      );
      if (!f2Ensemble) throw new Error("f2 ensemble not found");
      expect(f2Ensemble.className).not.toContain("mb-[var(--space-4)]");
    });
  });

  it("honours an explicit author gap and preserves per-field margins", async () => {
    const definition: FormDefinition = {
      id: "override-test",
      title: "Override Test",
      sections: [
        {
          id: "sec1",
          title: "Override Section",
          layout: { type: "grid", columns: 12, gap: "lg" } as any,
          fields: [
            baseField(1, {
              meta: { ui: { className: "" } },
            }),
          ],
        },
      ],
    };

    const { container } = renderWithProviders(
      <Form definition={definition} />
    );
    const grid = await getGridContainer(container);

    // Author gap ("lg" → token 8) bypasses the calculator entirely.
    expect(grid.className).toContain("gap-[var(--space-8)]");
    expect(grid.className).not.toContain("gap-x-[var(--space-4)]");
    expect(grid.className).not.toContain("gap-y-[var(--space-4)]");
  });

  it("keeps authored field margins when the author owns spacing", async () => {
    const definition: FormDefinition = {
      id: "override-margin-test",
      title: "Override Margin Test",
      sections: [
        {
          id: "sec1",
          title: "Override Margin Section",
          layout: { type: "grid", columns: 12, gap: "sm" } as any,
          fields: [
            baseField(1, {
              meta: {
                ui: { className: "", classNames: { base: "mb-2 sm:mb-2.5" } },
              },
            }),
          ],
        },
      ],
    };

    const { container } = renderWithProviders(
      <Form definition={definition} />
    );
    await getGridContainer(container);

    // Explicit author gap → spacingAuthority is OFF → margins preserved.
    await waitFor(() => {
      const field = getFieldCore(container, "f1");
      expect(field.className).toContain("mb-2");
      expect(field.className).toContain("sm:mb-2.5");
    });
  });

  it("drives block layouts with space-y and never strips margins", async () => {
    const definition: FormDefinition = {
      id: "block-test",
      title: "Block Test",
      sections: [
        {
          id: "sec1",
          title: "Block Section",
          layout: { type: "block" } as any,
          fields: [
            baseField(1, {
              meta: {
                ui: { className: "", classNames: { base: "mb-2" } },
              },
            }),
            baseField(2, {
              meta: { ui: { className: "" } },
            }),
            baseField(3, {
              meta: { ui: { className: "" } },
            }),
          ],
        },
      ],
    };

    const { container } = renderWithProviders(
      <Form definition={definition} />
    );

    await waitFor(() => {
      const block = Array.from(container.querySelectorAll("div.block")).find(
        (d) => d.className.includes("space-y-[")
      );
      if (!block) {
        throw new Error(
          "block container with space-y token not found: " +
            container.querySelector("div.block")?.className
        );
      }
      // Calculator-driven block keeps authored per-field margins.
      const field = getFieldCore(container, "f1");
      expect(field.className).toContain("mb-2");
    });
  });
});