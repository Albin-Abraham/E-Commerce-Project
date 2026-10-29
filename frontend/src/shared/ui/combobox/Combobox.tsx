import React, {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useEventRegistry } from "@core/events/stores/eventRegistry.store";
import { cn } from "@ui/form/utils/form-styles";
import { announce } from "../a11y/LiveAnnouncer";
import { ComboboxContext } from "./ComboboxContext";
import type { ComboboxOptionItem } from "./types";

export interface ComboboxProps {
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string) => void;
  options?: ComboboxOptionItem[];
  filter?: (option: ComboboxOptionItem, query: string) => boolean;
  scope?: string;
  disabled?: boolean;
  readOnly?: boolean;
  id?: string;
  children: React.ReactNode;
  className?: string;
}

const defaultFilter = (option: ComboboxOptionItem, query: string) => {
  if (!query) return true;
  return option.label.toLowerCase().includes(query.toLowerCase());
};

/**
 * Combobox
 *
 * Composite root component implementing the WAI-ARIA 1.2 Combobox pattern.
 * Coordinates input state, listbox display, keyboard roving active-descendant,
 * filtering, and screen reader announcements.
 */
export const Combobox: React.FC<ComboboxProps> = ({
  value: controlledValue,
  defaultValue = null,
  onValueChange,
  options: externalOptions,
  filter = defaultFilter,
  scope,
  disabled = false,
  readOnly = false,
  id: propId,
  children,
  className,
}) => {
  const generatedId = useId();
  const baseId = propId || `combobox-${generatedId.replace(/:/g, "")}`;
  const listboxId = `${baseId}-listbox`;

  const [internalValue, setInternalValue] = useState<string | null>(defaultValue);
  const selectedValue = controlledValue !== undefined ? controlledValue : internalValue;

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedValue, setHighlightedValue] = useState<string | null>(null);

  // Dynamic option registry for declarative <ComboboxOption> children
  const [registeredOptions, setRegisteredOptions] = useState<ComboboxOptionItem[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const registerOption = useCallback((option: ComboboxOptionItem) => {
    setRegisteredOptions((prev) => {
      const idx = prev.findIndex((o) => o.value === option.value);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = option;
        return next;
      }
      return [...prev, option];
    });
  }, []);

  const unregisterOption = useCallback((value: string) => {
    setRegisteredOptions((prev) => prev.filter((o) => o.value !== value));
  }, []);

  const allOptions = useMemo(() => {
    return externalOptions || registeredOptions;
  }, [externalOptions, registeredOptions]);

  const filteredOptions = useMemo(() => {
    return allOptions.filter((opt) => filter(opt, searchQuery));
  }, [allOptions, filter, searchQuery]);

  const enabledOptions = useMemo(() => {
    return filteredOptions.filter((opt) => !opt.disabled);
  }, [filteredOptions]);

  // Announce results count to screen readers
  useEffect(() => {
    if (isOpen && searchQuery) {
      const count = filteredOptions.length;
      announce(
        count === 0
          ? "No options found"
          : `${count} option${count === 1 ? "" : "s"} available. Use arrow keys to navigate.`,
        "polite"
      );
    }
  }, [isOpen, searchQuery, filteredOptions.length]);

  // Handle outside click
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  // Sync event registry activeScope
  const setActiveScope = useEventRegistry((s) => s.setActiveScope);
  useEffect(() => {
    if (isOpen) {
      setActiveScope(scope || `combobox:${baseId}`);
    } else {
      setActiveScope("global");
    }
  }, [isOpen, scope, baseId, setActiveScope]);

  const selectOption = useCallback(
    (val: string) => {
      if (controlledValue === undefined) {
        setInternalValue(val);
      }
      onValueChange?.(val);
      const selected = allOptions.find((o) => o.value === val);
      if (selected) {
        setSearchQuery(selected.label);
      }
      setIsOpen(false);
      setHighlightedValue(null);
    },
    [allOptions, controlledValue, onValueChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled || readOnly) return;

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            setHighlightedValue(enabledOptions[0]?.value || null);
          } else if (enabledOptions.length > 0) {
            const currentIndex = enabledOptions.findIndex(
              (o) => o.value === highlightedValue
            );
            const nextIndex =
              currentIndex === -1
                ? 0
                : currentIndex < enabledOptions.length - 1
                  ? currentIndex + 1
                  : 0;
            setHighlightedValue(enabledOptions[nextIndex].value);
          }
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            setHighlightedValue(
              enabledOptions[enabledOptions.length - 1]?.value || null
            );
          } else if (enabledOptions.length > 0) {
            const currentIndex = enabledOptions.findIndex(
              (o) => o.value === highlightedValue
            );
            const prevIndex =
              currentIndex <= 0
                ? enabledOptions.length - 1
                : currentIndex - 1;
            setHighlightedValue(enabledOptions[prevIndex].value);
          }
          break;
        }
        case "Home": {
          if (isOpen && enabledOptions.length > 0) {
            e.preventDefault();
            setHighlightedValue(enabledOptions[0].value);
          }
          break;
        }
        case "End": {
          if (isOpen && enabledOptions.length > 0) {
            e.preventDefault();
            setHighlightedValue(enabledOptions[enabledOptions.length - 1].value);
          }
          break;
        }
        case "Enter": {
          if (isOpen && highlightedValue) {
            e.preventDefault();
            selectOption(highlightedValue);
          }
          break;
        }
        case "Escape": {
          if (isOpen) {
            e.preventDefault();
            setIsOpen(false);
            setHighlightedValue(null);
          }
          break;
        }
        case "Tab": {
          if (isOpen) {
            setIsOpen(false);
          }
          break;
        }
      }
    },
    [disabled, enabledOptions, highlightedValue, isOpen, readOnly, selectOption]
  );

  const inputProps = useMemo(
    () => ({
      id: `${baseId}-input`,
      onKeyDown: handleKeyDown,
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        if (!isOpen) {
          setIsOpen(true);
        }
        setHighlightedValue(enabledOptions[0]?.value || null);
      },
      onFocus: () => {
        if (!disabled && !readOnly) {
          setIsOpen(true);
        }
      },
      onBlur: () => {
        // Blur handled softly so clicking options works
      },
    }),
    [baseId, disabled, enabledOptions, handleKeyDown, isOpen, readOnly]
  );

  return (
    <ComboboxContext.Provider
      value={{
        isOpen,
        setIsOpen,
        value: selectedValue,
        selectOption,
        searchQuery,
        setSearchQuery,
        highlightedValue,
        setHighlightedValue,
        filteredOptions,
        registerOption,
        unregisterOption,
        baseId,
        inputRef,
        listboxId,
        inputProps,
      }}
    >
      <div
        ref={containerRef}
        id={baseId}
        className={cn("relative w-full", className)}
        data-unit="combobox"
        data-open={isOpen}
      >
        {children}
      </div>
    </ComboboxContext.Provider>
  );
};

Combobox.displayName = "Combobox";
