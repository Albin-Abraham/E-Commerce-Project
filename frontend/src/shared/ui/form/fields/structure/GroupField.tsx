import React from "react";

import { useFormSpacing } from "@ui/form/context/FormSpacingContext";
import { useFormRegistry } from "@ui/form/context/FormRegistryContext";
import { cn } from "@ui/form/utils/form-styles";
import { resolveTranslation } from "@ui/form/utils/i18n.utils";

import type { StructuralFieldProps } from "./types";

/**
 * GroupField
 *
 * An inline horizontal row of fields that share a single group label.
 * Each child field renders without its own individual label, relying on
 * the group label for context (e.g., "Full Name" containing "First" + "Last").
 *
 * This fills the gap between a full `section` (vertical stack) and raw `flex` layout —
 * Group is a semantic, labeled, horizontal cluster.
 *
 * ## Schema Usage
 * ```ts
 * {
 *   key: "full_name",
 *   type: "group",
 *   label: "Full Name",
 *   required: true,
 *   layout: { gap: "gap-4" },     // via customData.gap
 *   fields: [
 *     { key: "first_name", type: "text", label: "First", placeholder: "Alice" },
 *     { key: "last_name",  type: "text", label: "Last",  placeholder: "Smith" },
 *   ]
 * }
 * ```
 */
export const GroupField: React.FC<
  StructuralFieldProps & { children?: React.ReactNode }
> = ({ field, children, className, styles }) => {
  const { i18nNamespace } = useFormRegistry();
  const label = resolveTranslation(field.label, i18nNamespace);
  const description = resolveTranslation(field.description, i18nNamespace);
  const isRequired = !!field.required;
  const spacing = useFormSpacing();
  const gap =
    field.customData?.gap ?? spacing.fieldHorizontal ?? "gap-3";

  return (
    <div
      className={cn("w-full flex flex-col gap-1.5", styles?.base, className)}
      role="group"
      aria-labelledby={label ? `${field.id}-group-label` : undefined}
      data-unit="group"
      data-field-id={field.id}
    >
      {/* ── Group Label ─────────────────────────────────────────── */}
      {label && (
        <div
          className="flex items-baseline gap-1.5"
          id={`${field.id}-group-label`}
        >
          <span
            className={cn(
              "text-[var(--text-sm)] font-semibold text-foreground leading-tight",
              styles?.label
            )}
          >
            {label}
          </span>
          {isRequired && (
            <span
              className="text-danger text-[var(--text-xs)]"
              aria-hidden="true"
            >
              *
            </span>
          )}
        </div>
      )}

      {/* ── Description ─────────────────────────────────────────── */}
      {description && (
        <p className="text-[var(--text-xs)] text-foreground/50 leading-relaxed -mt-0.5">
          {description}
        </p>
      )}

      {/* ── Inline Field Row ────────────────────────────────────── */}
      {/*
       * Children arrive as individual FieldRouter outputs (each wrapped in a flex-1 div).
       * The flex layout makes them share the row evenly.
       */}
      <div
        className={cn(
          "flex flex-row flex-wrap items-start w-full",
          gap,
          styles?.content
        )}
        data-layout="group-row"
      >
        {children}
      </div>
    </div>
  );
};

GroupField.displayName = "GroupField";
