import { describe, expect, it } from "vitest";
import { createSimpleForm } from "../utils/createSimpleForm";

describe("createSimpleForm", () => {
  it("should create a valid FormDefinition with defaults", () => {
    const formDef = createSimpleForm<{ username: string; email: string }>({
      id: "quick-login",
      title: "Quick Login",
      fields: [
        { name: "username", label: "Username", required: true },
        { name: "email", label: "Email", type: "email" },
      ],
    });

    expect(formDef.id).toBe("quick-login");
    expect(formDef.title).toBe("Quick Login");
    expect(formDef.submitLabel).toBe("Submit");
    expect(formDef.sections).toHaveLength(1);
    expect(formDef.sections?.[0].fields).toHaveLength(2);

    const firstField = formDef.sections?.[0].fields?.[0];
    expect(firstField?.id).toBe("username");
    expect(firstField?.name).toBe("username");
    expect(firstField?.label).toBe("Username");
    expect(firstField?.required).toBe(true);
    expect((firstField?.layout as any)?.columnSpan).toBe(12);
  });

  it("should map component presentation override correctly", () => {
    const formDef = createSimpleForm<{ category: string }>({
      id: "category-form",
      fields: [
        {
          name: "category",
          type: "string",
          component: "select",
          options: [{ label: "Tech", value: "tech" }],
        },
      ],
    });

    const field = formDef.sections?.[0].fields?.[0];
    expect(field?.type).toBe("string");
    expect(field?.meta?.ui?.component).toBe("select");
  });

  it("should wire validationSchema and custom options", () => {
    const dummySchema = { safeParse: () => ({ success: true }) };
    const onSubmit = () => {};

    const formDef = createSimpleForm({
      id: "modal-form",
      density: "compact",
      shell: "modal",
      variant: "filled",
      submitLabel: "Confirm",
      validationSchema: dummySchema,
      onSubmit,
      fields: [{ name: "name", columnSpan: 6 }],
    });

    expect(formDef.settings?.density).toBe("compact");
expect(formDef.surface?.ui?.shell).toBe("modal");
expect((formDef.presentation?.style as any)?.variant).toBe("filled");
expect(formDef.submitLabel).toBe("Confirm");
expect((formDef.validation as any)?.schema).toBe(dummySchema);
expect(formDef.events?.onSubmit).toBe(onSubmit);
expect((formDef.sections?.[0].fields?.[0].layout as any)?.columnSpan).toBe(6);
  });
});
