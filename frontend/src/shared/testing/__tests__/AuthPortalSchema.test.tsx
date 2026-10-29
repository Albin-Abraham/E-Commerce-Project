import {
  buildLoginSchema,
  buildSignupSchema,
} from "@shell/pages/static-pages/configs/auth-schema";
import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FormDriver } from "../drivers/FormDriver";

/**
 * AuthPortalSchema — Verifies the schema-driven AuthPortal refactor.
 *
 * The AuthPortalPage is now a thin V4 wrapper: ALL form chrome lives in the
 * fused FormDefinition (mode toggle, split brand panel, header, divider,
 * social buttons, footer links) and the submit button comes from
 * `submitLabel` via the SplitLayoutRenderer. These tests pin that contract.
 */
describe("Auth Portal: Schema-Driven Chrome", () => {
  it("fuses login schema with split layout + chrome fields", () => {
    const schema = buildLoginSchema();

    // Split layout with mode toggle (segmented primitive) + brand panel + form pane
    expect(schema.layout).toBe("split");
    expect(schema.containers?.[0].config?.topContent).toMatchObject({
      type: "segmented",
    });
    expect(schema.containers?.[0].config?.topContent?.options).toEqual([
      { label: "Sign In", value: "login" },
      { label: "Sign Up", value: "signup" },
    ]);
    expect(schema.containers?.[0].config?.leftContent).toMatchObject({
      type: "component",
    });
    expect(schema.containers?.[0].config?.rightContent).toMatchObject({
      type: "section-ref",
      sectionId: "login-fields",
      className: expect.stringContaining("flex-1"),
    });

    // Card height is content-driven, not a fixed 700px
    expect(schema.style?.classNames?.root).not.toContain("min-h-[700px]");

    // Input fields reserve a consistent slot for validation errors
    const usernameField = schema.sections?.[0]?.fields?.find(
      (f) => f.name === "username"
    );
    expect(usernameField?.properties?.reserveErrorSpace).toBe(true);

    // Chrome fields are schema-driven, in order
    const types = schema.sections?.[0]?.fields?.map((f) => f.type) ?? [];
    expect(types).toEqual([
      "header",
      "text",
      "password",
      "button",
      "divider",
      "social",
      "html",
    ]);
    expect(schema.submitLabel).toBe("Sign In");
  });

  it("renders the split panes, brand panel, mode toggle and schema chrome", async () => {
    const { driver, container } = await FormDriver.render(buildLoginSchema() as any);

    // Mode toggle embedded on the card via topContent
    expect(
      container.querySelector('[data-testid="auth-mode-toggle"]')
    ).not.toBeNull();

    // Left pane: brand panel via the `component` container content type
    const brandTitles = await screen.findAllByText(
      /Unified Hub for Smarter Industrial/i
    );
    expect(brandTitles[0]).toBeInTheDocument();

    // Header static field (label + description)
    expect(await screen.findByText(/Welcome to ZenOS/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/Sign in to your account to continue/i)
    ).toBeInTheDocument();

    // Divider + social buttons + footer links (lazy static fields)
    expect(await screen.findByText(/Or continue with/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/ZenOS Platform|Copyright/i)
    ).toBeInTheDocument();

    // Data fields hydrate in the right pane
    await driver.expectVisible("username");
    await driver.expectVisible("password");

    // Validation errors reserve a fixed slot so fields don't jump
    const usernameWrapper = driver.getWrapperByName("username");
    expect(
      usernameWrapper.querySelector('[class*="min-h-[18px]"], [class*="min-h-[24px]"]')
    ).not.toBeNull();

    // Submit button driven by submitLabel inside the split renderer
    const submit = container.querySelector('button[type="submit"]');
    expect(submit).not.toBeNull();
    expect(submit?.textContent).toContain("Sign In");
  });

  it("fuses signup schema with chrome + 4 data fields", async () => {
    const schema = buildSignupSchema();

    const types = schema.sections?.[0]?.fields?.map((f) => f.type) ?? [];
    expect(types).toEqual([
      "header",
      "text",
      "text",
      "password",
      "password",
      "button",
      "divider",
      "social",
      "html",
    ]);
    expect(schema.submitLabel).toBe("Create Account");

    const { driver, container } = await FormDriver.render(buildSignupSchema() as any);
    await driver.expectVisible("name");
    await driver.expectVisible("username");
    await driver.expectVisible("password");
    await driver.expectVisible("confirm_password");

    // Mode toggle present on signup too
    expect(
      container.querySelector('[data-testid="auth-mode-toggle"]')
    ).not.toBeNull();

    const submit = container.querySelector('button[type="submit"]');
    expect(submit?.textContent).toContain("Create Account");
  });

  it("shows validation errors inside the reserved slots", async () => {
    const { driver } = await FormDriver.render(buildLoginSchema() as any);

    // Submit an empty form to trigger required-field validation
    await driver.submit();
    await driver.expectValidationFailure();

    // Errors surface in the reserved feedback slot of each input
    expect(
      driver.getWrapperByName("username").querySelector('[role="alert"]')
    ).not.toBeNull();
    expect(
      driver.getWrapperByName("password").querySelector('[role="alert"]')
    ).not.toBeNull();
  });

  it("routes mode changes through the schema-delivered toggle", async () => {
    const onModeChange = vi.fn();
    const { user, container } = await FormDriver.render(
      buildLoginSchema({ mode: "login", onModeChange }) as any
    );

    const toggle = container.querySelector(
      '[data-testid="auth-mode-toggle"]'
    ) as HTMLElement;

    await user.click(within(toggle).getByRole("radio", { name: "Sign Up" }));
    expect(onModeChange).toHaveBeenCalledWith("signup");

    await user.click(within(toggle).getByRole("radio", { name: "Sign In" }));
    expect(onModeChange).toHaveBeenCalledWith("login");
  });
});
