import React from "react";

import { FieldProperties } from "@ui/form/builder/panels/FieldProperties";
import { FormProperties } from "@ui/form/builder/panels/FormProperties";
import { SectionProperties } from "@ui/form/builder/panels/SectionProperties";
import type { Selection } from "@ui/form/builder/store/builder.store";
import type { FormDefinition } from "@ui/form/types";

interface PropertiesPanelProps {
  selection: Selection | null;
  formDefinition: FormDefinition;
  onUpdateForm: (updates: Partial<FormDefinition>) => void;
  onUpdateSection: (sectionId: string, updates: any) => void;
  onUpdateField: (sectionId: string, fieldId: string, updates: any) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selection,
  formDefinition,
  onUpdateForm,
  onUpdateSection,
  onUpdateField,
}) => {
  if (!selection) {
    return (
      <div className="p-8 text-center text-gray-500 flex flex-col items-center justify-center h-full">
        <p>Select an element to edit properties</p>
      </div>
    );
  }

  if (selection.type === "field" && selection.sectionId) {
    const section = formDefinition.sections!.find(
      (s) => s.id === selection.sectionId
    );
    const field = (section?.fields as any[])?.find(
      (f) => (f as any).id === selection.id
    );

    if (field) {
      return (
        <FieldProperties
          field={field as any}
          sectionId={section!.id || ""}
          onUpdate={onUpdateField}
        />
      );
    }
    return (
      <div className="p-4 text-red-500">
        Field node not found in definition.
      </div>
    );
  }

  if (selection.type === "section") {
    const section = formDefinition.sections!.find((s) => s.id === selection.id);
    if (section) {
      return (
        <SectionProperties
          section={section as any}
          onUpdate={onUpdateSection}
        />
      );
    }
    return (
      <div className="p-4 text-red-500">
        Section node not found in definition.
      </div>
    );
  }

  if (selection.type === "form") {
    return (
      <FormProperties formDefinition={formDefinition} onUpdate={onUpdateForm} />
    );
  }

  return null;
};
