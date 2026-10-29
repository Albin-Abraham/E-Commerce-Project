import React from "react";

export interface ComboboxOptionItem {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  group?: string;
  [key: string]: unknown;
}

export interface ComboboxContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  value: string | null;
  selectOption: (value: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  highlightedValue: string | null;
  setHighlightedValue: (val: string | null) => void;
  filteredOptions: ComboboxOptionItem[];
  registerOption: (option: ComboboxOptionItem) => void;
  unregisterOption: (value: string) => void;
  baseId: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  listboxId: string;
  inputProps: {
    id: string;
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onFocus: () => void;
    onBlur: (e: React.FocusEvent) => void;
  };
}
