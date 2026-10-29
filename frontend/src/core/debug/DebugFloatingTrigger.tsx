import React, { useState, useEffect } from "react";
import { debugConfig } from "./config";
import { StateInspectorPanel } from "./panels/StateInspectorPanel";
import { ScopeInspectorPanel } from "./panels/ScopeInspectorPanel";
import { NetworkMockPanel } from "./panels/NetworkMockPanel";
import { Terminal, X, Database, Building2, Server } from "lucide-react";

export const DebugFloatingTrigger: React.FC = () => {
  if (!debugConfig.isEnabled) return null;

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"state" | "scope" | "network">("state");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "d") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      {/* Floating Trigger Icon */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-4 right-4 z-50 p-2.5 rounded-full bg-slate-900 text-primary border border-primary/40 shadow-2xl hover:scale-105 transition-all focus:outline-none"
        title="ZenOS DevTools (Ctrl+Shift+D)"
      >
        <Terminal size={18} />
      </button>

      {/* Slide-out Debug Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 w-96 max-w-[90vw] z-50 bg-card border-l border-border/60 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between p-3 border-b border-border/40 bg-muted/40">
            <div className="flex items-center gap-2">
              <Terminal size={16} className="text-primary" />
              <span className="font-bold text-xs">ZenOS DevTools & QA</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="flex border-b border-border/30 bg-card">
            <button
              type="button"
              onClick={() => setActiveTab("state")}
              className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                activeTab === "state"
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Database size={13} />
              <span>State</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("scope")}
              className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                activeTab === "scope"
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 size={13} />
              <span>Scope</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("network")}
              className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
                activeTab === "network"
                  ? "border-primary text-primary bg-primary/5"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Server size={13} />
              <span>MSW</span>
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            {activeTab === "state" && <StateInspectorPanel />}
            {activeTab === "scope" && <ScopeInspectorPanel />}
            {activeTab === "network" && <NetworkMockPanel />}
          </div>
        </div>
      )}
    </>
  );
};
