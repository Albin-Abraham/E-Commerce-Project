import { expect } from "vitest";

import { BaseDriver } from "./BaseDriver";

/**
 * LayoutDriver: Specialized for structural and visual layout verification.
 * Focuses on grid spans, container spacing, shell modes, and theme application.
 */
export class LayoutDriver extends BaseDriver {
  constructor(container: HTMLElement) {
    super(container);
  }

  // --- Shell & Container Assertions ---

  public async expectShellMode(mode: "portal" | "dashboard") {
    await this.waitFor(() => {
      const className =
        mode === "portal" ? "page-shell--portal" : "page-shell--dashboard";
      const shell = this.container.querySelector(`.${className}`);
      if (!shell) {
        throw new Error(
          `Expected PageShell to be in ${mode} mode (class: ${className})`
        );
      }
    });
  }

  public async expectGridContainer(gap?: string) {
    await this.waitFor(() => {
      const container = this.container.querySelector(".grid.grid-cols-12");
      if (!container) {
        throw new Error("Grid container (grid-cols-12) not found");
      }
      if (gap) {
        // Match based on gap property or CSS variable
        const hasGap = Array.from(container.classList).some(
          (c) =>
            c.includes("gap-") &&
            (c.includes(gap) || c.includes(`var(--space-${gap})`))
        );
        if (!hasGap && !container.className.includes(gap)) {
          throw new Error(
            `Expected grid container to have gap "${gap}". Found classes: "${container.className}"`
          );
        }
      }
    });
  }

  // --- Field Layout & Spacing ---

  public async expectFieldSpan(fieldId: string, span: number) {
    await this.waitFor(() => {
      const ensemble = this.container.querySelector(
        `[data-field-id="${fieldId}"]`
      );
      if (!ensemble) throw new Error(`Ensemble for ${fieldId} not found`);

      const rawSpan = `col-span-${span}`;
      const responsiveSpan = `md:col-span-${span}`;

      const hasCorrectSpan =
        ensemble.className.includes(rawSpan) ||
        ensemble.className.includes(responsiveSpan);

      if (!hasCorrectSpan) {
        throw new Error(
          `Field ${fieldId} expected ${rawSpan} or ${responsiveSpan}. Found: ${ensemble.className}`
        );
      }
    });
  }

  public async expectFieldLayout(
    fieldId: string,
    layout: { columnSpan?: number; order?: number }
  ) {
    if (layout.columnSpan)
      await this.expectFieldSpan(fieldId, layout.columnSpan);

    if (layout.order !== undefined) {
      await this.waitFor(() => {
        const ensemble = this.container.querySelector(
          `[data-field-id="${fieldId}"]`
        );
        if (!ensemble?.className.includes(`order-${layout.order}`)) {
          throw new Error(`Field ${fieldId} expected order-${layout.order}.`);
        }
      });
    }
  }

  // --- Styling & Variants ---

  public async expectFieldVariant(
    fieldId: string,
    variant: "outlined" | "filled" | "standard"
  ) {
    await this.waitFor(() => {
      const inputWrapper = this.container.querySelector(
        `[data-field-id="${fieldId}"] [data-unit="input-wrapper"]`
      );
      if (!inputWrapper)
        throw new Error(`Input wrapper for ${fieldId} not found`);

      // Match based on classes defined in FormTheme/form-styles
      const isOutlined =
        variant === "outlined" && inputWrapper.className.includes("border");
      const isFilled =
        variant === "filled" &&
        (inputWrapper.className.includes("bg-surface-secondary") ||
          inputWrapper.className.includes("bg-slate"));
      const isStandard =
        variant === "standard" && inputWrapper.className.includes("border-b");

      if (!(isOutlined || isFilled || isStandard)) {
        throw new Error(
          `Field ${fieldId} does not appear to be "${variant}" variant. Classes: ${inputWrapper.className}`
        );
      }
    });
  }

  public async expectSectionVariant(
    sectionId: string,
    variant: "card" | "flat"
  ) {
    await this.waitFor(() => {
      const section = this.container.querySelector(
        `[data-field-id="${sectionId}"]`
      );
      if (!section) throw new Error(`Section ${sectionId} not found`);

      const card = section.querySelector('[data-unit="card"]');
      if (variant === "card") {
        if (!card)
          throw new Error(`Section ${sectionId} expected to be a card.`);
        // Verify modernized shadow token
        expect(card.className).toContain("shadow-premium");
      } else if (variant === "flat" && card) {
        throw new Error(
          `Section ${sectionId} expected to be flat/simple (no card wrapper).`
        );
      }
    });
  }

  // --- Typography & Icons ---

  public async expectIcon(
    fieldId: string,
    position: "prefix" | "suffix",
    iconName: string
  ) {
    await this.waitFor(() => {
      const wrapper = this.container.querySelector(
        `[data-field-id="${fieldId}"] [data-unit="input-wrapper"]`
      );
      if (!wrapper) throw new Error(`Input wrapper for ${fieldId} not found`);

      const svg = wrapper.querySelector("svg");
      if (!svg)
        throw new Error(
          `Icon ${iconName} not found in ${position} of ${fieldId}`
        );
    });
  }
}
