import type { FormDefinition, FormField } from "@ui/form/types";
import type { RuntimeLayoutConfig } from "@ui/form/types/layout";

import {
  getDeterministicId,
  resolveFieldIdentity,
} from "./normalization-utils";

/**
 * SchemaNormalizer - Sanitizes and transforms raw schemas into a predictable internal format.
 *
 * DESIGN PATTERN: Buffer/Normalization Layer
 * Ensures the rendering engine (FormComposer) only ever deals with a clean FormField[] tree.
 *
 * NOTE: This produces a tree (FormField[]) for the UI renderer.
 * The engine uses a separate normalization (normalizeFormDefinition) that produces
 * flat O(1) maps for state lookups. Both share identity resolution via normalization-utils.
 */
export class SchemaNormalizer {
  private static readonly ALLOWED_LAYOUT_KEYS = new Set([
    "type",
    "gridClass",
    "fullWidth",
    "columnSpan",
    "rowSpan",
    "rowStart",
    "colStart",
    "startNewRow",
    "responsive",
    "columns",
    "gap",
    "direction",
    "wrap",
    "align",
    "justify",
    "variant",
    "defaultOpen",
    "elevation",
    "wrapOuter",
    "span",
    "width",
  ]);

  private static readonly ALLOWED_PROPERTIES_KEYS = new Set([
    "typography",
    "labelPlacement",
    "borderRadius",
    "width",
    "startNewRow",
    "alignment",
    "customClasses",
    "placeholder",
    "intent",
    "classNames",
    "marginTop",
    "marginBottom",
    "margin",
    "padding",
    "backgroundColor",
    "border",
    "elevation",
    "footer",
    "footerContent",
    "options",
    "tooltip",
    "slotPlacement",
    "tooltipPlacement",
    "display",
    "gridCols",
    "columns",
    "gap",
    "autoFocus",
    "description",
    "reserveErrorSpace",
    "length",
    "size",
    "min",
    "max",
    "step",
    "ariaKeyShortcuts",
    "aria-keyshortcuts",
    "direction",
    "orientation",
    "startContent",
    "endContent",
    "leftContent",
    "rightContent",
    "prefix",
    "suffix",
    "icon",
    "leftIcon",
    "rightIcon",
  ]);

  private static readonly ALLOWED_META_KEYS = new Set([
    "events",
    "options",
    "performance",
    "accessibility",
    "security",
    "history",
    "computed",
    "reactiveValue",
    "conditions",
    "i18n",
    "category",
    "ui",
  ]);

  private static readonly ALLOWED_COMPONENT_PROPS_KEYS = new Set([
    "className",
    "style",
    "placeholder",
    "disabled",
    "readOnly",
    "required",
    "autoComplete",
    "rows",
    "maxLength",
    "minLength",
    "min",
    "max",
    "step",
    "type",
    "options",
    "direction",
    "orientation",
    "startContent",
    "endContent",
    "leftContent",
    "rightContent",
    "prefix",
    "suffix",
    "icon",
    "leftIcon",
    "rightIcon",
    "ariaKeyShortcuts",
    "aria-keyshortcuts",
  ]);

  private static warnUnknownKeys(
    entityId: string,
    bucket: string,
    value: Record<string, any> | undefined,
    allowList: Set<string>
  ) {
    if (!value || process.env.NODE_ENV === "production") return;

    Object.keys(value).forEach((key) => {
      if (!allowList.has(key)) {
        console.warn(
          `[SchemaNormalizer] Unknown ${bucket} key "${key}" for field "${entityId}".`
        );
      }
    });
  }

  private static readonly STRUCTURAL_FIELD_TYPES = new Set([
    "card",
    "container",
    "accordion",
    "fieldset",
    "group",
    "tabs",
    "steps",
    "block",
  ]);

  private static resolveCanonicalLayout(
    field: Record<string, any>
  ): RuntimeLayoutConfig {
    if (field.layout) return field.layout;

    const props = field.properties || {};
    const fieldType = field.type as string;

    // For structural field types, respect the field type as layout type
    if (fieldType && this.STRUCTURAL_FIELD_TYPES.has(fieldType)) {
      return {
        type: fieldType,
        columns: Number(props.columns || props.gridCols || 12),
        gap: props.gap || 4,
      } as any;
    }

    if (props.display === "grid" || props.gridCols || props.columns) {
      return {
        type: "grid",
        columns: Number(props.columns || props.gridCols || 12),
        gap: props.gap || 4,
      };
    }

    return field.customData?.originalLayout || {};
  }
  /**
   * Main entry point for normalization.
   * Converts a FormDefinition into a hierarchical FormField[] tree.
   */
  public static normalize(definition: FormDefinition<any>): FormField[] {
    if (!definition) return [];

    // 1. Handle legacy "sections" format and root-level "fields"
    const sections = definition.sections || [];
    const rootFields = definition.fields || [];

    // 2. Map sections, containers and root fields to internal field tree
    return [
      ...sections.map((section, index) =>
        this.normalizeSection(section, `section:${index}`)
      ),
      ...this.normalizeContainers(definition.containers || []),
      ...rootFields.map((field, index) =>
        this.normalizeField(field, `rootField:${index}`)
      ),
    ];
  }

  /**
   * Scans structural containers (Split/Hero) for inline field definitions.
   */
  private static normalizeContainers(containers: any[]): FormField[] {
    const fields: FormField[] = [];
    containers.forEach((container, containerIndex) => {
      const config = container.config || {};
      // Handle Split Layout Panes
      [config.leftContent, config.rightContent].forEach((pane, paneIndex) => {
        if (pane?.type === "container" && pane.fields) {
          pane.fields.forEach((field: FormField, fieldIndex: number) => {
            fields.push(
              this.normalizeField(
                field,
                `container:${containerIndex}:pane:${paneIndex}:field:${fieldIndex}`
              )
            );
          });
        }
      });
      // Handle Generic Container Fields
      if (container.fields) {
        container.fields.forEach((field: FormField, fieldIndex: number) => {
          fields.push(
            this.normalizeField(
              field,
              `container:${containerIndex}:field:${fieldIndex}`
            )
          );
        });
      }
    });
    return fields;
  }

  /**
   * Decouples FormSection from the rendering logic by treating it as a 'section' field.
   */
  private static normalizeSection(
    section: import("@ui/form/fields").RawFormSection,
    path = "section:0"
  ): FormField {
    const layoutType = (section.layout?.type as string) || undefined;
    const type =
      layoutType === "card" ||
      layoutType === "accordion" ||
      layoutType === "tabs" ||
      layoutType === "fieldset"
        ? layoutType
        : "section";
    const sectionId =
      section.id ||
      section.key ||
      getDeterministicId(`${path}:${section.title || ""}`);
    const children: FormField[] = [];

    // 1. Normalize direct fields
    if (section.fields) {
      const sectionProps = section.properties || {};
      section.fields.forEach((field, index) => {
        if (sectionProps.labelPlacement && !field.properties?.labelPlacement) {
          field.properties = {
            ...field.properties,
            labelPlacement: sectionProps.labelPlacement,
          };
        }
        children.push(this.normalizeField(field, `${path}:field:${index}`));
      });
    }

    // 2. Recursively normalize sub-sections
    if (Array.isArray(section.subSections)) {
      section.subSections.forEach((sub, index) => {
        children.push(this.normalizeSection(sub, `${path}:sub:${index}`));
      });
    }

    // 3. Assemble the structural field
    return {
      id: sectionId,
      name: sectionId,
      type: type as any,
      label: section.title || "",
      description: section.description,
      fields: children,
      layout: section.layout,
      visible: section.visible,
      enabled: section.enabled,
      // Metadata passthrough for styling
      customData: {
        originalLayout: section.layout,
        originalSection: section,
        description: section.description,
        defaultOpen: (section.layout as { defaultOpen?: boolean } | undefined)
          ?.defaultOpen,
      },
      meta: {
        ...section.meta,
        ui: {
          variant: (section.layout as any)?.variant,
        },
      },
    };
  }

  /**
   * Sanitizes individual fields, injecting defaults where necessary.
   * NEW: Handles ECS Composite Expansion.
   */
  private static normalizeField(
    field: import("@ui/form/fields").RawFormField,
    path = "field:0"
  ): FormField {
    const normalizedLayout = this.resolveCanonicalLayout(field);

    const { id: fieldId, name: fieldName } = resolveFieldIdentity(
      field as any,
      `${path}:${field.type || "unknown"}:${(field.label as string) || ""}`,
      { value: 0 }
    );

    this.warnUnknownKeys(
      fieldId,
      "layout",
      normalizedLayout,
      this.ALLOWED_LAYOUT_KEYS
    );
    this.warnUnknownKeys(
      fieldId,
      "properties",
      field.properties as Record<string, any>,
      this.ALLOWED_PROPERTIES_KEYS
    );
    this.warnUnknownKeys(
      fieldId,
      "meta",
      field.meta as Record<string, any>,
      this.ALLOWED_META_KEYS
    );
    this.warnUnknownKeys(
      fieldId,
      "componentProps",
      field.componentProps as Record<string, any>,
      this.ALLOWED_COMPONENT_PROPS_KEYS
    );

    const normalized: FormField = {
      ...field,
      id: fieldId,
      name: fieldName,
      properties: {
        labelPlacement: "top" as const,
        ...field.properties,
      },
      layout: normalizedLayout,
    } as FormField;

    // Recursively normalize children if they exist
    if (normalized.fields) {
      normalized.fields = normalized.fields.map((f, index) =>
        this.normalizeField(f as any, `${path}:child:${index}`)
      );
    }

    return normalized;
  }
}
