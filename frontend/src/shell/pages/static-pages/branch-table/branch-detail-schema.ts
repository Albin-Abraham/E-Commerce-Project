import type { DetailSchema } from "@shared/ui/detail";
import type { Branch, BranchCompany, BranchBusinessUnit, BranchCatalog } from "./branch-types";

/**
 * Declarative Detail Schema for Branch Entity
 * Drives both PageHeader.DetailSlot and Table Row Expansion (RowActionPanel)
 * Fully aligned with Backend-RestFul Branch and BranchExtension models
 */
export const BRANCH_DETAIL_SCHEMA: DetailSchema<Branch> = {
  id: "branch-detail-schema",
  title: "Branch Specifications",
  fields: [
    {
      id: "code",
      label: "Branch Code",
      format: "mono",
      value: (b) => b.code,
    },
    {
      id: "name",
      label: "Branch Name",
      format: "text",
      value: (b) => b.name,
    },
    {
      id: "company",
      label: "Parent Corporation",
      format: "text",
      value: (b) => {
        if (!b.company) return "—";
        if (typeof b.company === "object") {
          const comp = b.company as BranchCompany;
          return comp.name || comp.display || comp.label || comp.code || comp.id;
        }
        return String(b.company);
      },
    },
    {
      id: "business_unit",
      label: "Operational Unit",
      format: "text",
      value: (b) => {
        if (!b.business_unit) return "—";
        if (typeof b.business_unit === "object") {
          const bu = b.business_unit as BranchBusinessUnit;
          return bu.name || bu.display || bu.label || bu.code || bu.id;
        }
        return String(b.business_unit);
      },
    },
    {
      id: "location",
      label: "Jurisdiction & Hub",
      format: "text",
      value: (b) => b.location || "—",
    },
    {
      id: "opened_date",
      label: "Commissioned Date",
      format: "text",
      value: (b) => b.opened_date || "—",
    },
    {
      id: "catalog",
      label: "Subscription Tier",
      format: "text",
      value: (b) => {
        if (!b.catalog) return "Standard Operations";
        if (typeof b.catalog === "object") {
          const cat = b.catalog as BranchCatalog;
          return cat.name || cat.tier || cat.display || cat.id;
        }
        return String(b.catalog);
      },
    },
    {
      id: "status",
      label: "Lifecycle Status",
      format: "badge",
      value: (b) => b.status ?? "active",
      badgeIntent: (status) =>
        status === "active"
          ? "success"
          : status === "inactive"
          ? "warning"
          : "default",
      badgeLabel: (status) =>
        status === "active"
          ? "Operational (Active)"
          : status === "inactive"
          ? "Inactive"
          : "Under Maintenance",
    },
    {
      id: "contact_capacity",
      label: "Contact & Capacity",
      format: "text",
      value: (b) => {
        const extra = b.extensions?.extra_attributes;
        const manager = b.manager || extra?.manager;
        const capacity = b.capacity || extra?.capacity;
        const email = b.email || extra?.email;

        const parts: string[] = [];
        if (manager) parts.push(`Mgr: ${manager}`);
        if (capacity) parts.push(`Cap: ${capacity}`);
        if (email) parts.push(String(email));

        return parts.length > 0 ? parts.join(" • ") : "Standard Capacity";
      },
    },
  ],
};
