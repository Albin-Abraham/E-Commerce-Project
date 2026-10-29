import React, { useState, useEffect } from "react";
import { storeRegistry } from "@core/state/StoreRegistry";
import { RotateCcw, RefreshCw } from "lucide-react";

export const StateInspectorPanel: React.FC = () => {
  const [snapshot, setSnapshot] = useState<Record<string, any>>({});
  const [selectedStore, setSelectedStore] = useState<string>("");

  const refreshSnapshot = () => {
    const data = storeRegistry.getSnapshot();
    setSnapshot(data);
    const names = Object.keys(data);
    if (!selectedStore && names.length > 0) {
      setSelectedStore(names[0]);
    }
  };

  useEffect(() => {
    refreshSnapshot();
  }, []);

  const storeNames = Object.keys(snapshot);

  return (
    <div className="flex flex-col h-full gap-3 p-4 text-xs font-mono text-foreground">
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase tracking-wider text-primary">State Inspector</span>
          <span className="px-1.5 py-0.5 rounded bg-muted text-[10px]">{storeNames.length} Stores</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={refreshSnapshot}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Refresh snapshot"
          >
            <RefreshCw size={14} />
          </button>
          <button
            type="button"
            onClick={() => {
              storeRegistry.resetAll();
              refreshSnapshot();
            }}
            className="p-1 rounded hover:bg-destructive/10 text-destructive transition-colors"
            title="Reset all stores"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border/20 pb-2 overflow-x-auto">
        {storeNames.map((name) => (
          <button
            type="button"
            key={name}
            onClick={() => setSelectedStore(name)}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              selectedStore === name
                ? "bg-primary text-primary-foreground font-bold"
                : "bg-muted/50 hover:bg-muted text-muted-foreground"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0 overflow-auto bg-slate-950 text-slate-100 p-3 rounded-xl border border-border/30">
        <pre className="text-[11px] leading-relaxed">
          {selectedStore && snapshot[selectedStore]
            ? JSON.stringify(snapshot[selectedStore], null, 2)
            : "// Select a registered store to view live state"}
        </pre>
      </div>
    </div>
  );
};
