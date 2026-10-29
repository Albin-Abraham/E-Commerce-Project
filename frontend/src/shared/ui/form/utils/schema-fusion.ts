import type { RawFormField, RawFormSection } from "@ui/form/fields";
import type {
  FormDefinition,
  FormUIConfig,
  FormUIFieldConfig,
} from "@ui/form/types";

/**
 * Schema Fusion Logic
 *
 * Implements the Data-Centric Style (DCS) by separating logical structure
 * from visual branding. This utility "fuses" a skeletal form definition with
 * a UI configuration object.
 *
 * Canonical UI shape (react-vite):
 *   { fields, sections, layout, settings }
 *
 * Legacy hospital shape (accepted, not required at call sites):
 *   { fieldConfig: { name: { gridColumn: "span 1" } }, layout: { type: "grid", columns: 2 } }
 */

/** @deprecated Use FormUIConfig — kept so existing fuseSchema call sites type-check. */
export type UIConfiguration = FormUIConfig;

const CANONICAL_GRID_COLUMNS = 12;

function resolveLayoutColumns(layout: FormUIConfig["layout"]): number {
  if (layout && typeof layout === "object" && "columns" in layout) {
    const columns = Number((layout as { columns?: number }).columns);
    return columns > 0 ? columns : CANONICAL_GRID_COLUMNS;
  }
  return CANONICAL_GRID_COLUMNS;
}

function parseSpanToken(gridColumn: unknown): number | undefined {
  if (typeof gridColumn === "number" && Number.isFinite(gridColumn)) {
    return gridColumn;
  }
  if (typeof gridColumn !== "string") return undefined;
  const match = gridColumn.match(/span\s+(\d+)/i);
  return match ? Number(match[1]) : undefined;
}

function toCanonicalColumnSpan(cssSpan: number, layoutColumns: number): number {
  if (layoutColumns === CANONICAL_GRID_COLUMNS) {
    return Math.min(CANONICAL_GRID_COLUMNS, Math.max(1, cssSpan));
  }
  return Math.min(
    CANONICAL_GRID_COLUMNS,
    Math.max(1, Math.round((cssSpan / layoutColumns) * CANONICAL_GRID_COLUMNS))
  );
}

function toSectionLayout(
  layout: FormUIConfig["layout"]
): Record<string, any> | undefined {
  if (!layout) return undefined;
  if (typeof layout === "string") {
    return layout === "grid"
      ? { type: "grid", columns: CANONICAL_GRID_COLUMNS }
      : { type: layout };
  }
  const { columns, ...rest } = layout as {
    type?: string;
    columns?: number;
    [key: string]: any;
  };
  return {
    ...rest,
    type: rest.type || "grid",
    columns: CANONICAL_GRID_COLUMNS,
  };
}

function canonicalizeFieldEntry(
  raw: FormUIFieldConfig,
  layoutColumns: number
): FormUIFieldConfig {
  const { gridColumn, layout, properties, meta, fields, ...rest } = raw;
  const cssSpan = parseSpanToken(gridColumn);
  const columnSpan = cssSpan
    ? toCanonicalColumnSpan(cssSpan, layoutColumns)
    : undefined;

  const nestedFields = fields
    ? Object.fromEntries(
        Object.entries(fields).map(([key, value]) => [
          key,
          canonicalizeFieldEntry(value, layoutColumns),
        ])
      )
    : undefined;

  return {
    ...rest,
    layout: {
      ...(typeof layout === "object" && layout ? layout : {}),
      ...(columnSpan ? { columnSpan } : {}),
    },
    properties: {
      ...rest,
      ...properties,
    },
    meta,
    ...(nestedFields ? { fields: nestedFields } : {}),
  };
}

/**
 * Rewrites legacy hospital UI overlays into the canonical fusion contract
 * so domain files do not need to change.
 */
export function normalizeUIConfig(uiConfig: FormUIConfig): FormUIConfig {
  const layoutColumns = resolveLayoutColumns(uiConfig.layout);

  const legacyFields = uiConfig.fieldConfig
    ? Object.fromEntries(
        Object.entries(uiConfig.fieldConfig).map(([key, value]) => [
          key,
          canonicalizeFieldEntry(value, layoutColumns),
        ])
      )
    : undefined;

  const canonicalFields = uiConfig.fields
    ? Object.fromEntries(
        Object.entries(uiConfig.fields).map(([key, value]) => [
          key,
          canonicalizeFieldEntry(value, layoutColumns),
        ])
      )
    : undefined;

  const fields = {
    ...legacyFields,
    ...canonicalFields,
  };

  const sections = uiConfig.sections
    ? Object.fromEntries(
        Object.entries(uiConfig.sections).map(([sectionId, section]) => {
          const sectionFields = section.fields
            ? Object.fromEntries(
                Object.entries(section.fields).map(([key, value]) => [
                  key,
                  canonicalizeFieldEntry(value, layoutColumns),
                ])
              )
            : undefined;
          return [sectionId, { ...section, fields: sectionFields }];
        })
      )
    : undefined;

  return {
    ...uiConfig,
    fields: Object.keys(fields).length > 0 ? fields : undefined,
    sections,
  };
}

/**
 * fuseSchema
 * Joins a logical form definition with a UI configuration mapping.
 *
 * @example
 * ```ts
 * const schema = fuseSchema(logicalSkeleton, {
 *   settings: { density: "compact" },
 *   sections: {
 *     personal: {
 *       layout: { type: "card" },
 *       fields: {
 *         fullName: { properties: { placeholder: "Full Name" } },
 *       },
 *     },
 *   },
 * });
 * ```
 */
export function fuseSchema<T extends Record<string, any> = Record<string, any>>(
  skeleton: FormDefinition<T>,
  uiConfig: UIConfiguration
): FormDefinition<T> {
  const normalized = normalizeUIConfig(uiConfig);
  const defaultSectionLayout = toSectionLayout(normalized.layout);

  const mergedSections = (skeleton.sections || []).map((section) => {
    const sectionUI = section.id
      ? normalized.sections?.[section.id]
      : undefined;

    const sectionFieldsMap = {
      ...normalized.fields,
      ...sectionUI?.fields,
    };

    const mergedSection: RawFormSection<T> = {
      ...section,
      layout: sectionUI?.layout ?? section.layout ?? defaultSectionLayout,
      meta: {
        ...section.meta,
        ...sectionUI?.meta,
      },
    };

    if (mergedSection.fields) {
      mergedSection.fields = mergedSection.fields.map((field) =>
        fuseField(field, sectionFieldsMap)
      );
    }

    return mergedSection;
  });

  return {
    ...skeleton,
    layout: normalized.layout ?? skeleton.layout,
    containers: normalized.containers ?? skeleton.containers,
    shell: normalized.shell ?? skeleton.shell,
    settings: {
      ...skeleton.settings,
      ...normalized.settings,
    },
    style: {
      ...skeleton.style,
      ...normalized.style,
    },
    sections: mergedSections,
  };
}

/**
 * Recursively fuses field logic with UI branding.
 * Looks up field UI config by `field.name || field.id || field.key`.
 */
function fuseField<T extends Record<string, any> = Record<string, any>>(
  field: RawFormField<any, any, T>,
  sectionFieldsMap?: Record<string, FormUIFieldConfig>
): RawFormField<any, any, T> {
  const lookupKey = field.name || (field.id as string) || (field.key as string);
  const fieldUI = sectionFieldsMap?.[lookupKey];

  const mergedLayout = {
    ...(typeof field.layout === "object" && field.layout ? field.layout : {}),
    ...(typeof fieldUI?.layout === "object" && fieldUI.layout
      ? fieldUI.layout
      : {}),
  };

  const mergedField: RawFormField<any, any, T> = {
    ...field,
    layout: Object.keys(mergedLayout).length > 0 ? mergedLayout : field.layout,
    properties: {
      ...field.properties,
      ...fieldUI?.properties,
    },
    meta: {
      ...field.meta,
      ...fieldUI?.meta,
    },
  };

  if (field.fields?.length) {
    mergedField.fields = field.fields.map((child) =>
      fuseField(child, fieldUI?.fields)
    );
  }

  return mergedField;
}
