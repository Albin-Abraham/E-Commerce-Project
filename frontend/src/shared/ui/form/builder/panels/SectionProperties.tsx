import React from "react";

import { DEFAULT_FORM_THEME } from "@ui/form/styles/FormTheme";
import type { FormSection } from "@ui/form/types/section";

interface SectionPropertiesProps {
  section: FormSection;
  onUpdate: (sectionId: string, updates: Partial<FormSection>) => void;
}

export const SectionProperties: React.FC<SectionPropertiesProps> = ({
  section,
  onUpdate,
}) => {
  // Determine current layout type - Default to grid if undefined
  const layoutConfig = section.layout || { type: "grid", columns: 1 };
  const layoutType = layoutConfig.type;

  // Helper to update layout with proper discriminated union structure
  const updateLayout = (newLayout: any) => {
    // Using any for partial updates during UI interaction, but could be stricter
    onUpdate(section.id, {
      layout: { ...layoutConfig, ...newLayout },
    });
  };

  return (
    <div className="p-4 space-y-6">
      <h3 className="font-semibold mb-2">Section Properties</h3>

      {/* General Settings */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Title
        </label>
        <input
          type="text"
          value={
            typeof section.title === "string" ? section.title : section.title.en
          }
          onChange={(e) => onUpdate(section.id, { title: e.target.value })}
          className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 p-2 border"
        />
      </div>

      {/* Layout Type Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Layout Mode
        </label>
        <div className="flex gap-2">
          {["grid", "flex", "tabs", "card"].map((mode) => (
            <button
              key={mode}
              onClick={() => {
                // Reset to defaults for that type
                let defaultForMode = {};
                if (mode === "grid")
                  defaultForMode = { type: "grid", columns: 1 };
                else if (mode === "flex")
                  defaultForMode = { type: "flex", direction: "row" };
                else if (mode === "tabs")
                  defaultForMode = { type: "tabs", variant: "default" };
                else if (mode === "card") defaultForMode = { type: "card" };
                else defaultForMode = { type: mode };

                onUpdate(section.id, { layout: defaultForMode as any });
              }}
              className={`px-3 py-1.5 text-sm rounded border capitalize ${
                layoutType === mode
                  ? "bg-blue-50 border-blue-500 text-blue-700 font-medium"
                  : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Configuration */}
      {layoutConfig.type === "grid" && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border dark:border-gray-700 space-y-4">
          <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
            Grid Settings
          </h4>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
              Columns (1-12)
            </label>
            <input
              type="range"
              min={1}
              max={6}
              value={layoutConfig.columns || 1}
              onChange={(e) =>
                updateLayout({ columns: parseInt(e.target.value) })
              }
              className="w-full mt-2"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>1</span>
              <span>{layoutConfig.columns || 1} cols</span>
              <span>6</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
              Gap
            </label>
            <select
              value={layoutConfig.gap || "md"}
              onChange={(e) => updateLayout({ gap: e.target.value })}
              // Note: gap needs to be number in strictly typed config, but for UI we might map strings to numbers later.
              // For now assuming the types allows flexible input or we cast.
              className="mt-1 block w-full rounded border-gray-300 text-sm p-1"
            >
              {Object.keys(DEFAULT_FORM_THEME.spacing).map((space) => (
                <option
                  key={space}
                  value={
                    DEFAULT_FORM_THEME.spacing[
                      space as keyof typeof DEFAULT_FORM_THEME.spacing
                    ]
                  }
                >
                  {space}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Flex Configuration */}
      {layoutConfig.type === "flex" && (
        <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded border dark:border-gray-700 space-y-4">
          <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
            Flex Settings
          </h4>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Direction
            </label>
            <div className="flex rounded border bg-white overflow-hidden">
              {["row", "column"].map((dir) => (
                <button
                  key={dir}
                  onClick={() => updateLayout({ direction: dir })}
                  className={`flex-1 py-1 text-xs border-r last:border-0 hover:bg-gray-50 ${layoutConfig.direction === dir ? "bg-blue-100 font-semibold" : ""}`}
                >
                  {dir}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
