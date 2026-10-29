import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Combobox,
  ComboboxInput,
  ComboboxList,
  ComboboxOption,
  ComboboxEmpty,
} from "../../ui/combobox";
import { Globe, MapPin, Search } from "lucide-react";

const meta: Meta<typeof Combobox> = {
  title: "Components/Forms/Combobox",
  component: Combobox,
  parameters: {
    docs: {
      description: {
        component:
          "Composite WAI-ARIA 1.2 Combobox and Autocomplete primitive featuring active-descendant roving keyboard navigation, filtering, clear actions, and live screen reader result announcements.",
      },
    },
  },
};

export default meta;

const COUNTRIES = [
  { value: "us", label: "United States" },
  { value: "ca", label: "Canada" },
  { value: "gb", label: "United Kingdom" },
  { value: "de", label: "Germany" },
  { value: "fr", label: "France" },
  { value: "jp", label: "Japan" },
  { value: "au", label: "Australia" },
  { value: "in", label: "India" },
  { value: "br", label: "Brazil" },
  { value: "za", label: "South Africa (Region Locked)", disabled: true },
];

export const AutocompleteSearch: StoryObj = {
  name: "01. Autocomplete Search & Selection",
  render: () => {
    const [selected, setSelected] = useState<string | null>(null);

    return (
      <div className="max-w-md p-6 border border-border rounded-xl bg-card space-y-4">
        <div>
          <h3 className="font-semibold text-foreground">Country Selector</h3>
          <p className="text-sm text-muted-foreground">
            Type to filter or use <kbd className="px-1 py-0.5 bg-muted rounded border text-xs">ArrowDown</kbd> /{" "}
            <kbd className="px-1 py-0.5 bg-muted rounded border text-xs">ArrowUp</kbd> and{" "}
            <kbd className="px-1 py-0.5 bg-muted rounded border text-xs">Enter</kbd> to select.
          </p>
        </div>

        <Combobox value={selected} onValueChange={setSelected}>
          <label htmlFor="country-input" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Country / Region
          </label>
          <ComboboxInput
            id="country-input"
            startIcon={<Globe className="w-4 h-4" />}
            placeholder="Search countries..."
          />
          <ComboboxList aria-label="Available countries">
            {COUNTRIES.map((c) => (
              <ComboboxOption
                key={c.value}
                value={c.value}
                label={c.label}
                disabled={c.disabled}
                icon={<MapPin className="w-3.5 h-3.5" />}
              />
            ))}
            <ComboboxEmpty>No matching countries found.</ComboboxEmpty>
          </ComboboxList>
        </Combobox>

        <div className="p-3 bg-muted/30 rounded-lg text-xs font-mono text-muted-foreground">
          Selected Country Code: <span className="text-primary font-bold">{selected || "none"}</span>
        </div>
      </div>
    );
  },
};

export const PreselectedWithClear: StoryObj = {
  name: "02. Pre-selected Value with Clear Action",
  render: () => {
    const [selected, setSelected] = useState<string | null>("de");

    return (
      <div className="max-w-md p-6 border border-border rounded-xl bg-card space-y-4">
        <div>
          <h3 className="font-semibold text-foreground">Pre-populated Combobox</h3>
          <p className="text-sm text-muted-foreground">
            Initialized with "Germany". Click the <kbd className="px-1 py-0.5 bg-muted rounded border text-xs">✕</kbd> button or press Backspace to clear.
          </p>
        </div>

        <Combobox value={selected} onValueChange={setSelected}>
          <label htmlFor="preselected-input" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
            Preferred Deployment Region
          </label>
          <ComboboxInput
            id="preselected-input"
            placeholder="Choose region..."
            clearable
          />
          <ComboboxList aria-label="Deployment regions">
            {COUNTRIES.map((c) => (
              <ComboboxOption
                key={c.value}
                value={c.value}
                label={c.label}
                disabled={c.disabled}
              />
            ))}
            <ComboboxEmpty>No region found.</ComboboxEmpty>
          </ComboboxList>
        </Combobox>
      </div>
    );
  },
};
