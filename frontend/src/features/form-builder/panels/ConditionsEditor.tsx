import React from "react";

import type {
  FieldConditionExpression,
  FieldConditionGroup,
} from "@ui/form/types/condition";

const OPERATORS = [
  { value: "equals", label: "equals" },
  { value: "notEquals", label: "not equals" },
  { value: "contains", label: "contains" },
  { value: "startsWith", label: "starts with" },
  { value: "endsWith", label: "ends with" },
  { value: "greaterThan", label: ">" },
  { value: "lessThan", label: "<" },
  { value: "greaterThanOrEqual", label: ">=" },
  { value: "lessThanOrEqual", label: "<=" },
  { value: "empty", label: "is empty" },
  { value: "notEmpty", label: "is not empty" },
  { value: "in", label: "is one of" },
  { value: "notIn", label: "is not one of" },
  { value: "regex", label: "matches regex" },
  { value: "between", label: "between" },
  { value: "notBetween", label: "not between" },
] as const;

const ACTIONS = [
  { value: "show", label: "Show" },
  { value: "hide", label: "Hide" },
  { value: "enable", label: "Enable" },
  { value: "disable", label: "Disable" },
  { value: "setValue", label: "Set Value" },
] as const;

interface ConditionsEditorProps {
  conditions: FieldConditionExpression | undefined;
  onUpdate: (groups: FieldConditionGroup[]) => void;
}

export const ConditionsEditor: React.FC<ConditionsEditorProps> = ({
  conditions,
  onUpdate,
}) => {
  const groups = conditions?.groups || [];

  const addGroup = () => {
    const newGroups = [
      ...groups,
      {
        action: "show" as const,
        logic: "AND" as const,
        rules: [{ field: "", operator: "equals" as const, value: "" }],
      },
    ];
    onUpdate(newGroups);
  };

  const updateGroup = (
    index: number,
    updates: Partial<FieldConditionGroup>
  ) => {
    const newGroups = groups.map((g, i) =>
      i === index ? { ...g, ...updates } : g
    );
    onUpdate(newGroups);
  };

  const removeGroup = (index: number) => {
    onUpdate(groups.filter((_, i) => i !== index));
  };

  const addRule = (groupIndex: number) => {
    const group = groups[groupIndex];
    if (!group) return;
    const newGroups = groups.map((g, i) =>
      i === groupIndex
        ? {
            ...g,
            rules: [
              ...g.rules,
              { field: "", operator: "equals" as const, value: "" },
            ],
          }
        : g
    );
    onUpdate(newGroups);
  };

  const updateRule = (
    groupIndex: number,
    ruleIndex: number,
    updates: Partial<{ field: string; operator: any; value: any }>
  ) => {
    const newGroups = groups.map((g, i) => {
      if (i !== groupIndex) return g;
      return {
        ...g,
        rules: g.rules.map((r, ri) =>
          ri === ruleIndex ? { ...r, ...updates } : r
        ),
      };
    });
    onUpdate(newGroups);
  };

  const removeRule = (groupIndex: number, ruleIndex: number) => {
    const newGroups = groups.map((g, i) => {
      if (i !== groupIndex) return g;
      return {
        ...g,
        rules: g.rules.filter((_, ri) => ri !== ruleIndex),
      };
    });
    onUpdate(newGroups);
  };

  return (
    <div className="space-y-4">
      {groups.length === 0 && (
        <p className="text-xs text-gray-400 italic py-2">
          No conditions. Fields are always visible and enabled.
        </p>
      )}

      {groups.map((group, groupIndex) => (
        <div
          key={groupIndex}
          className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 space-y-3"
        >
          {/* Group header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <select
                value={group.action}
                onChange={(e) =>
                  updateGroup(groupIndex, {
                    action: e.target.value as FieldConditionGroup["action"],
                  })
                }
                className="text-xs font-medium border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600"
              >
                {ACTIONS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>

              {groups.length > 1 && (
                <select
                  value={group.logic || "AND"}
                  onChange={(e) =>
                    updateGroup(groupIndex, {
                      logic: e.target.value as "AND" | "OR",
                    })
                  }
                  className="text-xs border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600"
                >
                  <option value="AND">AND</option>
                  <option value="OR">OR</option>
                </select>
              )}
            </div>

            <button
              onClick={() => removeGroup(groupIndex)}
              className="text-red-400 hover:text-red-600 text-sm"
            >
              &times;
            </button>
          </div>

          {/* Rules */}
          <div className="space-y-2 pl-4 border-l-2 border-gray-200 dark:border-gray-600">
            {group.rules.map((rule, ruleIndex) => (
              <div key={ruleIndex} className="flex items-center gap-2">
                <input
                  type="text"
                  value={rule.field}
                  onChange={(e) =>
                    updateRule(groupIndex, ruleIndex, { field: e.target.value })
                  }
                  placeholder="field name"
                  className="flex-1 text-xs border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 font-mono"
                />

                <select
                  value={rule.operator}
                  onChange={(e) =>
                    updateRule(groupIndex, ruleIndex, {
                      operator: e.target.value,
                    })
                  }
                  className="text-xs border rounded px-1 py-1 dark:bg-gray-700 dark:border-gray-600"
                >
                  {OPERATORS.map((op) => (
                    <option key={op.value} value={op.value}>
                      {op.label}
                    </option>
                  ))}
                </select>

                {!["empty", "notEmpty"].includes(rule.operator) && (
                  <input
                    type="text"
                    value={(rule.value ?? "") as string | number}
                    onChange={(e) =>
                      updateRule(groupIndex, ruleIndex, {
                        value: e.target.value,
                      })
                    }
                    placeholder="value"
                    className="flex-1 text-xs border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600"
                  />
                )}

                <button
                  onClick={() => removeRule(groupIndex, ruleIndex)}
                  className="text-red-400 hover:text-red-600 text-xs"
                >
                  &times;
                </button>
              </div>
            ))}

            <button
              onClick={() => addRule(groupIndex)}
              className="text-xs text-blue-500 hover:underline"
            >
              + Add Rule
            </button>
          </div>

          {/* setValue target */}
          {group.action === "setValue" && (
            <div className="flex items-center gap-2 pl-4">
              <label className="text-xs text-gray-500">Target:</label>
              <input
                type="text"
                value={(group as any).targetField ?? ""}
                onChange={(e) =>
                  updateGroup(groupIndex, {
                    targetField: e.target.value,
                  } as any)
                }
                placeholder="target field name"
                className="flex-1 text-xs border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 font-mono"
              />
              <label className="text-xs text-gray-500">Value:</label>
              <input
                type="text"
                value={(group as any).targetValue ?? ""}
                onChange={(e) =>
                  updateGroup(groupIndex, {
                    targetValue: e.target.value,
                  } as any)
                }
                placeholder="value to set"
                className="flex-1 text-xs border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
          )}
        </div>
      ))}

      <button
        onClick={addGroup}
        className="w-full text-sm border border-dashed rounded px-3 py-2 text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors"
      >
        + Add Condition Group
      </button>

      {groups.length > 1 && (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <span>Logic between groups:</span>
          <select
            value={conditions?.logic || "AND"}
            onChange={() => onUpdate(groups.length > 0 ? groups : [])}
            className="border rounded px-2 py-0.5 dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="AND">AND</option>
            <option value="OR">OR</option>
          </select>
        </div>
      )}
    </div>
  );
};
