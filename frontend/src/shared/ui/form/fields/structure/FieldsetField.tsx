import React from "react";

import { useFormRegistry } from "@ui/form/context/FormRegistryContext";
import { cn } from "@ui/form/utils/form-styles";
import { resolveTranslation } from "@ui/form/utils/i18n.utils";

import type { StructuralFieldProps } from "./types";

/**
 * FieldsetField
 *
 * A semantic `<fieldset>` + `<legend>` wrapper for grouping related fields.
 * Improves accessibility (screen readers announce the group context for every child input)
 * and provides a native HTML landmark for form navigation.
 *
 * Unlike `section` (a `<div>` group), `fieldset` is an HTML semantic element
 * explicitly designed for grouping form controls.
 *
 * ## Schema Usage
 * ```ts
 * {
 *   key: "address",
 *   type: "fieldset",
 *   label: "Shipping Address",
 *   description: "Where should we deliver?",
 *   fields: [
 *     { key: "street", type: "text", label: "Street" },
 *     { key: "city",   type: "text", label: "City"   },
 *   ]
 * }
 * ```
 */
export const FieldsetField: React.FC<
  StructuralFieldProps & { children?: React.ReactNode }
> = ({ field, children, className, styles }) => {
  const { i18nNamespace } = useFormRegistry();
  const label = resolveTranslation(field.label, i18nNamespace);
  const description = resolveTranslation(field.description, i18nNamespace);

  return (
    <fieldset
      className={cn(
        "w-full border border-border rounded-xl px-5 pt-3 pb-5",
        "bg-transparent transition-shadow duration-200",
        styles?.base,
        className
      )}
      data-unit="fieldset"
      data-field-id={field.id}
    >
      {/* ── Legend ──────────────────────────────────────────────── */}
      {label && (
        <legend
          className={cn(
            "px-2 -ml-2 text-[var(--text-xs)] font-bold uppercase tracking-widest",
            "text-foreground/50 select-none",
            styles?.label
          )}
        >
          {label}
        </legend>
      )}

      {/* ── Description ─────────────────────────────────────────── */}
      {description && (
        <p className="text-[var(--text-xs)] text-foreground/40 mb-4 leading-relaxed">
          {description}
        </p>
      )}

      {/* ── Children ─────────────────────────────────────────────── */}
      <div className={cn("w-full min-w-0", styles?.content)}>{children}</div>
    </fieldset>
  );
};

FieldsetField.displayName = "FieldsetField";
