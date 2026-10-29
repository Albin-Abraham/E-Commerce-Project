import { SchemaNormalizer } from "@ui/form/utils/SchemaNormalizer";
import { describe, expect, it, vi } from "vitest";

import type { FormDefinition } from "../types";

describe("SchemaNormalizer", () => {
  it("generates deterministic fallback IDs", () => {
    const definition: FormDefinition = {
      id: "deterministic",
      title: "Deterministic",
      sections: [
        {
          id: "s1",
          title: "S1",
          fields: [{ name: "name", type: "text", label: "Name" }],
        },
      ],
    };

    const first = SchemaNormalizer.normalize(definition);
    const second = SchemaNormalizer.normalize(definition);

    expect(first[0].fields?.[0].id).toBe(second[0].fields?.[0].id);
  });

  it("resolves canonical layout from properties when layout is missing", () => {
    const definition: FormDefinition = {
      id: "layout-test",
      title: "Layout Test",
      fields: [
        {
          id: "f1",
          name: "name",
          type: "text",
          label: "Name",
          properties: { display: "grid", columns: 6, gap: 3 },
        },
      ],
    };

    const normalized = SchemaNormalizer.normalize(definition);
    expect((normalized[0].layout as any).type).toBe("grid");
    expect((normalized[0].layout as any).columns).toBe(6);
  });

  it("warns on unknown schema keys in development", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const definition: FormDefinition = {
      id: "warn-test",
      title: "Warn Test",
      fields: [
        {
          id: "f1",
          name: "name",
          type: "text",
          label: "Name",
          properties: { unknownKey: "x" } as any,
        },
      ],
    };

    SchemaNormalizer.normalize(definition);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
