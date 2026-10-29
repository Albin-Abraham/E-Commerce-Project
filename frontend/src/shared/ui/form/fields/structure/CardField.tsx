import React from "react";
import { useTranslation } from "react-i18next";

import { useFormTheme } from "@ui/form/context/FormThemeContext";
import { classNames } from "@ui/form/utils/field-utils";
import { cn } from "@ui/form/utils/form-styles";
import { resolveTranslation } from "@ui/form/utils/i18n.utils";
import { Box } from "@ui/layout/Box";
import { Flex } from "@ui/layout/Flex";
import { Layer } from "@ui/layout/Layer";

import type { StructuralFieldProps } from "./types";

export const CardWrapper: React.FC<{
  elevation?: "none" | "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
  "data-unit"?: string;
  "data-field-id"?: string;
}> = ({ elevation = "md", className, children, ...dataProps }) => {
  const elevationClasses: Record<string, string> = {
    none: "border border-border/40",
    sm: "shadow-sm  border border-border/60",
    md: "shadow-premium border border-border/50",
    lg: "shadow-2xl border border-border/80 shadow-primary/5",
  };

  return (
    <Box
      className={cn(
        "bg-surface/90 backdrop-blur-md rounded-2xl transition-all duration-500 ease-out",
        "relative isolation-auto hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
        "animate-in fade-in slide-in-from-bottom-4 duration-700",
        elevationClasses[elevation] ?? elevationClasses.md,
        className
      )}
      {...dataProps}
    >
      <Layer
        position="absolute"
        inset
        className="rounded-2xl border border-white/5 pointer-events-none"
      />
      {children}
    </Box>
  );
};

export const CardHeader: React.FC<{
  compact?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ compact = false, className, children }) => (
  <div
    data-part="card-header"
    className={cn(
      "relative border-b border-border/40",
      "bg-subtle/30 backdrop-blur-sm rounded-t-2xl",
      compact ? "px-6 py-3" : "px-6 py-4",
      className
    )}
  >
    <Flex direction="col" gap="xs">
      {children}
    </Flex>
  </div>
);

export const CardTitle: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <h3
    data-part="card-title"
    className={cn(
      "text-[var(--text-lg)] font-bold text-foreground tracking-tight leading-tight",
      className
    )}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <p
    className={cn(
      "text-[var(--text-xs)] text-foreground/60 leading-relaxed font-medium",
      className
    )}
  >
    {children}
  </p>
);

export const CardBody: React.FC<{
  compact?: boolean;
  padding?: string;
  className?: string;
  children: React.ReactNode;
}> = ({ compact = false, padding, className, children }) => (
  <div
    data-part="card-body"
    className={cn("bg-transparent", compact ? "px-6 py-4" : "p-6", className)}
    style={padding ? { padding } : undefined}
  >
    {children}
  </div>
);

export const CardFooter: React.FC<{
  compact?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ compact = false, className, children }) => (
  <div
    data-part="card-footer"
    className={cn(
      "bg-subtle/50 border-t border-border/40 rounded-b-xl",
      compact ? "px-6 py-3" : "px-6 py-4",
      className
    )}
  >
    {children}
  </div>
);

export const CardField: React.FC<StructuralFieldProps> = ({
  field,
  styles,
  className,
  children,
}) => {
  useTranslation();
  const theme = useFormTheme();
  const isCompact = theme.density === "compact";
  const props = field.properties || {};
  const layout = (field.layout as any) || {};
  const uiMeta = field.meta?.ui as any;
  const elevation = (props.elevation ||
    uiMeta?.cardElevation ||
    layout.elevation ||
    "md") as
    | "none"
    | "sm"
    | "md"
    | "lg";

  const hasHeader = !!(
    field.label ||
    field.description ||
    field.customData?.description
  );
  const hasFooter = !!(props.footer || props.footerContent);
  const fieldLabel = resolveTranslation(field.label);
  const fieldDescription =
    resolveTranslation(field.description) ||
    field.customData?.description ||
    "";

  return (
    <CardWrapper
      elevation={elevation}
      data-unit="card"
      data-field-id={field.id}
      className={classNames(styles?.base, styles?.wrapper, className)}
    >
      {hasHeader && (
        <CardHeader
          compact={isCompact}
          className={
            styles?.label ? `bg-transparent border-none ${styles.label}` : ""
          }
        >
          {fieldLabel && (
            <CardTitle className={styles?.label}>{fieldLabel}</CardTitle>
          )}
          {fieldDescription && (
            <CardDescription className={styles?.description}>
              {fieldDescription}
            </CardDescription>
          )}
        </CardHeader>
      )}
      <CardBody
        compact={isCompact}
        padding={props.padding as string | undefined}
      >
        {children}
      </CardBody>
      {hasFooter && (
        <CardFooter compact={isCompact}>
          {props.footerContent ?? (
            <span className="text-[10px] text-muted uppercase tracking-widest font-black">
              {props.footer as string}
            </span>
          )}
        </CardFooter>
      )}
    </CardWrapper>
  );
};
