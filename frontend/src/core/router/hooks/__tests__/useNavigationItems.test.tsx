import { MemoryRouter } from "react-router-dom";
import { render } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { CompositionProvider } from "../../composition/CompositionContext";
import type { AppRoute } from "../../route.types";
import { NavigationRegistry } from "../../registries/navigation.registry";
import { useNavigationItems } from "../useNavigationItems";

const routeIndex = new Map<string, AppRoute>([
  ["root", { id: "root", path: "/" }],
  ["products.list", { id: "products.list", path: "/products" }],
  ["products.detail", { id: "products.detail", path: "/products/:id" }],
  ["products.inventory", { id: "products.inventory", path: "/products/inventory" }],
  ["builder", { id: "builder", path: "/builder" }],
]);

let registry: NavigationRegistry;

function ItemsProbe({
  group,
  onItems,
}: {
  group?: string;
  onItems: (items: any[]) => void;
}) {
  const items = useNavigationItems({ group, registry });
  onItems(items);
  return null;
}

function renderItems(group?: string) {
  let captured: any[] = [];
  const onItems = (items: any[]) => {
    captured = items;
  };

  render(
    <MemoryRouter initialEntries={["/"]}>
      <CompositionProvider value={{ routeIndex }}>
        <ItemsProbe group={group} onItems={onItems} />
      </CompositionProvider>
    </MemoryRouter>
  );

  return { getItems: () => captured };
}

describe("useNavigationItems", () => {
  beforeEach(() => {
    registry = new NavigationRegistry();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves routeId destinations into concrete hrefs", () => {
    registry.registerAll([
      { id: "nav.products", label: "Products", routeId: "products.list" },
      { id: "nav.external", label: "Docs", href: "https://example.com" },
    ]);

    const { getItems } = renderItems();
    const items = getItems();

    expect(items.find((i) => i.id === "nav.products")?.href).toBe("/products");
    expect(items.find((i) => i.id === "nav.external")?.href).toBe(
      "https://example.com"
    );
  });

  it("keeps unresolved routeIds as href: null", () => {
    registry.register({
      id: "nav.ghost",
      label: "Ghost",
      routeId: "does.not.exist",
    });

    const { getItems } = renderItems();

    expect(getItems()[0].href).toBeNull();
  });

  it("builds hierarchy from parentId and sorts siblings by order", () => {
    registry.registerAll([
      {
        id: "nav.products",
        label: "Products",
        routeId: "products.list",
        order: 10,
      },
      {
        id: "nav.analytics",
        label: "Analytics",
        routeId: "builder",
        parentId: "nav.products",
        order: 30,
      },
      {
        id: "nav.inventory",
        label: "Inventory",
        routeId: "products.inventory",
        parentId: "nav.products",
        order: 20,
      },
      { id: "nav.root-level", label: "Root", routeId: "root", order: 5 },
    ]);

    const { getItems } = renderItems();
    const items = getItems();

    expect(items.map((i) => i.id)).toEqual(["nav.root-level", "nav.products"]);
    expect(items[1].children?.map((c: any) => c.id)).toEqual([
      "nav.inventory",
      "nav.analytics",
    ]);
    expect(items[1].children?.[0].href).toBe("/products/inventory");
  });

  it("filters by group", () => {
    registry.registerAll([
      { id: "a", label: "A", routeId: "root", group: "catalog" },
      { id: "b", label: "B", routeId: "builder", group: "system" },
    ]);

    const { getItems } = renderItems("catalog");
    const items = getItems();

    expect(items).toHaveLength(1);
    expect(items[0].id).toBe("a");
  });

  it("sorts orderless items alphabetically", () => {
    registry.registerAll([
      { id: "z", label: "Zeta", routeId: "root" },
      { id: "a", label: "Alpha", routeId: "builder" },
    ]);

    const { getItems } = renderItems();

    expect(getItems().map((i) => i.id)).toEqual(["a", "z"]);
  });
});
