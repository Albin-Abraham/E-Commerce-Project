import React, { useMemo } from "react";

import { buildHeroUIClasses } from "@ui/form/utils/form-styles";

import { useFormTheme } from "../context/FormThemeContext";
import type { FormField } from "../fields";

interface FormStyleDebuggerProps {
  field: FormField;
}

export const FormStyleDebugger: React.FC<FormStyleDebuggerProps> = ({
  field,
}) => {
  const theme = useFormTheme();

  const trace = useMemo(() => {
    return buildHeroUIClasses(field, false, false, theme, true);
  }, [field, theme]);

  const { sources } = trace.metadata;

  return (
    <div className="space-y-4 text-[10px] font-mono p-2">
      <div className="flex items-center justify-between border-b pb-1 border-gray-200 dark:border-gray-700">
        <span className="font-bold text-blue-500 uppercase tracking-tighter">
          Style Trace: {field.id}
        </span>
        <span className="text-gray-400 capitalize">{field.type}</span>
      </div>

      {Object.entries(sources).map(([source, data]: [string, any]) => (
        <div key={source} className="group">
          <div className="flex items-center gap-2 mb-1">
            <div
              className={`w-1.5 h-1.5 rounded-full ${getSourceColor(source)}`}
            />
            <span className="font-bold uppercase text-gray-500">{source}</span>
          </div>

          <div className="pl-3.5 space-y-1">
            {typeof data === "string" ? (
              <ClassList classes={data} />
            ) : (
              Object.entries(data).map(([slot, classes]: [string, any]) => (
                <div key={slot} className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-gray-400 italic">
                    Slot: {slot}
                  </span>
                  <ClassList
                    classes={
                      typeof classes === "string"
                        ? classes
                        : JSON.stringify(classes)
                    }
                  />
                </div>
              ))
            )}
          </div>
        </div>
      ))}

      {/* Visual Density Indicators */}
      <div className="mt-4 pt-2 border-t border-gray-100 dark:border-gray-800 flex gap-4">
        <div className="flex items-center gap-1">
          <span className="text-gray-400">Density:</span>
          <span
            className={`px-1.5 py-0.5 rounded ${sources.magic.density.isCompact ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}
          >
            {sources.magic.density.isCompact ? "Compact" : "Normal"}
          </span>
        </div>
      </div>
    </div>
  );
};

const ClassList = ({ classes }: { classes: string }) => {
  if (!classes || classes === "None")
    return <span className="text-gray-300 italic">none</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {classes
        .split(" ")
        .filter(Boolean)
        .map((cls, i) => (
          <span
            key={i}
            className="px-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded border border-gray-200 dark:border-gray-700"
          >
            {cls}
          </span>
        ))}
    </div>
  );
};

function getSourceColor(source: string) {
  switch (source) {
    case "base":
      return "bg-gray-400";
    case "theme":
      return "bg-blue-400";
    case "intent":
      return "bg-purple-400";
    case "heuristic":
      return "bg-amber-400";
    case "explicit":
      return "bg-emerald-400";
    case "magic":
      return "bg-pink-400";
    default:
      return "bg-slate-300";
  }
}
