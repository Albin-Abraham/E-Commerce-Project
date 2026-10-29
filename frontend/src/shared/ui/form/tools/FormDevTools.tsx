import React, { useEffect, useState } from "react";

import { commandBus } from "@core/events/CommandBus";
import { PlatformCommand } from "@core/events/config/shortcuts";
import { FormCore } from "@form-core/engine";
import type { InternalFormState } from "@form-core/engine";
import {
  Activity,
  AlertCircle,
  Bug,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Copy,
  Palette,
  RefreshCw,
  Redo2,
  Undo2,
  X,
  Zap,
} from "lucide-react";

import { FormStyleDebugger } from "./FormStyleDebugger";

interface FormDevToolsProps {
  form: FormCore<any>;
  open?: boolean;
}

export const FormDevTools: React.FC<FormDevToolsProps> = ({
  form,
  open = false,
}) => {
  const [isOpen, setIsOpen] = useState(open);
  const [state, setState] = useState<InternalFormState<any>>(form.state);
  const [activeTab, setActiveTab] = useState<string>("values");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const previousFocusedElement = React.useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Subscribe to form updates
    const unsubscribe = form.subscribe((newState) => {
      setState({ ...newState });
    });
    return () => {
      unsubscribe();
    };
  }, [form]);

  // Centralized command bus subscription with focus memory
  useEffect(() => {
    const unsubscribe = commandBus.on(
      PlatformCommand.ToggleFormDevTools,
      () => {
        setIsOpen((prev) => {
          if (!prev) {
            if (document.activeElement instanceof HTMLElement) {
              previousFocusedElement.current = document.activeElement;
            }
            return true;
          } else {
            setTimeout(() => previousFocusedElement.current?.focus(), 0);
            return false;
          }
        });
      }
    );
    return unsubscribe;
  }, []);

  const handleOpen = () => {
    if (document.activeElement instanceof HTMLElement) {
      previousFocusedElement.current = document.activeElement;
    }
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => previousFocusedElement.current?.focus(), 0);
  };

  const togglePath = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const expandAll = () => {
    const data = (state as any)[activeTab];
    if (data) {
      const allPaths = collectAllPaths(data);
      setExpandedPaths(new Set(allPaths));
    }
  };

  const collapseAll = () => {
    setExpandedPaths(new Set());
  };

  const copyToClipboard = () => {
    const data = (state as any)[activeTab] || state;
    if (data) {
      const json = JSON.stringify(data, null, 2);
      navigator.clipboard.writeText(json);
    }
  };

  // Calculate error summary
  const errorSummary = React.useMemo(() => {
    const validity = state.validity || {};
    const errorCount = Object.values(validity).filter((v) => !v.valid).length;
    const totalFields = Object.keys(validity).length;
    const invalidFieldIds = Object.entries(validity)
      .filter(([_id, v]) => !v.valid)
      .map(([id]) => id);
    return { errorCount, totalFields, invalidFieldIds };
  }, [state.validity]);

  if (!isOpen) {
    return (
      <>
        <div className="sr-only" aria-live="polite">
          Form DevTools Inspector closed
        </div>
        <button
          onClick={handleOpen}
          aria-keyshortcuts="Control+Shift+D Meta+Shift+D"
          aria-label="Open Form DevTools (Ctrl+Shift+D)"
          className="fixed bottom-4 right-4 bg-surface-raised border border-border/80 text-foreground p-3 rounded-full shadow-2xl hover:border-primary/50 hover:bg-primary/10 transition-all z-[var(--z-dropdown)] flex items-center justify-center cursor-pointer group"
          title="Open Form DevTools (Ctrl+Shift+D)"
        >
          <Bug size={20} className="text-primary group-hover:scale-110 transition-transform" />
        </button>
      </>
    );
  }

  return (
    <>
      <div className="sr-only" aria-live="polite">
        Form DevTools Inspector opened
      </div>
      <div
        role="dialog"
        aria-label="Form DevTools Inspector"
        aria-modal="false"
        aria-keyshortcuts="Control+Shift+D Meta+Shift+D"
        className="fixed bottom-4 right-4 w-[520px] max-h-[82vh] bg-surface/95 backdrop-blur-2xl border border-border/80 shadow-2xl rounded-2xl z-[var(--z-dropdown)] flex flex-col font-mono text-xs overflow-hidden text-foreground"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 bg-surface-raised border-b border-border/60">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <Bug size={16} className="text-primary" />
            <span className="tracking-tight">Form DevTools</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-sans">
              Ctrl+Shift+D
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                form.undo().catch((err) => console.error("Undo failed:", err));
              }}
              disabled={!form.canUndo}
              className="p-1.5 hover:bg-surface-raised text-foreground/70 hover:text-foreground rounded-lg transition-colors disabled:opacity-40 disabled:cursor-default"
              title="Undo"
            >
              <Undo2 size={14} />
            </button>
            <button
              onClick={() => {
                form.redo().catch((err) => console.error("Redo failed:", err));
              }}
              disabled={!form.canRedo}
              className="p-1.5 hover:bg-surface-raised text-foreground/70 hover:text-foreground rounded-lg transition-colors disabled:opacity-40 disabled:cursor-default"
              title="Redo"
            >
              <Redo2 size={14} />
            </button>
            <button
              onClick={copyToClipboard}
              className="p-1.5 hover:bg-surface-raised text-foreground/70 hover:text-foreground rounded-lg transition-colors"
              title="Copy to Clipboard"
            >
              <Copy size={14} />
            </button>
            <button
              onClick={() => setState({ ...form.state })}
              className="p-1.5 hover:bg-surface-raised text-foreground/70 hover:text-foreground rounded-lg transition-colors"
              title="Refresh Snapshot"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={handleClose}
              aria-label="Close DevTools"
              className="p-1.5 hover:bg-surface-raised text-foreground/70 hover:text-foreground rounded-lg transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

      {/* Error Summary Banner */}
      {activeTab === "validity" && errorSummary.errorCount > 0 && (
        <div className="bg-danger/10 border-b border-danger/20 p-2.5 flex items-center gap-2">
          <AlertCircle size={14} className="text-danger" />
          <span className="text-danger text-xs font-medium">
            {errorSummary.errorCount} error
            {errorSummary.errorCount !== 1 ? "s" : ""} in{" "}
            {errorSummary.totalFields} fields
          </span>
        </div>
      )}

      {activeTab === "validity" && errorSummary.errorCount === 0 && (
        <div className="bg-success/10 border-b border-success/20 p-2.5 flex items-center gap-2">
          <CheckCircle size={14} className="text-success" />
          <span className="text-success text-xs font-medium">
            All {errorSummary.totalFields} fields valid
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border/60 overflow-x-auto bg-surface/50 scrollbar-none">
        {["values", "vitality", "validity", "visibility", "styles", "performance", "debug"].map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-2.5 px-3 text-center capitalize whitespace-nowrap text-xs transition-colors cursor-pointer ${
                activeTab === tab
                  ? "bg-surface text-primary font-bold border-b-2 border-primary"
                  : "text-foreground/60 hover:text-foreground hover:bg-surface-raised/40"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5">
                {tab === "styles" && <Palette size={12} />}
                {tab === "performance" && <Activity size={12} />}
                {tab}
              </div>
            </button>
          )
        )}
      </div>

      {/* Search & Controls */}
      <div className="p-2.5 bg-surface-raised/40 border-b border-border/60 flex items-center gap-2">
        <input
          type="text"
          placeholder="Filter properties..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-border bg-surface text-foreground placeholder:text-foreground/40 outline-none focus:border-primary/50"
        />
        <button
          onClick={expandAll}
          className="px-2.5 py-1.5 text-xs bg-surface-raised border border-border hover:border-primary/40 text-foreground/80 hover:text-foreground rounded-lg cursor-pointer transition-colors"
          title="Expand All"
        >
          Expand
        </button>
        <button
          onClick={collapseAll}
          className="px-2.5 py-1.5 text-xs bg-surface-raised border border-border hover:border-primary/40 text-foreground/80 hover:text-foreground rounded-lg cursor-pointer transition-colors"
          title="Collapse All"
        >
          Collapse
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 bg-slate-50 dark:bg-slate-950">
        {activeTab === "styles" ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-[9px] uppercase font-bold text-gray-400">
                Select Field to Inspect
              </label>
              <select
                value={selectedFieldId || ""}
                onChange={(e) => setSelectedFieldId(e.target.value)}
                className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs"
              >
                <option value="">-- Choose Field --</option>
                {Object.keys(form.registry.definition.fields).map((id) => (
                  <option key={id} value={id}>
                    {id}
                  </option>
                ))}
              </select>
            </div>

            {selectedFieldId ? (
              <FormStyleDebugger
                field={form.registry.definition.fields[selectedFieldId]}
              />
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-gray-400 gap-2 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                <Palette size={32} opacity={0.2} />
                <span>Select a field to trace style sources</span>
              </div>
            )}
          </div>
        ) : activeTab === "performance" ? (
          <div className="space-y-4">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-2 mb-4 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                <Zap size={14} className="text-yellow-500" />
                <span>Runtime Metrics</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] text-gray-400">Submission</span>
                  <span className="text-lg font-bold text-gray-700 dark:text-gray-200">
                    {(state.performance?.lastSubmissionDurationMs || 0).toFixed(
                      1
                    )}
                    ms
                  </span>
                </div>
                <div className="flex flex-col gap-1 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-800">
                  <span className="text-[10px] text-gray-400">Validation</span>
                  <span className="text-lg font-bold text-gray-700 dark:text-gray-200">
                    {(state.performance?.lastValidationDurationMs || 0).toFixed(
                      1
                    )}
                    ms
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <div className="flex items-center justify-between text-[10px] text-gray-400 mb-2">
                  <span>Engine Version</span>
                  <span>v2.4.0-industrial</span>
                </div>
                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[85%]" />
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-lg text-[10px] text-blue-700 dark:text-blue-300 leading-relaxed">
              Performance metrics are collected in real-time. Validation
              duration includes both local rules and external schemas.
            </div>
          </div>
        ) : (
          <CollapsibleJsonView
            data={(state as any)[activeTab]}
            expandedPaths={expandedPaths}
            togglePath={togglePath}
            searchQuery={searchQuery}
            validityState={activeTab === "values" ? state.validity : undefined}
            vitalityState={activeTab === "values" ? state.vitality : undefined}
          />
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-400 text-[10px] flex justify-between">
        <span>SDK v2.0</span>
        <span>
          Fields: {Object.keys(form.registry.definition.fields).length}
        </span>
        {activeTab === "debug" && state.debug && (
          <span>Renders: {state.debug.renderCount}</span>
        )}
      </div>
    </div>
  </>
);
};

// Helper to collect all paths for expand all
function collectAllPaths(data: any, prefix = ""): string[] {
  if (!data || typeof data !== "object") return [];

  const paths: string[] = [];
  for (const key in data) {
    const path = prefix ? `${prefix}.${key}` : key;
    paths.push(path);
    if (typeof data[key] === "object" && data[key] !== null) {
      paths.push(...collectAllPaths(data[key], path));
    }
  }
  return paths;
}

// Enhanced Collapsible JSON Tree Viewer
interface CollapsibleJsonViewProps {
  data: any;
  expandedPaths: Set<string>;
  togglePath: (path: string) => void;
  level?: number;
  path?: string;
  searchQuery?: string;
  validityState?: any;
  vitalityState?: any;
}

const CollapsibleJsonView: React.FC<CollapsibleJsonViewProps> = ({
  data,
  expandedPaths,
  togglePath,
  level = 0,
  path = "",
  searchQuery = "",
  validityState,
  vitalityState,
}) => {
  if (data === null) return <span className="text-gray-400">null</span>;
  if (data === undefined)
    return <span className="text-gray-400">undefined</span>;

  if (typeof data !== "object") {
    const color =
      typeof data === "string"
        ? "text-green-600 dark:text-green-400"
        : typeof data === "number"
          ? "text-blue-600 dark:text-blue-400"
          : typeof data === "boolean"
            ? "text-purple-600 dark:text-purple-400"
            : "text-gray-600";

    let display = String(data);
    if (typeof data === "string" && display.length > 100)
      display = display.substring(0, 100) + "...";

    return (
      <span className={color}>
        {typeof data === "string" ? `"${display}"` : display}
      </span>
    );
  }

  const isArray = Array.isArray(data);
  const isEmpty = Object.keys(data).length === 0;

  if (isEmpty)
    return <span className="text-gray-400">{isArray ? "[]" : "{}"}</span>;

  return (
    <div className="ml-0">
      {Object.entries(data).map(([key, val]) => {
        const currentPath = path ? `${path}.${key}` : key;
        const isExpanded = expandedPaths.has(currentPath);
        const isObject = typeof val === "object" && val !== null;
        const matchesSearch =
          !searchQuery || key.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch && searchQuery) return null;

        // Check validation state for this field
        const hasError = validityState?.[key] && !validityState[key].valid;
        const isDirty = vitalityState?.[key]?.dirty;
        const isTouched = vitalityState?.[key]?.touched;

        const fieldBadge = hasError
          ? "🔴"
          : isDirty
            ? "🟡"
            : isTouched
              ? "🔵"
              : "";

        return (
          <div key={key} className="flex items-start my-1">
            {isObject && (
              <button
                onClick={() => togglePath(currentPath)}
                className="mr-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-0.5"
              >
                {isExpanded ? (
                  <ChevronDown size={12} />
                ) : (
                  <ChevronRight size={12} />
                )}
              </button>
            )}
            <span
              className={`text-gray-600 dark:text-gray-400 mr-1 font-semibold ${hasError ? "text-red-600 dark:text-red-400" : ""}`}
            >
              {key}: {fieldBadge}
            </span>
            {!isObject ? (
              <CollapsibleJsonView
                data={val}
                expandedPaths={expandedPaths}
                togglePath={togglePath}
                level={level + 1}
                path={currentPath}
                searchQuery={searchQuery}
              />
            ) : (
              <>
                {!isExpanded && (
                  <span className="text-gray-400">
                    {Array.isArray(val)
                      ? `[${val.length}]`
                      : `{${Object.keys(val).length}}`}
                  </span>
                )}
                {isExpanded && (
                  <div className="ml-4">
                    <CollapsibleJsonView
                      data={val}
                      expandedPaths={expandedPaths}
                      togglePath={togglePath}
                      level={level + 1}
                      path={currentPath}
                      searchQuery={searchQuery}
                      validityState={validityState}
                      vitalityState={vitalityState}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};
