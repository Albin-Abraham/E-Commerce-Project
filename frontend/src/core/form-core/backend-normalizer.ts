import type {
  FormDefinition,
  ContentDefinition,
  ContentFieldDefinition,
} from "./domain";

export interface BackendFieldMetadata {
  name: string;
  type: string; // e.g. "varchar", "text", "int", "boolean", "date", "decimal", "select"
  label?: string;
  description?: string;
  nullable?: boolean;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  min?: number;
  max?: number;
  options?: Array<{ label: string; value: any }>;
  defaultValue?: any;
  validationRule?: string;
}

export interface BackendSchemaMetadata {
  entity: string;
  title?: string;
  description?: string;
  fields: BackendFieldMetadata[];
}

/**
 * BackendMetadataNormalizer
 * Transforms heterogeneous backend metadata (REST, SAP, Oracle, GraphQL)
 * into canonical Zenith MetaSchema FormDefinition / ContentDefinition.
 */
export class BackendMetadataNormalizer {
  /**
   * Normalizes raw backend schema into a Layer 1 ContentDefinition.
   */
  public static normalizeToContent(
    backendSchema: BackendSchemaMetadata
  ): ContentDefinition {
    const fields: ContentFieldDefinition[] = backendSchema.fields.map((bf) => {
      const fieldType = this.mapType(bf.type);
      const isRequired = bf.required ?? bf.nullable === false;

      return {
        id: bf.name,
        name: bf.name,
        type: fieldType,
        label: bf.label || bf.name,
        description: bf.description,
        required: isRequired,
        defaultValue: bf.defaultValue,
        validation: {
          rules: [
            ...(isRequired
              ? [
                  {
                    type: "required" as const,
                    message: `${bf.label || bf.name} is required`,
                  },
                ]
              : []),
            ...(bf.maxLength
              ? [
                  {
                    type: "maxLength" as const,
                    value: bf.maxLength,
                    message: `Max length is ${bf.maxLength}`,
                  },
                ]
              : []),
            ...(bf.minLength
              ? [
                  {
                    type: "minLength" as const,
                    value: bf.minLength,
                    message: `Min length is ${bf.minLength}`,
                  },
                ]
              : []),
            ...(bf.min !== undefined
              ? [
                  {
                    type: "min" as const,
                    value: bf.min,
                    message: `Min value is ${bf.min}`,
                  },
                ]
              : []),
            ...(bf.max !== undefined
              ? [
                  {
                    type: "max" as const,
                    value: bf.max,
                    message: `Max value is ${bf.max}`,
                  },
                ]
              : []),
          ],
        },
        metadata: {
          backendType: bf.type,
          options: bf.options,
        },
      };
    });

    return {
      id: backendSchema.entity,
      entityName: backendSchema.entity,
      title: backendSchema.title || backendSchema.entity,
      description: backendSchema.description,
      fields,
    };
  }

  /**
   * Normalizes raw backend schema into a canonical FormDefinition.
   */
  public static normalizeToFormDefinition(
    backendSchema: BackendSchemaMetadata
  ): FormDefinition {
    const content = this.normalizeToContent(backendSchema);

    return {
      id: backendSchema.entity,
      title: content.title,
      description: content.description,
      content,
      fields: content.fields as any[],
    };
  }

  private static mapType(backendType: string): string {
    const lower = backendType.toLowerCase();
    if (
      lower.includes("char") ||
      lower.includes("string") ||
      lower.includes("text")
    )
      return "text";
    if (
      lower.includes("int") ||
      lower.includes("decimal") ||
      lower.includes("number") ||
      lower.includes("float")
    )
      return "number";
    if (lower.includes("bool")) return "checkbox";
    if (lower.includes("date") || lower.includes("time")) return "date";
    if (lower.includes("select") || lower.includes("enum")) return "select";
    return "text";
  }
}
