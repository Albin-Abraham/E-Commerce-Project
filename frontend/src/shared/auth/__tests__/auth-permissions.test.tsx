import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PermissionProvider, PermissionGuard } from "../index";
import { permissionEvaluator } from "@platform/authorization/permission-evaluator";

describe("Shared Auth Presentation Layer", () => {
  it("renders children when user has permission", () => {
    permissionEvaluator.setUser({
      id: "u-1",
      email: "staff@zenos.local",
      username: "staff",
      fullName: "Staff Member",
      isStaff: true,
      isSuperuser: false,
      roles: ["staff"],
      permissions: ["shop:orders:view"],
      memberships: [],
    });

    render(
      <PermissionProvider>
        <PermissionGuard permission="shop:orders:view" fallback={<div>Forbidden</div>}>
          <div>Orders Table</div>
        </PermissionGuard>
      </PermissionProvider>
    );

    expect(screen.getByText("Orders Table")).toBeDefined();
    expect(screen.queryByText("Forbidden")).toBeNull();
  });

  it("renders fallback slot when user lacks permission", () => {
    permissionEvaluator.setUser({
      id: "u-2",
      email: "guest@zenos.local",
      username: "guest",
      fullName: "Guest User",
      isStaff: false,
      isSuperuser: false,
      roles: ["guest"],
      permissions: [],
      memberships: [],
    });

    render(
      <PermissionProvider>
        <PermissionGuard permission="shop:orders:view" fallback={<div>Access Restricted</div>}>
          <div>Orders Table</div>
        </PermissionGuard>
      </PermissionProvider>
    );

    expect(screen.queryByText("Orders Table")).toBeNull();
    expect(screen.getByText("Access Restricted")).toBeDefined();
  });
});
