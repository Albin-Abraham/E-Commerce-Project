import { beforeEach, describe, expect, it } from "vitest";
import { SchemaRegistry } from "../SchemaRegistry";
import type { FormDefinition } from "../domain";

describe("SchemaRegistry Code-Splitting & Lazy Loading", () => {
  let registry: SchemaRegistry;

  const mockSchema: FormDefinition = {
    id: "test-schema-1",
    title: "Test Form",
    sections: [
      {
        id: "s1",
        title: "Section 1",
        fields: [{ key: "name", type: "text", label: "Name" }],
      },
    ],
  };

  beforeEach(() => {
    registry = new SchemaRegistry();
  });

  it("registers and resolves synchronous schemas", () => {
    registry.register("sync-form", () => mockSchema);

    expect(registry.has("sync-form")).toBe(true);
    const resolved = registry.resolveSync("sync-form");
    expect(resolved.id).toBe("test-schema-1");
  });

  it("registers and resolves code-split lazy schema loaders", async () => {
    registry.registerLazy("lazy-form", async () => ({
      default: mockSchema,
    }));

    expect(registry.has("lazy-form")).toBe(true);

    // Resolving async loads and unwraps the module
    const resolved = await registry.resolve("lazy-form");
    expect(resolved.id).toBe("test-schema-1");

    // Memoized in cache, subsequent sync resolution succeeds
    expect(registry.resolveSync("lazy-form").id).toBe("test-schema-1");
  });

  it("preloads schemas and multiple schemas concurrently", async () => {
    const schemaA: FormDefinition = { id: "form-a", title: "A", sections: [] };
    const schemaB: FormDefinition = { id: "form-b", title: "B", sections: [] };

    registry.registerLazy("form-a", async () => schemaA);
    registry.registerLazy("form-b", async () => ({ default: schemaB }));

    const [loadedA, loadedB] = await registry.preloadMany(["form-a", "form-b"]);
    expect(loadedA.id).toBe("form-a");
    expect(loadedB.id).toBe("form-b");

    expect(registry.resolveSync("form-a").id).toBe("form-a");
    expect(registry.resolveSync("form-b").id).toBe("form-b");
  });

  it("throws clear error when resolving unregistered schema", async () => {
    await expect(registry.resolve("unknown-form")).rejects.toThrow(
      'No schema registered for form ID: "unknown-form"'
    );
  });
});
