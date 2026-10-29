// src/testing/__tests__/FormRenderEngine.test.tsx
import { Form } from "@ui/form/Form";
import { describe, expect, it } from "vitest";

import { FormSystemDriver } from "../drivers/FormSystemDriver";
import {
  ENTERPRISE_PROFILE_SCHEMA,
  RENDER_ENGINE_TEST_SCHEMA,
} from "../fixtures/RenderEngineTestFixture";
import { renderWithProviders } from "../test-utils";

describe("Form Render Engine (v2.1.0) Integration Audit", () => {
  /**
   * Test Suite A: Grid Auto-Flow Orchestration
   * Ensures fields occupy correct column spans in the 12-col grid.
   */
  describe("Grid Orchestration", () => {
    it("should correctly apply 12-column and 6-column spans at the DOM level", async () => {
      const { container } = renderWithProviders(
        <Form definition={RENDER_ENGINE_TEST_SCHEMA} />
      );
      const driver = new FormSystemDriver(container, null as any); // Non-interactive test

      await driver.waitForField("field_full");

      // Verify Full Width
      await driver.expectGridSpan("field_full", 12);

      // Verify Half Width Splits
      await driver.expectGridSpan("field_half_left", 6);
      await driver.expectGridSpan("field_half_right", 6);
    });

    it("should apply grid gap from layout configuration", async () => {
      const { container } = renderWithProviders(
        <Form definition={RENDER_ENGINE_TEST_SCHEMA} />
      );

      // The grid container is managed by SectionContent
      const grid = container.querySelector(".grid.grid-cols-12");
      expect(grid?.className).toContain("gap-");
    });
  });

  /**
   * Test Suite B: Recursive Structural Integrity
   * Ensures nested containers correctly pass layout context to their children.
   */
  describe("Recursive Nesting & Context", () => {
    it("should pass parent layout context to deeply nested children", async () => {
      const { container } = renderWithProviders(
        <Form definition={RENDER_ENGINE_TEST_SCHEMA} />
      );
      const driver = new FormSystemDriver(container, null as any);

      await driver.waitForField("nested_field");

      // Verify nested field exists within its card and container
      // Card should be 12/12 of the container
      await driver.expectGridSpan("inner_card", 12);

      // Nested field should be 6/12 of the card
      await driver.expectGridSpan("nested_field", 6);

      // Verify DOM-level recursive context hooks
      await driver.expectLayoutContext("nested_field", "grid");
    });

    it("should render CardField with correct elevation and surface", async () => {
      const { container } = renderWithProviders(
        <Form definition={RENDER_ENGINE_TEST_SCHEMA} />
      );
      const driver = new FormSystemDriver(container, null as any);

      await driver.waitForField("inner_card");

      // Cards default to "md" elevation in SectionComposer
      await driver.expectCardStyle("inner_card", "md");
    });
  });

  describe("Shell Unification", () => {
    it("should render themed FormHeader with standard borders in Dashboard mode", async () => {
      const { container } = renderWithProviders(
        <Form definition={RENDER_ENGINE_TEST_SCHEMA} />
      );
      const driver = new FormSystemDriver(container, null as any);

      // In dashboard mode, we expect standard borders from the theme
      await driver.expectShellPart(".form-header", "form-header");
    });

    it("should yield FormHeader to PageShell in Portal mode", async () => {
      const portalSchema = {
        ...RENDER_ENGINE_TEST_SCHEMA,
        settings: {
          ...RENDER_ENGINE_TEST_SCHEMA.settings,
          layoutMode: "portal",
        },
      };
      const { container } = renderWithProviders(
        <Form definition={portalSchema as any} />
      );

      // In portal mode, the local shell is rendered inside the portal card
      const localHeader = container.querySelector(".form-header");
      expect(localHeader).toBeInTheDocument();

      // Instead, verify the PageShell's card header title
      const pageTitle = container.querySelector("h1");
      expect(pageTitle?.textContent).toBe(RENDER_ENGINE_TEST_SCHEMA.title);
    });

    it("should render sections as cards in dashboard mode", async () => {
      const { container } = renderWithProviders(
        <Form definition={RENDER_ENGINE_TEST_SCHEMA} />
      );

      // Verify that sections are rendered as Cards with premium shadows
      const sectionCards = container.querySelectorAll('[data-unit="card"]');
      expect(sectionCards.length).toBeGreaterThan(0);
      expect(sectionCards[0].className).toContain("shadow-premium");
    });
  });

  /**
   * Test Suite D: Enterprise Profile Audit (User Scenario)
   * Validates the 8/4 split and complex field types.
   */
  describe("Enterprise Profile Audit", () => {
    it("should correctly render the 8/4 grid split for organization details", async () => {
      const { container } = renderWithProviders(
        <Form definition={ENTERPRISE_PROFILE_SCHEMA} />
      );
      const driver = new FormSystemDriver(container, null as any);

      await driver.waitForField("org_name");

      // Verify the 8/4 split
      await driver.expectGridSpan("org_name", 8);
      await driver.expectGridSpan("org_code", 4);

      // Verify full width for sector
      await driver.expectGridSpan("sector", 12);
    });

    it("should apply 'sm' elevation to the Corporate Identity section card", async () => {
      const { container } = renderWithProviders(
        <Form definition={ENTERPRISE_PROFILE_SCHEMA} />
      );
      const driver = new FormSystemDriver(container, null as any);

      await driver.waitForField("org_name");

      // Verify section elevation
      await driver.expectCardStyle("primary_details", "sm");
    });

    it("should demonstrate custom action labels", async () => {
      const { container } = renderWithProviders(
        <Form definition={ENTERPRISE_PROFILE_SCHEMA} />
      );

      // Verify custom button text from schema
      const submitBtn = await container.querySelector('button[type="submit"]');
      expect(submitBtn?.textContent).toBe(
        ENTERPRISE_PROFILE_SCHEMA.submitLabel
      );
    });
  });
});
