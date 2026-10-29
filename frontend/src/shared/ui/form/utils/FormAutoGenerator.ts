import type { RawFormField, RawFormSection } from "@ui/form/fields";
import type { FormDefinition } from "@ui/form/types";

/**
 * Domain Field Metadata
 */
export interface DomainFieldMetadata {
  label?: string;
  type?:
    | "text"
    | "number"
    | "email"
    | "password"
    | "textarea"
    | "select"
    | "checkbox"
    | "switch"
    | "date";
  placeholder?: string;
  required?: boolean;
  hidden?: boolean;
  disabled?: boolean;
  defaultValue?: any;
  options?: { label: string; value: any }[];
  gridCols?: number; // Span in grid
  group?: string; // Section name
}

/**
 * Domain Form Configuration
 */
export interface DomainFormConfig<T> {
  id: string;
  title: string;
  description?: string;
  fields: Partial<Record<keyof T, DomainFieldMetadata>>;
  groups?: Record<string, { title: string; columns?: number }>;
}

/**
 * FormAutoGenerator
 *
 * Automatically generates a high-fidelity FormDefinition from domain metadata.
 */
export class FormAutoGenerator {
  /**
   * Generates a FormDefinition for a specific domain model.
   */
  static generate<T extends Record<string, any>>(
    config: DomainFormConfig<T>
  ): FormDefinition<T> {
    const { fields, groups = {}, id, title, description } = config;

    // 1. Group fields into sections
    const sectionMap: Record<string, RawFormField<any, any, T>[]> = {
      default: [],
    };

    Object.entries(fields).forEach(([key, metadata]) => {
      const meta = metadata as DomainFieldMetadata;
      const groupName = meta.group || "default";

      if (!sectionMap[groupName]) {
        sectionMap[groupName] = [];
      }

      const formField: RawFormField<any, any, T> = {
        id: `${id}_${key}`,
        name: key,
        label: meta.label || this.capitalize(key),
        type: (meta.type || this.inferType(key, meta.defaultValue)) as any,
        initialValue: meta.defaultValue,
        required: meta.required,
        visible: !meta.hidden,
        enabled: !meta.disabled,
        options: meta.options,
        properties: {
          gridCols: meta.gridCols || 12,
          placeholder: meta.placeholder,
        },
      };

      sectionMap[groupName].push(formField);
    });

    // 2. Convert groups to FormSections
    const sections: RawFormSection<T>[] = Object.entries(sectionMap)
      .filter(([_, fields]) => fields.length > 0)
      .map(([groupName, fields]) => {
        const groupConfig = groups[groupName] || {
          title: groupName === "default" ? "" : this.capitalize(groupName),
        };

        return {
          id: `${id}_section_${groupName}`,
          title: groupConfig.title,
          layout: {
            type: "grid",
            columns: groupConfig.columns || 12,
            gap: 6,
          },
          fields,
        };
      });

    return {
      id,
      title,
      description,
      sections,
      layout: "grid",
      settings: {
        density: "comfortable",
      },
    };
  }

  private static capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1).replace(/([A-Z])/g, " $1");
  }

  private static inferType(key: string, value: any): any {
    if (key.toLowerCase().includes("email")) return "email";
    if (key.toLowerCase().includes("password")) return "password";
    if (typeof value === "number") return "number";
    if (typeof value === "boolean") return "switch";
    return "text";
  }
}
