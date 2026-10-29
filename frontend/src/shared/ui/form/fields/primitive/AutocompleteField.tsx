import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { BadgeOverflowPopover } from "@ui/form/atoms/BadgeOverflowPopover";
import { ValidationHints } from "@ui/form/atoms/ValidationHints";
import type {
  FieldBadgeConfig,
  FieldOption,
  FormField,
  VirtualizationConfig,
} from "@ui/form/fields";
import { BelowSurfaceContext } from "@ui/form/structure/OuterWrapper";

import { resolveBadgeStyles } from "@ui/form/utils/badge-utils";
import { getI18nString } from "@ui/form/utils/field-utils";
import { cn } from "@ui/form/utils/form-styles";
import { getIcon } from "@ui/form/utils/icon-registry";
import { AnimatePresence, m } from "framer-motion";
import { Check, ChevronDown, Loader2, X } from "lucide-react";

import type { AtomicFieldProps } from "./types";
import { computeDropdownAnchor } from "./utils/dropdown-anchor";
import { VirtualizedOptionList } from "./utils/VirtualizedOptionList";

// Helper to resolve icon by name
const IconRenderer = ({
  name,
  className,
}: {
  name: string;
  className?: string;
}) => {
  const IconComponent = getIcon(name);
  if (!IconComponent) return null;
  return <IconComponent className={className} />;
};

export interface AutocompleteFieldProps
  extends Omit<Partial<AtomicFieldProps<string | number | (string | number)[]>>, "field"> {
  field: FormField;
  value?: string | number | (string | number)[];
  onChange?: (val: any) => void;
  options?: FieldOption[];
  isLoading?: boolean;
  onSearch?: (query: string) => void;
  multiple?: boolean;
  freeText?: boolean;
  allowsCustomValue?: boolean;
  disabled?: boolean;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  multipleDisplay?: "inline" | "area" | "summary";
  maxVisibleTags?: number;
  badge?: FieldBadgeConfig;
  renderSelectedTag?: (option: FieldOption, onRemove: () => void) => React.ReactNode;
}

export const AutocompleteField = React.forwardRef<
  HTMLInputElement,
  AutocompleteFieldProps
>(function AutocompleteFieldInternal(
  {
    field,
    value,
    onChange,
    layout,
    options: propOptions,
    isLoading = false,
    isInvalid,
    errorMessage,
    onSearch,
    styles,
    multiple: propMultiple,
    freeText: propFreeText,
    allowsCustomValue: propAllowsCustomValue,
    disabled: propDisabled,
    onLoadMore,
    isLoadingMore = false,
    multipleDisplay: propMultipleDisplay,
    maxVisibleTags: propMaxVisibleTags,
    badge: propBadge,
    renderSelectedTag,
    ...restProps
  },
  ref
) {

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  React.useImperativeHandle(ref, () => inputRef.current!);

  const isDisabled = propDisabled ?? layout?.disabled ?? false;
  const isMultiple = propMultiple ?? (field as any).multiple ?? false;
  const allowsCustom =
    propFreeText ??
    propAllowsCustomValue ??
    (field as any).freeText ??
    (field as any).allowsCustomValue ??
    false;

  const placeholderText = getI18nString(layout?.placeholder) || "Search...";

  // 1. Resolve full option list
  const allOptions: FieldOption[] = useMemo(() => {
    const raw =
      propOptions ||
      field.options ||
      (field.properties as any)?.options ||
      (field.meta as any)?.options?.options ||
      [];
    return raw;
  }, [propOptions, field.options, field.properties, field.meta]);

  // 2. Search query and open state
  const [isOpen, setIsOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Derive initial input text from current value
  const initialLabel = useMemo(() => {
    if (isMultiple) return "";
    if (value === undefined || value === null || value === "") return "";
    const matched = allOptions.find((opt) => String(opt.value) === String(value));
    return matched ? getI18nString(matched.label) : String(value);
  }, [value, allOptions, isMultiple]);

  const [query, setQuery] = useState(initialLabel);

  // Synchronize query when external value changes and dropdown is closed
  useEffect(() => {
    if (!isOpen) {
      setQuery(initialLabel);
    }
  }, [initialLabel, isOpen]);

  const multipleDisplay =
    propMultipleDisplay ??
    (field as any).multipleDisplay ??
    "inline";

  const belowSurfaceContainer = useContext(BelowSurfaceContext);

  const maxVisibleTags =
    propMaxVisibleTags ??
    (field as any).maxVisibleTags ??
    2;

  // Resolve selected options for multi-select
  const selectedOptions: FieldOption[] = useMemo(() => {
    if (!isMultiple || !Array.isArray(value)) return [];
    return value.map((val) => {
      const found = allOptions.find((opt) => String(opt.value) === String(val));
      if (found) return found;
      return { value: val, label: String(val) };
    });
  }, [isMultiple, value, allOptions]);

  const removeValue = (valToRemove: string | number) => {
    if (!isMultiple) return;
    const currentArr = Array.isArray(value) ? [...value] : [];
    const nextArr = currentArr.filter((v) => String(v) !== String(valToRemove));
    onChange?.(nextArr);
  };

  const clearAllValues = () => {
    if (!isMultiple) return;
    onChange?.([]);
  };

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
  }, [isOpen, updateRect, selectedOptions.length]);


  // 3. Filter options by search query
  const filteredOptions = useMemo(() => {
    if (onSearch) {
      // If async search delegate is active, allOptions are already query-results
      return allOptions;
    }
    if (!query.trim()) return allOptions;
    const lower = query.toLowerCase();
    return allOptions.filter((opt) => {
      const label = getI18nString(opt.label).toLowerCase();
      const valStr = String(opt.value).toLowerCase();
      return label.includes(lower) || valStr.includes(lower);
    });
  }, [allOptions, query, onSearch]);

  // Group options if group property exists
  const groupedOptions = useMemo(() => {
    const hasGroups = filteredOptions.some((opt: any) => Boolean(opt.group));
    if (!hasGroups) return { "": filteredOptions };

    return filteredOptions.reduce<Record<string, FieldOption[]>>(
      (acc, opt: any) => {
        const grp = opt.group || "Other";
        if (!acc[grp]) acc[grp] = [];
        acc[grp].push(opt);
        return acc;
      },
      {}
    );
  }, [filteredOptions]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node) &&
        (!menuRef.current || !menuRef.current.contains(event.target as Node))
      ) {
        setIsOpen(false);
        // If allows custom value and query is non-empty, persist free text
        if (allowsCustom && query && !isMultiple) {
          onChange?.(query);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [allowsCustom, query, isMultiple, onChange]);

  // 4. Selection handlers
  const handleSelect = (selectedVal: string | number) => {
    if (isMultiple) {
      const currentArr = Array.isArray(value) ? [...value] : [];
      const idx = currentArr.findIndex((v) => String(v) === String(selectedVal));
      if (idx >= 0) {
        currentArr.splice(idx, 1);
      } else {
        currentArr.push(selectedVal);
      }
      onChange?.(currentArr);
      inputRef.current?.focus();
    } else {
      const matched = allOptions.find((opt) => String(opt.value) === String(selectedVal));
      const label = matched ? getI18nString(matched.label) : String(selectedVal);
      setQuery(label);
      onChange?.(selectedVal);
      setIsOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuery("");
    onChange?.(isMultiple ? [] : undefined);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextQuery = e.target.value;
    setQuery(nextQuery);
    if (!isOpen) setIsOpen(true);
    setHighlightedIndex(0);

    if (onSearch) {
      onSearch(nextQuery);
    } else if (allowsCustom && !isMultiple) {
      onChange?.(nextQuery);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isDisabled) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(filteredOptions.length - 1);
      } else {
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
      }
    } else if (e.key === "Enter") {
      if (isOpen && highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
        e.preventDefault();
        handleSelect(filteredOptions[highlightedIndex].value);
      } else if (allowsCustom && query && !isMultiple) {
        e.preventDefault();
        onChange?.(query);
        setIsOpen(false);
      }
    } else if (e.key === "Backspace" && !query && isMultiple && selectedOptions.length > 0) {
      e.preventDefault();
      const lastVal = selectedOptions[selectedOptions.length - 1].value;
      removeValue(lastVal);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  // Check if option is selected
  const isSelected = (val: string | number) => {
    if (isMultiple) {
      return Array.isArray(value) && value.some((v) => String(v) === String(val));
    }
    return String(value) === String(val);
  };

  const hasValue = isMultiple
    ? Array.isArray(value) && value.length > 0
    : value !== undefined && value !== null && value !== "";

  return (
    <div
      ref={containerRef}
      className="relative w-full min-w-0"
      data-field-root={field.id}
      data-field-type="autocomplete"
      data-field-name={field.name}
    >
      <div
        onClick={() => {
          if (!isDisabled) {
            inputRef.current?.focus();
          }
        }}
        className={cn(
          "flex items-center flex-wrap gap-1.5 w-full min-w-0 min-h-0 relative pr-9 cursor-text py-0.5",
          isDisabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {/* Inline Chips (when multipleDisplay === "inline") */}
        {isMultiple && multipleDisplay === "inline" && selectedOptions.length > 0 && (
          <>
            {selectedOptions.slice(0, maxVisibleTags).map((opt) => {
              const optLabel = getI18nString(opt.label);
              if (renderSelectedTag) {
                return (
                  <React.Fragment key={String(opt.value)}>
                    {renderSelectedTag(opt, () => removeValue(opt.value))}
                  </React.Fragment>
                );
              }
              return (
                <span
                  key={String(opt.value)}
                  data-unit="selected-tag"
                  className={badgeStyles.tagClass}
                >
                  {opt.icon && (
                    <IconRenderer name={opt.icon} className="w-3 h-3 opacity-80" />
                  )}
                  <span className="max-w-[120px] truncate">{optLabel}</span>
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

        {/* Summary Text (when multipleDisplay === "summary") */}
        {isMultiple &&
          multipleDisplay === "summary" &&
          selectedOptions.length > 0 &&
          !isOpen &&
          !query && (
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

        <input
          ref={inputRef}
          id={field.id}
          name={field.name}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={`${field.id}-autocomplete-menu`}
          disabled={isDisabled}
          placeholder={
            isMultiple && selectedOptions.length > 0
              ? isOpen
                ? "Type to search..."
                : ""
              : placeholderText
          }
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (!isDisabled) {
              setIsOpen(true);
              updateRect();
            }
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className={cn(
            "min-w-[2rem] flex-1 bg-transparent outline-none border-none shadow-none focus:ring-0",
            "text-foreground placeholder:text-foreground/40 placeholder:italic",
            "font-medium selection:bg-primary/30",
            "min-h-0 py-0.5 leading-normal",
            styles?.input
          )}
          {...(restProps as any)}
        />

        {/* Action icons: Loading / Clear / Dropdown Chevron */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-1.5 shrink-0 text-foreground/40">
          {isLoading && (
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
          )}

          {!isLoading && hasValue && !isDisabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:text-foreground hover:bg-muted/10 rounded-full transition-colors cursor-pointer"
              aria-label="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            tabIndex={-1}
            onClick={(e) => {
              e.stopPropagation();
              if (!isDisabled) setIsOpen(!isOpen);
            }}
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

      {/* Dedicated Area of Selected Values (projected to belowSurfaceContainer on next line) */}
      {isMultiple &&
        multipleDisplay === "area" &&
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
                    {opt.icon && (
                      <IconRenderer name={opt.icon} className="w-3.5 h-3.5 opacity-80" />
                    )}
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
                  onClick={clearAllValues}
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
            const {
              top: computedTop,
              maxHeight: computedMaxH,
              transformOrigin,
            } = computeDropdownAnchor(rect, { panelMaxHeight: 280, margin: 6 });

            const menuWidth = Math.max(rect.width, 240);

            const handleMenuScroll = (e: React.UIEvent<HTMLDivElement>) => {
              const el = e.currentTarget;
              if (onLoadMore && el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
                onLoadMore();
              }
            };

            let flatOptionIdx = 0;

            return (
              <AnimatePresence mode="wait">
                <div
                  key={`${field.id}-menu-container`}
                  style={{
                    position: "fixed",
                    top: computedTop,
                    left: rect.left,
                    width: menuWidth,
                    maxHeight: computedMaxH,
                    zIndex: "var(--z-system)" as any,
                  }}
                  id={`${field.id}-autocomplete-menu`}
                  role="listbox"
                  ref={menuRef}
                  data-unit="autocomplete-menu"
                >
                  <m.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                    style={{ transformOrigin }}
                    className="w-full h-full bg-surface/95 backdrop-blur-xl border border-border rounded-xl shadow-xl overflow-hidden flex flex-col"
                  >
                    <div
                      onScroll={handleMenuScroll}
                      className="flex-1 min-h-0 overflow-y-auto p-1.5 pb-2.5 flex flex-col gap-1 custom-scrollbar"
                    >
                      {(() => {
                        const virtualizationConfig: VirtualizationConfig | undefined =
                          field.properties?.virtualization;
                        const threshold = virtualizationConfig?.threshold ?? 100;
                        const shouldVirtualize =
                          Boolean(virtualizationConfig?.enabled) ||
                          (filteredOptions.length >= threshold &&
                            Object.keys(groupedOptions).length <= 1);

                        if (filteredOptions.length === 0) {
                          return (
                            <div className="px-3 py-3 text-xs leading-5 text-center text-foreground/50">
                              {allowsCustom && query
                                ? `Press Enter to use "${query}"`
                                : "No matching options"}
                            </div>
                          );
                        }

                        if (shouldVirtualize) {
                          return (
                            <VirtualizedOptionList
                              items={filteredOptions}
                              itemHeight={virtualizationConfig?.itemHeight ?? 38}
                              maxHeight={virtualizationConfig?.maxHeight ?? 240}
                              overscan={virtualizationConfig?.overscan ?? 4}
                              onScroll={handleMenuScroll}
                              renderItem={(opt, currIdx) => {
                                const selected = isSelected(opt.value);
                                const isHighlighted = highlightedIndex === currIdx;

                                return (
                                  <div
                                    key={String(opt.value)}
                                    role="option"
                                    aria-selected={selected}
                                    onClick={() => handleSelect(opt.value)}
                                    onMouseEnter={() => setHighlightedIndex(currIdx)}
                                    className={cn(
                                      "flex items-center justify-between px-3 py-2 text-xs leading-5 rounded-lg cursor-pointer transition-colors duration-150 h-[38px]",
                                      selected
                                        ? "bg-primary/10 text-primary font-medium hover:bg-primary/15"
                                        : isHighlighted
                                          ? "bg-foreground/5 text-foreground"
                                          : "text-foreground/80 hover:bg-foreground/5 hover:text-foreground"
                                    )}
                                  >
                                    <div className="flex items-center gap-2 truncate">
                                      {opt.icon && (
                                        <IconRenderer
                                          name={opt.icon}
                                          className="w-3.5 h-3.5 shrink-0 opacity-70"
                                        />
                                      )}
                                      <span className="truncate leading-5">
                                        {getI18nString(opt.label)}
                                      </span>
                                    </div>
                                    {selected && (
                                      <Check className="w-3.5 h-3.5 shrink-0 text-primary ml-2" />
                                    )}
                                  </div>
                                );
                              }}
                            />
                          );
                        }

                        return Object.entries(groupedOptions).map(([groupTitle, opts]) => (
                          <div key={groupTitle || "root"} className="flex flex-col gap-1">
                            {groupTitle && (
                              <span className="px-3 pt-2 pb-1 text-[11px] leading-4 font-bold text-foreground/50 uppercase tracking-wider">
                                {groupTitle}
                              </span>
                            )}
                            {opts.map((opt) => {
                              const currIdx = flatOptionIdx++;
                              const selected = isSelected(opt.value);
                              const isHighlighted = highlightedIndex === currIdx;

                              return (
                                <div
                                  key={String(opt.value)}
                                  role="option"
                                  aria-selected={selected}
                                  onClick={() => handleSelect(opt.value)}
                                  onMouseEnter={() => setHighlightedIndex(currIdx)}
                                  className={cn(
                                    "flex items-center justify-between px-3 py-2 text-xs leading-5 rounded-lg cursor-pointer transition-colors duration-150",
                                    selected
                                      ? "bg-primary/10 text-primary font-medium hover:bg-primary/15"
                                      : isHighlighted
                                        ? "bg-foreground/5 text-foreground"
                                        : "text-foreground/80 hover:bg-foreground/5 hover:text-foreground"
                                  )}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    {opt.icon && (
                                      <IconRenderer
                                        name={opt.icon}
                                        className="w-3.5 h-3.5 shrink-0 opacity-70"
                                      />
                                    )}
                                    <span className="truncate leading-5">
                                      {getI18nString(opt.label)}
                                    </span>
                                  </div>
                                  {selected && (
                                    <Check className="w-3.5 h-3.5 shrink-0 text-primary ml-2" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ));
                      })()}
                      {isLoadingMore && (
                        <div className="flex items-center justify-center p-2 text-primary">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      )}
                    </div>
                  </m.div>
                </div>
              </AnimatePresence>
            );
          })(),
          document.body
        )}

      <ValidationHints hints={field.customData?.validationHints as string[]} />
    </div>
  );
});

AutocompleteField.displayName = "AutocompleteField";
