import { schemaRegistry } from "@form-core/SchemaRegistry";
import type { FormDefinition } from "@ui/form/types";
import type { EntityDefinition } from "@ui/form/types/application";
import { fuseSchema } from "@ui/form/utils/schema-fusion";

import { BranchValidationRules } from "../validations/branch-rules";
import { buildBranchEntity } from "./branch-logical";

export type { BranchFormData } from "./branch-logical";

/**
 * ── TRUE MDAP COMPILER ───────────────────────────────────────────────────────
 *
 * Consumes a complete 6-Layer MDAP Entity (Content, Behavior, Surface, Presentation)
 * and compiles it down into a flattened runtime FormDefinition.
 */
export function compileEntityToFormDef<T extends Record<string, any>>(
  entity: EntityDefinition<T>,
  formId: string,
  submitLabel: string
): FormDefinition<T> {
  const content = entity.content;
  const behavior = entity.behavior;
  const surface = entity.surface?.ui as any;
  const presentation = entity.presentation;

  // 1. Apply Behavior Pipeline Middleware, Conditions & Events
  const fieldsWithBehavior = (content.sections || []).map((section) => ({
    ...section,
    fields: (section.fields ?? []).map((field: any) => {
      const rules =
        BranchValidationRules.events[
          field.name as keyof typeof BranchValidationRules.events
        ];
      const condition = behavior?.rules?.find(
        (r) => r.targetField === field.name
      );
      return {
        ...field,
        meta: {
          ...field.meta,
          events: {
            ...(field.meta?.events || {}),
            ...(rules || {}),
          },
        },
        conditions: condition
          ? (BranchValidationRules.conditions as any)[condition.condition]
          : field.conditions,
      };
    }),
  }));

  const flatContent = { ...content, sections: fieldsWithBehavior };

  // 2. Map MDAP Surface & Presentation to the Fusion Engine
  const uiConfig = {
    shell: surface?.shell,
    settings: {
      layoutMode: surface?.layoutMode || "dashboard",
      density: surface?.density,
      width: surface?.width,
      wizard: surface?.wizard,
      maxHeight: surface?.maxHeight,
      hideHeader: surface?.hideHeader,
    },
    style: presentation?.style,
  };

  // 3. Compile everything down to a standard FormDefinition
  const compiledForm = fuseSchema(flatContent as any, uiConfig);
  compiledForm.id = formId;
  compiledForm.submitLabel = submitLabel;
  compiledForm.cancelLabel = "Save Draft";
  compiledForm.customData = { successMessage: "Branch Deployed Successfully!" };

  // Attach the behavior middleware so the FormCore can execute it on submit
  if (behavior?.pipeline?.middleware) {
    compiledForm.events = {
      ...compiledForm.events,
      onSubmit: async (data: any) => {
        behavior.pipeline!.middleware!.forEach((mw: any) => mw(data));
      },
    };
  }

  return compiledForm as FormDefinition<T>;
}

export const buildBranchSchema = () =>
  compileEntityToFormDef(
    buildBranchEntity(),
    "create-branch",
    "Deploy Infrastructure"
  );

// Auto-register so dynamic hooks can find it
schemaRegistry.register("create-branch", buildBranchSchema as any);
