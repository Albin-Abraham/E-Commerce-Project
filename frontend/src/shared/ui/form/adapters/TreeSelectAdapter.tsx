import React, { useState } from "react";

// Assuming an import from a complex UI library
// import { UncontrolledTreeEnvironment, Tree } from "react-complex-tree";

/**
 * 1. Define the Expected JSON Definition for the Tree
 * This is what the FormCore schema authors will write.
 */
interface TreeFieldMeta {
  allowMultiple?: boolean;
  canDragAndDrop?: boolean;
  maxDepth?: number;
  dataProviderUrl?: string; // Where to fetch the tree nodes
}

/**
 * 2. The Adapter Component (Registered in FormRegistryContext)
 * Wrapped in forwardRef so the Form Engine can imperatively control it
 * or manage focus during validation errors.
 */
export const TreeSelectAdapter = React.forwardRef(
  ({ field, value, onChange, error }: any, forwardedRef: React.Ref<any>) => {
    // A. Extract instance definitions from the JSON schema
    const meta: TreeFieldMeta = field.meta?.ui || {};
    const isMulti = meta.allowMultiple ?? false;

    // B. Local Ephemeral State (FormCore never sees this!)
    const [, setExpandedItems] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    // C. DOM References
    // We use a local ref to interact directly with the 3rd-party UI primitive
    const internalTreeRef = React.useRef<any>(null);

    // D. Imperative API (Exposing local actions to the global engine)
    // This allows the Form Engine to say `ref.current.expandAll()`
    // without knowing how the tree actually works.
    React.useImperativeHandle(forwardedRef, () => ({
      focus: () => {
        // Used by FormCore to auto-focus on validation error
        internalTreeRef.current?.focus();
      },
      expandAll: () => {
        // A custom action exposed to the parent
        setExpandedItems(["root", "child1", "child2"]);
      },
      clearSearch: () => {
        setSearchQuery("");
      },
    }));

    // E. Synchronization (useEffect)
    // If the Domain State (value) is completely wiped by the Form Engine (e.g. form.reset()),
    // we must sync that change down into our local ephemeral state to reset the UI.
    React.useEffect(() => {
      if (!value || value.length === 0) {
        setExpandedItems([]); // Collapse tree if domain state is cleared
        setSearchQuery("");
      }
    }, [value]);

    // F. Data Fetching / Mapping (Simulated)
    // The adapter translates the 'dataProviderUrl' into actual data the Primitive needs
    React.useMemo(() => {
      return {
        root: {
          index: "root",
          isFolder: true,
          children: ["child1", "child2"],
          data: "Root",
        },
        child1: { index: "child1", isFolder: false, data: "Child 1" },
        child2: { index: "child2", isFolder: false, data: "Child 2" },
      };
    }, [meta.dataProviderUrl]);

    return (
      <div className="tree-select-wrapper" data-error={!!error}>
        <div className="mb-2">
          <input
            type="text"
            placeholder="Local Search (doesn't trigger FormCore re-render)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border p-1 text-xs w-full"
          />
        </div>

        {/* 
        3. The Complex UI Primitive (Public API) 
        Notice how we feed it both Local state (expandedItems) 
        and Domain state (value), and attach our internal ref.
      */}
        <div className="border rounded p-2 bg-white">
          {/* Mocking the react-complex-tree API */}
          <div
            className="complex-react-tree-mock"
            ref={internalTreeRef}
            tabIndex={0}
          >
            <p className="text-xs text-gray-500 mb-2">
              Simulated react-complex-tree environment
            </p>

            <div
              className={`p-2 cursor-pointer ${value?.includes("child1") ? "bg-blue-100 font-bold" : ""}`}
              onClick={() => {
                // When the Primitive fires a selection event, we translate it
                // and pass it up to FormCore's `onChange`.
                if (isMulti) {
                  const current = Array.isArray(value) ? value : [];
                  onChange([...current, "child1"]);
                } else {
                  onChange(["child1"]);
                }
              }}
            >
              📁 Child 1 {value?.includes("child1") && " (Selected)"}
            </div>

            <div className="mt-2 text-[10px] text-gray-400">
              * Configuration active: MultiSelect={String(isMulti)}, DragDrop=
              {String(meta.canDragAndDrop)}
            </div>
          </div>
        </div>

        {error && <span className="text-red-500 text-xs mt-1">{error}</span>}
      </div>
    );
  }
);
