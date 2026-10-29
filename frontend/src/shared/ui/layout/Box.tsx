import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";
import { cn } from "@libs/utils";

import {
  type ModifierProps,
  extractModifiers,
  getModifierClasses,
} from "./modifiers";

const boxVariants = cva("", {
  variants: {
    variant: {
      default: "",
      surface: "bg-surface border border-border text-foreground shadow-xs",
      card: "bg-surface border border-border rounded-xl shadow-sm text-foreground",
      glass: "bg-surface/70 backdrop-blur-md border border-border/60 shadow-sm text-foreground",
      subtle: "bg-subtle border border-border-soft text-foreground",
      elevated: "bg-surface-elevated border border-border shadow-md text-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export type BoxVariant = NonNullable<VariantProps<typeof boxVariants>["variant"]>;

export interface BoxProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof boxVariants>,
    ModifierProps {
  asChild?: boolean;
}

const Box = React.forwardRef<HTMLDivElement, BoxProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "div";
    const { modifiers, rest } = extractModifiers(props);
    const modifierClasses = getModifierClasses(modifiers);

    return (
      <Comp
        ref={ref}
        className={cn(boxVariants({ variant }), modifierClasses, className)}
        {...rest}
      />
    );
  }
);
Box.displayName = "Box";

export { Box, boxVariants };
