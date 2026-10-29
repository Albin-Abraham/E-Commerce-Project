import { useCallback } from "react";

import type { DropResult } from "@hello-pangea/dnd";

import { useBuilderStore } from "../store/builder.store";

export const useBoardAsViewModel = () => {
  const {
    formDefinition,
    moveSection,
    moveField,
    moveFieldToSection,
    addSection,
    addSectionWithField,
    addField,
  } = useBuilderStore();

  const onDragEnd = useCallback(
    (result: DropResult) => {
      const { source, destination, type } = result;

      if (!destination) return;

      if (source.droppableId === "PALETTE") {
        const draggableId = result.draggableId; // e.g., "PALETTE-text"
        if (draggableId.startsWith("PALETTE-")) {
          const realType = draggableId.replace("PALETTE-", "") as any;

          // Handle creation via Empty Canvas Drop
          if (destination.droppableId === "EMPTY_CANVAS") {
            addSectionWithField(realType);
            return;
          }

          // Handle normal drop into a section
          if (type === "FIELD") {
            addField(destination.droppableId, realType, destination.index);
          }
        }
        return;
      }

      if (type === "SECTION") {
        moveSection(source.index, destination.index);
      } else if (type === "FIELD") {
        const sourceSectionId = source.droppableId;
        const destSectionId = destination.droppableId;

        if (sourceSectionId === destSectionId) {
          moveField(sourceSectionId, source.index, destination.index);
        } else {
          moveFieldToSection(
            sourceSectionId,
            destSectionId,
            source.index,
            destination.index
          );
        }
      }
    },
    [moveSection, moveField, moveFieldToSection, addField, addSectionWithField]
  );

  return {
    formDefinition,
    onDragEnd,
    addSection,
  };
};
