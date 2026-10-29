import React from "react";

import type { FormField } from "@ui/form/fields";
import { cn } from "@ui/form/utils/form-styles";
import { getIcon } from "@ui/form/utils/icon-registry";
import { Loader2 } from "lucide-react";

export interface ButtonFieldProps {
  name?: string;
  type?: string;
  component?: string | React.ComponentType<any>;
  id?: string;
  label?: string | any;
  disabled?: boolean;
  field?: Partial<FormField>;
  styles?: {
    input?: string;
  };
  className?: string;
  onClick?: (e?: React.MouseEvent) => void;
  tabIndex?: number;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
  leftContent?: React.ReactNode;
  rightContent?: React.ReactNode;
  error?: any;
  errorMessage?: string;
  value?: any;
  onChange?: any;
  layout?: any;
  variant?:
    | "solid"
    | "bordered"
    | "outline"
    | "flat"
    | "soft"
    | "ghost"
    | "light"
    | "shadow";
  color?:
    | "primary"
    | "secondary"
    | "danger"
    | "destructive"
    | "success"
    | "warning"
    | "default"
    | "neutral";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  fullWidth?: boolean;
  [key: string]: unknown;
}

const getButtonVariantClasses = (
  variant: string = "solid",
  color: string = "primary"
): string => {
  const isSecondary = color === "secondary";
  const isDanger = color === "danger" || color === "destructive";
  const isSuccess = color === "success";
  const isWarning = color === "warning";
  const isDefault = color === "default" || color === "neutral";

  switch (variant) {
    case "bordered":
    case "outline": {
      if (isSecondary)
        return "border border-border text-foreground hover:bg-muted/50 bg-transparent";
      if (isDanger)
        return "border border-destructive/80 text-destructive hover:bg-destructive/10 bg-transparent";
      if (isSuccess)
        return "border border-success/80 text-success hover:bg-success/10 bg-transparent";
      if (isWarning)
        return "border border-warning/80 text-warning hover:bg-warning/10 bg-transparent";
      if (isDefault)
        return "border border-border text-foreground/80 hover:bg-muted/40 bg-transparent";
      return "border border-primary text-primary hover:bg-primary/10 bg-transparent";
    }
    case "flat":
    case "soft": {
      if (isSecondary)
        return "bg-muted text-foreground hover:bg-muted/80 border-transparent";
      if (isDanger)
        return "bg-destructive/15 text-destructive hover:bg-destructive/25 border-transparent";
      if (isSuccess)
        return "bg-success/15 text-success hover:bg-success/25 border-transparent";
      if (isWarning)
        return "bg-warning/15 text-warning hover:bg-warning/25 border-transparent";
      if (isDefault)
        return "bg-muted/60 text-foreground/80 hover:bg-muted border-transparent";
      return "bg-primary/15 text-primary hover:bg-primary/25 border-transparent";
    }
    case "ghost": {
      if (isDanger)
        return "text-destructive hover:bg-destructive/10 bg-transparent border-transparent";
      if (isSuccess)
        return "text-success hover:bg-success/10 bg-transparent border-transparent";
      if (isWarning)
        return "text-warning hover:bg-warning/10 bg-transparent border-transparent";
      return "text-foreground hover:bg-muted hover:text-foreground bg-transparent border-transparent";
    }
    case "light": {
      if (isSecondary)
        return "text-foreground/80 hover:bg-muted/40 bg-transparent border-transparent";
      if (isDanger)
        return "text-destructive hover:bg-destructive/10 bg-transparent border-transparent";
      return "text-primary hover:bg-primary/10 bg-transparent border-transparent";
    }
    case "shadow": {
      if (isSecondary)
        return "bg-secondary text-secondary-foreground shadow-md hover:bg-secondary/90 border-transparent";
      if (isDanger)
        return "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/25 hover:bg-destructive/90 border-transparent";
      if (isSuccess)
        return "bg-success text-success-foreground shadow-lg shadow-success/25 hover:bg-success/90 border-transparent";
      return "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:bg-primary/95 border-transparent";
    }
    case "solid":
    default: {
      if (isSecondary)
        return "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-transparent shadow-xs";
      if (isDanger)
        return "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-transparent shadow-xs";
      if (isSuccess)
        return "bg-success text-success-foreground hover:bg-success/90 border-transparent shadow-xs";
      if (isWarning)
        return "bg-warning text-warning-foreground hover:bg-warning/90 border-transparent shadow-xs";
      if (isDefault)
        return "bg-muted text-foreground hover:bg-muted/80 border border-border/40 shadow-xs";
      return "bg-primary text-primary-foreground hover:bg-primary/90 border-transparent shadow-xs";
    }
  }
};

const getButtonSizeClasses = (size: string = "md"): string => {
  switch (size) {
    case "sm":
      return "h-8 px-3 text-xs gap-1.5 rounded-lg";
    case "lg":
      return "h-12 px-6 text-base gap-2.5 rounded-xl";
    case "md":
    default:
      return "h-10 px-4 text-sm gap-2 rounded-xl";
  }
};

/**
 * ButtonField - Native action component for the Form Engine.
 * Supports variant themes (solid, bordered/outline, flat, ghost, light, shadow),
 * semantic color palettes (primary, secondary, danger, success, warning, default),
 * sizing (sm, md, lg), loading state with spinner, and full-width layout.
 */
export const ButtonField: React.FC<ButtonFieldProps> = ({
  name,
  type,
  component,
  id,
  label,
  disabled,
  field,
  styles = {},
  className,
  onClick,
  tabIndex,
  startContent: propStartContent,
  endContent: propEndContent,
  leftContent: propLeftContent,
  rightContent: propRightContent,
  error: _error,
  errorMessage: _errorMessage,
  value: _value,
  onChange: _onChange,
  layout,
  variant: propVariant,
  color: propColor,
  size: propSize,
  isLoading: propIsLoading,
  fullWidth: propFullWidth,
  ...rest
}) => {
  const resolvedName = name ?? field?.name;
  const resolvedType = type ?? field?.type ?? "button";
  const resolvedId = id ?? field?.id ?? resolvedName;
  const resolvedComponent =
    typeof component === "string"
      ? component
      : typeof field?.component === "string"
        ? field.component
        : "button";

  const resolvedLabel = label ?? field?.label;
  const { properties = {}, meta = {} } = field || {};

  const resolvedVariant = String(
    propVariant ||
      properties.variant ||
      meta.ui?.variant ||
      (rest as any).variant ||
      "solid"
  );
  const resolvedColor = String(
    propColor ||
      properties.color ||
      properties.intent ||
      meta.ui?.color ||
      meta.ui?.intent ||
      (rest as any).color ||
      (rest as any).intent ||
      "primary"
  );
  const resolvedSize = String(
    propSize || properties.size || layout?.size || (rest as any).size || "md"
  );
  const isLoading = Boolean(
    propIsLoading || properties.isLoading || (rest as any).isLoading || false
  );
  const isFullWidth = Boolean(
    propFullWidth ||
    properties.fullWidth ||
    layout?.fullWidth ||
    (rest as any).fullWidth ||
    false
  );

  const iconSize = resolvedSize === "sm" ? 14 : resolvedSize === "lg" ? 20 : 16;
  const ariaKeyShortcuts =
    properties.ariaKeyShortcuts ||
    (properties as any)["aria-keyshortcuts"] ||
    (rest as any)["aria-keyshortcuts"];

  const isDisabled = Boolean(
    disabled ??
    (field?.enabled === false ? true : undefined) ??
    field?.properties?.disabled ??
    layout?.disabled ??
    isLoading ??
    false
  );

  // Dynamic Left Content
  const resolvedStartContent = (() => {
    if (isLoading) {
      return <Loader2 size={iconSize} className="shrink-0 animate-spin" />;
    }
    if (propStartContent) return propStartContent;
    if (propLeftContent) return propLeftContent;
    if (properties.startContent) return properties.startContent;
    if (properties.leftContent) return properties.leftContent;
    if (meta.ui?.startContent) return meta.ui.startContent;
    if (meta.ui?.leftContent) return meta.ui.leftContent;

    const iconKey = properties.icon || properties.leftIcon || meta.ui?.icon;
    if (iconKey) {
      if (React.isValidElement(iconKey)) return iconKey;
      if (typeof iconKey === "string") {
        const IconComp = getIcon(iconKey);
        if (IconComp) return <IconComp size={iconSize} className="shrink-0" />;
      }
    }
    return null;
  })();

  // Dynamic Right Content
  const resolvedEndContent = (() => {
    if (propEndContent) return propEndContent;
    if (propRightContent) return propRightContent;
    if (properties.endContent) return properties.endContent;
    if (properties.rightContent) return properties.rightContent;
    if (meta.ui?.endContent) return meta.ui.endContent;
    if (meta.ui?.rightContent) return meta.ui.rightContent;

    const rightIconKey =
      properties.rightIcon || properties.endIcon || meta.ui?.rightIcon;
    if (rightIconKey) {
      if (React.isValidElement(rightIconKey)) return rightIconKey;
      if (typeof rightIconKey === "string") {
        const IconComp = getIcon(rightIconKey);
        if (IconComp) return <IconComp size={iconSize} className="shrink-0" />;
      }
    }
    return null;
  })();

  const variantClasses = getButtonVariantClasses(
    resolvedVariant,
    resolvedColor
  );
  const sizeClasses = getButtonSizeClasses(resolvedSize);

  return (
    <button
      id={resolvedId}
      name={resolvedName}
      type={properties.submit ? "submit" : "button"}
      tabIndex={tabIndex}
      aria-keyshortcuts={ariaKeyShortcuts || undefined}
      aria-busy={isLoading || undefined}
      data-field-name={resolvedName}
      data-field-type={resolvedType}
      data-field-component={resolvedComponent}
      data-variant={resolvedVariant}
      data-color={resolvedColor}
      data-size={resolvedSize}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all duration-200 cursor-pointer select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "active:scale-[0.98]",
        "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
        variantClasses,
        sizeClasses,
        isFullWidth && "w-full",
        styles.input,
        className
      )}
      onClick={(e) => {
        if (isDisabled || isLoading) return;
        if (onClick) onClick(e);
        if (field?.properties?.onClick) field.properties.onClick(e);
      }}
      disabled={isDisabled}
      {...(rest as any)}
    >
      {resolvedStartContent}
      {resolvedLabel && (
        <span className="truncate">
          {typeof resolvedLabel === "string"
            ? resolvedLabel
            : (resolvedLabel as any).en || String(resolvedLabel)}
        </span>
      )}
      {resolvedEndContent}
    </button>
  );
};

ButtonField.displayName = "ButtonField";
