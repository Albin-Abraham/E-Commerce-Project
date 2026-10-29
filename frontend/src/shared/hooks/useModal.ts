import { useState } from "react";

/**
 * Enterprise Modal Hook
 * Lightweight implementation to reduce bundle size while maintaining the same API.
 */
export function useModal() {
  const [isOpen, setIsOpen] = useState(false);

  return {
    isOpen,
    openModal: () => setIsOpen(true),
    closeModal: () => setIsOpen(false),
    toggleModal: () => setIsOpen((prev) => !prev),
    /**
     * Native binding for React Aria's onOpenChange
     */
    onOpenChange: (open: boolean) => setIsOpen(open),
  };
}
