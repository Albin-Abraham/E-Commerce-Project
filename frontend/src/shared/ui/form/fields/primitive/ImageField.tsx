import React from "react";

import { cn } from "@ui/form/utils/form-styles";

import type { AtomicFieldProps } from "./types";

/**
 * ImageField: A presentational primitive for rendering images within the form.
 * Supports src, alt, and overlay properties via the schema.
 */
export const ImageField: React.FC<AtomicFieldProps> = ({
  field,
  className,
  styles,
}) => {
  const src = field.initialValue || field.properties?.src;
  const alt = field.properties?.alt || "Form Image";
  const overlay = field.properties?.overlay === true;

  if (!src) {
    return (
      <div
        className={cn(
          "w-full aspect-video bg-subtle border-2 border-dashed border-border flex items-center justify-center rounded-lg",
          className
        )}
      >
        <span className="text-foreground/30 text-xs font-medium">
          No Image Source Provided
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "form-static-image relative w-full overflow-hidden rounded-[var(--radius-lg)]",
        styles?.wrapper,
        className
      )}
    >
      <img
        src={src}
        alt={alt}
        className={cn("w-full h-auto object-cover", styles?.input)}
      />
      {overlay && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
      )}
      {field.description && (
        <p className="mt-2 text-xs text-foreground/50 text-center">
          {typeof field.description === "string"
            ? field.description
            : field.description.en}
        </p>
      )}
    </div>
  );
};
