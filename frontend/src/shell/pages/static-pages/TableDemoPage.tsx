/**
 * TableDemoPage — ZenithTable Architecture Showcase: Branch API
 *
 * Demonstrates ZenithTable v2 Enterprise Architecture:
 * 1. Branch API integration (/api/v1/admin/branches via fetchBranches)
 * 2. Separate modular files: branch-types.ts, branch-api.ts, cell.ts, column.ts, branch-entity.ts, branch-detail-schema.ts
 * 3. Registered custom cells & atomic cell variants (code, numeric, identity, status-dot, copyable)
 * 4. Option B Fixed Glassmorphic Toolbar with DCS & ECS surface popovers
 * 5. Expanded Action Row (RowActionPanel) using declarative DetailRenderer.Grid
 * 6. Sticky Aggregation Footer (ZenithTable.Footer with sum/count aggregates)
 * 7. PageHeader integration with Spatial Breadcrumbs, Sibling Quick-Switch Hopping, and DetailSlots
 */

import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { PageHeader } from "@shared/components/layout";
import { DetailRenderer } from "@shared/ui/detail";
import {
  RowActionPanel,
  TableCore,
  useZenithTable,
  ScrollRestorationFeature,
  KeyboardNavigationFeature,
  PhysicsTrackingFeature,
} from "@ui/table";
import {
  Building2,
  CheckCircle2,
  Database,
  Edit2,
  Eye,
  Plus,
  RefreshCw,
  Server,
  Trash2,
} from "lucide-react";

import "./branch-table/cell"; // Import to register cell renderers
import { fetchBranches } from "./branch-table/branch-api";
import { BRANCH_DETAIL_SCHEMA } from "./branch-table/branch-detail-schema";
import { BRANCH_FILTER_FORM, BRANCH_TABLE_META } from "./branch-table/branch-entity";
import { compileBranchColumns } from "./branch-table/column";

import type { Branch } from "./branch-table/branch-types";

export default function BranchManagementShowcasePage() {
  useTranslation("screens/staticPages");
  const dynamicColumns = useMemo(
    () => [
      TableCore.Selection.columnDef<Branch>(),
      ...compileBranchColumns(),
    ],
    []
  );

  const engine = useZenithTable<Branch>({
    meta: {
      ...BRANCH_TABLE_META,
      expansion: {
        mode: "exclusive",
        policy: {
          closeOnOtherClick: true,
        },
        render: ({ context }) => (
          <RowActionPanel
            context={context}
            title={
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-primary" />
                <span>{context.data.name}</span>
                <span className="font-mono text-xs text-muted-foreground">
                  ({context.data.code})
                </span>
              </div>
            }
            subtitle={`Location: ${context.data.location} • Company: ${context.data.company?.display ?? context.data.company?.label ?? "System"} • Unit: ${context.data.business_unit?.display ?? context.data.business_unit?.label ?? "All Business"}`}
            actions={[
              {
                id: "edit",
                label: "Edit Branch",
                icon: Edit2,
                variant: "default",
                onClick: (ctx) => alert(`Editing branch: ${ctx.data.name}`),
              },
              {
                id: "view",
                label: "View Details",
                icon: Eye,
                variant: "outline",
                onClick: (ctx) => alert(`Branch Code: ${ctx.data.code}`),
              },
              {
                id: "delete",
                label: "Archive Branch",
                icon: Trash2,
                variant: "destructive",
                onClick: (ctx) => alert(`Archiving branch: ${ctx.data.name}`),
              },
            ]}
          >
            {/* Declarative Detail Grid derived from entity schema (replacing mode="view" form) */}
            <div className="pt-2">
              <DetailRenderer.Grid
                schema={BRANCH_DETAIL_SCHEMA}
                data={context.data}
                columns={3}
                variant="card"
              />
            </div>
          </RowActionPanel>
        ),
      },
    },
    columns: dynamicColumns,
    source: {
      type: "server",
      fetcher: async (params) => {
        const res = await fetchBranches({
          page: params.page,
          page_size: params.pageSize,
          search: params.search,
          sort: params.sort,
          filters: params.filters as any,
        });
        return {
          rows: res.data,
          totalCount: res.count,
          page: res.current_page,
          totalPages: res.total_pages,
        };
      },
    },
    filterForm: BRANCH_FILTER_FORM,
    toolbar: true,
    filterBar: false,
    pagination: true,
    selectionActionBar: true,
    features: [
      ScrollRestorationFeature({ key: "branches-showcase" }),
      KeyboardNavigationFeature(),
      PhysicsTrackingFeature({ estimateRowHeight: 52 }),
    ],
  });

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#F9FAFB] dark:bg-background overflow-hidden">
      {/* Enterprise Page Header with Spatial Navigation & Declarative Detail Slots */}
      <PageHeader
        title="Branch Infrastructure Showcase"
        subtitle="Enterprise ZenithTable v2 Architecture with Option B Sticky Glass Toolbar, Declarative DetailRenderer Slots, and Sticky Footer Aggregations."
        badge="/api/v1/admin/branches"
        breadcrumbs={[
          { label: "Admin", path: "/showcase" },
          {
            label: "Operations",
            path: "/showcase",
            items: [
              { label: "Branch Management", href: "/showcase/table", active: true },
              { label: "Employee Form", href: "/showcase/employee" },
              { label: "Multi-Step Wizard", href: "/showcase/wizard" },
            ],
          },
          { label: "Branch Management", active: true },
        ]}
        detail={
          <PageHeader.DetailSlot>
            <DetailRenderer.Telemetry
              items={[
                {
                  id: "cluster-status",
                  label: "Cluster",
                  value: "EMEA-Prod-01",
                  icon: <Server size={13} />,
                  intent: "primary",
                },
                {
                  id: "db-state",
                  label: "DB Replica",
                  value: "Synced (0.4ms)",
                  icon: <Database size={13} />,
                  intent: "success",
                },
                {
                  id: "health",
                  label: "Platform Health",
                  value: "100% Operational",
                  icon: <CheckCircle2 size={13} />,
                  intent: "success",
                },
              ]}
            />
          </PageHeader.DetailSlot>
        }
        actions={
          <PageHeader.Actions>
            <button
              onClick={() => engine.refetch()}
              className="flex items-center gap-2 px-3.5 py-2 border border-border/40 rounded-xl text-xs font-bold hover:bg-surface-raised transition-all shadow-xs bg-white dark:bg-surface"
            >
              <RefreshCw size={14} /> Refetch API
            </button>
            <button
              onClick={() => alert("Creating new branch location...")}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-black hover:shadow-lg hover:shadow-primary/20 transition-all"
            >
              <Plus size={14} /> New Branch Location
            </button>
          </PageHeader.Actions>
        }
      />

      {/* ZenithTable Container with Sticky Body & Footer */}
      <div className="flex-1 min-h-0 p-6 overflow-hidden">
        <engine.Table className="h-full bg-white dark:bg-surface rounded-2xl border border-border/40 shadow-premium">
          <engine.Table.View>
            <engine.Table.Header />
            <engine.Table.Body />
            <engine.Table.Footer
              aggregates={{
                status: "count",
              }}
            />
          </engine.Table.View>
        </engine.Table>
      </div>
    </div>
  );
}
