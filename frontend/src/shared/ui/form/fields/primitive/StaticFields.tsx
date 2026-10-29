import React from "react";

import { cn } from "@ui/form/utils/form-styles";
import { resolveTranslation } from "@ui/form/utils/i18n.utils";
import { buildTypographyClasses } from "@ui/form/utils/typography";

import type { AtomicFieldProps } from "./types";

interface StaticFieldProps extends Omit<
  AtomicFieldProps,
  "onChange" | "value"
> {
  field?: Partial<FormField>;
  label?: any;
  description?: any;
  isEditor?: boolean;
}

export const HeaderField: React.FC<StaticFieldProps> = ({
  field,
  label: propLabel,
  description: propDescription,
  className,
  styles,
}) => {
  const label = resolveTranslation(propLabel ?? field?.label);

  const tagVariant = field?.properties?.typography?.variant || "h3";
  const Tag = (
    ["h1", "h2", "h3", "h4", "h5", "h6"].includes(tagVariant)
      ? tagVariant
      : "h3"
  ) as React.ElementType;

  const headingSizeClasses: Record<string, string> = {
    h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-4",
    h2: "scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0 mb-3",
    h3: "scroll-m-20 text-2xl font-semibold tracking-tight mb-2",
    h4: "scroll-m-20 text-xl font-semibold tracking-tight mb-1",
    h5: "scroll-m-20 text-lg font-semibold tracking-tight mb-1",
    h6: "scroll-m-20 text-base font-semibold tracking-tight mb-1",
  };

  const typographyClasses = buildTypographyClasses(field?.properties);
  const finalClass =
    typographyClasses || headingSizeClasses[tagVariant] || headingSizeClasses.h3;

  const alignmentClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[(field?.properties?.alignment as string) || "left"];

  const resolvedDescription = propDescription ?? field?.description;

  return (
    <div
      className={cn(
        "form-static-header w-full flex flex-col",
        !typographyClasses && alignmentClass,
        styles?.wrapper,
        className
      )}
    >
      <Tag className={cn("text-foreground", finalClass)}>{label}</Tag>
      {resolvedDescription && (
        <p
          className={cn(
            "text-foreground/50 text-[var(--text-sm)] mt-1 leading-relaxed",
            !typographyClasses && alignmentClass, // Applied here too
            styles?.description
          )}
        >
          {resolveTranslation(resolvedDescription)}
        </p>
      )}
    </div>
  );
};

export const ParagraphField: React.FC<StaticFieldProps> = ({
  field,
  label: propLabel,
  className,
  styles,
}) => {
  const content = resolveTranslation(propLabel ?? field?.label) || field?.initialValue || "";
  const isHtml = field?.customData?.html === true;

  const alignmentClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[(field?.properties?.alignment as string) || "left"];

  const typoClass = buildTypographyClasses(field?.properties);
  const baseClass =
    typoClass || "text-foreground/70 text-[var(--text-base)] leading-relaxed";

  return (
    <div
      className={cn(
        "form-static-paragraph w-full",
        baseClass,
        !typoClass && alignmentClass,
        styles?.wrapper,
        className
      )}
    >
      {isHtml ? (
        <p
          className={cn(
            "prose prose-sm max-w-none",
            !typoClass && alignmentClass, // Applied here
            styles?.text
          )}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled by schema author
          dangerouslySetInnerHTML={{ __html: content }}
        />
      ) : (
        <p className={cn(styles?.text, !typoClass && alignmentClass)}>
          {content}
        </p>
      )}
    </div>
  );
};

export const DividerField: React.FC<StaticFieldProps> = ({
  field,
  label: propLabel,
  className,
  styles,
}) => {
  const label = resolveTranslation(propLabel ?? field?.label);
  return label ? (
    // Labelled divider — "Section Label" with lines on both sides
    <div className={cn("relative py-2 w-full", styles?.wrapper, className)}>
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-transparent backdrop-blur-md px-4 text-[var(--text-xs)] font-bold uppercase tracking-[0.2em] text-foreground/40">
          {label}
        </span>
      </div>
    </div>
  ) : (
    // Plain rule
    <hr className={cn("my-2 border-border", className, styles?.wrapper)} />
  );
};

export const HtmlField: React.FC<StaticFieldProps> = ({
  field,
  className,
  styles,
}) => {
  // Use initialValue or fallback to customData.content
  const content = field?.initialValue || field?.customData?.content || "";

  if (!content) return null;

  return (
    <div
      className={cn("form-static-html w-full", styles?.wrapper, className)}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: controlled by schema author
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};
