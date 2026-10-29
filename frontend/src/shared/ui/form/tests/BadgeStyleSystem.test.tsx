import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { resolveBadgeStyles, getBadgeIntentClasses } from "../utils/badge-utils";
import type { FormField } from "../fields";
import { MultiSelectField } from "../fields/primitive/MultiSelectField";
import { AutocompleteField } from "../fields/primitive/AutocompleteField";
import { withAtom } from "../hoc/withAtom";

const WrappedMultiSelect = withAtom(MultiSelectField);
const WrappedAutocomplete = withAtom(AutocompleteField);

describe("BadgeStyleSystem & Dedicated Area Architecture", () => {
  describe("Pillar 1: Contrast-Certified Token Resolution & Zero bg-muted", () => {
    it("never includes bg-muted in overflowBadgeClass or neutral tags", () => {
      const mockField: FormField = {
        id: "test-field",
        name: "test",
        type: "multiselect",
        properties: {
          badge: {
            intent: "neutral",
          },
        },
      } as any;

      const styles = resolveBadgeStyles(mockField);
      expect(styles.overflowBadgeClass).not.toContain("bg-muted");
      expect(styles.tagClass).not.toContain("bg-muted");
    });

    it("automatically harmonizes overflow badge with field intent", () => {
      const primaryField: FormField = {
        id: "primary-field",
        name: "primary",
        type: "multiselect",
        properties: {
          badge: {
            intent: "primary",
          },
        },
      } as any;

      const primaryStyles = resolveBadgeStyles(primaryField);
      expect(primaryStyles.overflowBadgeClass).toContain("text-primary");
      expect(primaryStyles.overflowBadgeClass).toContain("bg-primary/15");
      expect(primaryStyles.overflowBadgeClass).toContain("rounded-full");

      const warningField: FormField = {
        id: "warning-field",
        name: "warning",
        type: "multiselect",
        properties: {
          badge: {
            intent: "warning",
          },
        },
      } as any;

      const warningStyles = resolveBadgeStyles(warningField);
      expect(warningStyles.overflowBadgeClass).toContain("text-warning");
      expect(warningStyles.overflowBadgeClass).toContain("bg-warning");
    });

    it("respects overflowIntent override independently from tag intent", () => {
      const decoupledField: FormField = {
        id: "decoupled-field",
        name: "decoupled",
        type: "multiselect",
        properties: {
          badge: {
            intent: "warning",
            overflowIntent: "neutral",
          },
        },
      } as any;

      const styles = resolveBadgeStyles(decoupledField);
      expect(styles.tagClass).toContain("text-warning");
      expect(styles.overflowBadgeClass).toContain("bg-neutral-200/90");
      expect(styles.overflowBadgeClass).not.toContain("bg-muted");
    });

    it("provides high-contrast solid and outline variants", () => {
      const solidClasses = getBadgeIntentClasses("primary", "solid");
      expect(solidClasses).toContain("bg-primary");
      expect(solidClasses).toContain("text-primary-foreground");

      const outlineClasses = getBadgeIntentClasses("secondary", "outline");
      expect(outlineClasses).toContain("bg-transparent");
      expect(outlineClasses).toContain("text-secondary");
    });
  });

  describe("Pillar 2: Dedicated Area Separation from Input Surface", () => {
    it("separates dedicated tag area into below-surface container outside input card in MultiSelectField", () => {
      const options = [
        { value: "react", label: "React" },
        { value: "vue", label: "Vue" },
        { value: "solid", label: "Solid" },
      ];

      const { container } = render(
        <WrappedMultiSelect
          field={{
            id: "multiselect-area-test",
            name: "frameworks",
            type: "multiselect",
            label: "Tech Stacks",
            options,
            layout: { placeholder: { en: "Select technologies..." } },
          } as any}
          value={["react", "vue"]}
          multipleDisplay="area"
          placeholder="Select technologies..."
        />
      );

      // The input surface card
      const inputSurface = container.querySelector(".form-field-surface");
      expect(inputSurface).toBeInTheDocument();

      // The below-surface container (rendered on next line)
      const belowSurfaceContainer = container.querySelector("[data-unit='below-surface-container']");
      expect(belowSurfaceContainer).toBeInTheDocument();

      // The dedicated values area
      const dedicatedArea = container.querySelector("[data-unit='selected-values-area']");
      expect(dedicatedArea).toBeInTheDocument();

      // CRITICAL ASSERTION: The dedicated area must be inside below-surface-container, NOT inside inputSurface!
      expect(belowSurfaceContainer).toContainElement(dedicatedArea);
      expect(inputSurface).not.toContainElement(dedicatedArea);

      // Verify the prompt placeholder remains in inputSurface so it's not a hollow void
      expect(
        container.querySelector("[data-unit='multiselect-placeholder']")
      ).toHaveTextContent("Select technologies...");
    });

    it("separates dedicated tag area into below-surface container outside input card in AutocompleteField", () => {
      const options = [
        { value: "react", label: "React" },
        { value: "vue", label: "Vue" },
      ];

      const { container } = render(
        <WrappedAutocomplete
          field={{
            id: "autocomplete-area-test",
            name: "frameworks",
            type: "autocomplete",
            label: "Framework Selection",
            options,
            multiple: true,
          } as any}
          value={["react", "vue"]}
          multipleDisplay="area"
          layout={{ placeholder: { en: "Search frameworks..." } }}
        />
      );

      const inputSurface = container.querySelector(".form-field-surface");
      const belowSurfaceContainer = container.querySelector("[data-unit='below-surface-container']");
      const dedicatedArea = container.querySelector("[data-unit='selected-values-area']");

      expect(inputSurface).toBeInTheDocument();
      expect(belowSurfaceContainer).toBeInTheDocument();
      expect(dedicatedArea).toBeInTheDocument();

      // Must be rendered below the surface, outside the card
      expect(belowSurfaceContainer).toContainElement(dedicatedArea);
      expect(inputSurface).not.toContainElement(dedicatedArea);
    });

    it("removes items and clears all from the dedicated area", () => {
      const options = [
        { value: "react", label: "React" },
        { value: "vue", label: "Vue" },
      ];
      let currentValue = ["react", "vue"];

      const { rerender } = render(
        <WrappedMultiSelect
          field={{
            id: "multiselect-remove-test",
            name: "frameworks",
            type: "multiselect",
            options,
          } as any}
          value={currentValue}
          onChange={(newVal) => {
            currentValue = newVal || [];
          }}
          multipleDisplay="area"
        />
      );

      const clearAllButton = screen.getByText("Clear all");
      expect(clearAllButton).toBeInTheDocument();

      fireEvent.click(clearAllButton);
      expect(currentValue).toEqual([]);
    });
  });
});
