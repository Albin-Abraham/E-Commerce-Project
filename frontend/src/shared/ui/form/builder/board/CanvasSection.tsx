import React from "react";

import { Draggable, Droppable } from "@hello-pangea/dnd";
import { CanvasField } from "@ui/form/builder/board/CanvasField";
// Verify path
import { useBuilderStore } from "@ui/form/builder/store/builder.store";
import { Edit2, GripVertical, Plus, Trash2 } from "lucide-react";

interface CanvasSectionProps {
  section: import("@ui/form/fields").RawFormSection;
  index: number;
  onEditField: (field: any, sectionId: string) => void;
  onEditSection: (section: import("@ui/form/fields").RawFormSection) => void;
}

export const CanvasSection: React.FC<CanvasSectionProps> = ({
  section,
  index,
  onEditField,
  onEditSection,
}) => {
  const { addField, removeSection, selection, setSelection } =
    useBuilderStore();
  const isSelected =
    selection?.type === "section" && selection.id === section.id;

  // Helper to get title
  const title =
    typeof section.title === "object"
      ? (section.title as any).en
      : section.title;

  return (
    <Draggable draggableId={section.id || ""} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`relative mb-8 group transition-all duration-200 outline-none ${
            snapshot.isDragging ? "z-40 opacity-90 scale-[1.01]" : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setSelection({ type: "section", id: section.id || "" });
          }}
        >
          {/* Selection Border */}
          <div
            className={`absolute -inset-0.5 rounded-xl border-2 pointer-events-none transition-colors ${
              isSelected
                ? "border-blue-500"
                : "border-transparent group-hover:border-blue-200"
            }`}
          />

          {/* Section Container (mimics Card/Panel look) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6">
            {/* Header & Controls */}
            <div className="flex items-start justify-between mb-6 group/header">
              <div className="flex items-center gap-3">
                {/* Drag Handle */}
                <div
                  {...provided.dragHandleProps}
                  className="cursor-grab active:cursor-grabbing p-1.5 -ml-2 text-gray-300 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <GripVertical size={20} />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 leading-none">
                    {title || "Untitled Section"}
                  </h3>
                  {section.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {section.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Section Actions */}
              <div
                className={`flex items-center gap-1 transition-opacity ${
                  isSelected || snapshot.isDragging
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditSection(section);
                  }}
                  className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                  title="Edit Section Settings"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeSection(section.id || "");
                  }}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                  title="Delete Section"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Fields Drop Zone - Clean */}
            <div className="p-4 bg-white dark:bg-slate-800 min-h-[100px]">
              <Droppable droppableId={section.id || ""} type="FIELD">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`transition-colors duration-200 rounded-lg min-h-[80px] ${
                      snapshot.isDraggingOver
                        ? "bg-blue-50/50 dark:bg-blue-900/10 ring-2 ring-blue-500/20 ring-inset"
                        : "bg-transparent"
                    }`}
                  >
                    {(section.fields || []).map((field, index) => (
                      <CanvasField
                        key={field.id}
                        field={field as any}
                        sectionId={section.id || ""}
                        index={index}
                        onEdit={onEditField}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            {/* Quick Add at bottom */}
            {section.fields && section.fields.length > 0 && (
              <div className="mt-4 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => addField(section.id || "", "text")}
                  className="flex items-center gap-1 text-xs font-medium text-blue-500 hover:bg-blue-50 px-2 py-1 rounded"
                >
                  <Plus size={12} /> Add Field
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};
