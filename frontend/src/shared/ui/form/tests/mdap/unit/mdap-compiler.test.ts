import { describe, expect, it, vi } from "vitest";

import { compileEntityToFormDef } from "../../../utils/mdap-compiler";
import { SAMPLE_EMPLOYEE_MDAP_ENTITY } from "../fixtures/mdap-form.fixture";

describe("MDAP Form Compiler: Unit Suite", () => {
  it("compiles a 6-layer EntityDefinition into a runtime FormDefinition", () => {
    const formDef = compileEntityToFormDef(
      SAMPLE_EMPLOYEE_MDAP_ENTITY,
      "employee-form-01",
      "Save Employee"
    );

    expect(formDef.id).toBe("employee-form-01");
    expect(formDef.submitLabel).toBe("Save Employee");
    expect(formDef.sections).toHaveLength(2);
    expect(formDef.sections?.[0].title).toBe("Personal Information");
    expect(formDef.sections?.[1].title).toBe("Job Assignment");
  });

  it("correctly preserves all field metadata across compilation", () => {
    const formDef = compileEntityToFormDef(
      SAMPLE_EMPLOYEE_MDAP_ENTITY,
      "employee-form-02",
      "Submit"
    );

    const personalSection = formDef.sections?.find((s) => s.id === "personal_info");
    expect(personalSection).toBeDefined();

    const fullNameField = personalSection?.fields.find((f) => f.name === "fullName");
    expect(fullNameField).toBeDefined();
    expect(fullNameField?.type).toBe("text");
    expect(fullNameField?.required).toBe(true);
  });

  it("attaches behavior pipeline middleware to onSubmit handler", async () => {
    const middleware1 = vi.fn(async (data: any) => data);
    const middleware2 = vi.fn(async (data: any) => data);

    const entityWithMiddleware = {
      ...SAMPLE_EMPLOYEE_MDAP_ENTITY,
      behavior: {
        ...SAMPLE_EMPLOYEE_MDAP_ENTITY.behavior,
        pipeline: {
          middleware: [middleware1, middleware2],
        },
      },
    };

    const formDef = compileEntityToFormDef(
      entityWithMiddleware,
      "middleware-test-form",
      "Submit"
    );

    expect(formDef.events?.onSubmit).toBeDefined();

    const testPayload = { fullName: "John Doe", email: "john@example.com" };
    await formDef.events?.onSubmit?.(testPayload as any);

    expect(middleware1).toHaveBeenCalledTimes(1);
    expect(middleware1).toHaveBeenCalledWith(testPayload);
    expect(middleware2).toHaveBeenCalledTimes(1);
    expect(middleware2).toHaveBeenCalledWith(testPayload);
  });

  it("handles minimal entities with omitted surface and presentation layers", () => {
    const minimalEntity = {
      id: "minimal-entity",
      name: "Minimal",
      content: {
        id: "min-content",
        title: "Minimal Form",
        sections: [
          {
            id: "sec1",
            title: "General",
            fields: [
              { id: "f1", name: "title", type: "text", label: "Title" },
            ],
          },
        ],
      },
    };

    const formDef = compileEntityToFormDef(
      minimalEntity as any,
      "min-form",
      "Send"
    );

    expect(formDef.id).toBe("min-form");
    expect(formDef.sections).toHaveLength(1);
    expect(formDef.sections?.[0].fields).toHaveLength(1);
  });
});
