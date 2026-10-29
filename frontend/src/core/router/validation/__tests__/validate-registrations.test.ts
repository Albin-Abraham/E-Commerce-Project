import { describe, expect, it } from "vitest";

import type { AppRoute, ModuleDefinition } from "../../route.types";
import {
  formatValidationReport,
  validateRegistrations,
} from "../validate-registrations";

const route = (id: string, path: string, extra?: Partial<AppRoute>): AppRoute => ({
  id,
  path,
  ...extra,
});

describe("validateRegistrations", () => {
  it("passes for a valid route tree", () => {
    const routes = [
      route("root", "/", {
        children: [route("home", "home"), route("about", "about")],
      }),
    ];

    const result = validateRegistrations(routes);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("reports duplicate route ids as errors", () => {
    const routes = [route("dup", "/a"), route("dup", "/b")];

    const result = validateRegistrations(routes);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "duplicate-route-id")).toBe(
      true
    );
  });

  it("reports missing route ids as errors", () => {
    const routes = [{ path: "/no-id" } as AppRoute];

    const result = validateRegistrations(routes);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "missing-route-id")).toBe(true);
  });

  it("reports routes with neither path nor index as errors", () => {
    const routes = [{ id: "no-path" } as AppRoute];

    const result = validateRegistrations(routes);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "missing-path")).toBe(true);
  });

  it("accepts index routes without a path", () => {
    const routes = [
      route("root", "/", {
        children: [{ id: "home", index: true } as AppRoute],
      }),
    ];

    const result = validateRegistrations(routes);

    expect(result.valid).toBe(true);
  });

  it("reports duplicate sibling paths as errors", () => {
    const routes = [
      route("root", "/", {
        children: [route("a", "same"), route("b", "same")],
      }),
    ];

    const result = validateRegistrations(routes);

    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.code === "duplicate-sibling-path")
    ).toBe(true);
  });

  it("allows the same path under different parents", () => {
    const routes = [
      route("p1", "/parent1", { children: [route("c1", "item")] }),
      route("p2", "/parent2", { children: [route("c2", "item")] }),
    ];

    const result = validateRegistrations(routes);

    expect(result.valid).toBe(true);
  });

  it("reports duplicate module ids as errors", () => {
    const modules: ModuleDefinition[] = [
      { id: "mod", routes: [] },
      { id: "mod", routes: [] },
    ];

    const result = validateRegistrations([], modules);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "duplicate-module-id")).toBe(
      true
    );
  });

  it("warns on unknown layoutId references", () => {
    const routes = [route("r", "/x", { layoutId: "missing-layout" })];

    const result = validateRegistrations(routes, [], {
      knownLayoutIds: ["main"],
    });

    expect(result.valid).toBe(true);
    expect(
      result.warnings.some((w) => w.code === "unknown-layout-id")
    ).toBe(true);
  });

  it("does not warn on layoutId when no known layouts are provided", () => {
    const routes = [route("r", "/x", { layoutId: "any-layout" })];

    const result = validateRegistrations(routes);

    expect(
      result.warnings.some((w) => w.code === "unknown-layout-id")
    ).toBe(false);
  });

  it("reports orphaned parentId references as errors", () => {
    const routes = [route("r", "/x", { parentId: "ghost-parent" })];

    const result = validateRegistrations(routes);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.code === "unknown-parent-id")).toBe(
      true
    );
  });

  it("accepts derived parentIds that reference existing routes", () => {
    const routes = [
      route("parent", "/", {
        children: [route("child", "c", { parentId: "parent" })],
      }),
    ];

    const result = validateRegistrations(routes);

    expect(result.valid).toBe(true);
  });

  it("formats a readable report", () => {
    const result = validateRegistrations([route("dup", "/a"), route("dup", "/b")]);

    const report = formatValidationReport(result);

    expect(report).toContain("[ERROR]");
    expect(report).toContain("duplicate-route-id");
  });
});
