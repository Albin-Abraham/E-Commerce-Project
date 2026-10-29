import React, { useState } from "react";

import { DragDropContext } from "@hello-pangea/dnd";
import { getFormLayoutTree } from "@ui/form/utils/form-layout-utils";
import {
  getFormContainerClass,
  getFormDensityClass,
} from "@ui/form/utils/form-styles";
import { Code, Eye, Monitor } from "lucide-react";

import { FormComposer } from "../FormComposer";
import { Board } from "./board/Board";
import { FormCanvas } from "./board/FormCanvas";
import { PropertiesModal } from "./hooks/PropertiesModal";
import { useBoardAsViewModel } from "./hooks/useBoardAsViewModel";
import { usePropertiesModalAsViewModel } from "./hooks/usePropertiesModalAsViewModel";
import { ComponentPanel } from "./palette/ComponentPanel";

export const FormBuilder: React.FC = () => {
  // ViewModel integration
  const { formDefinition, onDragEnd } = useBoardAsViewModel();
  const { open } = usePropertiesModalAsViewModel();

  const [viewMode, setViewMode] = useState<"preview" | "json">("preview");
  const [canvasMode, setCanvasMode] = useState<"board" | "canvas">("canvas");
  const [previewData, setPreviewData] = useState<any>({});
  const [previewErrors, _setPreviewErrors] = useState<Record<string, string>>(
    {}
  );

  const layoutNodes = getFormLayoutTree(formDefinition);

  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-950 overflow-hidden flex-col font-sans">
      {/* Toolbar - Glass Effect */}
      <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center px-6 justify-between shrink-0 z-50 sticky top-0 transition-all duration-200">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 tracking-tight">
              <span
                onClick={() => open({ type: "form", id: formDefinition.id })}
                className="cursor-pointer hover:text-blue-600 transition-colors"
              >
                {typeof formDefinition.title === "string"
                  ? formDefinition.title
                  : formDefinition.title?.en || ""}
              </span>
            </h1>
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
              v{formDefinition.version} • Draft
            </span>
          </div>
        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setViewMode("preview")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              viewMode === "preview"
                ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
            }`}
          >
            <Eye size={14} /> Preview
          </button>
          <button
            onClick={() => setViewMode("json")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              viewMode === "json"
                ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white"
                : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
            }`}
          >
            <Code size={14} /> JSON
          </button>
        </div>
      </div>

      {/* Split View */}
      <div className="flex-1 flex overflow-hidden">
        <DragDropContext onDragEnd={onDragEnd}>
          {/* LEFT: Component Panel (Palette) */}
          <ComponentPanel />

          {/* CENTER: Form Canvas/Board */}
          <div className="flex-1 bg-slate-50 dark:bg-slate-900 relative overflow-hidden flex flex-col">
            <div className="h-10 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center px-4 justify-between shrink-0 z-10">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Editor Canvas
              </span>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-md text-[10px] font-semibold">
                <button
                  onClick={() => setCanvasMode("canvas")}
                  className={`px-2 py-1 rounded transition-all ${canvasMode === "canvas" ? "bg-white dark:bg-slate-600 shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-800"}`}
                >
                  Vertical
                </button>
                <button
                  onClick={() => setCanvasMode("board")}
                  className={`px-2 py-1 rounded transition-all ${canvasMode === "board" ? "bg-white dark:bg-slate-600 shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-800"}`}
                >
                  Board
                </button>
              </div>
            </div>

            <div className="flex-1 relative overflow-hidden">
              {canvasMode === "board" ? (
                <div className="absolute inset-0 overflow-x-auto overflow-y-hidden bg-gray-50/50 dark:bg-gray-900/50">
                  <Board
                    sections={formDefinition.sections || []}
                    onEditField={(field, sectionId) =>
                      open({ type: "field", id: field.id, sectionId })
                    }
                    onEditSection={(section) =>
                      open({ type: "section", id: section.id || "" })
                    }
                  />
                </div>
              ) : (
                <FormCanvas
                  sections={formDefinition.sections || []}
                  settings={formDefinition.settings}
                  style={formDefinition.style}
                  onEditField={(field, sectionId) =>
                    open({ type: "field", id: field.id, sectionId })
                  }
                  onEditSection={(section) =>
                    open({ type: "section", id: section.id || "" })
                  }
                />
              )}
            </div>
          </div>
        </DragDropContext>

        {/* RIGHT: Live Preview */}
        <div className="w-[400px] bg-white dark:bg-gray-800 flex flex-col border-l dark:border-gray-700 shadow-xl z-20">
          <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <Monitor size={16} /> Live Preview
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 min-h-[400px]">
              {viewMode === "preview" ? (
                <div
                  className="p-6 h-full transition-colors duration-200"
                  style={{
                    backgroundColor: formDefinition.style?.backgroundColor,
                    fontFamily: formDefinition.style?.fontFamily,
                  }}
                >
                  <div
                    className={`transition-all duration-300 mx-auto ${getFormContainerClass(formDefinition.settings?.width)} ${getFormDensityClass(formDefinition.settings?.density)}`}
                    style={
                      {
                        "--primary-color":
                          formDefinition.style?.primaryColor || "#3b82f6",
                      } as React.CSSProperties
                    }
                  >
                    <div className="mb-8 text-left">
                      <h1 className="text-2xl font-bold mb-2 text-slate-900 dark:text-slate-100">
                        {typeof formDefinition.title === "string"
                          ? formDefinition.title
                          : formDefinition.title?.en || ""}
                      </h1>
                      {formDefinition.description && (
                        <p className="text-slate-600 dark:text-slate-400">
                          {typeof formDefinition.description === "string"
                            ? formDefinition.description
                            : (formDefinition.description as any)?.en}
                        </p>
                      )}
                    </div>

                    <FormComposer
                      fields={layoutNodes}
                      getComponentProps={(id) => ({
                        value: previewData[id],
                        error: previewErrors[id],
                        onChange: (val: any) =>
                          setPreviewData((prev: any) => ({
                            ...prev,
                            [id]: val,
                          })),
                      })}
                      visibility={{}}
                    />
                    {layoutNodes.length === 0 && (
                      <div className="text-center text-gray-400 py-12 border-2 border-dashed border-gray-200 rounded-lg">
                        <p className="mb-2">Your form is empty.</p>
                        <p className="text-sm">
                          Add sections and fields using the builder.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <textarea
                  readOnly
                  className="w-full h-full min-h-[400px] font-mono text-sm p-4 bg-gray-900 text-green-400 resize-none focus:outline-none"
                  value={JSON.stringify(formDefinition, null, 2)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Properties Modal */}
      <PropertiesModal />
    </div>
  );
};
