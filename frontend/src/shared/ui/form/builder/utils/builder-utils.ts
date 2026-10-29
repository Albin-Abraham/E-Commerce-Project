import type { FieldType, FormField } from "@ui/form/fields";
import type { FormDefinition } from "@ui/form/types";
import type { FormSection } from "@ui/form/types/section";

export const generateId = (prefix: string = "id") => {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
};

export const createDefaultForm = (): FormDefinition => ({
  id: generateId("form"),
  title: "New Form",
  sections: [],
  version: "1.0.0",
});

export const createDefaultSection = (): FormSection => ({
  id: generateId("section"),
  title: "New Section",
  fields: [],
  layout: { type: "grid", columns: 1 },
});

export const createDefaultField = (type: FieldType): FormField => ({
  id: generateId("field"),
  name: generateId("field_name"),
  type,
  label: "New Field",
  required: false,
  visible: true,
  enabled: true,
});
