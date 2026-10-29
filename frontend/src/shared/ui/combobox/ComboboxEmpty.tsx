import React from "react";
import { cn } from "@ui/form/utils/form-styles";
import { useComboboxContext } from "./ComboboxContext";

export interface ComboboxEmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

/**
 * ComboboxEmpty
 *
 * Renders an accessible status container when no options match the search query.
 */
export const ComboboxEmpty: React.FC<ComboboxEmptyProps> = ({
  children = "No options found.",
  className,
  ...rest
}) => {
  const { filteredOptions } = useComboboxContext();

  if (filteredOptions.length > 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("py-4 text-center text-sm text-foreground/50", className)}
      {...rest}
    >
      {children}
    </div>
  );
};

ComboboxEmpty.displayName = "ComboboxEmpty";
