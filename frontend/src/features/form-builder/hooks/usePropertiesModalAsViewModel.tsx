import { useCallback } from "react";

import { useBuilderStore } from "../store/builder.store";
import type { Selection } from "../store/builder.store";

export const usePropertiesModalAsViewModel = () => {
  const { selection, setSelection, isModalOpen, setModalOpen } =
    useBuilderStore();

  const open = useCallback(
    (newSelection: Selection) => {
      setSelection(newSelection);
      setModalOpen(true);
    },
    [setSelection, setModalOpen]
  );

  const close = useCallback(() => {
    setModalOpen(false);
  }, [setModalOpen]);

  // Derived state for the modal title/type
  const modalTitle =
    selection?.type === "form"
      ? "Edit Form"
      : selection?.type === "section"
        ? "Edit Section"
        : "Edit Field";

  return {
    isOpen: isModalOpen,
    open,
    close,
    selection,
    modalTitle,
  };
};
