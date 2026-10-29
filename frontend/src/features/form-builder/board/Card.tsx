import React from "react";

import { Draggable } from "@hello-pangea/dnd";
import { useBuilderStore } from "@ui/form/builder/store/builder.store";
import { Edit, GripVertical, Trash2 } from "lucide-react";

interface CardProps {
  field: import("@ui/form/fields").RawFormField;
  sectionId: string;
  index: number;
  onEdit: (
    field: import("@ui/form/fields").RawFormField,
    sectionId: string
  ) => void;
}

export const Card: React.FC<CardProps> = ({
  field,
  sectionId,
  index,
  onEdit,
}) => {
  const { removeField } = useBuilderStore();

  return (
    <Draggable draggableId={field.id || ""} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`bg-white dark:bg-gray-800 p-3 rounded shadow-sm border dark:border-gray-700 flex items-center gap-2 group ${
            snapshot.isDragging
              ? "shadow-lg ring-2 ring-blue-500/50 z-[var(--z-dropdown)]"
              : "hover:border-blue-400 dark:hover:border-blue-500"
          }`}
        >
          <div
            {...provided.dragHandleProps}
            className="text-gray-400 cursor-grab hover:text-gray-600 dark:hover:text-gray-300"
          >
            <GripVertical size={16} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-gray-800 dark:text-gray-200 truncate">
              {typeof field.label === "string"
                ? field.label
                : (field.label as any)?.en}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded uppercase text-[10px] font-semibold">
                {field.type}
              </span>
              {field.required && (
                <span className="text-red-500 font-medium">Req</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(field, sectionId)}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
              title="Edit Properties"
            >
              <Edit size={14} />
            </button>
            <button
              onClick={() => removeField(sectionId, field.id || "")}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              title="Remove Field"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
};
