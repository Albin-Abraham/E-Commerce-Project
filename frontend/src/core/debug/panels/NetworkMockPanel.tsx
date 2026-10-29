import React, { useState } from "react";
import { Server, AlertTriangle } from "lucide-react";

export const NetworkMockPanel: React.FC = () => {
  const [latency, setLatency] = useState<number>(0);
  const [forcedStatus, setForcedStatus] = useState<string>("default");

  return (
    <div className="flex flex-col h-full gap-4 p-4 text-xs font-mono text-foreground">
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Server size={14} className="text-primary" />
          <span className="font-bold uppercase tracking-wider text-primary">MSW Network Simulation</span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1.5 block">
            Simulated Network Latency: {latency}ms
          </label>
          <input
            type="range"
            min="0"
            max="3000"
            step="100"
            value={latency}
            onChange={(e) => setLatency(Number(e.target.value))}
            className="w-full cursor-pointer accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>0ms (Instant)</span>
            <span>1000ms (Fast 3G)</span>
            <span>3000ms (Slow)</span>
          </div>
        </div>

        <div>
          <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1.5 block">
            Forced Response Code (Error Matrix Test)
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: "Default (200 OK)", value: "default", color: "text-foreground" },
              { label: "400 Bad Request", value: "400", color: "text-amber-500" },
              { label: "401 Unauthorized", value: "401", color: "text-rose-500" },
              { label: "429 Rate Limited", value: "429", color: "text-purple-500" },
              { label: "500 Server Error", value: "500", color: "text-destructive" },
            ].map((opt) => (
              <button
                type="button"
                key={opt.value}
                onClick={() => setForcedStatus(opt.value)}
                className={`p-2 rounded-lg border text-left transition-all ${
                  forcedStatus === opt.value
                    ? "border-primary bg-primary/10 font-bold"
                    : "border-border/40 bg-card hover:bg-muted/50"
                }`}
              >
                <span className={opt.color}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {forcedStatus !== "default" && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
            <AlertTriangle size={14} className="shrink-0" />
            <span className="text-[11px]">
              MSW will intercept outgoing API calls and simulate HTTP {forcedStatus}.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
