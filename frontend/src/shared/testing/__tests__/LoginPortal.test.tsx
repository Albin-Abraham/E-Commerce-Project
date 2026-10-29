import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Form } from "@ui/form/Form";
import type { FormDefinition } from "@ui/form/types";
import { describe, expect, it } from "vitest";

import { FormDriver } from "../drivers/FormDriver";
import { renderWithProviders } from "../test-utils";

/**
 * LoginPortalDriver - Specialized Expert for Authentication UI
 */
export class LoginPortalDriver extends FormDriver {
  /**
   * Typed Renderer for Login Portal
   */
  static async render(
    definition: FormDefinition,
    theme?: any,
    initialData?: any
  ) {
    const user = userEvent.setup();
    const { container } = renderWithProviders(
      <Form definition={definition} theme={theme} initialData={initialData} />
    );

    return {
      driver: new LoginPortalDriver(container, user),
      container,
      user,
    };
  }

  /**
   * Fills credentials and submits
   */
  public async attemptLogin(email: string, pass: string) {
    await this.fill("email", email);
    await this.fill("password", pass);
    await this.submit();
    return this;
  }

  /**
   * Verifies the Split Pane integrity (Left Image, Right Form)
   */
  public async expectSplitLayoutBehavior() {
    // 1. Verify Left Pane (Image)
    const img = screen.getByAltText(/healthcare facility/i);
    expect(img).toBeInTheDocument();

    // Check for Sticky/Full height classes (Layout Fidelity)
    const leftPane = img.closest(".col-span-12");
    expect(leftPane).toHaveClass("lg:col-span-5"); // 40/60 ratio mapping

    // 2. Verify Right Pane (Hydrated Auth Core)
    const header = await screen.findByText(/welcome back/i);
    expect(header).toBeInTheDocument();

    // Check for correct grid ratio mapping on the pane
    const rightPane = this.container.querySelector('[data-pane="right"]');
    expect(rightPane).toHaveClass("lg:col-span-7");
  }

  /**
   * Verifies the icon mapping for credentials
   */
  public async expectCredentialIcons() {
    const emailWrapper = this.getWrapperByName("email");
    const passWrapper = this.getWrapperByName("password");

    // Look for SVG icons matching the names (mail, lock)
    // withAtom uses dynamic Lucide components
    expect(emailWrapper.querySelector("svg")).toBeInTheDocument();
    expect(passWrapper.querySelector("svg")).toBeInTheDocument();
  }
}

// --- TARGET SCHEMA ---

const LOGIN_SCHEMA: FormDefinition = {
  id: "modern-login",
  title: "",
  submitLabel: "LOGIN",
  layout: "split",
  containers: [
    {
      id: "split-main",
      type: "split",
      config: {
        splitRatio: "40/60",
        leftContent: {
          type: "image",
          src: "path/to/image.jpg",
          alt: "Healthcare Facility",
          overlay: true,
          className: "sticky top-0",
        },
        rightContent: {
          type: "section-ref",
          sectionId: "auth-core",
          className: "auth-pane-container",
        },
      },
    },
  ],
  sections: [
    {
      id: "auth-core",
      title: "",
      fields: [
        {
          id: "header",
          type: "header",
          label: "Welcome Back!",
          description: "Please enter your account here",
        },
        {
          id: "email",
          name: "email",
          type: "email",
          label: "Email",
          required: true,
          meta: { ui: { icon: "mail" } },
        },
        {
          id: "password",
          name: "password",
          type: "password",
          label: "Password",
          required: true,
          meta: { ui: { icon: "lock" } },
        },
        {
          id: "forgot-link",
          type: "paragraph",
          label: "",
          initialValue: "Forgot password?",
        },
        {
          id: "social-split",
          type: "divider",
          label: "Or continue with",
        },
      ],
    },
  ],
};

// --- EXECUTION ---

describe("Form Engine: Login Portal Orchestration", () => {
  it("should hydrate section-ref and maintain layout fidelity", async () => {
    // Render using the specialized driver
    const { driver } = await LoginPortalDriver.render(LOGIN_SCHEMA);
    const loginDriver = driver as LoginPortalDriver;

    // 1. Assert Split Layout Pane mapping
    await loginDriver.expectSplitLayoutBehavior();

    // 2. Assert Hydration (Verify fields that were pulled in via section-ref)
    await loginDriver.expectVisible("email");
    await loginDriver.expectVisible("password");

    // Divider has no name, check by ID
    await loginDriver.waitForField("social-split");

    // 3. Assert Icon Fidelity
    await loginDriver.expectCredentialIcons();

    // 4. Interaction Flow
    await loginDriver.attemptLogin("test@hospital.com", "secure123");

    // Note: In a real test we would verify the onSubmit mock call
  });

  it("should render static components (header/divider) with correct content", async () => {
    const { driver } = await LoginPortalDriver.render(LOGIN_SCHEMA);

    // Wait for the fields to clear skeletons (Using ID for static fields)
    await driver.waitForField("header");
    await driver.waitForField("social-split");

    // Divider text verification
    expect(await screen.findByText(/or continue with/i)).toBeInTheDocument();

    // Header description verification
    expect(
      await screen.findByText(/please enter your account here/i)
    ).toBeInTheDocument();
  });
});
