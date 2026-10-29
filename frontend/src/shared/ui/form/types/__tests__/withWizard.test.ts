import { describe, expect, it } from "vitest";

import {
  defineFormContract,
  withWizard,
  type FormDefinitionContract,
} from "../contract";

const base = defineFormContract({
  id: "wizard-contract",
  title: "Wizard Contract",
  sections: [
    {
      id: "step-1",
      title: "Step 1",
      fields: [
        { id: "name", name: "name", type: "string" as const, label: "Name" },
      ],
    },
    {
      id: "step-2",
      title: "Step 2",
      fields: [
        { id: "age", name: "age", type: "number" as const, label: "Age" },
      ],
    },
  ],
});

describe("withWizard", () => {
  it("stamps settings.wizard.enabled=true on the contract", () => {
    const contract = withWizard()(base);
    const wizard = contract.settings?.wizard as Record<string, unknown>;
    expect(wizard.enabled).toBe(true);
  });

  it("merges stepper config into settings.wizard", () => {
    const contract = withWizard({ stepperType: "top", linear: false })(base);
    const wizard = contract.settings?.wizard as Record<string, unknown>;
    expect(wizard.stepperType).toBe("top");
    expect(wizard.linear).toBe(false);
    expect(wizard.enabled).toBe(true);
  });

  it("preserves existing settings and can set an explicit initial step", () => {
    const source: FormDefinitionContract<any> = {
      ...base,
      settings: { layoutMode: "split" } as any,
    };
    const contract = withWizard({ initialStepId: "step-2" })(source);
    const settings = contract.settings as Record<string, any>;
    expect(settings.layoutMode).toBe("split");
    expect((settings.wizard as Record<string, unknown>).initialStepId).toBe(
      "step-2"
    );
  });

  it("does not mutate the input contract", () => {
    const input: FormDefinitionContract<any> = { ...base };
    withWizard()(input);
    expect(input.settings?.wizard).toBeUndefined();
  });

  it("leaves the rest of the contract untouched", () => {
    const contract = withWizard()(base);
    expect(contract.id).toBe("wizard-contract");
    expect(contract.sections?.[0].fields?.[0].name).toBe("name");
  });
});