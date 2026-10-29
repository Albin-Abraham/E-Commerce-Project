import { describe, it } from "vitest";

import { FormDriver } from "@testing/drivers/FormDriver";
import { compileEntityToFormDef } from "../../../utils/mdap-compiler";
import { SAMPLE_EMPLOYEE_MDAP_ENTITY } from "../fixtures/mdap-form.fixture";

describe("MDAP Form: Accessibility Audit (A11y)", () => {
  it("passes automated WCAG / axe-core audits on initial render", async () => {
    const formDef = compileEntityToFormDef(
      SAMPLE_EMPLOYEE_MDAP_ENTITY,
      "employee-a11y-form",
      "Submit Onboarding"
    );

    const { driver } = await FormDriver.render(formDef);

    // Automated axe-core accessibility verification (heading-order disabled for isolated form fragments)
    await driver.expectAccessible({
      rules: { "heading-order": { enabled: false } },
    });
  });

  it("maintains accessibility compliance after field interaction and value population", async () => {
    const formDef = compileEntityToFormDef(
      SAMPLE_EMPLOYEE_MDAP_ENTITY,
      "employee-a11y-populated",
      "Submit"
    );

    const { driver } = await FormDriver.render(formDef);

    await driver.fill("fullName", "Samantha Vance");
    await driver.fill("email", "sam.vance@company.com");

    await driver.expectAccessible({
      rules: { "heading-order": { enabled: false } },
    });
  });
});
