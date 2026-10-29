import React from "react";

import { Draggable, Droppable } from "@hello-pangea/dnd";
import { Card } from "@ui/form/builder/board/Card";
import { useBuilderStore } from "@ui/form/builder/store/builder.store";
// Import store directly if needed, or stick to prop passing if cleaner
import { Edit2, GripVertical, Plus, Trash2 } from "lucide-react";

interface ColumnProps {
  section: import("@ui/form/fields").RawFormSection;
  index: number;
  onEditField: (field: any, sectionId: string) => void;
  onEditSection: (section: import("@ui/form/fields").RawFormSection) => void;
}

export const Column: React.FC<ColumnProps> = ({
  section,
  index,
  onEditField,
  onEditSection,
}) => {
  const { addField, removeSection } = useBuilderStore();

  return (
    <Draggable draggableId={section.id || ""} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`flex-shrink-0 w-80 bg-gray-50 dark:bg-gray-900/50 rounded-lg flex flex-col h-full border dark:border-gray-700 ${
            snapshot.isDragging
              ? "shadow-2xl opacity-90 ring-2 ring-blue-500 z-[var(--z-overlap)]"
              : ""
          }`}
        >
          {/* Header */}
          <div
            className="p-3 flex items-center justify-between border-b dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-lg"
            {...provided.dragHandleProps}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="cursor-grab text-gray-400 hover:text-gray-600">
                <GripVertical size={16} />
              </span>
              <div className="font-semibold text-gray-700 dark:text-gray-200 truncate">
                {typeof section.title === "string"
                  ? section.title
                  : section.title?.en}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onEditSection(section)}
                className="p-1.5 text-gray-400 hover:text-blue-500 rounded"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => removeSection(section.id || "")}
                className="p-1.5 text-gray-400 hover:text-red-500 rounded"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {/* Fields List */}
          <div className="flex-1 overflow-y-auto p-2">
            <Droppable droppableId={section.id || ""} type="FIELD">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`min-h-[100px] flex flex-col gap-2 transition-colors rounded ${
                    snapshot.isDraggingOver
                      ? "bg-blue-50 dark:bg-blue-900/10"
                      : ""
                  }`}
                >
                  {(section.fields || []).map((field, fIndex) => (
                    <Card
                      key={field.id}
                      field={field as any}
                      sectionId={section.id || ""}
                      index={fIndex}
                      onEdit={onEditField}
                    />
                  ))}
                  {provided.placeholder}

                  {/* Quick Add Button */}
                  <button
                    onClick={() => addField(section.id || "", "text")}
                    className="mt-2 w-full py-2 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded text-gray-400 hover:border-blue-400 hover:text-blue-500 text-sm font-medium flex items-center justify-center gap-1 transition-all"
                  >
                    <Plus size={16} /> Add Field
                  </button>
                </div>
              )}
            </Droppable>
          </div>
        </div>
      )}
    </Draggable>
  );
};
