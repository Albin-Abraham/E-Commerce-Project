/**
 * Authentication & Workspace Session Flow — MSW Integration Tests
 *
 * @issue [ISSUE-AUTH-WORKSPACE]
 * @bug [BUG-DETAIL-ENVELOPE]
 *
 * Validates real server response contracts without mocking React hooks:
 *  1. Login Token Exchange (POST /api/v1/auth/login/)
 *  2. Profile & Initial Session Seed (GET /api/v1/auth/profile/)
 *  3. Error Status Matrix (400, 401, 429, 500)
 *  4. Workspace Org Queries (/api/v1/sessions/user/companies/, business-units, branches)
 *  5. Cascading Referential Integrity (Company -> BU -> Branch)
 */


import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";

import { server } from "@testing/msw/server";
import { mockEnvelope } from "@testing/msw/msw-utils";
import { httpClient } from "@services/http.instance";
import { BaseAuthService } from "../services/BaseAuthService";
import { authManager } from "../services/auth-manager";
import { useAuthStore } from "../store/auth.store";
import { createOrgRepo } from "@services/org/org.repository";

// A mock JWT valid for decoding exp timestamp
const MOCK_ACCESS_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE5OTk5OTk5OTksInVzZXJfaWQiOjEwMSwiZW1haWwiOiJhbGV4QHplbm9zLmlvIn0.signature";
const MOCK_REFRESH_TOKEN = "mock-refresh-token-xyz-12345";

describe("MSW Integration: Login & Workspace Response Flows", () => {
  let authService: BaseAuthService;

  beforeEach(() => {
    useAuthStore.getState().clearAuth();
    authManager.resetContext();
    authService = new BaseAuthService(httpClient.public, httpClient.auth);
  });

  afterEach(() => {
    useAuthStore.getState().clearAuth();
    authManager.resetContext();
  });

  // ─── 1. Login Happy Path & Profile Resolution ──────────────────────────────
  describe("1. Login Success & Session Seeding", () => {
    it("exchanges credentials for tokens and seeds session context from profile", async () => {
      // 1. Mock Login Token Exchange
      server.use(
        http.post("*/api/v1/auth/login/", () => {
          return HttpResponse.json({
            access: MOCK_ACCESS_TOKEN,
            refresh: MOCK_REFRESH_TOKEN,
          });
        }),

        // 2. Mock Profile resolution with session context IDs
        http.get("*/api/v1/auth/profile/", () => {
          return mockEnvelope({
            id: 101,
            email: "alex@zenos.io",
            username: "alex",
            first_name: "Alex",
            last_name: "Vance",
            role: "platform_admin",
            permissions: ["all"],
            session: {
              company_id: "comp-zenith",
              business_unit_id: "bu-engineering",
              branch_id: "branch-tokyo",
            },
          });
        })
      );

      // Execute login domain flow
      const response = await authService.login({
        email: "alex@zenos.io",
        password: "ValidPassword123!",
      });

      // Verify returned tokens
      expect(response.access).toBe(MOCK_ACCESS_TOKEN);
      expect(response.refresh).toBe(MOCK_REFRESH_TOKEN);

      // Verify authenticated store state
      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe("alex@zenos.io");
      expect(state.accessToken).toBe(MOCK_ACCESS_TOKEN);

      // Verify initial session context IDs seeded from profile
      expect(state.sessionContext.company?.id).toBe("comp-zenith");
      expect(state.sessionContext.businessUnit?.id).toBe("bu-engineering");
      expect(state.sessionContext.branch?.id).toBe("branch-tokyo");
    });
  });

  // ─── 2. Login Failure Matrix ───────────────────────────────────────────────
  describe("2. Login Failure & Error Boundary Resiliency", () => {
    it.each([
      {
        status: 401,
        code: "UNAUTHORIZED",
        body: { detail: "No active account found with the given credentials" },
        expectedError: /No active account found/i,
      },
      {
        status: 400,
        code: "BAD_REQUEST",
        body: { email: ["Enter a valid email address."] },
        expectedError: /Enter a valid email address/i,
      },
      {
        status: 429,
        code: "RATE_LIMITED",
        body: { detail: "Request was throttled. Expected available in 60 seconds." },
        expectedError: /Request was throttled/i,
      },
      {
        status: 500,
        code: "SERVER_ERROR",
        body: { message: "Internal Server Error" },
        expectedError: /Internal Server Error|failed/i,
      },
    ])(
      "rejects login on HTTP $status ($code) and keeps auth state clean",
      async ({ status, body, expectedError }) => {
        server.use(
          http.post("*/api/v1/auth/login/", () => {
            return HttpResponse.json(body, { status });
          })
        );

        await expect(
          authService.login({
            email: "invalid@zenos.io",
            password: "wrong",
          })
        ).rejects.toThrow(expectedError);

        // State remains completely clean
        const state = useAuthStore.getState();
        expect(state.isAuthenticated).toBe(false);
        expect(state.user).toBeNull();
        expect(state.accessToken).toBeNull();
      }
    );
  });

  // ─── 3. Workspace Org Queries via MSW ──────────────────────────────────────
  describe("3. Workspace Session API Endpoints (Org Queries)", () => {
    it("fetches company, business unit, and branch hierarchies with envelopes", async () => {
      server.use(
        // 1. Companies
        http.get("*/api/v1/sessions/user/companies/", () => {
          return mockEnvelope([
            { id: "c-100", name: "Zenith Aerospace", code: "Z-AERO", is_active: true },
            { id: "c-200", name: "Zenith Robotics", code: "Z-ROBO", is_active: true },
          ]);
        }),

        // 2. Business Units (scoped to company)
        http.get("*/api/v1/sessions/user/business-units/", ({ request }) => {
          const url = new URL(request.url);
          const companyId = url.searchParams.get("company_id");

          if (companyId === "c-100") {
            return mockEnvelope([
              { id: "bu-10", name: "Avionics Division", company_id: "c-100", is_active: true },
            ]);
          }
          return mockEnvelope([]);
        }),

        // 3. Branches (scoped to BU)
        http.get("*/api/v1/sessions/user/branches/", ({ request }) => {
          const url = new URL(request.url);
          const buId = url.searchParams.get("business_unit_id");

          if (buId === "bu-10") {
            return mockEnvelope([
              { id: "br-01", name: "Seattle Hangar", business_unit_id: "bu-10", is_active: true },
            ]);
          }
          return mockEnvelope([]);
        })
      );

      // Verify Companies
      const orgRepo = createOrgRepo(httpClient.auth);
      const companies = await orgRepo.getCompanies();
      expect(companies).toHaveLength(2);
      expect(companies[0].name).toBe("Zenith Aerospace");

      // Verify Scoped Business Units
      const bus = await orgRepo.getBusinessUnits("c-100");
      expect(bus).toHaveLength(1);
      expect(bus[0].name).toBe("Avionics Division");

      // Verify Scoped Branches
      const branches = await orgRepo.getBranches("bu-10");
      expect(branches).toHaveLength(1);
      expect(branches[0].name).toBe("Seattle Hangar");
    });

    it("successfully unwraps backend detail envelope: { status: 200, message, detail: [...] }", async () => {
      server.use(
        http.get("*/api/v1/sessions/user/companies/", () => {
          return HttpResponse.json({
            status: 200,
            message: "Request successful",
            detail: [
              {
                id: "iwPuFpauWjEzXNTLnjvRUxKOaJhPCcit",
                name: "System",
                code: "sys-001",
              },
            ],
          });
        })
      );

      const orgRepo = createOrgRepo(httpClient.auth);
      const companies = await orgRepo.getCompanies();
      expect(companies).toHaveLength(1);
      expect(companies[0].id).toBe("iwPuFpauWjEzXNTLnjvRUxKOaJhPCcit");
      expect(companies[0].name).toBe("System");
      expect(companies[0].code).toBe("sys-001");
    });
  });

  // ─── 4. Cascading Referential Integrity ───────────────────────────────────
  describe("4. Workspace Cascading Referential Integrity & 2-Tier Stability", () => {
    it("resets child selections when switching companies to prevent cross-tenant corruption", () => {
      // Step 1: Select initial hierarchy (Company A -> BU A -> Branch A)
      authManager.selectCompany({ id: "c-1", name: "Company One", code: "C1" });
      authManager.selectBusinessUnit({ id: "bu-1", name: "Unit 1", companyId: "c-1", isActive: true });
      authManager.selectBranch({ id: "br-1", name: "Branch 1", businessUnitId: "bu-1", isActive: true });

      let session = useAuthStore.getState().sessionContext;
      expect(session.company?.id).toBe("c-1");
      expect(session.businessUnit?.id).toBe("bu-1");
      expect(session.branch?.id).toBe("br-1");
      expect(session.isStable).toBe(true);

      // Step 2: Switch to Company B -> BU and Branch MUST automatically reset
      authManager.selectCompany({ id: "c-2", name: "Company Two", code: "C2" });

      session = useAuthStore.getState().sessionContext;
      expect(session.company?.id).toBe("c-2");
      expect(session.businessUnit).toBeNull(); // Reset!
      expect(session.branch).toBeNull();       // Reset!
      expect(session.isStable).toBe(false);    // Requires 2-tier (Company + BU) for stability

      // Step 3: Select BU in Company B -> Unlocks 2-tier stability
      authManager.selectBusinessUnit({ id: "bu-2", name: "Unit 2", companyId: "c-2", isActive: true });
      session = useAuthStore.getState().sessionContext;
      expect(session.businessUnit?.id).toBe("bu-2");
      expect(session.isStable).toBe(true);     // Unlocked without needing branch
    });
  });
});
