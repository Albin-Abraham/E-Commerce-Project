import type { BehaviorDefinition } from "../types/behavior";
import type { EntityDefinition } from "../types/application";
import type { FormDefinition } from "../types";
import type { FormLayerModel } from "../types/contract";
import type { PresentationDefinition } from "../types/presentation";
import type { SurfaceDefinition } from "../types/surface";
import { compileEntityToFormDef } from "./mdap-compiler";

/**
 * @file project-layers.ts
 *
 * Projects the effective MDAP runtime layers from an authoring source.
 *
 * This is the Phase A anti-flattening boundary:
 * - `EntityDefinition` → layers are read directly from the authored 6-layer model.
 * - `FormDefinitionContract` / flat `FormDefinition` → layers are projected
 *   best-effort from the compiled definition (content is authoritative).
 *
 * In Phase B the engine consumes these layers directly; this projector becomes
 * the internal compile step only.
 */

function projectFromDefinition<TFormData extends Record<string, any>>(
  definition: FormDefinition<TFormData>
): FormLayerModel<TFormData> {
  const settings = definition.settings as Record<string, any> | undefined;

  const surface: SurfaceDefinition = {
    ui: {
      target: "screen",
      ...(settings?.density ? { density: settings.density } : {}),
      ...(settings?.widgetWidth
        ? { width: settings.widgetWidth }
        : settings?.width
          ? { width: settings.width }
          : {}),
      ...(settings?.maxHeight ? { maxHeight: settings.maxHeight } : {}),
      ...(settings?.stickyHeader ? { stickyHeader: true } : {}),
      ...(settings?.stickyFooter ? { stickyFooter: true } : {}),
      ...(settings?.wizard ? { wizard: settings.wizard } : {}),
    },
  };

  const behavior: BehaviorDefinition<TFormData> = {
    ...(definition.events ? { events: definition.events } : {}),
    ...(definition.pipeline ? { pipeline: definition.pipeline as any } : {}),
  };

  const presentation: PresentationDefinition = {
    ...(definition.style ? { style: definition.style as any } : {}),
  };

  return { content: definition, behavior, surface, presentation };
}

export function projectLayers<TFormData extends Record<string, any>>(
  source:
    | EntityDefinition<TFormData>
    | FormDefinition<TFormData>
): FormLayerModel<TFormData> {
  if (source && (source as EntityDefinition<TFormData>).forms !== undefined) {
    const entity = source as EntityDefinition<TFormData>;
    return {
      content: compileEntityToFormDef(
        entity,
        entity.content?.id || entity.id || "mdap_form",
        "Submit"
      ),
      behavior: entity.behavior,
      surface: entity.surface,
      presentation: entity.presentation,
    };
  }

  return projectFromDefinition(source as FormDefinition<TFormData>);
}