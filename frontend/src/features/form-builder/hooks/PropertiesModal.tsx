import React from "react";

// Adapter
import { PropertiesPanel } from "../panels/PropertiesPanel";
import { useBuilderStore } from "../store/builder.store";
// View (Dumb)
import { usePropertiesModalAsViewModel } from "./usePropertiesModalAsViewModel";

export const PropertiesModal: React.FC = () => {
  const { isOpen, close, modalTitle } = usePropertiesModalAsViewModel();

  // Connect directly to store here (Container Pattern)
  const { formDefinition, selection, updateForm, updateSection, updateField } =
    useBuilderStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out border-l dark:border-gray-700 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <h2 className="font-semibold text-gray-800 dark:text-white truncate">
          {modalTitle}
        </h2>
        <button
          onClick={close}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
        >
          <span className="sr-only">Close</span>
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Content Scroller */}
      <div className="flex-1 overflow-y-auto">
        <PropertiesPanel
          selection={selection}
          formDefinition={formDefinition}
          onUpdateForm={updateForm}
          onUpdateSection={updateSection}
          onUpdateField={updateField}
        />
      </div>
    </div>
  );
};
