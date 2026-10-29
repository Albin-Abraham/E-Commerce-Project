/**
 * HTTP Response Factory & Envelope Unwrapping Test Suite
 *
 * @issue [FEAT-CORE-HTTP]
 * @bug [BUG-DETAIL-ENVELOPE]
 *
 * Validates backend envelope compatibility across:
 *  1. Raw JSON payloads with { status, message, detail: [...] }
 *  2. Axios/Fetch HttpResponse objects
 *  3. Standard data envelopes { success, data: [...] }
 */

import { describe, expect, it } from "vitest";

import { ResponseFactory } from "../http.response.factory";
import type { HttpResponse } from "../http.types";

describe("ResponseFactory", () => {
  describe("UnWrap", () => {
    it("unwraps backend detail envelope from raw JSON", () => {
      const payload = {
        status: 200,
        message: "Request successful",
        detail: [
          { id: "iwPuFpauWjEzXNTLnjvRUxKOaJhPCcit", name: "System", code: "sys-001" },
        ],
      };

      const result = ResponseFactory.UnWrap<any, any[]>(payload);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("iwPuFpauWjEzXNTLnjvRUxKOaJhPCcit");
      expect(result[0].name).toBe("System");
    });

    it("unwraps backend detail envelope from HttpResponse object", () => {
      const response: HttpResponse<any> = {
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json" },
        config: { url: "/test", method: "GET" },
        data: {
          status: 200,
          message: "Request successful",
          detail: [
            { id: "c1", company_name: "Zenith Corp" },
          ],
        },
      };

      const result = ResponseFactory.UnWrap<any, any[]>(response, { casing: "camel" });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("c1");
      expect(result[0].companyName).toBe("Zenith Corp");
    });

    it("unwraps standard data envelope: { success: true, data: [...] }", () => {
      const payload = {
        success: true,
        data: [{ user_id: 1, user_role: "admin" }],
      };

      const result = ResponseFactory.UnWrap<any, any[]>(payload, { casing: "camel" });
      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe(1);
      expect(result[0].userRole).toBe("admin");
    });

    it("unwraps results envelope from DRF", () => {
      const payload = {
        count: 50,
        results: [{ id: 99, item_code: "DRF-01" }],
      };

      const result = ResponseFactory.UnWrap<any, any[]>(payload, { casing: "camel" });
      expect(result).toHaveLength(1);
      expect(result[0].itemCode).toBe("DRF-01");
    });

    it("preserves casing when casing is set to 'none'", () => {
      const payload = {
        status: 200,
        detail: [{ company_id: "comp-1", is_active: true }],
      };

      const result = ResponseFactory.UnWrap<any, any[]>(payload, { casing: "none" });
      expect(result[0].company_id).toBe("comp-1");
      expect(result[0].is_active).toBe(true);
    });

    it("handles plain arrays directly", () => {
      const payload = [{ id: 1, name: "Plain Array" }];
      const result = ResponseFactory.UnWrap<any, any[]>(payload);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Plain Array");
    });

    it("extracts custom dataPath when specified", () => {
      const payload = {
        nested: {
          deep: {
            records: [{ id: "nested-1" }],
          },
        },
      };

      const result = ResponseFactory.UnWrap<any, any[]>(payload, {
        dataPath: "nested.deep.records",
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("nested-1");
    });
  });

  describe("ResponseParser.parsePaginated", () => {
    it("extracts items from detail envelope", () => {
      const response: HttpResponse<any> = {
        status: 200,
        statusText: "OK",
        headers: {},
        config: { url: "/test", method: "GET" },
        data: {
          status: 200,
          total: 10,
          detail: [{ id: "d1" }, { id: "d2" }],
        },
      };

      const parsed = ResponseFactory.parse(response).parsePaginated<{ id: string }>();
      expect(parsed.items).toHaveLength(2);
      expect(parsed.total).toBe(10);
    });

    it("extracts items from results envelope", () => {
      const response: HttpResponse<any> = {
        status: 200,
        statusText: "OK",
        headers: {},
        config: { url: "/test", method: "GET" },
        data: {
          count: 25,
          results: [{ id: "r1" }],
        },
      };

      const parsed = ResponseFactory.parse(response).parsePaginated<{ id: string }>();
      expect(parsed.items).toHaveLength(1);
      expect(parsed.total).toBe(25);
    });
  });

  describe("ResponseParser.parseEnvelope", () => {
    it("extracts data from detail envelope", () => {
      const response: HttpResponse<any> = {
        status: 200,
        statusText: "OK",
        headers: {},
        config: { url: "/test", method: "GET" },
        data: {
          status: 200,
          message: "Success",
          detail: [{ id: "d1" }],
        },
      };

      const parsed = ResponseFactory.parse(response).parseEnvelope();
      expect(parsed.success).toBe(true);
      expect(parsed.data).toEqual([{ id: "d1" }]);
      expect(parsed.message).toBe("Success");
    });
  });
});
