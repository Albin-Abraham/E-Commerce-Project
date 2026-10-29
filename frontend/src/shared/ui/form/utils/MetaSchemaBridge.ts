import type { RawFormField, RawFormSection } from "@ui/form/fields";
import type { FormDefinition, RenderDefinition } from "@ui/form/types";
import type { TableColumn, TableColumnMeta } from "@ui/table/types";

/**
 * HeaderMetaSchemaField
 *
 * Defines the generic shape of an individual field/column in a dynamic API metaSchema.
 */
export interface HeaderMetaSchemaField {
  name: string;
  type:
    | "text"
    | "number"
    | "email"
    | "password"
    | "textarea"
    | "select"
    | "checkbox"
    | "switch"
    | "date"
    | "string"
    | "boolean"
    | "slot"
    | string;
  label?: string;
  title?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: any;
  options?: { label: string; value: any }[] | string[];
  validation?: any;
  gridCols?: number;
  width?: string | number;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  visible?: boolean;
  disabled?: boolean;
  group?: string; // Group fields into logical form sections
}

/**
 * HeaderMetaSchema
 *
 * Defines a dynamic, dynamic metadata schema structure returned from databases or APIs.
 * The `id` and `title` fields are optional since form-wrapping parameters are not
 * required when mapping pure dynamic layouts.
 */
export interface HeaderMetaSchema {
  id?: string;
  title?: string;
  description?: string;
  fields:
    | HeaderMetaSchemaField[]
    | Record<string, Omit<HeaderMetaSchemaField, "name">>;
  settings?: any;
  layout?: any;
}

// RenderDefinition is imported centrally from @ui/form/types

/**
 * MetaSchemaBridge
 *
 * Bridges generic model schemas (the "header metaSchema") with the rendering components
 * (FormDefinition / RenderDefinition for forms, and TableColumn for high-density grids).
 */
export class MetaSchemaBridge {
  /**
   * Compiles the dynamic fields of a HeaderMetaSchema directly into normalized, DCS-fused fields.
   *
   * Supports injecting custom React components or custom elements directly into
   * matching slot field IDs or field names.
   */
  static compileToFields<T extends Record<string, any>>(
    metaSchema: HeaderMetaSchema,
    uiOverrides?: any,
    slots?: Record<string, any>
  ): RawFormField<any, any, T>[] {
    const { fields, id = "dynamic" } = metaSchema;

    const normalizedFields: HeaderMetaSchemaField[] = Array.isArray(fields)
      ? fields
      : Object.entries(fields).map(([name, field]) => ({
          name,
          ...field,
        }));

    return normalizedFields.map((f) => {
      // Map dynamic types to exact form primitives
      let fieldType = f.type || "text";
      if (fieldType === "string") fieldType = "text";
      if (fieldType === "boolean") fieldType = "checkbox";

      // Normalize dynamic options
      let resolvedOptions: any[] | undefined = undefined;
      if (f.options) {
        resolvedOptions = f.options.map((opt) =>
          typeof opt === "string" ? { label: opt, value: opt } : opt
        );
      }

      const formField: RawFormField<any, any, T> = {
        id: `${id}_${f.name}`,
        name: f.name,
        label:
          f.label ||
          f.title ||
          f.name.charAt(0).toUpperCase() + f.name.slice(1),
        type: fieldType as any,
        initialValue: f.defaultValue,
        required: f.required,
        visible: f.visible !== false,
        enabled: f.disabled !== true,
        options: resolvedOptions,
        validation: f.validation,
        layout: {
          columnSpan: f.gridCols || 12,
        },
        properties: {
          placeholder: f.placeholder,
        },
      };

      // Merge visual UI/branding overrides if present (Data-Centric Styling support)
      if (uiOverrides?.fields?.[f.name]) {
        const override = uiOverrides.fields[f.name];
        Object.assign(formField, {
          ...override,
          layout: { ...formField.layout, ...override.layout },
          properties: { ...formField.properties, ...override.properties },
          meta: { ...formField.meta, ...override.meta },
        });
      }

      // Inject Slot Component/Node if matching slot key is provided
      if (slots?.[f.name] || slots?.[formField.id!]) {
        const slotComponent = slots[f.name] || slots[formField.id!];
        formField.type = "slot" as any;
        formField.meta = {
          ...formField.meta,
          ui: {
            ...formField.meta?.ui,
            component: slotComponent,
          },
        };
      }

      return formField;
    });
  }

  /**
   * Compiles the HeaderMetaSchema into a list of structured sections, perfectly aligned with DCS.
   */
  static compileToSections<T extends Record<string, any>>(
    metaSchema: HeaderMetaSchema,
    uiOverrides?: any,
    slots?: Record<string, any>
  ): RawFormSection<T>[] {
    const id = metaSchema.id || "dynamic";
    const fields = this.compileToFields<T>(metaSchema, uiOverrides, slots);

    const sectionMap: Record<string, RawFormField<any, any, T>[]> = {
      default: [],
    };

    // Reconstruct fields into their corresponding groups/sections
    fields.forEach((formField) => {
      const origField = Array.isArray(metaSchema.fields)
        ? metaSchema.fields.find((f) => f.name === formField.name)
        : (metaSchema.fields as Record<string, any>)[formField.name as string];

      const groupName = origField?.group || "default";

      if (!sectionMap[groupName]) {
        sectionMap[groupName] = [];
      }
      sectionMap[groupName].push(formField);
    });

    return Object.entries(sectionMap)
      .filter(([_, sectionFields]) => sectionFields.length > 0)
      .map(([groupName, sectionFields]) => {
        const overrideSection = uiOverrides?.sections?.[groupName];
        return {
          id: `${id}_section_${groupName}`,
          title:
            overrideSection?.title ||
            (groupName === "default"
              ? ""
              : groupName.charAt(0).toUpperCase() + groupName.slice(1)),
          layout: overrideSection?.layout || {
            type: "grid",
            columns: overrideSection?.columns || 12,
            gap: 6,
          },
          fields: sectionFields,
        };
      });
  }

  /**
   * Compiles a raw API metaSchema directly into a RenderDefinition.
   * A RenderDefinition is purely layout-oriented (sections, layout, styling, density)
   * and completely omits form identity details (id, title, description, buttons)
   * for pure structural field presentation.
   */
  static compileToRenderDefinition<T extends Record<string, any>>(
    metaSchema: HeaderMetaSchema,
    uiOverrides?: any,
    slots?: Record<string, any>
  ): RenderDefinition<T> {
    const { settings = {}, layout = "grid" } = metaSchema;
    const sections = this.compileToSections<T>(metaSchema, uiOverrides, slots);

    return {
      sections,
      layout: typeof layout === "string" ? layout : undefined,
      settings: {
        density: "comfortable",
        ...settings,
        ...uiOverrides?.settings,
      },
      style: uiOverrides?.style,
    };
  }

  /**
   * Compiles an API-provided HeaderMetaSchema directly into a canonical FormDefinition.
   */
  static compileToFormDefinition<T extends Record<string, any>>(
    metaSchema: HeaderMetaSchema,
    uiOverrides?: any,
    slots?: Record<string, any>
  ): FormDefinition<T> {
    const id =
      metaSchema.id ||
      `dynamic-form-${Math.random().toString(36).substr(2, 9)}`;
    const title = metaSchema.title || "";
    const { description, settings = {}, layout = "grid" } = metaSchema;

    const sections = this.compileToSections<T>(metaSchema, uiOverrides, slots);

    return {
      id,
      title,
      description,
      sections,
      layout: typeof layout === "string" ? (layout as any) : undefined,
      settings: {
        density: "comfortable",
        ...settings,
        ...uiOverrides?.settings,
      },
      style: uiOverrides?.style,
      events: uiOverrides?.events,
    };
  }

  /**
   * Compiles an API-provided HeaderMetaSchema into TanStack/Zenith-compatible Table Columns.
   */
  static compileToTableColumns<T>(
    metaSchema: HeaderMetaSchema,
    uiOverrides?: any
  ): TableColumn<T>[] {
    const { fields } = metaSchema;
    const normalizedFields: HeaderMetaSchemaField[] = Array.isArray(fields)
      ? fields
      : Object.entries(fields).map(([name, field]) => ({
          name,
          ...field,
        }));

    return normalizedFields.map((f) => {
      const tableCol: TableColumn<T> = {
        id: f.name,
        header:
          f.label ||
          f.title ||
          f.name.charAt(0).toUpperCase() + f.name.slice(1),
        accessor: f.name as any,
        width: f.width,
        sortable: f.sortable !== false,
        align: f.align || "left",
      };

      // Merge visual overrides
      if (uiOverrides?.columns?.[f.name]) {
        Object.assign(tableCol, uiOverrides.columns[f.name]);
      }

      return tableCol;
    });
  }

  /**
   * Compiles an API-provided HeaderMetaSchema into ZenithTable TableColumnMeta[]
   * with optional fieldSchema binding for inline editing.
   */
  static compileToZenithColumns(
    metaSchema: HeaderMetaSchema,
    uiOverrides?: any
  ): TableColumnMeta[] {
    const { fields } = metaSchema;
    const normalizedFields: HeaderMetaSchemaField[] = Array.isArray(fields)
      ? fields
      : Object.entries(fields).map(([name, field]) => ({
          name,
          ...field,
        }));

    return normalizedFields
      .filter((f) => f.visible !== false)
      .map((f) => {
        // Normalize type — match compileToFields() normalization
        let fieldType = f.type || "text";
        if (fieldType === "string") fieldType = "text";
        if (fieldType === "boolean") fieldType = "checkbox";

        const colMeta: TableColumnMeta = {
          id: f.name,
          label:
            f.label ||
            f.title ||
            f.name.charAt(0).toUpperCase() + f.name.slice(1),
          sortable: f.sortable !== false,
          filterable: true,
          pinned: false,
          hidden: false,
          width: typeof f.width === "number" ? f.width : undefined,
          align: f.align || "left",
          renderer: fieldType,
        };

        // Bind fieldSchema for inline editing
        colMeta.fieldSchema = {
          id: f.name,
          name: f.name,
          label: colMeta.label,
          type: fieldType,
          initialValue: f.defaultValue,
          required: f.required,
          visible: true,
          enabled: f.disabled !== true,
          options: f.options?.map((opt) =>
            typeof opt === "string" ? { label: opt, value: opt } : opt
          ),
          validation: f.validation,
          properties: {
            placeholder: f.placeholder,
          },
        };

        // Merge visual overrides
        if (uiOverrides?.columns?.[f.name]) {
          const override = uiOverrides.columns[f.name];
          Object.assign(colMeta, override);
        }

        return colMeta;
      });
  }
}
