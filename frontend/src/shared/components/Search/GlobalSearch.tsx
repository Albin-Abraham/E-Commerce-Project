import React, { useEffect, useRef } from "react";

import { commandBus } from "@core/events/CommandBus";
import { PlatformCommand } from "@core/events/config/shortcuts";
import { usePlatformUrlParams } from "@core/router/hooks/usePlatformNavigation";
import { FieldRenderer } from "@ui/form/FieldRenderer";
import { FormRegistryProvider } from "@ui/form/context/FormRegistryContext";
import { defaultRegistry } from "@ui/form";
import { useForm } from "@ui/form/hooks/useForm";
import type { FormDefinition } from "@ui/form/types";

const GLOBAL_SEARCH_SCHEMA: FormDefinition = {
  id: "platform-global-search",
  title: "Global Search",
  fields: [
    {
      id: "global-search-input",
      name: "search",
      type: "search_input",
      label: "Search",
      initialValue: "",
      properties: {
        placeholder: "Search platform (⌘K)",
        ariaKeyShortcuts: "Control+K Meta+K",
      },
    },
  ],
};

export const GlobalSearch: React.FC = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocusedElement = useRef<HTMLElement | null>(null);
  const { search, setSearch } = usePlatformUrlParams({ isGlobal: true });

  // ECS: Initialize search through the Form Engine
  const { form, setValue } = useForm(GLOBAL_SEARCH_SCHEMA, { search });

  // Sync Form Engine when URL search changes (e.g. back button)
  useEffect(() => {
    if (form.values.search !== search) {
      setValue("search", search);
    }
  }, [search, form, setValue]);

  useEffect(() => {
    // Subscribe to the global focus-search command with focus memory
    const unsubscribe = commandBus.on(PlatformCommand.FocusSearch, () => {
      if (document.activeElement === inputRef.current) {
        // Toggle behavior: blur and restore focus to previous element
        inputRef.current?.blur();
        previousFocusedElement.current?.focus();
      } else {
        // Save previously active element before taking focus
        if (
          document.activeElement instanceof HTMLElement &&
          document.activeElement !== inputRef.current
        ) {
          previousFocusedElement.current = document.activeElement;
        }
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    });

    return unsubscribe;
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      inputRef.current?.blur();
      // Restore focus to previous element upon dismissing search
      previousFocusedElement.current?.focus();
    }
    if (e.key === "Enter") {
      // Commit local form value to global platform state
      setSearch(form.values.search, true);
    }
  };

  return (
    <FormRegistryProvider value={{ form, registry: defaultRegistry }}>
      <div className="relative group min-w-[320px]">
        <FieldRenderer
          field={form.resolveField("global-search-input")!}
          ref={inputRef}
          onKeyDown={handleKeyDown}
          onClear={() => setSearch("", true)}
        />
      </div>
    </FormRegistryProvider>
  );
};
