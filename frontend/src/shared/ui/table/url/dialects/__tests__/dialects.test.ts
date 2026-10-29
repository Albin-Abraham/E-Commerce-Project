import { describe, expect, it } from "vitest";
import {
  RestDialectAdapter,
  ODataDialectAdapter,
  RsqlDialectAdapter,
} from "../index";
import type { TableQueryParams } from "../../../types";

const mockParams: TableQueryParams = {
  page: 2,
  pageSize: 25,
  offset: 50,
  search: "acme",
  sort: [{ key: "name", dir: "asc" }, { key: "created", dir: "desc" }],
  filters: { status: "active", tier: "enterprise" },
};

describe("Query Dialect Adapters", () => {
  describe("RestDialectAdapter", () => {
    const adapter = new RestDialectAdapter();

    it("serializes TableQueryParams into standard REST query params", () => {
      const query = adapter.serialize(mockParams);
      expect(query.page).toBe("2");
      expect(query.size).toBe("25");
      expect(query.search).toBe("acme");
      expect(query.sort).toBe("name:asc,created:desc");
      expect(query["filter[status]"]).toBe("active");
    });

    it("parses REST query params back to partial TableQueryParams", () => {
      const parsed = adapter.parse({
        page: "2",
        size: "25",
        search: "acme",
        sort: "name:asc,created:desc",
        "filter[status]": "active",
      });

      expect(parsed.page).toBe(2);
      expect(parsed.pageSize).toBe(25);
      expect(parsed.search).toBe("acme");
      expect(parsed.sort).toEqual([
        { key: "name", dir: "asc" },
        { key: "created", dir: "desc" },
      ]);
      expect(parsed.filters).toEqual({ status: "active" });
    });
  });

  describe("ODataDialectAdapter", () => {
    const adapter = new ODataDialectAdapter();

    it("serializes TableQueryParams into OData v4 query strings", () => {
      const query = adapter.serialize(mockParams);
      expect(query.$top).toBe("25");
      expect(query.$skip).toBe("50");
      expect(query.$search).toBe('"acme"');
      expect(query.$orderby).toBe("name asc, created desc");
      expect(query.$filter).toBe("status eq 'active' and tier eq 'enterprise'");
    });

    it("parses OData v4 query strings into TableQueryParams", () => {
      const parsed = adapter.parse({
        $top: "25",
        $skip: "50",
        $search: '"acme"',
        $orderby: "name asc, created desc",
      });

      expect(parsed.page).toBe(2);
      expect(parsed.pageSize).toBe(25);
      expect(parsed.search).toBe("acme");
      expect(parsed.sort).toEqual([
        { key: "name", dir: "asc" },
        { key: "created", dir: "desc" },
      ]);
    });
  });

  describe("RsqlDialectAdapter", () => {
    const adapter = new RsqlDialectAdapter();

    it("serializes TableQueryParams into RSQL / FIQL syntax", () => {
      const query = adapter.serialize(mockParams);
      expect(query.page).toBe("2");
      expect(query.size).toBe("25");
      expect(query.sort).toBe("name,asc;created,desc");
      expect(query.query).toContain('search=="*acme*"');
      expect(query.query).toContain("status==active");
    });

    it("parses RSQL query parameters", () => {
      const parsed = adapter.parse({
        page: "2",
        size: "25",
        sort: "name,asc;created,desc",
      });

      expect(parsed.page).toBe(2);
      expect(parsed.pageSize).toBe(25);
      expect(parsed.sort).toEqual([
        { key: "name", dir: "asc" },
        { key: "created", dir: "desc" },
      ]);
    });
  });
});
