/**
 * Platform Networking: Request Context & Tenant Scoping
 *
 * Manages request-scoped metadata such as correlation IDs, authentication tokens,
 * and multi-tenant scoping headers (X-Company-ID, X-Branch-ID).
 *
 * Invariant: Multi-tenant headers are ONLY attached when an explicit tenant scope
 * is declared for the request. Public storefront requests are never polluted.
 */

export interface RequestScope {
  companyId?: string | number;
  branchId?: string | number;
  facilityId?: string | number;
  correlationId?: string;
}

export class RequestContext {
  private static defaultScope: RequestScope = {};

  /**
   * Sets platform-wide default tenant scope (for ERP/Backoffice application shell)
   */
  public static setDefaultScope(scope: RequestScope): void {
    this.defaultScope = { ...scope };
  }

  /**
   * Clears platform-wide default scope
   */
  public static clearDefaultScope(): void {
    this.defaultScope = {};
  }

  /**
   * Builds request headers merging explicit request-level scope with active context
   */
  public static buildHeaders(
    options: {
      headers?: HeadersInit;
      scope?: RequestScope;
      isPublicStorefront?: boolean;
    } = {}
  ): Headers {
    const headers = new Headers(options.headers || {});

    // Ensure JSON content-type if not already set
    if (!headers.has("Accept")) {
      headers.set("Accept", "application/json");
    }

    // Attach correlation ID for traceability
    const correlationId =
      options.scope?.correlationId ||
      options.headers instanceof Headers
        ? options.headers.get("x-request-id")
        : (options.headers as Record<string, string>)?.[
            "x-request-id"
          ] ||
          `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    headers.set("X-Request-ID", correlationId);

    // Invariant: Do NOT attach company or branch headers if marked as public storefront
    if (options.isPublicStorefront) {
      return headers;
    }

    // Attach company / branch headers if explicitly scoped
    const effectiveScope = { ...this.defaultScope, ...options.scope };

    if (effectiveScope.companyId !== undefined && effectiveScope.companyId !== null) {
      headers.set("X-Company-ID", String(effectiveScope.companyId));
    }

    if (effectiveScope.branchId !== undefined && effectiveScope.branchId !== null) {
      headers.set("X-Branch-ID", String(effectiveScope.branchId));
    }

    if (effectiveScope.facilityId !== undefined && effectiveScope.facilityId !== null) {
      headers.set("X-Facility-ID", String(effectiveScope.facilityId));
    }

    return headers;
  }
}
