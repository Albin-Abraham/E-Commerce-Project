import React, { useMemo } from "react";

import { Draggable, Droppable } from "@hello-pangea/dnd";
import { FIELD_METADATA } from "@ui/form/fields/field-metadata";

export const ComponentPanel: React.FC = () => {
  const paletteItems = useMemo(() => Object.values(FIELD_METADATA), []);

  return (
    <div className="w-64 border-r dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col h-full">
      <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <h2 className="font-semibold text-gray-700 dark:text-gray-200">
          Components
        </h2>
        <p className="text-xs text-gray-400 mt-1">Drag fields to the board</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <Droppable droppableId="PALETTE" isDropDisabled={true} type="FIELD">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-2"
            >
              {paletteItems.map((item, index) => (
                <Draggable
                  key={item.type}
                  draggableId={`PALETTE-${item.type}`}
                  index={index}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`flex items-center gap-3 p-3 rounded-lg border dark:border-gray-700 bg-white dark:bg-gray-700 shadow-sm hover:border-blue-500 cursor-grab ${
                        snapshot.isDragging
                          ? "ring-2 ring-blue-500 shadow-xl z-50"
                          : "hover:shadow-md transition-shadow"
                      }`}
                    >
                      <div className="text-gray-500 dark:text-gray-400">
                        {item.icon()}
                      </div>
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {item.label}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    </div>
  );
};
