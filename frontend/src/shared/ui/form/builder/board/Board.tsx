import React from "react";

import { Droppable } from "@hello-pangea/dnd";
import { Column } from "@ui/form/builder/board/Column";
import type { RawFormSection } from "@ui/form/fields";

interface BoardProps {
  sections: RawFormSection[];
  onEditField: (field: any, sectionId: string) => void;
  onEditSection: (section: RawFormSection) => void;
}

export const Board: React.FC<BoardProps> = ({
  sections,
  onEditField,
  onEditSection,
}) => {
  return (
    <Droppable droppableId="board" type="SECTION" direction="horizontal">
      {(provided, _snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="flex h-full gap-4 p-4 overflow-x-auto items-start"
        >
          {sections.map((section, index) => (
            <Column
              key={section.id}
              section={section}
              index={index}
              onEditField={onEditField}
              onEditSection={onEditSection}
            />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};
