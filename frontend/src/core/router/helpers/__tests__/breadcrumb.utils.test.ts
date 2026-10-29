import { describe, expect, it } from "vitest";

import { buildBreadcrumbs } from "../breadcrumb.utils";

describe("Breadcrumb Utilities", () => {
  it("resolves static labels and breadcrumbs from route matches", () => {
    const mockMatches: any[] = [
      {
        id: "root",
        pathname: "/",
        data: null,
        handle: { label: "Home", path: "/" },
      },
      {
        id: "admin",
        pathname: "/admin",
        data: null,
        handle: { breadcrumb: "Administration", path: "/admin" },
      },
      {
        id: "branches",
        pathname: "/admin/branches",
        data: null,
        handle: { label: "Branches", breadcrumb: "Branch Management", path: "/admin/branches" },
      },
    ];

    const breadcrumbs = buildBreadcrumbs(mockMatches);

    expect(breadcrumbs).toHaveLength(3);
    expect(breadcrumbs[0]).toEqual({
      id: "root",
      path: "/",
      label: "Home",
      icon: undefined,
      active: false,
      intent: undefined,
    });
    expect(breadcrumbs[1].label).toBe("Administration");
    expect(breadcrumbs[2].label).toBe("Branch Management");
    expect(breadcrumbs[2].active).toBe(true);
  });

  it("resolves dynamic functional breadcrumbs using loader data", () => {
    const mockMatches: any[] = [
      {
        id: "branch-detail",
        pathname: "/branches/dxb-01",
        data: { branch: { name: "Dubai Logistics Hub", code: "DXB-01" } },
        handle: {
          breadcrumb: (data: any) => `${data.branch.name} (${data.branch.code})`,
          path: "/branches/dxb-01",
        },
      },
    ];

    const breadcrumbs = buildBreadcrumbs(mockMatches);

    expect(breadcrumbs).toHaveLength(1);
    expect(breadcrumbs[0].label).toBe("Dubai Logistics Hub (DXB-01)");
    expect(breadcrumbs[0].active).toBe(true);
  });

  it("filters out route matches without labels or breadcrumb handlers", () => {
    const mockMatches: any[] = [
      {
        id: "unnamed-wrapper",
        pathname: "/wrapper",
        data: null,
        handle: {},
      },
      {
        id: "named-child",
        pathname: "/wrapper/child",
        data: null,
        handle: { label: "Visible Child" },
      },
    ];

    const breadcrumbs = buildBreadcrumbs(mockMatches);
    expect(breadcrumbs).toHaveLength(1);
    expect(breadcrumbs[0].label).toBe("Visible Child");
  });
});
