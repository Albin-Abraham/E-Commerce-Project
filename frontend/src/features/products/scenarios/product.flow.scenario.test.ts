import { describe, it, expect, beforeEach } from "vitest";
import { storeRegistry } from "@core/state/StoreRegistry";
import { useScopeStore } from "@core/scope/scope.store";
import productFixture from "../fixtures/products.mock.json";

describe("Products Feature: Scoped GrayBox Scenario", () => {
  beforeEach(() => {
    storeRegistry.resetAll();
  });

  it("applies multi-tenant scope and verifies state isolation and stability", () => {
    const scopeStore = useScopeStore.getState();

    // 1. Initial State: Unscoped
    expect(scopeStore.activeOrg).toBeNull();
    expect(scopeStore.activeBranch).toBeNull();
    expect(scopeStore.isScopeStable).toBe(false);

    // 2. Select Org
    scopeStore.selectOrg({
      id: "zenith-hq",
      name: "Zenith Aerospace HQ",
      code: "Z-HQ",
    });
    expect(useScopeStore.getState().activeOrg?.id).toBe("zenith-hq");
    expect(useScopeStore.getState().isScopeStable).toBe(true);

    // 3. Select Branch
    scopeStore.selectBranch({
      id: "tokyo",
      name: "Tokyo R&D Lab",
      code: "TYO-01",
      orgId: "zenith-hq",
    });
    expect(useScopeStore.getState().activeBranch?.id).toBe("tokyo");

    // 4. Verify products fixture conforms to active tenancy scope
    const scopedProducts = productFixture.data.filter(
      (p) => p.orgId === "zenith-hq" && p.branchId === "tokyo"
    );
    expect(scopedProducts).toHaveLength(2);
    expect(scopedProducts[0].title).toBe("Industrial Telemetry Sensor v4");
  });
});
