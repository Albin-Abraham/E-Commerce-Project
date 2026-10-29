import React from "react";

import { Droppable } from "@hello-pangea/dnd";
import { CanvasSection } from "@ui/form/builder/board/CanvasSection";
import type { RawFormSection } from "@ui/form/fields";
import type { FormDefinition } from "@ui/form/types";
import {
  getFormContainerClass,
  getFormDensityClass,
} from "@ui/form/utils/form-styles";

interface FormCanvasProps {
  sections: RawFormSection[];
  settings?: FormDefinition["settings"];
  style?: FormDefinition["style"];
  onEditField: (field: any, sectionId: string) => void;
  onEditSection: (section: RawFormSection) => void;
}

export const FormCanvas: React.FC<FormCanvasProps> = ({
  sections,
  settings,
  style,
  onEditField,
  onEditSection,
}) => {
  return (
    <div
      className="form-builder-canvas h-full overflow-y-auto p-8 transition-colors duration-200"
      style={{
        backgroundColor: style?.backgroundColor || undefined, // Fallback handled by parent or default bg
        fontFamily: style?.fontFamily,
      }}
    >
      <div
        className={`form-builder-canvas__container mx-auto pb-20 transition-all duration-300 ${getFormContainerClass(settings?.width)} ${getFormDensityClass(settings?.density)}`}
        style={
          {
            "--primary-color": style?.primaryColor || "#3b82f6",
          } as React.CSSProperties
        }
      >
        <div className="form-builder-canvas__header mb-8 text-center text-sm text-gray-500 dark:text-gray-400 uppercase tracking-widest font-semibold">
          Form Canvas
        </div>

        <Droppable
          droppableId="form-canvas"
          type="SECTION"
          direction="vertical"
        >
          {(provided, _snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="form-builder-canvas__dropzone flex flex-col gap-4 min-h-[200px]"
            >
              {sections.map((section, index) => (
                <CanvasSection
                  key={section.id}
                  section={section}
                  index={index}
                  onEditField={onEditField}
                  onEditSection={onEditSection}
                />
              ))}
              {provided.placeholder}

              {sections.length === 0 && (
                <Droppable droppableId="EMPTY_CANVAS" type="FIELD">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`form-builder-canvas__empty-state border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-12 text-center text-gray-400 transition-colors ${
                        snapshot.isDraggingOver
                          ? "bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700"
                          : ""
                      }`}
                    >
                      <p className="text-lg mb-2">
                        Drag component from component sidebar to start builder
                      </p>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}
            </div>
          )}
        </Droppable>
      </div>
    </div>
  );
};
