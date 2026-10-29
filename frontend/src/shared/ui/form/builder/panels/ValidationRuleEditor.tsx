import React from "react";

import { ValidationRegistry } from "@form-core/validation-registry";
import type { ValidationRule } from "@ui/form/types/validation";

/** Available strategy types from the registry */
const STRATEGY_TYPES = Object.keys(ValidationRegistry).filter(
  (k) => !["minLength", "maxLength"].includes(k) // aliases, shown under min/max
);

interface ValidationRuleEditorProps {
  rules: ValidationRule[];
  onUpdate: (index: number, updates: Partial<ValidationRule>) => void;
  onAdd: (rule: ValidationRule) => void;
  onRemove: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export const ValidationRuleEditor: React.FC<ValidationRuleEditorProps> = ({
  rules,
  onUpdate,
  onAdd,
  onRemove,
  onReorder,
}) => {
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);

  const handleDragStart = (index: number) => setDragIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      onReorder(dragIndex, index);
      setDragIndex(index);
    }
  };

  const getRuleLabel = (rule: ValidationRule): string => {
    const strategy = ValidationRegistry[rule.type];
    if (strategy) {
      return (
        strategy
          .defaultMessage(rule as any, { label: "", name: "" } as any)
          .replace(" is required", "")
          .replace(" must be at least ", ">= ")
          .replace(" must be at most ", "<= ")
          .trim() || rule.type
      );
    }
    return rule.type;
  };

  return (
    <div className="space-y-3">
      {rules.length === 0 && (
        <p className="text-xs text-gray-400 italic py-2">
          No validation rules. Click &quot;Add Rule&quot; to start.
        </p>
      )}

      {rules.map((rule, index) => (
        <div
          key={index}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={() => setDragIndex(null)}
          className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 space-y-2 cursor-move"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 cursor-grab">⠿</span>
              <span className="text-xs font-mono bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                {rule.type}
              </span>
              {rule.severity && rule.severity !== "error" && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    rule.severity === "warning"
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                  }`}
                >
                  {rule.severity}
                </span>
              )}
            </div>
            <button
              onClick={() => onRemove(index)}
              className="text-red-400 hover:text-red-600 text-sm"
            >
              &times;
            </button>
          </div>

          {/* Type-specific value input */}
          {["min", "max", "minLength", "maxLength", "fileSize"].includes(
            rule.type
          ) && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                {rule.type === "fileSize" ? "Max bytes" : "Value"}
              </label>
              <input
                type="number"
                value={rule.value ?? ""}
                onChange={(e) =>
                  onUpdate(index, { value: Number(e.target.value) })
                }
                className="w-full text-sm border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          )}

          {rule.type === "pattern" && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Pattern (regex or named pattern)
              </label>
              <input
                type="text"
                value={rule.value ?? ""}
                onChange={(e) => onUpdate(index, { value: e.target.value })}
                placeholder="e.g. ^[A-Z]+$ or EMAIL"
                className="w-full text-sm border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 font-mono"
              />
            </div>
          )}

          {rule.type === "fileType" && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Allowed types (comma-separated)
              </label>
              <input
                type="text"
                value={rule.value ?? ""}
                onChange={(e) => onUpdate(index, { value: e.target.value })}
                placeholder="e.g. image/png,image/jpeg,.pdf"
                className="w-full text-sm border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          )}

          {rule.type === "custom" && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Custom function (JS expression)
              </label>
              <textarea
                value={rule.fn?.toString() ?? ""}
                onChange={(e) => {
                  try {
                    const trimmed = e.target.value.trim();
                    if (!trimmed) {
                      onUpdate(index, { fn: undefined });
                      return;
                    }
                    const parsedFn = new Function(`return (${trimmed});`)();
                    if (typeof parsedFn === "function") {
                      onUpdate(index, { fn: parsedFn });
                    }
                  } catch {
                    // ignore parse errors while typing
                  }
                }}
                placeholder="(value, form) => value.length > 3"
                rows={2}
                className="w-full text-xs border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 font-mono"
              />
            </div>
          )}

          {/* Message override */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Custom message (optional)
            </label>
            <input
              type="text"
              value={rule.message ?? ""}
              onChange={(e) =>
                onUpdate(index, { message: e.target.value || undefined })
              }
              placeholder={getRuleLabel(rule)}
              className="w-full text-sm border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          {/* Severity */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Severity</label>
            <select
              value={rule.severity ?? "error"}
              onChange={(e) =>
                onUpdate(index, {
                  severity: e.target.value as "error" | "warning" | "info",
                })
              }
              className="w-full text-sm border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600"
            >
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="info">Info</option>
            </select>
          </div>
        </div>
      ))}

      {/* Add Rule dropdown */}
      <div className="relative">
        <select
          value=""
          onChange={(e) => {
            if (!e.target.value) return;
            onAdd({
              type: e.target.value as ValidationRule["type"],
              severity: "error",
            });
            e.target.value = "";
          }}
          className="w-full text-sm border border-dashed rounded px-2 py-2 text-gray-500 dark:bg-gray-800 dark:border-gray-700 cursor-pointer hover:border-blue-400 transition-colors"
        >
          <option value="">+ Add Validation Rule</option>
          {STRATEGY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};
