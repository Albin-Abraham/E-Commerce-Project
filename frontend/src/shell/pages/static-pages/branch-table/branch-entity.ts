import type { FormDefinition } from "@ui/form/types";

/**
 * Filter Form Definition for Branches
 * Drives the ZenithTable Filter Drawer / Filter Bar
 * Strictly aligned with Backend Branch model fields (`name`, `code`, `location`, `is_all_branch`)
 */
export const BRANCH_FILTER_FORM: FormDefinition = {
  id: "branch-filter-form",
  title: "Filter Branches",
  fields: [
    {
      id: "search",
      name: "search",
      type: "text",
      label: "Search",
      properties: { placeholder: "Search code, name, location..." },
    },
    {
      id: "location",
      name: "location",
      type: "text",
      label: "Location",
      properties: { placeholder: "Filter by location or hub..." },
    },
    {
      id: "is_all_branch",
      name: "is_all_branch",
      type: "select",
      label: "Scope Type",
      options: [
        { label: "All Branch Scopes", value: "" },
        { label: "Global System Branch", value: "true" },
        { label: "Standard Branch", value: "false" },
      ],
    },
  ],
};

export const BRANCH_TABLE_META = {
  id: "branch-management-table",
  variant: "cards" as const,
  showIndex: true,
  indexLabel: "SL. NO.",
  striped: true,
  stickyHeader: true,
  maxHeight: "100%",
  display_format: "Displaying {from} to {to} of {total} branch locations",
  pagination: {
    enabled: true,
    variant: "full" as const,
    pageSizeOptions: [10, 25, 50, 100],
  },
};
