import { describe, expect, it } from "vitest";
import {
  ApiClient,
  ApiError,
  RetryPolicy,
  RequestContext,
  PermissionVO,
  AuthorizationPolicy,
  PermissionEvaluator,
  TenantContext,
  createLogger,
  errorReporter,
} from "../index";

describe("Platform Kernel Infrastructure", () => {
  describe("1. Networking & ApiError", () => {
    it("correctly identifies transient status codes as retryable", () => {
      const e503 = new ApiError({
        status: 503,
        code: "SERVICE_UNAVAILABLE",
        message: "Overloaded",
        timestamp: new Date().toISOString(),
      });
      const e400 = new ApiError({
        status: 400,
        code: "BAD_REQUEST",
        message: "Invalid",
        timestamp: new Date().toISOString(),
      });

      expect(e503.isTransient()).toBe(true);
      expect(e400.isTransient()).toBe(false);
    });

    it("enforces that only idempotent methods are eligible for retry", () => {
      const policy = new RetryPolicy({ maxRetries: 2, baseDelayMs: 10 });
      const transientError = new ApiError({
        status: 503,
        code: "UNAVAILABLE",
        message: "Down",
        timestamp: new Date().toISOString(),
      });

      expect(policy.isRetryable("GET", transientError)).toBe(true);
      expect(policy.isRetryable("HEAD", transientError)).toBe(true);
      expect(policy.isRetryable("POST", transientError)).toBe(false);
      expect(policy.isRetryable("PUT", transientError)).toBe(false);
      expect(policy.isRetryable("PATCH", transientError)).toBe(false);
      expect(policy.isRetryable("DELETE", transientError)).toBe(false);
    });

    it("scopes request headers strictly when requested and never pollutes public storefront", () => {
      // 1. Public storefront: no tenant headers
      const publicHeaders = RequestContext.buildHeaders({
        scope: { companyId: "comp-1", branchId: "br-1" },
        isPublicStorefront: true,
      });
      expect(publicHeaders.get("X-Company-ID")).toBeNull();
      expect(publicHeaders.get("X-Branch-ID")).toBeNull();
      expect(publicHeaders.get("X-Request-ID")).toBeTruthy();

      // 2. Scoped ERP request: attaches headers
      const scopedHeaders = RequestContext.buildHeaders({
        scope: { companyId: "comp-1", branchId: "br-1" },
        isPublicStorefront: false,
      });
      expect(scopedHeaders.get("X-Company-ID")).toBe("comp-1");
      expect(scopedHeaders.get("X-Branch-ID")).toBe("br-1");
    });
  });

  describe("2. Authorization & Permission Evaluation", () => {
    it("validates permission format with PermissionVO", () => {
      const p = new PermissionVO("shop:products:view");
      expect(p.module).toBe("shop");
      expect(p.resource).toBe("products");
      expect(p.action).toBe("view");
      expect(p.matches("shop:products:view")).toBe(true);
      expect(p.matches("shop:orders:view")).toBe(false);

      const wildcard = new PermissionVO("shop:products:*");
      expect(wildcard.matches("shop:products:view")).toBe(true);
      expect(wildcard.matches("shop:products:delete")).toBe(true);
    });

    it("evaluates RBAC and caches fast results in PermissionEvaluator", () => {
      const evaluator = new PermissionEvaluator();
      evaluator.setUser({
        id: "usr-1",
        email: "user@test.com",
        username: "testuser",
        fullName: "Test User",
        isStaff: false,
        isSuperuser: false,
        roles: ["catalog_viewer"],
        permissions: ["shop:products:view", "shop:categories:view"],
        memberships: [
          {
            companyId: "c-100",
            companyName: "Acme",
            branches: [{ branchId: "b-1", branchName: "Main" }],
          },
        ],
      });

      expect(evaluator.can("shop:products:view")).toBe(true);
      expect(evaluator.can("shop:orders:delete")).toBe(false);
      expect(evaluator.has("view")).toBe(true);
      expect(evaluator.has("delete")).toBe(false);
    });

    it("grants full access for superusers or admin role", () => {
      const evaluator = new PermissionEvaluator();
      evaluator.setUser({
        id: "admin-1",
        email: "admin@test.com",
        username: "admin",
        fullName: "Admin",
        isStaff: true,
        isSuperuser: true,
        roles: ["admin"],
        permissions: [],
        memberships: [],
      });

      expect(evaluator.can("anything:at:all")).toBe(true);
      expect(evaluator.has("arbitrary-action")).toBe(true);
    });
  });

  describe("3. Tenancy State Management", () => {
    it("propagates active company and branch and coordinates with listener", () => {
      const context = new TenantContext();
      let lastCompanyId: string | number | undefined;

      const unsubscribe = context.subscribe((state) => {
        lastCompanyId = state.activeCompany?.id;
      });

      context.setCompany({
        id: "comp-99",
        name: "Test Corp",
        code: "TC-99",
      });

      expect(context.getState().activeCompany?.id).toBe("comp-99");
      expect(lastCompanyId).toBe("comp-99");

      unsubscribe();
    });
  });

  describe("4. Observability & Error Reporting", () => {
    it("records reports into error sink without throwing", () => {
      const report = errorReporter.report(new Error("Database connection lost"), {
        subsystem: "inventory",
      });

      expect(report.id).toBeTruthy();
      expect(report.message).toBe("Database connection lost");
      expect(errorReporter.getRecentReports().length).toBeGreaterThan(0);
    });
  });
});
