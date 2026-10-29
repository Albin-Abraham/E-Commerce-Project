import * as React from "react";

import { Slot } from "@radix-ui/react-slot";
import { type VariantProps, cva } from "class-variance-authority";

import { cn } from "@libs/utils";

import {
  type ModifierProps,
  extractModifiers,
  getModifierClasses,
} from "./modifiers";

const flexVariants = cva("flex", {
  variants: {
    direction: {
      row: "flex-row",
      col: "flex-col",
      rowReverse: "flex-row-reverse",
      colReverse: "flex-col-reverse",
    },
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
      stretch: "items-stretch",
      baseline: "items-baseline",
    },
    justify: {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between",
      around: "justify-around",
      evenly: "justify-evenly",
    },
    wrap: {
      nowrap: "flex-nowrap",
      wrap: "flex-wrap",
      wrapReverse: "flex-wrap-reverse",
    },
    gap: {
      none: "gap-0",
      xs: "gap-1",
      sm: "gap-2",
      md: "gap-4",
      lg: "gap-6",
      xl: "gap-8",
      "2xl": "gap-12",
    },
  },
  defaultVariants: {
    direction: "row",
  },
});

export interface FlexProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof flexVariants>,
    ModifierProps {
  asChild?: boolean;
  fill?: boolean;
}

const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  (
    {
      className,
      direction,
      align,
      justify,
      wrap,
      gap,
      asChild = false,
      fill = false,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "div";
    const { modifiers, rest } = extractModifiers(props);
    const modifierClasses = getModifierClasses(modifiers);

    return (
      <Comp
        ref={ref}
        className={cn(
          flexVariants({ direction, align, justify, wrap, gap }),
          fill && "flex-1 min-h-0 min-w-0",
          modifierClasses,
          className
        )}
        {...rest}
      />
    );
  }
);
Flex.displayName = "Flex";

export { Flex, flexVariants };
