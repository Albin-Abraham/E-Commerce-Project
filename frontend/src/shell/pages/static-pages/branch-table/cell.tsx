import { cn } from "@core/libs/utils";
import { tableCellRegistry } from "@shared/ui/table/mdap/tableCellRegistry";
import { Building2, MapPin, Briefcase, Layers, Store } from "lucide-react";

import type {
  Branch,
  BranchCompany,
  BranchBusinessUnit,
  BranchCatalog,
  BranchStatus,
} from "./branch-types";

// ── Custom Cell Components ──────────────────────────────────────────

export function BranchCodeCell({ value }: { value: unknown }) {
  const code = String(value ?? "");
  return (
    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-muted/40 border border-border/50 text-foreground">
      {code}
    </span>
  );
}

export function BranchNameCell({ value }: { value: unknown }) {
  const name = String(value ?? "Branch");
  return (
    <div className="inline-flex items-center gap-2 font-medium text-foreground">
      <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
        <Store size={13} />
      </div>
      <span className="truncate font-semibold text-sm">{name}</span>
    </div>
  );
}

export function BranchCompanyCell({ value }: { value: unknown }) {
  if (!value) return <span className="text-xs text-muted-foreground">—</span>;

  let label = "";
  if (typeof value === "object" && value !== null) {
    const comp = value as BranchCompany;
    label = comp.name || comp.label || comp.display || comp.code || comp.id;
  } else {
    label = String(value);
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-xs font-bold">
      <Building2 size={13} className="shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  );
}

export function BranchBusinessUnitCell({ value }: { value: unknown }) {
  if (!value) return <span className="text-xs text-muted-foreground">—</span>;

  let label = "";
  if (typeof value === "object" && value !== null) {
    const bu = value as BranchBusinessUnit;
    label = bu.name || bu.label || bu.display || bu.code || bu.id;
  } else {
    label = String(value);
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-raised border border-border/40 text-foreground text-xs font-semibold">
      <Briefcase size={13} className="text-muted-foreground shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  );
}

export function BranchCatalogCell({ value }: { value: unknown }) {
  if (!value) return <span className="text-xs text-muted-foreground">—</span>;

  let label = "";
  if (typeof value === "object" && value !== null) {
    const cat = value as BranchCatalog;
    label = cat.name || cat.tier || cat.label || cat.display || cat.id;
  } else {
    label = String(value);
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
      <Layers size={12} className="shrink-0" />
      <span className="truncate">{label}</span>
    </div>
  );
}

export function BranchStatusCell({ value }: { value: unknown }) {
  const status = (String(value ?? "") as BranchStatus) || "active";
  const config = {
    active: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    inactive: "bg-muted text-muted-foreground border-border/50",
    maintenance: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  }[status] ?? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold capitalize border",
        config
      )}
    >
      <span
        className={cn(
          "w-1.5 h-1.5 rounded-full mr-1.5",
          status === "active" && "bg-emerald-500 animate-pulse",
          status === "inactive" && "bg-muted-foreground",
          status === "maintenance" && "bg-amber-500"
        )}
      />
      {status}
    </span>
  );
}

export function LocationCell({ value, row }: { value?: unknown; row?: unknown }) {
  const branch = row as Branch | undefined;
  const locString = String(value ?? branch?.location ?? "");

  if (!locString) return <span className="text-xs text-muted-foreground">—</span>;

  return (
    <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <MapPin size={12} className="text-muted-foreground/60 shrink-0" />
      <span className="truncate">{locString}</span>
    </div>
  );
}

// ── Register Cell Renderers into tableCellRegistry ─────────────────

export function registerBranchCellRenderers() {
  tableCellRegistry.register("branchCode", ({ value }) => (
    <BranchCodeCell value={value} />
  ));

  tableCellRegistry.register("branchName", ({ value }) => (
    <BranchNameCell value={value} />
  ));

  tableCellRegistry.register("branchCompany", ({ value }) => (
    <BranchCompanyCell value={value} />
  ));

  tableCellRegistry.register("branchBusinessUnit", ({ value }) => (
    <BranchBusinessUnitCell value={value} />
  ));

  tableCellRegistry.register("branchCatalog", ({ value }) => (
    <BranchCatalogCell value={value} />
  ));

  tableCellRegistry.register("branchStatus", ({ value }) => (
    <BranchStatusCell value={value} />
  ));

  tableCellRegistry.register("branchLocation", ({ value, row }) => (
    <LocationCell value={value} row={row} />
  ));
}

// Auto-register on import
registerBranchCellRenderers();
