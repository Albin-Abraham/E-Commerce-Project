import React from "react";

import { useFormTheme } from "@ui/form/context/FormThemeContext";
import type { FormField, LabelPlacement } from "@ui/form/fields";
import { FieldSlot } from "@ui/form/slots/FieldSlot";
import { cn } from "@ui/form/utils/form-styles";
import { Flex } from "@ui/layout/Flex";
import { Grid, GridItem } from "@ui/layout/Grid";

export interface InputWrapperProps {
  field?: Partial<FormField>;
  children: React.ReactNode;
  label?: React.ReactNode;
  feedback?: React.ReactNode;
  labelPlacement?: LabelPlacement;
  hasValue?: boolean;
  error?: string | boolean;
  styles?: any;
  align?: "left" | "right" | "center";
  reserveErrorSpace?: boolean;
}

/**
 * InputWrapper: The "Designer's View" (Internal Relationships)
 *
 * Responsibility: Manages the spatial relationship between the Label and the Input surface.
 * It implements label placement logic (top, side, hidden, inline, inline-floating) using CSS Grid/Flex primitives.
 */
export const InputWrapper: React.FC<InputWrapperProps> = ({
  field,
  children,
  label,
  feedback,
  labelPlacement = "top",
  hasValue = false,
  error,
  styles = {},
  align: propsAlign,
  reserveErrorSpace: propsReserveErrorSpace,
}) => {
  const theme = useFormTheme();
  const isSide = labelPlacement === "side";
  const isHidden = labelPlacement === "hidden";
  const isInline = labelPlacement === "inline";
  const isFloating = labelPlacement === "inline-floating";

  // Resolve alignment traits (default to left)
  const align = propsAlign || field?.properties?.alignment || "left";

  // Resolve density-aware label offset to match OuterWrapper surface padding
  const density = theme.density || "comfortable";

  const reserveSpace = Boolean(
    propsReserveErrorSpace ?? field?.properties?.reserveErrorSpace ?? false
  );

  // Reserve a consistent slot so validation errors never shift the layout
  const feedbackClass = cn(
    "w-full",
    reserveSpace &&
      (density === "compact" ? "min-h-[18px]" : "min-h-[24px]")
  );

  const labelOffset =
    density === "spacious"
      ? "pt-4"
      : density === "compact"
        ? "pt-1.5"
        : "pt-2.5";

  if (isFloating) {
    return (
      <div
        className={cn(
          "form-field-inner form-field-inner--floating relative w-full group",
          styles.innerWrapper
        )}
        data-align={align}
        data-error={!!error}
        data-has-value={hasValue}
      >
        <FieldSlot placement="beforeField" field={field} />

        <div className="relative w-full">
          {/* Floating Notch Label */}
          {!isHidden && label && (
            <div
              className={cn(
                "form-field-floating-label absolute left-3.5 z-10 origin-[0_0] pointer-events-none transition-all duration-200 ease-out select-none whitespace-nowrap truncate max-w-[calc(100%-2.5rem)] leading-none",
                // Resting position (unfocused and empty)
                "top-1/2 -translate-y-1/2 text-foreground/50 text-sm bg-transparent",
                // Focus-within floating notch
                "group-focus-within:-top-2.5 group-focus-within:translate-y-0 group-focus-within:scale-75 group-focus-within:font-medium group-focus-within:text-primary group-focus-within:bg-surface group-focus-within:px-1.5 group-focus-within:rounded-sm",
                // Value present floating notch
                hasValue &&
                  "-top-2.5 translate-y-0 scale-75 font-medium text-foreground/75 bg-surface px-1.5 rounded-sm",
                error && "group-focus-within:text-danger text-danger/80"
              )}
            >
              {label}
            </div>
          )}

          <div className="relative w-full overflow-visible">{children}</div>
        </div>

        {(feedback || reserveSpace) && (
          <div className={feedbackClass}>{feedback}</div>
        )}

        <FieldSlot placement="afterField" field={field} />
      </div>
    );
  }

  if (isSide) {
    return (
      <div className="relative w-full">
        <FieldSlot placement="beforeField" field={field} />
        <Grid
          columns={12}
          gap="sm"
          align="start"
          className={cn(
            "form-field-inner relative w-full md:gap-x-12",
            styles.innerWrapper
          )}
          data-align={align}
          data-error={!!error}
        >
          {/* Label Layer */}
          {!isHidden && label && (
            <GridItem
              colSpan={{ md: 4 }}
              className={cn("form-field-inner__label-zone", labelOffset)}
            >
              {label}
            </GridItem>
          )}

          {/* Content Layer */}
          <GridItem
            colSpan={{ md: 8 }}
            className={cn(
              "form-field-inner__content-zone relative w-full min-w-0",
              styles.contentWrapper
            )}
          >
            <Flex direction="col" gap="sm">
              <div className="relative w-full overflow-visible">{children}</div>
              {(feedback || reserveSpace) && (
                <div className={feedbackClass}>{feedback}</div>
              )}
            </Flex>
          </GridItem>
        </Grid>
        <FieldSlot placement="afterField" field={field} />
      </div>
    );
  }

  if (isInline) {
    return (
      <div className="relative w-full">
        <FieldSlot placement="beforeField" field={field} />
        <Flex
          direction="row"
          align="center"
          justify="between"
          gap="md"
          className={cn("form-field-inner relative w-full", styles.innerWrapper)}
          data-align={align}
          data-error={!!error}
        >
          {/* Label Layer */}
          {!isHidden && label && (
            <div
              className={cn("form-field-inner__label-zone shrink-0", labelOffset)}
            >
              {label}
            </div>
          )}

          {/* Content Layer */}
          <div
            className={cn(
              "form-field-inner__content-zone relative min-w-0 flex-grow text-right",
              styles.contentWrapper
            )}
          >
            <Flex direction="col" gap="sm" className="items-end">
              <div className="relative w-auto overflow-visible">{children}</div>
              {(feedback || reserveSpace) && (
                <div className={cn(feedbackClass, "text-right")}>{feedback}</div>
              )}
            </Flex>
          </div>
        </Flex>
        <FieldSlot placement="afterField" field={field} />
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <FieldSlot placement="beforeField" field={field} />
      <Flex
        direction="col"
        gap="xs"
        className={cn("form-field-inner relative w-full", styles.innerWrapper)}
        data-align={align}
        data-error={!!error}
      >
        {/* Label Layer */}
        {!isHidden && label && (
          <div className={cn("form-field-inner__label-zone w-full")}>{label}</div>
        )}

        {/* Content Layer */}
        <Flex
          direction="col"
          gap="sm"
          className={cn(
            "form-field-inner__content-zone relative w-full",
            styles.contentWrapper
          )}
        >
          <div className="relative w-full overflow-visible">{children}</div>
          {(feedback || reserveSpace) && (
            <div className={feedbackClass}>{feedback}</div>
          )}
        </Flex>
      </Flex>
      <FieldSlot placement="afterField" field={field} />
    </div>
  );
};
