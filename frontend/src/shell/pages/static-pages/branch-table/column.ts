import type { TableColumnMeta } from "@shared/ui/table";
import { TableColumnFactory } from "@shared/ui/table/utils/TableColumnFactory";
import type { ColumnDef } from "@tanstack/react-table";

import type { Branch } from "./branch-types";

/**
 * MDAP Column Metadata Definitions for Branches
 * Strictly aligned with Backend-RestFul Branch domain
 */
export const BRANCH_COLUMNS: TableColumnMeta[] = [
  {
    id: "code",
    label: "Branch Code",
    width: 130,
    align: "left",
    renderer: "branchCode",
    sortable: true,
  },
  {
    id: "name",
    label: "Branch Name",
    width: 240,
    align: "left",
    renderer: "branchName",
    sortable: true,
    filterable: true,
  },
  {
    id: "company",
    label: "Company",
    width: 180,
    align: "left",
    renderer: "branchCompany",
    sortable: true,
  },
  {
    id: "business_unit",
    label: "Business Unit",
    width: 180,
    align: "left",
    renderer: "branchBusinessUnit",
    sortable: true,
  },
  {
    id: "location",
    label: "Location / Hub",
    width: 180,
    align: "left",
    renderer: "branchLocation",
    sortable: true,
    filterable: true,
  },
  {
    id: "opened_date",
    label: "Opened Date",
    width: 140,
    align: "center",
    renderer: "date",
    sortable: true,
  },
  {
    id: "status",
    label: "Status",
    width: 140,
    align: "center",
    renderer: "branchStatus",
    sortable: false,
    filterable: false,
  },
];

export function compileBranchColumns(): ColumnDef<Branch>[] {
  return TableColumnFactory.compile<Branch>(BRANCH_COLUMNS);
}
