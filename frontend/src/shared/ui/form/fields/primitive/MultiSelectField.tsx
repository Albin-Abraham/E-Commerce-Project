import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, X } from "lucide-react";
import { AnimatePresence, m } from "framer-motion";

import { BadgeOverflowPopover } from "@ui/form/atoms/BadgeOverflowPopover";
import type { FieldBadgeConfig, FormField } from "@ui/form/fields";
import { BelowSurfaceContext } from "@ui/form/structure/OuterWrapper";

import { resolveBadgeStyles } from "@ui/form/utils/badge-utils";
import { getI18nString } from "@ui/form/utils/field-utils";
import type { FieldLayout } from "@ui/form/utils/form-layout-utils";
import { cn } from "@ui/form/utils/form-styles";

import { computeDropdownAnchor } from "./utils/dropdown-anchor";

export interface MultiSelectFieldProps {
  field: FormField;
  value?: any[];
  onChange?: (val: any[] | undefined) => void;
  layout?: FieldLayout;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  styles?: { input?: string; [key: string]: string | undefined };
  multipleDisplay?: "inline" | "area" | "summary";
  maxVisibleTags?: number;
  badge?: FieldBadgeConfig;
  native?: boolean;
}

export const MultiSelectField = React.forwardRef<
  HTMLSelectElement,
  MultiSelectFieldProps
>(
  (
    {
      field,
      value,
      onChange,
      layout,
      placeholder,
      disabled,
      error,
      className,
      styles,
      multipleDisplay = "inline",
      maxVisibleTags = 3,
      badge: propBadge,
      native = false,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const belowSurfaceContainer = useContext(BelowSurfaceContext);

    const placeholderText =
      placeholder ||
      getI18nString(layout?.placeholder) ||
      (field.layout ? getI18nString((field.layout as any).placeholder) : "") ||
      "Select options...";

    const safeValue = Array.isArray(value) ? value : [];
    const options = field.options || [];

    const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedValues = Array.from(e.target.selectedOptions).map(
        (opt) => opt.value
      );
      onChange?.(selectedValues);
    };

    const toggleOption = (optVal: any) => {
      const exists = safeValue.some((v) => String(v) === String(optVal));
      if (exists) {
        onChange?.(safeValue.filter((v) => String(v) !== String(optVal)));
      } else {
        onChange?.([...safeValue, optVal]);
      }
    };

    const removeValue = (valToRemove: any) => {
      const nextArr = safeValue.filter(
        (v) => String(v) !== String(valToRemove)
      );
      onChange?.(nextArr);
    };

    const clearAll = () => {
      onChange?.([]);
    };

    const selectedOptions = safeValue.map((val) => {
      const found = options.find((opt) => String(opt.value) === String(val));
      return found || { value: val, label: String(val) };
    });

    const isDisabled = disabled ?? layout?.disabled ?? false;
    const ariaKeyShortcuts =
      (field.properties as any)?.ariaKeyShortcuts ||
      (layout as any)?.ariaKeyShortcuts;

    // Resolve 100% extensible badge styles from Form Definition
    const badgeStyles = useMemo(
      () => resolveBadgeStyles(field, styles, propBadge),
      [field, styles, propBadge]
    );

    // Update DOM rect for floating menu positioning
    const updateRect = useCallback(() => {
      if (containerRef.current) {
        const anchorEl =
          containerRef.current.closest<HTMLElement>(
            "[data-unit='input-outer-wrapper'], .input-outer-wrapper"
          ) || containerRef.current;
        setRect(anchorEl.getBoundingClientRect());
      }
    }, []);

    useEffect(() => {
      if (isOpen) {
        updateRect();
        window.addEventListener("scroll", updateRect, true);
        window.addEventListener("resize", updateRect);
        return () => {
          window.removeEventListener("scroll", updateRect, true);
          window.removeEventListener("resize", updateRect);
        };
      }
    }, [isOpen, updateRect, safeValue.length]);

    // Close on outside click
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as Node;
        if (
          containerRef.current &&
          !containerRef.current.contains(target) &&
          menuRef.current &&
          !menuRef.current.contains(target)
        ) {
          setIsOpen(false);
        }
      };
      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [isOpen]);

    // If native HTML multiple select is explicitly requested
    if (native) {
      return (
        <div className="w-full min-w-0 flex flex-col gap-2">
          <select
            ref={ref}
            id={field.id}
            name={field.name}
            multiple
            disabled={isDisabled}
            value={safeValue}
            onChange={handleSelect}
            aria-keyshortcuts={ariaKeyShortcuts || undefined}
            className={cn(
              "w-full bg-transparent border-none outline-none ring-0",
              "text-foreground text-[length:var(--text-base)]",
              "h-32 p-2 custom-scrollbar",
              styles?.input,
              className
            )}
            aria-invalid={!!error}
          >
            {options.map((opt, i) => {
              const label = getI18nString(opt.label);
              return (
                <option
                  key={`${opt.value}-${i}`}
                  value={opt.value}
                  className="py-2 px-3 text-[length:var(--text-sm)] focus:bg-primary/10"
                >
                  {label}
                </option>
              );
            })}
          </select>
          <p className="text-[10px] text-muted italic">
            Hold Ctrl / Cmd to select multiple options
          </p>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className="w-full min-w-0 flex flex-col relative"
        data-field-root={field.id}
        data-field-type="multiselect"
        data-field-name={field.name}
      >
        {/* Hidden select for standard form binding, ref forwarding, and accessibility */}
        <select
          ref={ref}
          id={field.id}
          name={field.name}
          multiple
          disabled={isDisabled}
          value={safeValue}
          onChange={handleSelect}
          aria-keyshortcuts={ariaKeyShortcuts || undefined}
          role="listbox"
          className="sr-only"
        >
          {options.map((opt, i) => (
            <option key={`${opt.value}-${i}`} value={opt.value}>
              {getI18nString(opt.label)}
            </option>
          ))}
        </select>

        {/* Interactive Trigger Surface */}
        <div
          onClick={() => {
            if (!isDisabled) {
              setIsOpen(!isOpen);
              updateRect();
            }
          }}
          className={cn(
            "flex items-center flex-wrap gap-1.5 w-full min-w-0 min-h-0 relative pr-9 cursor-pointer py-0.5",
            isDisabled && "opacity-50 cursor-not-allowed"
          )}
        >
          {/* Empty placeholder or Area mode prompt (ensures trigger surface is never hollow) */}
          {(selectedOptions.length === 0 || multipleDisplay === "area") && (
            <span
              data-unit="multiselect-placeholder"
              className="text-foreground/40 italic text-sm select-none py-0.5 truncate flex-1 min-w-0"
            >
              {placeholderText}
            </span>
          )}

          {/* Inline Chips (when multipleDisplay === "inline") */}
          {multipleDisplay === "inline" && selectedOptions.length > 0 && (
            <>
              {selectedOptions.slice(0, maxVisibleTags).map((opt) => {
                const optLabel = getI18nString(opt.label);
                return (
                  <span
                    key={String(opt.value)}
                    data-unit="selected-tag"
                    className={badgeStyles.tagClass}
                  >
                    <span>{optLabel}</span>
                    {!isDisabled && (
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeValue(opt.value);
                        }}
                        className={badgeStyles.removeButtonClass}
                        aria-label={`Remove ${optLabel}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                );
              })}

              {/* Overflow +N Badge Popover */}
              {selectedOptions.length > maxVisibleTags && (
                <BadgeOverflowPopover
                  count={selectedOptions.length - maxVisibleTags}
                  overflowOptions={selectedOptions.slice(maxVisibleTags)}
                  onRemove={removeValue}
                  badgeClass={badgeStyles.overflowBadgeClass}
                  tagClass={badgeStyles.tagClass}
                  removeButtonClass={badgeStyles.removeButtonClass}
                  disabled={isDisabled}
                />
              )}
            </>
          )}

          {/* Summary Mode */}
          {multipleDisplay === "summary" && selectedOptions.length > 0 && (
            <span
              data-unit="selected-summary-text"
              className="text-foreground font-medium text-xs truncate max-w-[calc(100%-40px)] mr-1"
            >
              {selectedOptions
                .slice(0, maxVisibleTags)
                .map((o) => getI18nString(o.label))
                .join(", ")}
              {selectedOptions.length > maxVisibleTags
                ? ` +${selectedOptions.length - maxVisibleTags}`
                : ""}
            </span>
          )}

          {/* Dropdown Chevron toggle */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 shrink-0 text-foreground/40">
            <button
              type="button"
              tabIndex={-1}
              className="p-1 hover:text-foreground transition-colors cursor-pointer"
              aria-label="Toggle dropdown"
            >
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>
          </div>
        </div>

        {/* Dedicated Area of Selected Values: projected to belowSurfaceContainer on the next line outside input card */}
        {multipleDisplay === "area" &&
          selectedOptions.length > 0 &&
          (() => {
            const areaContent = (
              <div
                className={badgeStyles.selectedAreaClass}
                data-unit="selected-values-area"
              >
                {selectedOptions.map((opt) => {
                  const optLabel = getI18nString(opt.label);
                  return (
                    <span
                      key={String(opt.value)}
                      data-unit="selected-area-tag"
                      className={badgeStyles.tagClass}
                    >
                      <span>{optLabel}</span>
                      {!isDisabled && (
                        <button
                          type="button"
                          onClick={() => removeValue(opt.value)}
                          className={badgeStyles.removeButtonClass}
                          aria-label={`Remove ${optLabel}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  );
                })}
                {selectedOptions.length > 1 && !isDisabled && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-xs text-foreground/50 hover:text-foreground underline underline-offset-2 ml-1 cursor-pointer transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
            );

            return belowSurfaceContainer
              ? createPortal(areaContent, belowSurfaceContainer)
              : areaContent;
          })()}

        {/* Floating Dropdown Menu via Portal */}
        {isOpen &&
          rect &&
          createPortal(
            (() => {
              const { top, maxHeight, transformOrigin } = computeDropdownAnchor(
                rect,
                { panelMaxHeight: 280, margin: 4 }
              );
              return (
                <AnimatePresence>
                  <m.div
                    ref={menuRef}
                    initial={{ opacity: 0, scale: 0.98, y: -2 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98, y: -2 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    style={{
                      position: "fixed",
                      top,
                      left: rect.left,
                      width: Math.max(rect.width, 240),
                      maxHeight,
                      transformOrigin,
                      zIndex: 9999,
                    }}
                    className={cn(
                      "bg-surface border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col",
                      "backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
                    )}
                  >
                    <div className="overflow-y-auto max-h-[260px] p-1.5 pb-2.5 custom-scrollbar flex flex-col gap-1">
                      {options.length === 0 ? (
                        <div className="py-4 text-center text-xs leading-5 text-foreground/50">
                          No options available
                        </div>
                      ) : (
                        options.map((opt) => {
                          const optLabel = getI18nString(opt.label);
                          const isSelected = safeValue.some(
                            (v) => String(v) === String(opt.value)
                          );
                          return (
                            <button
                              key={String(opt.value)}
                              type="button"
                              onClick={() => toggleOption(opt.value)}
                              className={cn(
                                "flex items-center justify-between w-full px-3 py-2 text-left rounded-lg text-xs leading-5 font-medium transition-colors cursor-pointer",
                                isSelected
                                  ? "bg-primary/10 text-primary font-medium hover:bg-primary/15"
                                  : "text-foreground/80 hover:bg-foreground/5 hover:text-foreground"
                              )}
                            >
                              <span className="truncate leading-5">{optLabel}</span>
                              {isSelected && (
                                <Check className="w-4 h-4 text-primary shrink-0 ml-2" />
                              )}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </m.div>
                </AnimatePresence>
              );
            })(),
            document.body
          )}
      </div>
    );
  }
);
MultiSelectField.displayName = "MultiSelectField";
