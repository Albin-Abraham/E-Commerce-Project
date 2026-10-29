import { RouterProvider, createMemoryRouter } from "react-router-dom";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import TestMultiStepFormModel from "../multi-step-form";

// Helper to render the page with the necessary Router context
const renderPage = () => {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: <TestMultiStepFormModel />,
      },
    ],
    { initialEntries: ["/"] }
  );

  return render(<RouterProvider router={router} />);
};

/**
 * Advance the wizard one step via the footer's Next button.
 *
 * Two things make a bare stepper click insufficient:
 *  1. The page sets `settings.wizard.linear: true`, and FormStepper computes
 *     `isClickable = !isActive && (!isLinear || isVisited)` -- steps not yet
 *     visited are disabled, so they cannot be jumped to.
 *  2. FormFooter validates the current step before advancing in linear mode, and
 *     first_name / last_name / email are all `required: true`.
 *
 * Selected via `data-part` because only `es` locales are generated, so the
 * button's label is a translation key in tests.
 */
const goToNextStep = async (user: ReturnType<typeof userEvent.setup>) => {
  // firstName has a `min: 4` rule, lastName `min: 3`.
  await user.type(screen.getByLabelText(/First Name/i), "Alexander");
  await user.type(screen.getByLabelText(/Last Name/i), "Lovelace");
  await user.type(
    screen.getByLabelText(/Email Address/i),
    "alexander.lovelace@example.com"
  );

  const nextBtn = document.querySelector<HTMLElement>(
    '[data-part="next-btn"], [data-part="submit-btn"]'
  );
  if (!nextBtn) throw new Error("wizard Next button not found");
  await user.click(nextBtn);
};

describe("Employee Onboarding Wizard (UI & Schema Logic)", () => {
  beforeEach(() => {
    // Suppress console.errors if needed during tests
  });

  it("renders the initial Personal Profile section", async () => {
    renderPage();

    // Launch button might need to be clicked if Modal is closed by default,
    // but in multi-step-form.tsx, isOpen is initialized to true.
    expect(
      await screen.findByText("Employee Onboarding Portal")
    ).toBeInTheDocument();

    // Verify the first section headers - wait for form to fully render
    // Use heading role to avoid matching stepper label (which also says "Personal Details")
    await screen.findByRole('heading', { name: 'Personal Details' });
    expect(await screen.findByText("Personal Profile")).toBeInTheDocument();

    // Verify inputs are rendered
    expect(screen.getByLabelText(/First Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
  });

  it("switches to the Instructions tab", async () => {
    const user = userEvent.setup();
    renderPage();

    // Wait for modal to render
    await screen.findByText("Instructions & Policy");

    const instructionsTab = screen.getByText("Instructions & Policy");
    await user.click(instructionsTab);

    // Verify the instructions prose is visible
    expect(await screen.findByText("Welcome to the Team!")).toBeInTheDocument();
    expect(
      screen.getByText(/Please complete your onboarding profile/i)
    ).toBeInTheDocument();

    // Form engine shouldn't be visible
    expect(screen.queryByText("Personal Profile")).not.toBeInTheDocument();
  });

  it("conditionally renders the Visa section based on citizenship status", async () => {
    const user = userEvent.setup();
    renderPage();

    // At first, Visa section should NOT be in the document
    expect(screen.queryByText("Visa & Legal")).not.toBeInTheDocument();

    // Find the citizenship status select dropdown
    // Since we use native or custom selects, let's type or select it
    // If it's a native select or custom input labeled "Citizenship Status"
    const statusSelect = await screen.findByLabelText(/Citizenship Status/i);
    await user.click(statusSelect);

    // Depending on Select implementation (e.g., react-aria), we find the option
    // In our schema, the label is "Work Visa" with value "visa"
    const visaOption = await screen.findByText(/Work Visa/i);
    await user.click(visaOption);

    // Wait for the reactive expression engine ({{citizenship_status}} == 'visa') to evaluate
    // The Visa section should now dynamically appear in the stepper
    expect(await screen.findByText("Visa & Legal")).toBeInTheDocument();

    // Advance to the Visa step (the wizard is linear, so it is not clickable yet)
    await goToNextStep(user);

    // Verify we navigated to the Visa step
    expect(await screen.findByText("Visa Information")).toBeInTheDocument();
    expect(screen.getByLabelText(/Visa Number/i)).toBeInTheDocument();
  });

  it("conditionally renders the Spouse section based on marital status", async () => {
    const user = userEvent.setup();
    renderPage();

    // At first, Spouse section should NOT be in the document (defaults to single)
    expect(screen.queryByText("Spouse Information")).not.toBeInTheDocument();

    const maritalSelect = await screen.findByLabelText(/Marital Status/i);
    await user.click(maritalSelect);

    // Select Married
    const marriedOption = await screen.findByText(/Married/i);
    await user.click(marriedOption);

    // `citizenship_status` is required, so the wizard blocks on Next until it is
    // set. Pick "Citizen" so the conditional Visa section stays hidden and
    // Spouse Information is the step immediately after Personal Profile.
    const statusSelect = await screen.findByLabelText(/Citizenship Status/i);
    await user.click(statusSelect);
    const citizenOption = await screen.findByText(/^Citizen$/i);
    await user.click(citizenOption);

    // The Spouse section should dynamically appear in the stepper
    expect(await screen.findByText("Spouse Information")).toBeInTheDocument();

    // Advance to the Spouse step (the wizard is linear, so it is not clickable yet)
    await goToNextStep(user);

    // Verify Spouse fields rendered
    expect(await screen.findByText("Spouse Details")).toBeInTheDocument();
    expect(screen.getByLabelText(/Spouse Full Name/i)).toBeInTheDocument();
  });
});
