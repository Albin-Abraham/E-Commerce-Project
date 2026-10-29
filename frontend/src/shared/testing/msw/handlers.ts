import { http, HttpResponse } from "msw";

/**
 * Base MSW Handlers
 * Fallback defaults for common endpoints across features.
 */
export const handlers = [
  // Healthcheck
  http.get("/api/health", () => {
    return HttpResponse.json({ status: "healthy", timestamp: Date.now() });
  }),

  // Fallback Session / Org Endpoints returning unified backend envelope
  http.get("*/api/v1/sessions/user/companies/", () => {
    return HttpResponse.json({
      status: 200,
      message: "Request successful",
      detail: [
        {
          id: "iwPuFpauWjEzXNTLnjvRUxKOaJhPCcit",
          name: "System",
          code: "sys-001",
          is_active: true,
        },
      ],
    });
  }),

  http.get("*/api/v1/sessions/user/business-units/", () => {
    return HttpResponse.json({
      status: 200,
      message: "Request successful",
      detail: [
        {
          id: "bu-default",
          name: "Main Unit",
          code: "bu-001",
          is_active: true,
        },
      ],
    });
  }),

  http.get("*/api/v1/sessions/user/branches/", () => {
    return HttpResponse.json({
      status: 200,
      message: "Request successful",
      detail: [
        {
          id: "br-default",
          name: "Main Branch",
          code: "br-001",
          is_active: true,
        },
      ],
    });
  }),

  // Branch Infrastructure Table API (Strict v1)
  http.get("*/api/v1/admin/branches/*", ({ request }) => {
    const url = new URL(request.url);
    const page = Math.max(0, Number(url.searchParams.get("page") ?? 1) - 1);
    const pageSize = Number(url.searchParams.get("page_size") ?? 10);
    const search = url.searchParams.get("search")?.toLowerCase().trim() ?? "";
    const type = url.searchParams.get("type");
    const status = url.searchParams.get("status");
    const sortKey = url.searchParams.get("sortKey");
    const sortDir = url.searchParams.get("sortDir") ?? "asc";

    const cities = [
      { city: "New York", state: "NY", country: "US" },
      { city: "London", state: "Greater London", country: "UK" },
      { city: "Tokyo", state: "Kanto", country: "JP" },
      { city: "Sydney", state: "NSW", country: "AU" },
      { city: "Berlin", state: "Berlin", country: "DE" },
      { city: "Toronto", state: "Ontario", country: "CA" },
      { city: "Paris", state: "Île-de-France", country: "FR" },
      { city: "Singapore", state: "Central", country: "SG" },
    ];
    const managers = ["Sarah Connor", "Alex Mercer", "Elena Rostova", "David Chen", "Marcus Vance"];
    const types = ["headquarters", "regional", "store", "clinic"];
    const statuses = ["active", "inactive", "maintenance"];

    let all = Array.from({ length: 100 }, (_, i) => {
      const loc = cities[i % cities.length];
      const t = types[i % types.length];
      const s = statuses[i % statuses.length];
      return {
        id: `br-${i + 101}`,
        code: `BR-${100 + i + 1}`,
        name: `${loc.city} ${t.toUpperCase()} Branch`,
        type: t,
        status: s,
        manager: managers[i % managers.length],
        email: `branch.${i + 1}@example.com`,
        phone: `+1 555 ${100 + i}`,
        city: loc.city,
        state: loc.state,
        country: loc.country,
        capacity: Math.floor(40 + (i * 7) % 55),
        opened_date: new Date(2018 + (i % 6), i % 12, 1 + (i % 28))
          .toISOString()
          .split("T")[0],
        company: {
          id: "comp-001",
          label: "System",
          type: "company",
          display: "System (comp-001)",
        },
        business_unit: {
          id: "bu-001",
          label: "All Business",
          type: "businessunit",
          display: "All Business (bu-001)",
        },
      };
    });

    if (search) {
      all = all.filter(
        (b) =>
          b.name.toLowerCase().includes(search) ||
          b.code.toLowerCase().includes(search) ||
          b.manager.toLowerCase().includes(search) ||
          b.city.toLowerCase().includes(search)
      );
    }

    if (type) all = all.filter((b) => b.type === type);
    if (status) all = all.filter((b) => b.status === status);

    if (sortKey) {
      all.sort((a, b) => {
        const valA = (a as any)[sortKey];
        const valB = (b as any)[sortKey];
        if (valA < valB) return sortDir === "asc" ? -1 : 1;
        if (valA > valB) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }

    const totalCount = all.length;
    const start = page * pageSize;
    const rows = all.slice(start, start + pageSize);

    return HttpResponse.json({
      status: 200,
      message: "Fetched successfully",
      count: totalCount,
      total_pages: Math.max(1, Math.ceil(totalCount / pageSize)),
      current_page: page + 1,
      range: `showing ${start + 1}-${Math.min(start + pageSize, totalCount)} of ${totalCount}`,
      next_url: page + 1 < Math.ceil(totalCount / pageSize) ? `?page=${page + 2}` : null,
      prev_url: page > 0 ? `?page=${page}` : null,
      has_next: page + 1 < Math.ceil(totalCount / pageSize),
      has_prev: page > 0,
      results: rows,
      data: rows,
      rows,
      totalCount,
      page,
      pageSize,
    });
  }),
];
