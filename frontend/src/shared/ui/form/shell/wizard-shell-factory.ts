import type { FormDefinition } from "../types";
import type { ShellNode } from "../types/layout";

export function generateDefaultWizardShell(
  definition: FormDefinition
): ShellNode[] {
  const wizardSettings = (definition.settings as any)?.wizard || {};
  const stepperType = wizardSettings.stepperType || "sidebar";

  if (stepperType === "sidebar") {
    return [
      {
        node: "layout",
        type: "grid",
        config: { columns: 12 },
        className: "gap-[var(--space-8)] w-full",
        children: [
          {
            node: "content",
            type: "stepper",
            colSpan: { base: 12, lg: 3 },
          } as any,
          {
            node: "content",
            type: "form-steps",
            colSpan: { base: 12, lg: 9 },
          } as any,
        ],
      },
    ];
  }

  // Top Stepper
  return [
    {
      node: "layout",
      type: "grid",
      config: { columns: 12 },
      className: "w-full",
      children: [
        {
          node: "content",
          type: "stepper",
          colSpan: 12,
        } as any,
        {
          node: "content",
          type: "form-steps",
          colSpan: 12,
        } as any,
      ],
    },
  ];
}
