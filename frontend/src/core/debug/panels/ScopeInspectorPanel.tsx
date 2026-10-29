import React from "react";
import { useScope } from "@core/scope/useScope";
import { Building2, GitBranch, MapPin, CheckCircle } from "lucide-react";

export const ScopeInspectorPanel: React.FC = () => {
  const {
    activeOrg,
    activeBranch,
    isScopeStable,
    selectOrg,
    selectBranch,
    resetScope,
  } = useScope();

  const MOCK_ORGS = [
    { id: "zenith-hq", name: "Zenith Aerospace HQ", code: "Z-HQ" },
    { id: "zenith-robotics", name: "Zenith Robotics Global", code: "Z-ROBO" },
  ];

  const MOCK_BRANCHES = [
    { id: "tokyo", name: "Tokyo R&D Lab", code: "TYO-01", orgId: "zenith-hq", location: "Tokyo, Japan" },
    { id: "seattle", name: "Seattle Hangar", code: "SEA-02", orgId: "zenith-hq", location: "Seattle, USA" },
    { id: "berlin", name: "Berlin Fab", code: "BER-03", orgId: "zenith-robotics", location: "Berlin, Germany" },
  ];

  return (
    <div className="flex flex-col h-full gap-4 p-4 text-xs font-mono text-foreground">
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Building2 size={14} className="text-primary" />
          <span className="font-bold uppercase tracking-wider text-primary">Scope Switcher</span>
        </div>
        <button
          type="button"
          onClick={resetScope}
          className="px-2 py-0.5 rounded bg-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors text-[10px]"
        >
          Clear Scope
        </button>
      </div>

      <div className="p-3 rounded-xl bg-card border border-border/40 space-y-2">
        <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Active Scope Context</div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Organization:</span>
          <span className="font-bold text-foreground">{activeOrg ? `${activeOrg.name} (${activeOrg.code})` : "None"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Branch:</span>
          <span className="font-bold text-foreground">{activeBranch ? `${activeBranch.name} (${activeBranch.code})` : "None"}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Stability:</span>
          <span className={`inline-flex items-center gap-1 font-bold ${isScopeStable ? "text-emerald-500" : "text-amber-500"}`}>
            {isScopeStable && <CheckCircle size={12} />}
            {isScopeStable ? "Stable (Tenant Sealed)" : "Incomplete (Pending Selection)"}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1.5">Preset Organizations</div>
          <div className="grid grid-cols-1 gap-1.5">
            {MOCK_ORGS.map((org) => (
              <button
                type="button"
                key={org.id}
                onClick={() => selectOrg(org)}
                className={`flex items-center justify-between p-2 rounded-lg border transition-all text-left ${
                  activeOrg?.id === org.id
                    ? "border-primary bg-primary/10 text-primary font-bold"
                    : "border-border/40 bg-card hover:bg-muted/50 text-foreground"
                }`}
              >
                <span>{org.name}</span>
                <span className="text-[10px] text-muted-foreground">({org.code})</span>
              </button>
            ))}
          </div>
        </div>

        {activeOrg && (
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1.5">Preset Branches</div>
            <div className="grid grid-cols-1 gap-1.5">
              {MOCK_BRANCHES.filter((b) => b.orgId === activeOrg.id).map((branch) => (
                <button
                  type="button"
                  key={branch.id}
                  onClick={() => selectBranch(branch)}
                  className={`flex items-center justify-between p-2 rounded-lg border transition-all text-left ${
                    activeBranch?.id === branch.id
                      ? "border-primary bg-primary/10 text-primary font-bold"
                      : "border-border/40 bg-card hover:bg-muted/50 text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <GitBranch size={12} className="text-muted-foreground" />
                    <span>{branch.name}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <MapPin size={10} />
                    <span>{branch.location}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
