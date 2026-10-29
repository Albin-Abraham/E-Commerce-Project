import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { tokens } from "@shared/theme";
import { ValidationHints } from "@ui/form/atoms/ValidationHints";
import { useFieldCompositionContext } from "@ui/form/context/FieldCompositionContext";
import type { FieldOption, FormField, VirtualizationConfig } from "@ui/form/fields";
import { getI18nString } from "@ui/form/utils/field-utils";
import { cn } from "@ui/form/utils/form-styles";
import { getIcon } from "@ui/form/utils/icon-registry";
import { AnimatePresence, m } from "framer-motion";
import { Check, ChevronDown, Loader2 } from "lucide-react";

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

// --- Context for Composite Coordination ---
export interface SelectContextProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  selectedValue: any;
  highlightedIndex: number;
  setHighlightedIndex: (index: number) => void;
  onSelect: (value: any) => void;
  field?: Partial<FormField>;
  triggerRef: React.RefObject<HTMLDivElement | null>;
  menuRef: React.RefObject<HTMLDivElement | null>;
  rect: DOMRect | null;
  options: FieldOption[];
  /** True when the panel is currently anchored above the trigger. */
  openUpward: boolean;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

export const SelectContext = createContext<SelectContextProps | undefined>(
  undefined
);

export function useSelect() {
  const context = useContext(SelectContext);
  if (!context)
    throw new Error(
      "Select composite components must be used within <Select />"
    );
  return context;
}

// --- Composite Primitives ---

export const Select: React.FC<{
  field?: Partial<FormField>;
  value: any;
  onChange: (val: any) => void;
  options?: FieldOption[];
  children: React.ReactNode;
}> = ({ field, value, onChange, options, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [openUpward, setOpenUpward] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Resolve options for context
  const resolvedOptions =
    options ||
    field?.options ||
    field?.properties?.options ||
    [];

  // Sync highlightedIndex when opening or when value changes
  useEffect(() => {
    if (resolvedOptions.length === 0) {
      setHighlightedIndex(-1);
      return;
    }
    const idx = resolvedOptions.findIndex(
      (opt: any) => String(opt.value) === String(value)
    );
    setHighlightedIndex(idx >= 0 ? idx : 0);
  }, [value, isOpen, resolvedOptions]);

  const handleSelect = (val: any) => {
    onChange?.(val);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (resolvedOptions.length === 0) return;

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) =>
            prev < resolvedOptions.length - 1 ? prev + 1 : 0
          );
        }
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : resolvedOptions.length - 1
          );
        }
        break;
      }
      case "Home": {
        if (isOpen) {
          e.preventDefault();
          setHighlightedIndex(0);
        }
        break;
      }
      case "End": {
        if (isOpen) {
          e.preventDefault();
          setHighlightedIndex(resolvedOptions.length - 1);
        }
        break;
      }
      case "Enter":
      case " ": {
        if (isOpen) {
          e.preventDefault();
          if (
            highlightedIndex >= 0 &&
            highlightedIndex < resolvedOptions.length
          ) {
            handleSelect(resolvedOptions[highlightedIndex].value);
          }
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsOpen(true);
        }
        break;
      }
      case "Escape": {
        if (isOpen) {
          e.preventDefault();
          setIsOpen(false);
        }
        break;
      }
      case "Tab": {
        if (isOpen) {
          setIsOpen(false);
        }
        break;
      }
      default:
        break;
    }
  };

  // Reactive positioning: Update rect on scroll/resize to prevent "drifting"
  useEffect(() => {
    if (!isOpen) return;

    const updateRect = () => {
      if (triggerRef.current) {
        const anchorEl =
          triggerRef.current.closest<HTMLElement>(
            "[data-unit='input-outer-wrapper'], .input-outer-wrapper"
          ) || triggerRef.current;
        const nextRect = anchorEl.getBoundingClientRect();
        setRect(nextRect);
        const { openUpward: up } = computeDropdownAnchor(nextRect);
        setOpenUpward(up);
      }
    };

    updateRect();
    window.addEventListener("scroll", updateRect, true);
    window.addEventListener("resize", updateRect);

    return () => {
      window.removeEventListener("scroll", updateRect, true);
      window.removeEventListener("resize", updateRect);
    };
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        (!menuRef.current || !menuRef.current.contains(event.target as Node))
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <SelectContext.Provider
      value={{
        isOpen,
        setIsOpen,
        selectedValue: value,
        highlightedIndex,
        setHighlightedIndex,
        onSelect: handleSelect,
        field,
        triggerRef,
        menuRef,
        rect,
        options: resolvedOptions,
        openUpward,
        handleKeyDown,
      }}
    >
      <div
        className="relative w-full h-full"
        ref={triggerRef}
        data-field-root={field?.id}
        data-field-type="select"
        data-field-name={field?.name}
      >
        {children}
      </div>
    </SelectContext.Provider>
  );
};

/**
 * Dedicated presentational component for unselected placeholder state in SelectTrigger.
 * Distinct from outer FieldLabel.
 */
export const SelectPlaceholder: React.FC<{
  children?: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <span
      data-unit="select-placeholder"
      className={cn(
        "font-medium tracking-tight truncate block text-foreground/55",
        className
      )}
    >
      {children}
    </span>
  );
};

export const SelectTrigger: React.FC<{
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  startContent?: React.ReactNode;
  endContent?: React.ReactNode;
}> = ({
  className,
  placeholder,
  disabled,
  isLoading,
  startContent: propStartContent,
  endContent: propEndContent,
}) => {
  const {
    isOpen,
    setIsOpen,
    selectedValue,
    highlightedIndex,
    field,
    options,
    openUpward,
    handleKeyDown,
  } = useSelect();

  const composition = useFieldCompositionContext();
  const isManaged = composition.mode === "managed";

  const selectedOption = options.find(
    (opt: any) => String(opt.value) === String(selectedValue)
  );
  const highlightedOption =
    highlightedIndex >= 0 && highlightedIndex < options.length
      ? options[highlightedIndex]
      : selectedOption;

  const isFloating =
    (field.properties as any)?.labelPlacement === "inline-floating";
  const shouldHidePlaceholder = isFloating && !selectedOption && !isOpen;
  const placeholderText =
    placeholder !== undefined ? placeholder : "Select...";

  const label = selectedOption
    ? getI18nString(selectedOption.label)
    : placeholderText;

  const ariaKeyShortcuts =
    (field?.properties as any)?.ariaKeyShortcuts ||
    (field as any)?.["aria-keyshortcuts"];

  const resolvedStartContent =
    propStartContent ||
    field?.properties?.startContent ||
    field?.properties?.leftContent ||
    field?.meta?.ui?.startContent ||
    field?.meta?.ui?.leftContent ||
    (selectedOption?.icon ? (
      <span className="text-foreground/40 shrink-0 flex items-center justify-center">
        <IconRenderer name={selectedOption.icon} className="w-4 h-4" />
      </span>
    ) : null);

  const resolvedEndContent =
    propEndContent ||
    field?.properties?.endContent ||
    field?.properties?.rightContent ||
    field?.meta?.ui?.endContent ||
    field?.meta?.ui?.rightContent;

  return (
    <button
      type="button"
      onClick={() => !disabled && !isLoading && setIsOpen(!isOpen)}
      onKeyDown={handleKeyDown}
      id={field?.id}
      role="combobox"
      aria-expanded={isOpen}
      aria-haspopup="listbox"
      aria-controls={`${field?.id}-menu`}
      aria-activedescendant={
        isOpen && highlightedOption
          ? `${field?.id}-opt-${highlightedOption.value}`
          : undefined
      }
      aria-label={field?.label as string}
      aria-required={Boolean(field?.required)}
      aria-keyshortcuts={ariaKeyShortcuts || undefined}
      data-id={field?.id}
      data-unit="select-trigger"
      data-is-open={isOpen}
      data-is-loading={isLoading}
      data-selected-value={selectedValue}
      data-options-count={options.length}
      aria-busy={isLoading || undefined}
      aria-disabled={disabled || isLoading || undefined}
      className={cn(
        "flex flex-row items-center justify-between w-full min-w-0 cursor-pointer transition-all duration-200 select-none",
        isManaged
          ? "bg-transparent border-none ring-0 shadow-none outline-none min-h-0 h-full py-0 px-0 gap-2.5"
          : "bg-surface/50 hover:bg-surface-elevated/70 border border-border/70 rounded-xl min-h-[44px] px-3.5 gap-3 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
        (disabled || isLoading) &&
          "opacity-60 cursor-not-allowed pointer-events-none",
        className
      )}
    >
      <div
        className="flex items-center flex-nowrap gap-3 overflow-hidden min-w-0 flex-1"
        data-unit="select-value-container"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
            <span className="flex flex-col gap-1.5 flex-1 min-w-0" aria-hidden>
              <span className="h-2.5 w-2/3 max-w-[9rem] rounded-full bg-slate-200 animate-pulse" />
              <span className="h-2 w-1/3 max-w-[5rem] rounded-full bg-slate-100 animate-pulse" />
            </span>
            <span className="sr-only">Loading options</span>
          </>
        ) : (
          <>
            {resolvedStartContent}
            {!selectedOption ? (
              shouldHidePlaceholder ? null : (
                <SelectPlaceholder>{placeholderText}</SelectPlaceholder>
              )
            ) : (
              <span
                data-unit="select-value"
                className="font-medium tracking-tight truncate block text-foreground/90"
              >
                {label}
              </span>
            )}
          </>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {resolvedEndContent}
        <m.div
          animate={{ rotate: isOpen ? (openUpward ? 0 : 180) : 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="text-foreground/45"
        >
          <ChevronDown className="w-5 h-5" />
        </m.div>
      </div>
    </button>
  );
};

export const SelectMenu: React.FC<{
  children: React.ReactNode;
  topContent?: React.ReactNode;
  bottomContent?: React.ReactNode;
  onScrollToEnd?: () => void;
  isLoadingMore?: boolean;
}> = ({
  children,
  topContent,
  bottomContent,
  onScrollToEnd,
  isLoadingMore,
}) => {
  const { isOpen, rect, field, menuRef } = useSelect();

  if (!isOpen || !rect) return null;

  const {
    top: computedTop,
    maxHeight: computedMaxH,
    transformOrigin,
  } = computeDropdownAnchor(rect);

  const menuWidth = Math.max(rect.width, 240);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (onScrollToEnd && el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
      onScrollToEnd();
    }
  };

  return createPortal(
    <AnimatePresence mode="wait">
      <div
        key={field?.id}
        style={{
          position: "fixed",
          top: computedTop,
          left: rect.left,
          width: menuWidth,
          maxHeight: computedMaxH,
          zIndex: "var(--z-system)" as any,
        }}
        id={`${field?.id}-menu`}
        role="listbox"
        ref={menuRef}
        data-id={`${field?.id}-menu`}
        data-unit="select-menu"
      >
        <m.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin }}
          className="w-full h-full bg-surface/98 dark:bg-surface-elevated/98 backdrop-blur-2xl border border-border/80 dark:border-border-strong rounded-2xl shadow-xl overflow-hidden flex flex-col"
        >
          {topContent}
          <div
            onScroll={handleScroll}
            className="flex-1 min-h-0 overflow-y-auto p-2 pb-3 flex flex-col gap-1 custom-scrollbar"
          >
            {React.Children.count(children) > 0 ? (
              children
            ) : (
              <div className="px-4 py-3 text-sm text-center text-foreground/50">
                No options available
              </div>
            )}
            {isLoadingMore && (
              <div className="flex items-center justify-center p-2 text-primary">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            )}
          </div>
          {bottomContent}
        </m.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export const SelectOption: React.FC<{
  option: FieldOption;
  index?: number;
}> = ({ option, index }) => {
  const {
    selectedValue,
    highlightedIndex,
    setHighlightedIndex,
    onSelect,
    field,
    options,
  } = useSelect();
  const isSelected = String(selectedValue) === String(option.value);
  const resolvedIndex =
    index !== undefined
      ? index
      : options.findIndex((opt) => String(opt.value) === String(option.value));
  const isHighlighted = highlightedIndex === resolvedIndex;

  return (
    <m.div
      whileHover={{ x: 4 }}
      onClick={() => onSelect(option.value)}
      onMouseEnter={() => {
        if (resolvedIndex >= 0) setHighlightedIndex(resolvedIndex);
      }}
      id={`${field?.id}-opt-${option.value}`}
      role="option"
      aria-selected={isSelected}
      data-id={`${field?.id}-opt-${option.value}`}
      data-value={option.value}
      data-selected={isSelected}
      data-highlighted={isHighlighted}
      className={cn(
        "flex items-center justify-between px-3.5 py-2.5 text-sm leading-5 rounded-lg cursor-pointer transition-all duration-150",
        isSelected
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
          : isHighlighted
            ? "bg-foreground/5 text-foreground"
            : "hover:bg-foreground/5 text-foreground/80 hover:text-foreground"
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0 truncate">
        {option.icon && (
          <span className={isSelected ? "text-primary-foreground" : "text-foreground/40"}>
            <IconRenderer name={option.icon} className="w-4 h-4" />
          </span>
        )}
        <span className="truncate leading-5">{getI18nString(option.label)}</span>
      </div>
      <AnimatePresence>
        {isSelected && (
          <m.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="shrink-0 ml-2"
          >
            <Check className="w-4 h-4 text-primary" />
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
};

/**
 * SelectField Component (Primary Single-Selection Component)
 *
 * Responsibility: Manages single-selection from a list of options with
 * integrated ARIA combobox accessibility, keyboard navigation, and
 * validation hints.
 */
export const SelectField = React.forwardRef<
  HTMLDivElement,
  AtomicFieldProps<string | number> & {
    options?: FieldOption[];
    isLoading?: boolean;
    disabled?: boolean;
    placeholder?: string;
  }
>(function SelectFieldInternal(
  {
    name,
    type,
    component,
    id,
    label: _label,
    placeholder,
    disabled,
    readOnly: _readOnly,
    required,
    field,
    value,
    onChange,
    layout,
    className,
    options,
    styles,
    isLoading,
    role: _role,
    tabIndex: _tabIndex,
    "aria-label": _ariaLabel,
    "aria-required": _ariaRequired,
    "aria-invalid": _ariaInvalid,
    "aria-describedby": _ariaDescribedBy,
    "aria-expanded": _ariaExpanded,
    "aria-controls": _ariaControls,
    error: _error,
    errorMessage: _errorMessage,
    errors: _errors,
    ...rest
  },
  ref
) {
  const resolvedName = name ?? field?.name;
  const resolvedType = type ?? field?.type ?? "select";
  const resolvedId = id ?? field?.id ?? resolvedName;
  const resolvedComponent =
    typeof component === "string"
      ? component
      : typeof field?.component === "string"
        ? field.component
        : "select";

  const isDisabled = Boolean(
    disabled ?? layout?.disabled ?? field?.disabled ?? false
  );
  const isRequired = Boolean(required ?? field?.required);
  const placeholderText =
    placeholder !== undefined
      ? getI18nString(placeholder as any)
      : getI18nString(
          layout?.placeholder ??
            field?.properties?.placeholder ??
            (field as any)?.placeholder
        ) || "Select...";

  // Resolve options: prop > field.options > field.properties.options
  const resolvedOptions =
    options ||
    field?.options ||
    field?.properties?.options ||
    [];

  const validationHints = field?.customData?.validationHints as string[];

  const effectiveField: Partial<FormField> = {
    ...field,
    id: resolvedId,
    name: resolvedName,
    type: resolvedType as any,
    required: isRequired,
    disabled: isDisabled,
  };

  return (
    <div
      className="w-full min-w-0"
      ref={ref}
      data-field-name={resolvedName}
      data-field-type={resolvedType}
      data-field-component={resolvedComponent}
      {...(rest as any)}
    >
      <Select
        field={effectiveField}
        value={value}
        onChange={onChange as (val: unknown) => void}
        options={resolvedOptions}
      >
        <div
          className="flex-1 w-full min-w-0"
          data-unit="select-trigger-container"
        >
          <SelectTrigger
            placeholder={placeholderText}
            className={cn(
              "bg-transparent border-none ring-0 shadow-none min-w-0",
              styles?.input,
              className
            )}
            disabled={isDisabled}
            isLoading={isLoading}
          />
        </div>

        {/* Dropdown Menu */}
        <SelectMenu
          topContent={
            field?.meta?.ui?.listAction &&
            field.meta.ui.listAction.position === "top" ? (
              <div className="p-2 border-b border-white/10 mb-1 sticky top-0 z-10 bg-inherit w-full">
                <button
                  type="button"
                  onClick={field.meta.ui.listAction.onClick}
                  className={cn(
                    "w-full rounded-full px-4 py-1.5 font-medium text-sm transition-colors flex items-center justify-center cursor-pointer",
                    field.meta.ui.listAction.className ||
                      "bg-primary/10 text-primary hover:bg-primary/20 border-none"
                  )}
                >
                  {field.meta.ui.listAction.label}
                </button>
              </div>
            ) : undefined
          }
          bottomContent={
            field?.meta?.ui?.listAction &&
            field.meta.ui.listAction.position !== "top" ? (
              <div className="p-2 border-t border-border mt-1 sticky bottom-0 z-10 bg-inherit w-full">
                <button
                  type="button"
                  onClick={field.meta.ui.listAction.onClick}
                  className={cn(
                    "w-full rounded-full px-4 py-1.5 font-medium text-sm transition-colors flex items-center justify-center cursor-pointer",
                    field.meta.ui.listAction.className ||
                      "bg-primary/10 text-primary hover:bg-primary/20 border-none"
                  )}
                >
                  {field.meta.ui.listAction.label}
                </button>
              </div>
            ) : undefined
          }
        >
          {(() => {
            const virtualizationConfig: VirtualizationConfig | undefined =
              field.properties?.virtualization;
            const threshold = virtualizationConfig?.threshold ?? 100;
            const shouldVirtualize =
              Boolean(virtualizationConfig?.enabled) ||
              resolvedOptions.length >= threshold;

            if (shouldVirtualize) {
              return (
                <VirtualizedOptionList
                  items={resolvedOptions}
                  itemHeight={virtualizationConfig?.itemHeight ?? 44}
                  maxHeight={virtualizationConfig?.maxHeight ?? 260}
                  overscan={virtualizationConfig?.overscan ?? 4}
                  renderItem={(opt: FieldOption, idx: number) => (
                    <SelectOption key={String(opt.value)} option={opt} index={idx} />
                  )}
                />
              );
            }

            return resolvedOptions.map((opt: FieldOption, idx: number) => (
              <SelectOption key={String(opt.value)} option={opt} index={idx} />
            ));
          })()}
        </SelectMenu>
      </Select>

      {/* Validation Hints */}
      <ValidationHints hints={validationHints} />
    </div>
  );
});

SelectField.displayName = "SelectField";

export default SelectField;
