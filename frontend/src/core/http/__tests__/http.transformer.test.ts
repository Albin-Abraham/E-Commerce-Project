import { describe, expect, it } from "vitest";

import { HttpTransformer, unwrapEnvelope } from "../http.transformer";

describe("HttpTransformer", () => {
  describe("toCamelCase", () => {
    it("should correctly convert snake_case keys to camelCase", () => {
      const backendResponse = {
        user_id: 1,
        first_name: "John",
        profile_data: {
          is_active: true,
          last_login: "2026-07-08",
        },
      };

      const result = HttpTransformer.toCamelCase<any>(backendResponse);

      expect(result.userId).toBe(1);
      expect(result.firstName).toBe("John");
      expect(result.profileData.isActive).toBe(true);

      // Ensure old keys are stripped
      expect(result.user_id).toBeUndefined();
    });
  });

  describe("toSnakeCase", () => {
    it("should correctly convert camelCase keys to snake_case for outgoing payloads", () => {
      const frontendPayload = {
        userId: 1,
        firstName: "John",
      };

      const result = HttpTransformer.toSnakeCase<any>(frontendPayload);

      expect(result.user_id).toBe(1);
      expect(result.first_name).toBe("John");
    });
  });

  describe("unwrapEnvelope", () => {
    it("should unwrap a standard B2B API envelope containing 'data' and 'meta'", () => {
      const rawResponse = {
        status: "success",
        data: [
          { id: 1, name: "Product A" },
          { id: 2, name: "Product B" },
        ],
        meta: {
          total: 100,
          page: 1,
        },
      };

      const result = unwrapEnvelope(rawResponse);

      // It should extract the actual data array
      expect(result.data).toHaveLength(2);
      expect(result.data[0].name).toBe("Product A");

      // It should preserve the meta object
      expect(result.meta).toBeDefined();
      expect(result.meta.total).toBe(100);

      // It should strip the redundant envelope fields
      expect((result as any).status).toBeUndefined();
    });

    it("should fallback gracefully if 'data' is undefined but 'meta' exists", () => {
      const rawResponse = {
        status: "error",
        meta: { timestamp: "2026-07-08" },
      };

      const result = unwrapEnvelope(rawResponse);

      // Data becomes the entire object because 'data' wasn't found inside it
      expect(result.data.status).toBe("error");
      expect(result.meta.timestamp).toBe("2026-07-08");
    });

    it("should return the raw response if no envelope is detected", () => {
      const rawResponse = [{ id: 1, name: "Product A" }];

      const result = unwrapEnvelope(rawResponse);

      expect(result.data).toBe(rawResponse);
      expect(result.meta).toBeUndefined();
    });

    it("should unwrap backend detail envelope: { status, message, detail }", () => {
      const rawResponse = {
        status: 200,
        message: "Request successful",
        detail: [
          { id: "comp-1", name: "System", code: "sys-001" },
        ],
      };

      const result = unwrapEnvelope(rawResponse);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("comp-1");
      expect(result.data[0].name).toBe("System");
    });

    it("should unwrap Django/paginated results envelope: { results, count }", () => {
      const rawResponse = {
        count: 42,
        results: [
          { id: 10, title: "Item 10" },
        ],
      };

      const result = unwrapEnvelope(rawResponse);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].title).toBe("Item 10");
    });

    it("should unwrap items envelope: { items, total }", () => {
      const rawResponse = {
        total: 5,
        items: [
          { id: "item-1", value: 100 },
        ],
      };

      const result = unwrapEnvelope(rawResponse);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe("item-1");
    });
  });
});
