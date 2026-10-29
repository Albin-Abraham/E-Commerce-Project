import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { axe } from "vitest-axe";
import * as matchers from "vitest-axe/matchers";
import "vitest-axe/extend-expect";

expect.extend(matchers);

import { renderForm } from "@/shared/testing/drivers/FormDriverV2";
import { COMPREHENSIVE_FORM_FIXTURE } from "@/shared/testing/fixtures/ComprehensiveFormFixture";

describe("Layer 3: End-to-End Workflow Tests (FormDriverV2 + Multi-Step Wizard + Axe)", () => {
  it("should successfully guide the user through a 3-step enterprise onboarding workflow with conditional logic and submission", async () => {
    const onSubmit = vi.fn();

    const { driver, container, user } = await renderForm({
      definition: COMPREHENSIVE_FORM_FIXTURE,
      initialData: { accountType: "individual" },
      onSubmit,
    });

    // ─── STEP 1: Account Setup ───────────────────────────────────────────────
    expect(screen.getByRole("heading", { name: /Account Setup/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();

    // Conditional fields companyName and taxId should NOT be visible for individual
    expect(screen.queryByLabelText(/Company Legal Name/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Tax ID/i)).not.toBeInTheDocument();

    // Attempting to advance without required fullName should be gated
    await driver.nextStep();
    // Still on Step 1
    expect(screen.getByRole("heading", { name: /Account Setup/i })).toBeInTheDocument();

    // Switch account type to Business Organization
    const businessRadio = screen.getByLabelText(/Business Organization/i);
    await user.click(businessRadio);

    // Dynamic conditional fields should mount
    await waitFor(() => {
      expect(screen.getByLabelText(/Company Legal Name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Tax ID/i)).toBeInTheDocument();
    });

    // Fill Step 1 required fields
    await driver.fill("fullName", "Jane Doe");
    await driver.fill("companyName", "ZenOS Technologies Corp");

    // Advance to Step 2
    await driver.nextStep();

    // ─── STEP 2: Security & Credentials ──────────────────────────────────────
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Security & Credentials/i })).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/Corporate Email/i);
    const passwordInput = container.querySelector('input[name="password"]') as HTMLInputElement;

    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();

    // Fill valid credentials
    await driver.fill("email", "jane.doe@zenos.io");
    await driver.fill("password", "SuperSecret123!");

    // Advance to Step 3
    await driver.nextStep();

    // ─── STEP 3: Preferences & Confirmation ──────────────────────────────────
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Preferences & Confirmation/i })).toBeInTheDocument();
    });

    const termsCheckbox = screen.getByLabelText(/I agree to the ZenOS Enterprise Service Terms/i);
    expect(termsCheckbox).toBeInTheDocument();

    // Agree to terms
    await user.click(termsCheckbox);

    // Submit form
    await driver.submit();

    // ─── CANONICAL SUBMISSION ASSERTIONS ──────────────────────────────────────
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    const payload = onSubmit.mock.calls[0][0];
    expect(payload).toMatchObject({
      accountType: "business",
      fullName: "Jane Doe",
      companyName: "ZenOS Technologies Corp",
      email: "jane.doe@zenos.io",
      password: "SuperSecret123!",
      termsAgreed: true,
    });

    // ─── ACCESSIBILITY AUDIT (Axe WCAG 2.1 AA) ───────────────────────────────
    const axeResults = await axe(container);
    expect(axeResults).toHaveNoViolations();
  });

  it("should allow navigating back to previous steps and preserving input values", async () => {
    const { driver, user } = await renderForm({
      definition: COMPREHENSIVE_FORM_FIXTURE,
      initialData: { accountType: "individual" },
    });

    // Fill Step 1
    await driver.fill("fullName", "Alice Walker");
    await driver.nextStep();

    // Step 2 reached
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Security & Credentials/i })).toBeInTheDocument();
    });

    await driver.fill("email", "alice@example.com");

    // Click back button
    const backBtn = screen.getByRole("button", { name: /Back/i });
    await user.click(backBtn);

    // Step 1 restored with preserved value
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Account Setup/i })).toBeInTheDocument();
    });
    expect(screen.getByLabelText(/Full Name/i)).toHaveValue("Alice Walker");
  });
});
