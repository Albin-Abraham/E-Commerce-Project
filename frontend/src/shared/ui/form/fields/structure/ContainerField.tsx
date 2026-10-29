import React from "react";

import { cn } from "@ui/form/utils/form-styles";
import type { BoxModelProperties } from "@ui/form/utils/layout-generator";
import { Box } from "@ui/layout/Box";
import { Flex } from "@ui/layout/Flex";
import { Grid } from "@ui/layout/Grid";

import type { StructuralFieldProps } from "./types";

/** Map BoxModelProperties gap values to Flex/Grid gap scale. */
function mapGap(
  gap: string | number | undefined
): "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl" {
  if (gap === undefined || gap === 0 || gap === "0") return "none";
  if (typeof gap === "number") {
    if (gap <= 1) return "xs";
    if (gap <= 2) return "sm";
    if (gap <= 4) return "md";
    if (gap <= 6) return "lg";
    if (gap <= 8) return "xl";
    return "2xl";
  }
  const str = String(gap).toLowerCase();
  if (str === "sm" || str === "small") return "sm";
  if (str === "md" || str === "medium") return "md";
  if (str === "lg" || str === "large") return "lg";
  if (str === "xl") return "xl";
  if (str === "2xl") return "2xl";
  return "md";
}

export const ContainerField: React.FC<StructuralFieldProps> = ({
  field,
  styles,
  className,
  children,
}) => {
  const props = (field.properties || {}) as BoxModelProperties & {
    gridCols?: number;
    className?: string;
  };

  const display = props.display || "block";
  const sharedClassName = cn(
    props.className,
    "transition-all duration-300 hover:shadow-sm",
    styles?.base,
    styles?.wrapper,
    "relative",
    className
  );

  if (display === "flex") {
    return (
      <Flex
        direction={props.direction === "col" ? "col" : "row"}
        gap={mapGap(props.gap)}
        align={props.alignItems}
        justify={props.justify}
        className={sharedClassName}
        data-unit="container"
        data-field-id={field.id}
      >
        {children}
      </Flex>
    );
  }

  if (display === "grid") {
    return (
      <Grid
        columns={
          (props.columns || 12) as
            | 1
            | 2
            | 3
            | 4
            | 5
            | 6
            | 7
            | 8
            | 9
            | 10
            | 11
            | 12
        }
        gap={mapGap(props.gap)}
        align={props.alignItems}
        justify={props.justify}
        className={sharedClassName}
        data-unit="container"
        data-field-id={field.id}
      >
        {children}
      </Grid>
    );
  }

  return (
    <Box
      className={sharedClassName}
      data-unit="container"
      data-field-id={field.id}
    >
      {children}
    </Box>
  );
};
