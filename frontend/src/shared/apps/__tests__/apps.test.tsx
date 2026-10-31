import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { appRegistry, AppGuard } from "../index";
import { permissionEvaluator } from "@platform/authorization";

describe("Shared Apps Presentation & Registry", () => {
  it("provides active app and available apps list", () => {
    const apps = appRegistry.getAll();
    expect(apps.length).toBeGreaterThanOrEqual(3);

    const shopApp = appRegistry.get("shop");
    expect(shopApp).toBeDefined();
    expect(shopApp?.basePath).toBe("/products");
  });

  it("permits access through AppGuard when user has required permission", () => {
    permissionEvaluator.setUser({
      id: "u-admin",
      email: "admin@test.local",
      username: "admin",
      fullName: "Admin User",
      isStaff: true,
      isSuperuser: false,
      roles: ["admin"],
      permissions: ["admin:access"],
      memberships: [],
    });

    render(
      <AppGuard appId="admin" fallback={<div>Admin Restricted</div>}>
        <div>Admin Dashboard</div>
      </AppGuard>
    );

    expect(screen.getByText("Admin Dashboard")).toBeDefined();
    expect(screen.queryByText("Admin Restricted")).toBeNull();
  });

  it("blocks access through AppGuard when user lacks permission", () => {
    permissionEvaluator.setUser({
      id: "u-consumer",
      email: "customer@test.local",
      username: "customer",
      fullName: "Customer User",
      isStaff: false,
      isSuperuser: false,
      roles: ["customer"],
      permissions: [],
      memberships: [],
    });

    render(
      <AppGuard appId="admin" fallback={<div>Admin Restricted</div>}>
        <div>Admin Dashboard</div>
      </AppGuard>
    );

    expect(screen.queryByText("Admin Dashboard")).toBeNull();
    expect(screen.getByText("Admin Restricted")).toBeDefined();
  });
});
