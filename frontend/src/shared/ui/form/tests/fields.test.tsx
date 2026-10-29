import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FIELD_METADATA } from "../fields/field-metadata";
import { createDefaultRegistry } from "../fields/lazy-registry-builder";

/**
 * The field registry is lazy: eager types resolve synchronously, while heavier
 * ones (container, card, …) resolve on first render. These tests assert against
 * that split rather than a fully synchronous map.
 */
describe("Field Registry", () => {
  describe("eager field types", () => {
    const registry = createDefaultRegistry();

    it("should return the correct component for a registered type", () => {
      expect(registry.get("text")).toBeDefined();
    });

    it("should return a fallback for an unknown type rather than throwing", () => {
      // LazyRegistryStore.get() always yields a renderable component, falling
      // back to a placeholder for unregistered types.
      expect(registry.get("non-existent")).toBeDefined();
    });

    it("should share one component instance across aliases", () => {
      const text = registry.get("text");

      expect(registry.get("email")).toBe(text);
      expect(registry.get("password")).toBe(text);

      const number = registry.get("number");
      expect(registry.get("number_input")).toBe(number);
    });
  });

  describe("lazy field types", () => {
    it("registers heavy extensions lazily and keeps structural/core types eager", () => {
      const registry = createDefaultRegistry();

      expect(registry.getLazyTypes()).toContain("code");
      expect(registry.getEagerTypes()).toContain("container");
      expect(registry.getEagerTypes()).toContain("card");
    });

    it("keeps the basic input types out of the lazy set", () => {
      const registry = createDefaultRegistry();

      expect(registry.getEagerTypes()).toContain("text");
      expect(registry.getEagerTypes()).toContain("select");
      expect(registry.getLazyTypes()).not.toContain("text");
    });
  });

  describe("FIELD_METADATA", () => {
    it("should contain metadata for basic input types", () => {
      expect(FIELD_METADATA.text).toBeDefined();
      expect(FIELD_METADATA.text.label).toBe("Text Input");
      expect(FIELD_METADATA.select.label).toBe("Dropdown");
    });

    it("should return a renderable icon for each metadata item", () => {
      const { container } = render(<div>{FIELD_METADATA.text.icon()}</div>);
      expect(container.querySelector("svg")).toBeTruthy();
    });
  });

  describe("Registry Integrity", () => {
    it("should have all standard field types registered", () => {
      const registry = createDefaultRegistry();
      const essentialTypes = [
        "text",
        "textarea",
        "select",
        "checkbox",
        "radio",
        "container",
        "card",
      ];

      essentialTypes.forEach((type) => {
        const known =
          registry.getEagerTypes().includes(type) ||
          registry.getLazyTypes().includes(type);
        expect(known).toBe(true);
      });
    });
  });
});
