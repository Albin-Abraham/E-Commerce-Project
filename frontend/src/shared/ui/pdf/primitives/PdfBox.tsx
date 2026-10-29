import React from "react";
import { View } from "@react-pdf/renderer";

import { usePdfTheme } from "../core/PdfThemeContext";
import type { BoxNodeDefinition } from "../runtime/document.runtime.types";

interface PdfBoxProps extends Omit<BoxNodeDefinition, "type" | "children"> {
  children?: React.ReactNode;
}

const ALIGN_MAP = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  stretch: "stretch",
} as const;

const JUSTIFY_MAP = {
  start: "flex-start",
  center: "center",
  end: "flex-end",
  between: "space-between",
  around: "space-around",
} as const;

export const PdfBox: React.FC<PdfBoxProps> = ({
  layout = "vertical",
  variant,
  gap = "none",
  align = "start",
  justify = "start",
  padding,
  margin_bottom,
  bg,
  border_color,
  radius,
  flex,
  width,
  keep_together = false,
  break_before = false,
  children,
}) => {
  const theme = usePdfTheme();

  const isHorizontal = layout === "horizontal";
  const gapValue = theme.spacing[gap] ?? 0;
  const padValue = padding ? theme.spacing[padding] ?? 0 : 0;
  const mbValue = margin_bottom ? theme.spacing[margin_bottom] ?? 0 : 0;
  const bgValue = bg ? theme.colors[bg] : undefined;
  const borderValue = border_color ? theme.colors[border_color] : undefined;
  const radiusValue = radius ? theme.radius[radius] ?? 0 : 0;

  // Preset variant treatments
  let variantStyles: any = {};
  if (variant === "card" || variant === "bordered") {
    variantStyles = {
      backgroundColor: bgValue ?? theme.colors.surface,
      borderColor: borderValue ?? theme.colors.border,
      borderWidth: 1,
      borderRadius: radiusValue || theme.radius.md,
      padding: padValue || theme.spacing.md,
    };
  } else if (variant === "summary-panel") {
    variantStyles = {
      backgroundColor: bgValue ?? theme.colors.surface,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
      padding: padValue || theme.spacing.md,
      borderRadius: radiusValue || theme.radius.sm,
    };
  } else if (variant === "document-header") {
    variantStyles = {
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      marginBottom: theme.spacing.md,
    };
  }

  return (
    <View
      wrap={!keep_together}
      break={break_before}
      style={{
        flexDirection: isHorizontal ? "row" : "column",
        alignItems: ALIGN_MAP[align] as any,
        justifyContent: JUSTIFY_MAP[justify] as any,
        gap: gapValue,
        padding: padValue,
        marginBottom: mbValue,
        backgroundColor: bgValue,
        borderRadius: radiusValue,
        flex,
        width: typeof width === "number" ? width : undefined,
        ...variantStyles,
      }}
    >
      {children}
    </View>
  );
};
