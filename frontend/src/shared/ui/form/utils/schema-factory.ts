import { schemaRegistry } from "@form-core/SchemaRegistry";
import type { FormDefinition, FormUIConfig } from "@ui/form/types";
import type { EntityDefinition } from "@ui/form/types/application";
import type { UIScreenSurface } from "@ui/form/types/surface";

import { type UIConfiguration, fuseSchema } from "./schema-fusion";

/**
 * createFormDefinition — one-shot fuse of a logical skeleton and a UI overlay.
 *
 * ViewModels should call this instead of fuseSchema directly so formId
 * registration and future compile steps stay in one place.
 */
export function createFormDefinition<
  T extends Record<string, any> = Record<string, any>,
>(
  skeleton: FormDefinition<T>,
  uiConfig: FormUIConfig = {},
  options: { formId?: string } = {}
): FormDefinition<T> {
  const definition = fuseSchema(skeleton, uiConfig) as FormDefinition<T>;
  if (options.formId) {
    definition.id = options.formId;
    schemaRegistry.register(options.formId, () => definition as never);
  }
  return definition;
}

/**
 * compileEntityToFormDef — MDAP compiler (react-vite reference).
 *
 * Flattens Content + Behavior + Surface + Presentation into a runtime
 * FormDefinition. Domain modules supply the entity; this stays in core.
 */
export function compileEntityToFormDef<
  T extends Record<string, any> = Record<string, any>,
>(
  entity: EntityDefinition<T>,
  options: {
    formId: string;
    submitLabel?: string;
    cancelLabel?: string;
    register?: boolean;
  }
): FormDefinition<T> {
  const content = entity.content;
  const behavior = entity.behavior;
  const surface = entity.surface?.ui;
  const presentation = entity.presentation;

  const skeleton: FormDefinition<T> = {
    id: options.formId,
    title: content.title ?? entity.name,
    description: content.description,
    sections: (content.sections || []) as FormDefinition<T>["sections"],
    fields: content.fields as FormDefinition<T>["fields"],
    validation: content.validation,
    events: behavior?.events,
    pipeline: behavior?.pipeline,
    submitLabel: options.submitLabel,
    cancelLabel: options.cancelLabel,
  };

  const screen = surface as UIScreenSurface | undefined;
  const uiConfig: FormUIConfig = {
    shell: screen?.shell,
    containers: screen?.containers,
    settings: {
      density: screen?.density,
      width: screen?.width,
      maxHeight: screen?.maxHeight,
      stickyHeader: screen?.stickyHeader,
      stickyFooter: screen?.stickyFooter,
      wizard: screen?.wizard,
    },
    style: presentation?.style,
  };

  const compiled = fuseSchema(skeleton, uiConfig) as FormDefinition<T>;

  if (behavior?.pipeline?.middleware?.length) {
    const middleware = behavior.pipeline.middleware;
    const existingSubmit = compiled.events?.onSubmit;
    compiled.events = {
      ...compiled.events,
      onSubmit: async (data: T) => {
        for (const mw of middleware) {
          await mw(data);
        }
        await existingSubmit?.(data);
      },
    };
  }

  if (options.register !== false) {
    schemaRegistry.register(options.formId, () => compiled as never);
  }

  return compiled;
}

/**
 * createSchemaFactory — single vertical entry point for defining a form.
 *
 * Collapses the repeated per-form plumbing (fuseSchema + generic cast +
 * schemaRegistry.register) into one call, so adding a form is a one-liner
 * instead of N horizontal copies of the same merge code.
 */
export function createSchemaFactory<
  T extends Record<string, any>,
  P extends unknown[] = [],
>(
  skeleton: FormDefinition<T>,
  ui: (...args: P) => UIConfiguration,
  options: {
    formId?: string;
    /** Pre-fusion transform (e.g. hydrate events/conditions onto fields). */
    transform?: (skeleton: FormDefinition<T>) => FormDefinition<T>;
  } = {}
): (...args: P) => FormDefinition {
  const build = (...args: P): FormDefinition => {
    const base = options.transform ? options.transform(skeleton) : skeleton;
    return fuseSchema(base, ui(...args)) as FormDefinition;
  };

  if (options.formId) {
    schemaRegistry.register(options.formId, build as never);
  }

  return build;
}
