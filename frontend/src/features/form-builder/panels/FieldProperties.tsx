import React from "react";

import type { FieldUI, FormField } from "@ui/form/fields";
import { FIELD_METADATA } from "@ui/form/fields/field-metadata";

import { useBuilderStore } from "../store/builder.store";
import { ConditionsEditor } from "./ConditionsEditor";
import { ValidationRuleEditor } from "./ValidationRuleEditor";

/** Slot keys derived from FieldUI.classNames — keeps UI in sync with the type. */
const CLASS_NAMES_SLOTS = Object.keys(
  {} as NonNullable<FieldUI["classNames"]>
) as Array<keyof NonNullable<FieldUI["classNames"]>>;

interface FieldPropertiesProps {
  field: FormField;
  sectionId: string;
  onUpdate: (
    sectionId: string,
    fieldId: string,
    updates: Partial<FormField>
  ) => void;
}

export const FieldProperties: React.FC<FieldPropertiesProps> = ({
  field,
  sectionId,
  onUpdate,
}) => {
  // field.properties might be undefined, so we default it
  const properties = field.properties || {};
  const layout = field.layout || {};

  // Builder store actions for validation + conditions
  const {
    addValidationRule,
    updateValidationRule,
    removeValidationRule,
    reorderValidationRules,
    setFieldConditions,
  } = useBuilderStore();

  // Helper to update properties
  const updateProperty = (key: string, value: any) => {
    onUpdate(sectionId, field.id, {
      properties: { ...properties, [key]: value },
    });
  };

  const updateLayout = (key: string, value: any) => {
    onUpdate(sectionId, field.id, {
      layout: { ...layout, [key]: value },
    });
  };

  const updateMetaClassNames = (slot: string, value: string) => {
    onUpdate(sectionId, field.id, {
      meta: {
        ...field.meta,
        ui: {
          ...field.meta?.ui,
          classNames: {
            ...(field.meta?.ui?.classNames || {}),
            [slot]: value,
          },
        },
      },
    });
  };

  type Tab = "general" | "style" | "validation" | "conditions";
  const [activeTab, setActiveTab] = React.useState<Tab>("general");

  const validationRules = field.validation?.rules || [];
  const conditionGroups = field.meta?.conditions?.groups || [];

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Field Properties</h3>
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded p-1">
          {(["general", "style", "validation", "conditions"] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-xs px-3 py-1 rounded transition-colors capitalize ${
                  activeTab === tab
                    ? "bg-white dark:bg-gray-600 shadow text-blue-600 font-medium"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            )
          )}
        </div>
      </div>

      {activeTab === "general" && (
        <div className="space-y-4">
          {/* Basic Props */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Type
            </label>
            <div className="mt-1 flex items-center gap-2 p-2 border rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
              <span className="text-gray-500">
                {FIELD_METADATA[field.type]?.icon()}
              </span>
              <span className="text-sm font-medium">
                {FIELD_METADATA[field.type]?.label || field.type}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Label
            </label>
            <input
              type="text"
              value={
                typeof field.label === "string" ? field.label : field.label.en
              }
              onChange={(e) =>
                onUpdate(sectionId, field.id, { label: e.target.value })
              }
              className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 p-2 border"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Field Name (Key)
            </label>
            <input
              type="text"
              value={field.name}
              onChange={(e) =>
                onUpdate(sectionId, field.id, { name: e.target.value })
              }
              className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 p-2 border"
            />
          </div>

          {/* Validation */}
          <div className="space-y-2 pt-2 border-t dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Validation
            </h4>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={field.required as boolean}
                onChange={(e) =>
                  onUpdate(sectionId, field.id, { required: e.target.checked })
                }
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Required
              </span>
            </div>
          </div>

          <div className="pt-4 border-t dark:border-gray-700 space-y-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Display Settings
            </h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Placeholder
              </label>
              <input
                type="text"
                value={
                  typeof field.meta?.ui?.placeholder === "string"
                    ? field.meta.ui.placeholder
                    : (field.meta?.ui?.placeholder as any)?.en || ""
                }
                onChange={(e) =>
                  onUpdate(sectionId, field.id, {
                    meta: {
                      ...field.meta,
                      ui: { ...field.meta?.ui, placeholder: e.target.value },
                    },
                  })
                }
                className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 p-2 border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Help Text
              </label>
              <input
                type="text"
                value={
                  typeof field.meta?.ui?.helpText === "string"
                    ? field.meta.ui.helpText
                    : (field.meta?.ui?.helpText as any)?.en || ""
                }
                onChange={(e) =>
                  onUpdate(sectionId, field.id, {
                    meta: {
                      ...field.meta,
                      ui: { ...field.meta?.ui, helpText: e.target.value },
                    },
                  })
                }
                className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 p-2 border"
              />
            </div>
          </div>

          {/* Options (Select/Radio) */}
          {(field.type === "select" || field.type === "radio") && (
            <div className="pt-2 border-t dark:border-gray-700">
              <h4 className="text-sm font-medium mb-2">Options</h4>
              <div className="space-y-2">
                {field.meta?.options?.options?.map((opt, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      className="flex-1 text-sm border rounded px-2 py-1 dark:bg-gray-800 dark:border-gray-600"
                      placeholder="Label"
                      value={
                        typeof opt.label === "string" ? opt.label : opt.label.en
                      }
                      onChange={(e) => {
                        const newOptions = [
                          ...(field.meta?.options?.options || []),
                        ];
                        newOptions[idx] = {
                          ...newOptions[idx],
                          label: e.target.value,
                        };
                        onUpdate(sectionId, field.id, {
                          meta: {
                            ...field.meta,
                            options: {
                              ...field.meta?.options,
                              options: newOptions,
                            },
                          },
                        });
                      }}
                    />
                    <input
                      className="flex-1 text-sm border rounded px-2 py-1 dark:bg-gray-800 dark:border-gray-600"
                      placeholder="Value"
                      value={opt.value}
                      onChange={(e) => {
                        const newOptions = [
                          ...(field.meta?.options?.options || []),
                        ];
                        newOptions[idx] = {
                          ...newOptions[idx],
                          value: e.target.value,
                        };
                        onUpdate(sectionId, field.id, {
                          meta: {
                            ...field.meta,
                            options: {
                              ...field.meta?.options,
                              options: newOptions,
                            },
                          },
                        });
                      }}
                    />
                    <button
                      onClick={() => {
                        const newOptions = field.meta?.options?.options?.filter(
                          (_, i) => i !== idx
                        );
                        onUpdate(sectionId, field.id, {
                          meta: {
                            ...field.meta,
                            options: {
                              ...field.meta?.options,
                              options: newOptions || [],
                            },
                          },
                        });
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      &times;
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newOptions = [
                      ...(field.meta?.options?.options || []),
                      { label: "New Option", value: "value" },
                    ];
                    onUpdate(sectionId, field.id, {
                      meta: {
                        ...field.meta,
                        options: {
                          ...field.meta?.options,
                          options: newOptions,
                        },
                      },
                    });
                  }}
                  className="text-xs text-blue-600 hover:underline"
                >
                  + Add Option
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "style" && (
        <div className="space-y-4">
          {/* Width & Row */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Width
            </label>
            <select
              value={properties.width || "full"}
              onChange={(e) => updateProperty("width", e.target.value)}
              className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 text-sm"
            >
              <option value="quarter">Quarter (3/12)</option>
              <option value="third">Third (4/12)</option>
              <option value="half">Half (6/12)</option>
              <option value="full">Full (12/12)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Label Placement
            </label>
            <select
              value={properties.labelPlacement || "top"}
              onChange={(e) => updateProperty("labelPlacement", e.target.value)}
              className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 text-sm"
            >
              <option value="top">Top</option>
              <option value="side">Side (Left)</option>
              <option value="hidden">Hidden</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Custom Column Span (1-12)
            </label>
            <input
              type="number"
              min="1"
              max="12"
              value={(layout as any).columnSpan || ""}
              onChange={(e) =>
                updateLayout("columnSpan", parseInt(e.target.value))
              }
              placeholder="Auto"
              className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 p-2 text-sm border"
            />
          </div>

          <div className="flex items-center pt-2">
            <input
              type="checkbox"
              checked={properties.startNewRow || false}
              onChange={(e) => updateProperty("startNewRow", e.target.checked)}
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Start New Row
            </span>
          </div>

          {/* Borders & Spacing */}
          <div className="pt-4 border-t dark:border-gray-700">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Border Radius
            </label>
            <select
              value={properties.borderRadius || "default"}
              onChange={(e) => updateProperty("borderRadius", e.target.value)}
              className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 text-sm"
            >
              <option value="none">None</option>
              <option value="small">Small</option>
              <option value="default">Default</option>
              <option value="large">Large</option>
              <option value="full">Full</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-500">
                Margin Top
              </label>
              <input
                type="text"
                placeholder="mt-4"
                value={properties.marginTop || ""}
                onChange={(e) => updateProperty("marginTop", e.target.value)}
                className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 p-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500">
                Padding
              </label>
              <input
                type="text"
                placeholder="p-4"
                value={properties.padding || ""}
                onChange={(e) => updateProperty("padding", e.target.value)}
                className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 p-1 text-sm"
              />
            </div>
          </div>

          {/* Responsive Visibility */}
          <div className="pt-4 border-t dark:border-gray-700 space-y-2">
            <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
              Responsive Visibility
            </h4>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={properties.hideOnMobile || false}
                onChange={(e) =>
                  updateProperty("hideOnMobile", e.target.checked)
                }
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Hide on Mobile
              </span>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={properties.hideOnTablet || false}
                onChange={(e) =>
                  updateProperty("hideOnTablet", e.target.checked)
                }
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Hide on Tablet
              </span>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={properties.hideOnDesktop || false}
                onChange={(e) =>
                  updateProperty("hideOnDesktop", e.target.checked)
                }
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Hide on Desktop
              </span>
            </div>
          </div>

          {/* Per-Slot CSS Class Editors */}
          <div className="pt-4 border-t dark:border-gray-700 space-y-3">
            <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
              Slot Classes
            </h4>
            <p className="text-xs text-gray-400">
              Tailwind classes for each wrapper slot.
            </p>
            {CLASS_NAMES_SLOTS.map((slot) => (
              <div key={slot}>
                <label className="block text-xs font-medium text-gray-500">
                  {slot}
                </label>
                <input
                  type="text"
                  placeholder={`e.g. ${slot === "base" ? "mb-4" : slot === "input" ? "text-sm" : ""}`}
                  value={field.meta?.ui?.classNames?.[slot] || ""}
                  onChange={(e) => updateMetaClassNames(slot, e.target.value)}
                  className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 p-1 text-xs border font-mono"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === "validation" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Validation Rules
            </h4>
            <span className="text-xs text-gray-400">
              {validationRules.length} rule
              {validationRules.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Quick required toggle */}
          <div className="flex items-center p-2 bg-gray-50 dark:bg-gray-800 rounded border dark:border-gray-700">
            <input
              type="checkbox"
              checked={field.required as boolean}
              onChange={(e) =>
                onUpdate(sectionId, field.id, { required: e.target.checked })
              }
              className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Required
            </span>
          </div>

          <ValidationRuleEditor
            rules={validationRules}
            onAdd={(rule) => addValidationRule(sectionId, field.id, rule)}
            onUpdate={(index, updates) =>
              updateValidationRule(sectionId, field.id, index, updates)
            }
            onRemove={(index) =>
              removeValidationRule(sectionId, field.id, index)
            }
            onReorder={(from, to) =>
              reorderValidationRules(sectionId, field.id, from, to)
            }
          />
        </div>
      )}

      {activeTab === "conditions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Conditional Logic
            </h4>
            <span className="text-xs text-gray-400">
              {conditionGroups.length} group
              {conditionGroups.length !== 1 ? "s" : ""}
            </span>
          </div>

          <p className="text-xs text-gray-400">
            Define when this field is shown, hidden, enabled, or disabled based
            on other field values.
          </p>

          <ConditionsEditor
            conditions={field.meta?.conditions}
            onUpdate={(groups) =>
              setFieldConditions(sectionId, field.id, groups)
            }
          />
        </div>
      )}
    </div>
  );
};
