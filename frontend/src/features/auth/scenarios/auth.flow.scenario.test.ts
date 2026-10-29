import { describe, it, expect, beforeEach } from "vitest";
import { storeRegistry } from "@core/state/StoreRegistry";
import { useAuthStore } from "../store/auth.store";
import authFixture from "../fixtures/auth.mock.json";

describe("Auth Feature: GrayBox Flow Scenario", () => {
  beforeEach(() => {
    storeRegistry.resetAll();
  });

  it("authenticates and validates state transition via GrayBox store snapshot", () => {
    expect(useAuthStore.getState().isAuthenticated).toBe(false);

    // Simulate login mutation using loaded fixture
    useAuthStore
      .getState()
      .setAuth(
        authFixture.data.user as any,
        authFixture.data.tokens.access,
        Date.now() + 3600,
        authFixture.data.tokens.refresh
      );

    // Assert whitebox internal state
    const snapshot = storeRegistry.getSnapshot();
    expect(snapshot.authStore?.isAuthenticated).toBe(true);
    expect(snapshot.authStore?.user?.email).toBe("alex@zenos.io");
    expect(snapshot.authStore?.accessToken).toBe(authFixture.data.tokens.access);
  });
});
