import React from "react";

import { useFormRegistry } from "@ui/form/context/FormRegistryContext";
import { useFormTheme } from "@ui/form/context/FormThemeContext";
import { useAccordionNode } from "@ui/form/context/LayoutManagerContext";
import { cn } from "@ui/form/utils/form-styles";
import { resolveTranslation } from "@ui/form/utils/i18n.utils";
import { AnimatePresence, m } from "framer-motion";
import { ChevronDown } from "lucide-react";

import type { StructuralFieldProps } from "./types";

/**
 * AccordionField
 *
 * A collapsible section that hides/shows its child fields on click.
 * Works as a structural container — child fields are rendered inside when open.
 *
 * ## Schema Usage
 * ```ts
 * {
 *   key: "advanced",           // key sets both id and name
 *   type: "accordion",
 *   label: "Advanced Settings",
 *   defaultOpen: false,        // via customData.defaultOpen
 *   fields: [
 *     { key: "timeout", type: "number", label: "Timeout (ms)" },
 *   ]
 * }
 * ```
 */
export const AccordionField: React.FC<
  StructuralFieldProps & { children?: React.ReactNode }
> = ({ field, children, className, styles }) => {
  const { i18nNamespace } = useFormRegistry();
  const theme = useFormTheme();
  const isCompact = theme.density === "compact";
  const defaultOpen =
    field.customData?.defaultOpen ??
    (field.layout as { defaultOpen?: boolean } | undefined)?.defaultOpen ??
    false;

  // Phase 3: Register with LayoutManager — enables imperative control
  // (e.g., layoutManager.accordion.setOpen(field.id, true) to expand on error)
  const { isOpen, toggle } = useAccordionNode(field.id, defaultOpen);

  const label = resolveTranslation(field.label, i18nNamespace);
  const description = resolveTranslation(field.description, i18nNamespace);

  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-border/60 bg-surface/90 backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-primary/40",
        isOpen && "shadow-md shadow-primary/5 border-primary/40",
        styles?.base,
        className
      )}
      data-unit="accordion"
      data-field-id={field.id}
      data-open={isOpen ? "true" : "false"}
    >
      {/* ── Trigger ─────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={() => toggle()}
        aria-expanded={isOpen}
        className={cn(
          "w-full flex items-center justify-between gap-3",
          isCompact ? "px-4 py-3" : "px-5 py-4",
          "text-left",
          "bg-subtle/30 hover:bg-subtle/60 dark:hover:bg-white/5",
          "transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        )}
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          {label && (
            <span className="text-[var(--text-sm)] font-semibold text-foreground leading-tight truncate">
              {label}
            </span>
          )}
          {description && (
            <span className="text-[var(--text-xs)] text-foreground/50 leading-relaxed">
              {description}
            </span>
          )}
        </div>

        <m.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex-shrink-0 text-foreground/40"
        >
          <ChevronDown size={16} strokeWidth={2.5} />
        </m.div>
      </button>

      {/* ── Collapsible Body ────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <m.div
            key="accordion-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            style={{ overflow: "hidden" }}
          >
            <div
              className={cn(
                isCompact ? "px-4 py-3" : "px-5 py-4",
                "border-t border-border/50",
                styles?.content
              )}
            >
              {children}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
};

AccordionField.displayName = "AccordionField";
