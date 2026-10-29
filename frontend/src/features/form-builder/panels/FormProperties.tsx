import React, { useState } from "react";

import type { FormDefinition } from "@ui/form/types";
import {
  FORM_DENSITY_OPTIONS,
  FORM_THEME_COLORS,
  FORM_WIDTH_OPTIONS,
} from "@ui/form/utils/form-styles";

import { FormBehaviorEditor } from "./FormBehaviorEditor";

interface FormPropertiesProps {
  formDefinition: FormDefinition;
  onUpdate: (updates: Partial<FormDefinition>) => void;
}

export const FormProperties: React.FC<FormPropertiesProps> = ({
  formDefinition,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<"general" | "design" | "behavior">(
    "general"
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Form Settings</h3>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded p-1">
          <button
            onClick={() => setActiveTab("general")}
            className={`text-xs px-3 py-1 rounded transition-colors ${activeTab === "general" ? "bg-white dark:bg-gray-600 shadow text-blue-600 font-medium" : "text-gray-500 hover:text-gray-700"}`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab("design")}
            className={`text-xs px-3 py-1 rounded transition-colors ${activeTab === "design" ? "bg-white dark:bg-gray-600 shadow text-blue-600 font-medium" : "text-gray-500 hover:text-gray-700"}`}
          >
            Design
          </button>
          <button
            onClick={() => setActiveTab("behavior")}
            className={`text-xs px-3 py-1 rounded transition-colors ${activeTab === "behavior" ? "bg-white dark:bg-gray-600 shadow text-blue-600 font-medium" : "text-gray-500 hover:text-gray-700"}`}
          >
            Behavior
          </button>
        </div>
      </div>

      {activeTab === "general" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Form Title
            </label>
            <input
              type="text"
              value={
                typeof formDefinition.title === "string"
                  ? formDefinition.title
                  : formDefinition.title.en
              }
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 p-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={
                typeof formDefinition.description === "string"
                  ? formDefinition.description
                  : formDefinition.description?.en || ""
              }
              onChange={(e) => onUpdate({ description: e.target.value })}
              className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 p-2 border"
            />
          </div>
        </div>
      )}

      {activeTab === "design" && (
        <div className="space-y-6">
          {/* Layout Settings */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
              Layout
            </h4>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Width
              </label>
              <select
                value={formDefinition.settings?.width || "centered"}
                onChange={(e) =>
                  onUpdate({
                    settings: {
                      ...formDefinition.settings,
                      width: e.target.value as any,
                    },
                  })
                }
                className="w-full text-sm rounded border-gray-300 dark:border-gray-700 dark:bg-gray-800 p-2"
              >
                {FORM_WIDTH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Density
              </label>
              <div className="flex rounded border overflow-hidden">
                {FORM_DENSITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() =>
                      onUpdate({
                        settings: {
                          ...formDefinition.settings,
                          density: opt.value as any,
                        },
                      })
                    }
                    className={`flex-1 py-1.5 text-xs capitalize ${formDefinition.settings?.density === opt.value ? "bg-blue-50 text-blue-600 font-medium" : "hover:bg-gray-50"}`}
                  >
                    {opt.value}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-px bg-gray-200 dark:bg-gray-700" />

          {/* Style Settings */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
              Theme
            </h4>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Primary Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {FORM_THEME_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() =>
                      onUpdate({
                        style: { ...formDefinition.style, primaryColor: color },
                      })
                    }
                    className={`w-6 h-6 rounded-full border border-gray-200 ${formDefinition.style?.primaryColor === color ? "ring-2 ring-offset-1 ring-blue-500" : ""}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Background
              </label>
              <input
                type="color"
                value={formDefinition.style?.backgroundColor || "#ffffff"}
                onChange={(e) =>
                  onUpdate({
                    style: {
                      ...formDefinition.style,
                      backgroundColor: e.target.value,
                    },
                  })
                }
                className="w-full h-8 p-0 rounded cursor-pointer border-0"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "behavior" && (
        <FormBehaviorEditor form={formDefinition} onUpdate={onUpdate} />
      )}
    </div>
  );
};
