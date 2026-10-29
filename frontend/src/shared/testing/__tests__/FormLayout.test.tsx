import { Form } from "@ui/form/Form";
import type { FormDefinition } from "@ui/form/types";
import { describe, it } from "vitest";

import { LayoutDriver } from "../drivers/LayoutDriver";
import { renderWithProviders } from "../test-utils";

describe("Form Styling and Layout Integration", () => {
  // --- 1. Shell Orchestration ---

  describe("PageShell Modes", () => {
    it("should render in Portal mode with centering and glassmorphism", async () => {
      const definition: FormDefinition = {
        id: "layout-test",
        title: "Layout Test",
        sections: [],
        settings: { layoutMode: "portal" },
      };

      const { container } = renderWithProviders(
        <Form definition={definition} />
      );
      const driver = new LayoutDriver(container);

      driver.expectShellMode("portal");
    });

    it("should render in Dashboard mode with max-width container", async () => {
      const definition: FormDefinition = {
        id: "layout-test",
        title: "Layout Test",
        sections: [],
        settings: { layoutMode: "dashboard" },
      };

      const { container } = renderWithProviders(
        <Form definition={definition} />
      );
      const driver = new LayoutDriver(container);

      driver.expectShellMode("dashboard");
    });
  });

  // --- 2. Grid & Field Spans ---

  describe("Grid and Columns", () => {
    it("should apply correct 12-column grid spans to fields", async () => {
      const definition: FormDefinition = {
        id: "grid-test",
        title: "Grid Test",
        sections: [
          {
            id: "sec1",
            title: "Grid Section",
            fields: [
              {
                id: "f1",
                name: "f1",
                type: "text",
                label: "Full Width",
                layout: { columnSpan: 12 },
              },
              {
                id: "f2",
                name: "f2",
                type: "text",
                label: "Half Width",
                layout: { columnSpan: 6 },
              },
              {
                id: "f3",
                name: "f3",
                type: "text",
                label: "Quarter Width",
                layout: { columnSpan: 3 },
              },
            ],
          },
        ],
      };

      const { container } = renderWithProviders(
        <Form definition={definition} />
      );
      const driver = new LayoutDriver(container);

      driver.expectFieldSpan("f1", 12);
      driver.expectFieldSpan("f2", 6);
      driver.expectFieldSpan("f3", 3);
      driver.expectGridContainer();
    });

    it("should support custom grid gaps and density", async () => {
      const definition: FormDefinition = {
        id: "density-test",
        title: "Density Test",
        sections: [
          {
            id: "sec1",
            title: "Density Section",
            layout: { type: "grid", gap: "lg" } as any,
            fields: [{ id: "f1", name: "f1", type: "text", label: "Field" }],
          },
        ],
      };

      const { container } = renderWithProviders(
        <Form definition={definition} />
      );
      const driver = new LayoutDriver(container);

      // Explicit gap "lg" resolves to the gap-[var(--space-8)] fluid token
      // (author override, so it bypasses the SpacingCalculator).
      driver.expectGridContainer("gap-[var(--space-8)]");
    });
  });

  // --- 3. Variants & Themes ---

  describe("Visual Variants", () => {
    it("should correctly apply 'outlined' variant styles", async () => {
      const definition: FormDefinition = {
        id: "variant-test",
        title: "Variant Test",
        sections: [
          {
            id: "s1",
            title: "Variant Section",
            fields: [
              {
                id: "f1",
                name: "f1",
                type: "text",
                label: "Outlined",
                meta: { ui: { variant: "outlined" } },
              },
            ],
          },
        ],
      };

      const { container } = renderWithProviders(
        <Form definition={definition} />
      );
      const driver = new LayoutDriver(container);

      driver.expectFieldVariant("f1", "outlined");
    });

    it("should correctly apply 'filled' variant styles", async () => {
      const definition: FormDefinition = {
        id: "variant-test",
        title: "Variant Test",
        sections: [
          {
            id: "s1",
            title: "Variant Section",
            fields: [
              {
                id: "f1",
                name: "f1",
                type: "text",
                label: "Filled",
                meta: { ui: { variant: "filled" } },
              },
            ],
          },
        ],
      };

      const { container } = renderWithProviders(
        <Form definition={definition} />
      );
      const driver = new LayoutDriver(container);

      driver.expectFieldVariant("f1", "filled");
    });
  });

  // --- 4. Section Structures ---

  describe("Structural Elements", () => {
    it("should render sections as cards when configured", async () => {
      const definition: FormDefinition = {
        id: "structure-test",
        title: "Structure Test",
        sections: [
          {
            id: "sec_card",
            title: "Card Section",
            layout: { type: "card" } as any,
            fields: [],
          },
          {
            id: "sec_flat",
            title: "Flat Section",
            layout: { type: "grid" } as any,
            fields: [],
          },
        ],
      };

      const { container } = renderWithProviders(
        <Form definition={definition} />
      );
      const driver = new LayoutDriver(container);

      driver.expectSectionVariant("sec_card", "card");
      driver.expectSectionVariant("sec_flat", "flat");
    });
  });

  describe("Grid Orchestration Details", () => {
    it("should correctly render 50/50 split fields", async () => {
      const definition: FormDefinition = {
        id: "split-test",
        title: "Split Test",
        sections: [
          {
            id: "s1",
            title: "Row",
            layout: { type: "grid", columns: 12 } as any,
            fields: [
              {
                id: "left",
                name: "left",
                type: "text",
                label: "Left",
                layout: { columnSpan: 6 },
              },
              {
                id: "right",
                name: "right",
                type: "text",
                label: "Right",
                layout: { columnSpan: 6 },
              },
            ],
          },
        ],
      };

      const { container } = renderWithProviders(
        <Form definition={definition} />
      );
      const driver = new LayoutDriver(container);

      await driver.expectFieldSpan("left", 6);
      await driver.expectFieldSpan("right", 6);
    });

    it("should support 'colSpan' as a legacy alias for 'columnSpan'", async () => {
      const definition: FormDefinition = {
        id: "alias-test",
        title: "Alias Test",
        sections: [
          {
            id: "s1",
            title: "Row",
            fields: [
              {
                id: "alias",
                name: "alias",
                type: "text",
                label: "Alias",
                layout: { colSpan: 4 } as any,
              },
            ],
          },
        ],
      };

      const { container } = renderWithProviders(
        <Form definition={definition} />
      );
      const driver = new LayoutDriver(container);

      await driver.expectFieldSpan("alias", 4);
    });
  });
});
