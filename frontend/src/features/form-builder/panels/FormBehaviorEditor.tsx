import React from "react";

import type { FormDefinition } from "@ui/form/types";

interface FormBehaviorEditorProps {
  form: FormDefinition;
  onUpdate: (updates: Partial<FormDefinition>) => void;
}

export const FormBehaviorEditor: React.FC<FormBehaviorEditorProps> = ({
  form,
  onUpdate,
}) => {
  // FormDefinition 'events' are functions, which is hard to edit in a UI builder safely.
  // Usually we configure "Enable X Event" or "Webhook URL".
  // For this Builder, let's assume we can toggle standard handlers or Validation settings.

  const validation = form.validation || { validateOn: ["submit"] };

  return (
    <div className="space-y-6">
      <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider">
        Validation Settings
      </h4>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Validation Trigger
          </label>
          <select
            value={validation.validateOn?.[0] || "submit"}
            onChange={(e) => {
              const val = e.target.value;
              let newTriggers: any[] = ["submit"];
              if (val === "blur") newTriggers = ["blur", "submit"];
              if (val === "change") newTriggers = ["change", "blur", "submit"];

              onUpdate({
                validation: { ...validation, validateOn: newTriggers },
              });
            }}
            className="mt-1 block w-full rounded border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 text-sm"
          >
            <option value="submit">On Submit Only</option>
            <option value="blur">On Blur</option>
            <option value="change">On Change</option>
          </select>
        </div>
      </div>

      <div className="pt-4 border-t dark:border-gray-700">
        <h4 className="text-xs font-semibold uppercase text-gray-500 tracking-wider mb-2">
          Lifecycle Events
        </h4>
        <p className="text-xs text-gray-500 mb-4">
          Enable custom handlers (configured in code)
        </p>

        <div className="space-y-2">
          {["onInit", "onChange", "onSubmit", "onError"].map((event) => (
            <div
              key={event}
              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded border dark:border-gray-700"
            >
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {event}
              </span>
              <span className="text-xs text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                {form.events && form.events[event as keyof typeof form.events]
                  ? "Active"
                  : "Inactive"}
              </span>
            </div>
          ))}
          <p className="text-[10px] text-gray-400 mt-1">
            * Events must be attached via code injection or advanced script
            editor.
          </p>
        </div>
      </div>
    </div>
  );
};
