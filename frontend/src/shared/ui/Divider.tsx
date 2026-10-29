import React from "react";

import { Slot } from "@radix-ui/react-slot";
import { cn } from "@libs/utils";

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  asChild?: boolean;
}

/**
 * Divider: Universal semantic separator.
 */
export const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  ({ label = "OR", className, asChild = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";

    return (
      <Comp ref={ref} className={cn("relative py-8", className)} {...props}>
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-border"></div>
        </div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
          <span className="bg-surface px-4 text-foreground/40">{label}</span>
        </div>
        {children}
      </Comp>
    );
  }
);
Divider.displayName = "Divider";

export default Divider;
