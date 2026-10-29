import { describe, expect, it, vi } from "vitest";

import { FormDriver } from "@testing/drivers/FormDriver";
import { compileEntityToFormDef } from "../../../utils/mdap-compiler";
import {
  SAMPLE_EMPLOYEE_MDAP_ENTITY,
  type EmployeeOnboardingFormModel,
} from "../fixtures/mdap-form.fixture";

describe("MDAP Form: Gray-Box Feature Workflow", () => {
  it("compiles MDAP entity, operates through Driver, and verifies submit pipeline execution", async () => {
    let capturedSubmission: EmployeeOnboardingFormModel | null = null;

    // 1. Define behavioral pipeline middleware
    const persistMiddleware = vi.fn(async (payload: EmployeeOnboardingFormModel) => {
      capturedSubmission = payload;
    });

    const testEntity = {
      ...SAMPLE_EMPLOYEE_MDAP_ENTITY,
      behavior: {
        ...SAMPLE_EMPLOYEE_MDAP_ENTITY.behavior,
        pipeline: {
          middleware: [persistMiddleware],
        },
      },
    };

    // 2. Compile MDAP entity to runtime FormDefinition
    const formDef = compileEntityToFormDef(
      testEntity,
      "employee-graybox-form",
      "Complete Onboarding"
    );

    // 3. Render through FormDriver
    const { driver } = await FormDriver.render(formDef);

    // 4. Driver operates through standard UI interfaces
    await driver.fill("fullName", "Jane Doe");
    await driver.fill("email", "jane.doe@enterprise.org");
    await driver.fill("department", "Engineering");
    await driver.fill("role", "Lead Systems Architect");
    await driver.fill("baseSalary", "150000");

    // 5. Submit form
    await driver.submit();

    // 6. Gray-box assertion on architectural contract
    expect(persistMiddleware).toHaveBeenCalledTimes(1);
    expect(capturedSubmission).toMatchObject({
      fullName: "Jane Doe",
      email: "jane.doe@enterprise.org",
      role: "Lead Systems Architect",
    });
  });

  it("blocks submission and shows validation feedback when required fields are missing", async () => {
    const persistMiddleware = vi.fn();
    const testEntity = {
      ...SAMPLE_EMPLOYEE_MDAP_ENTITY,
      behavior: {
        ...SAMPLE_EMPLOYEE_MDAP_ENTITY.behavior,
        pipeline: { middleware: [persistMiddleware] },
      },
    };

    const formDef = compileEntityToFormDef(
      testEntity,
      "employee-invalid-form",
      "Submit"
    );

    const { driver } = await FormDriver.render(formDef);

    // Attempt submit with empty form
    await driver.submit();

    // Verify submit middleware was not called
    expect(persistMiddleware).not.toHaveBeenCalled();
    await driver.expectValidationFailure();
  });

  it("verifies field values synchronise properly within compiled MDAP sections", async () => {
    const formDef = compileEntityToFormDef(
      SAMPLE_EMPLOYEE_MDAP_ENTITY,
      "employee-values-form",
      "Save"
    );

    const { driver } = await FormDriver.render(formDef);

    await driver.fill("fullName", "Alex Morgan");
    await driver.expectValue("fullName", "Alex Morgan");
  });
});
