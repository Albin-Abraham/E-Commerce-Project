import React from "react";

import { Draggable } from "@hello-pangea/dnd";
import { FieldRenderer } from "@ui/form/FieldRenderer";
import { useBuilderStore } from "@ui/form/builder/store/builder.store";
import { Edit2, GripVertical, Trash2 } from "lucide-react";

interface CanvasFieldProps {
  field: import("@ui/form/fields").RawFormField;
  sectionId: string;
  index: number;
  onEdit: (
    field: import("@ui/form/fields").RawFormField,
    sectionId: string
  ) => void;
}

export const CanvasField: React.FC<CanvasFieldProps> = ({
  field,
  sectionId,
  index,
  onEdit,
}) => {
  const { removeField, selection, setSelection } = useBuilderStore();
  const isSelected = selection?.type === "field" && selection.id === field.id;

  return (
    <Draggable draggableId={field.id || ""} index={index}>
      {(provided, _snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`relative group mb-3 transition-all duration-200 outline-none rounded-lg p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 ${
            isSelected
              ? "ring-2 ring-blue-500 z-[var(--z-accent)]"
              : "hover:border-blue-400"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setSelection({ type: "field", id: field.id || "", sectionId });
          }}
        >
          {/* Controls Overlay */}
          <div
            className={`absolute top-2 right-2 flex items-center space-x-1 ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity z-[var(--z-overlap)] bg-white/90 dark:bg-gray-800/90 shadow-sm rounded-md border border-gray-100 dark:border-gray-700 p-0.5 backdrop-blur-sm`}
          >
            <div
              {...provided.dragHandleProps}
              className="p-1.5 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Drag to reorder"
            >
              <GripVertical size={14} />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(field, sectionId);
              }}
              className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
              title="Edit Field"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeField(sectionId, field.id || "");
              }}
              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              title="Remove Field"
            >
              <Trash2 size={14} />
            </button>
          </div>

          {/* Actual Field Render */}
          <div className="form-builder-field__preview relative pointer-events-none">
            <FieldRenderer
              field={field as any}
              value={null} // No value in builder
              onChange={() => {}} // No-op
              showLabel={true} // Always show label in builder
            />
          </div>
        </div>
      )}
    </Draggable>
  );
};
