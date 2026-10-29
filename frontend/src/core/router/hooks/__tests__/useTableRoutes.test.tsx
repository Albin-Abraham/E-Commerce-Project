import { MemoryRouter, useLocation } from "react-router-dom";
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { CompositionProvider } from "../../composition/CompositionContext";
import type { AppRoute } from "../../route.types";
import { tableRouteBindingRegistry } from "../../registries/table-route-binding.registry";
import { useTableRoutes } from "../useTableRoutes";

const routeIndex = new Map<string, AppRoute>([
  ["products.list", { id: "products.list", path: "/products" }],
  ["products.detail", { id: "products.detail", path: "/products/:id" }],
  ["products.create", { id: "products.create", path: "/products/new" }],
  ["products.edit", { id: "products.edit", path: "/products/:id/edit" }],
]);

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="location">{location.pathname}</span>;
}

function Harness() {
  const tableRoutes = useTableRoutes("products-table");
  return (
    <div>
      <span data-testid="list-href">{tableRoutes.listHref ?? "null"}</span>
      <span data-testid="details-href">
        {tableRoutes.detailsHref({ id: "42" }) ?? "null"}
      </span>
      <button
        data-testid="go-details"
        onClick={() => tableRoutes.navigateToDetails({ id: "99" })}
      >
        details
      </button>
      <button
        data-testid="go-create"
        onClick={() => tableRoutes.navigateToCreate()}
      >
        create
      </button>
      <LocationProbe />
    </div>
  );
}

function renderHarness() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <CompositionProvider value={{ routeIndex }}>
        <Harness />
      </CompositionProvider>
    </MemoryRouter>
  );
}

describe("useTableRoutes", () => {
  beforeEach(() => {
    tableRouteBindingRegistry.reset();
    tableRouteBindingRegistry.registerBinding({
      tableId: "products-table",
      listRouteId: "products.list",
      detailsRouteId: "products.detail",
      createRouteId: "products.create",
      editRouteId: "products.edit",
    });
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    tableRouteBindingRegistry.reset();
    vi.restoreAllMocks();
  });

  it("resolves binding destinations into concrete hrefs", () => {
    renderHarness();

    expect(screen.getByTestId("list-href").textContent).toBe("/products");
    expect(screen.getByTestId("details-href").textContent).toBe(
      "/products/42"
    );
  });

  it("navigates to details with params", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByTestId("go-details"));

    expect(screen.getByTestId("location").textContent).toBe("/products/99");
  });

  it("navigates to create", async () => {
    const user = userEvent.setup();
    renderHarness();

    await user.click(screen.getByTestId("go-create"));

    expect(screen.getByTestId("location").textContent).toBe("/products/new");
  });

  it("returns nulls and false when the binding is not registered", () => {
    tableRouteBindingRegistry.reset();

    let result: any;
    function Reader() {
      result = useTableRoutes("ghost-table");
      return null;
    }

    render(
      <MemoryRouter>
        <CompositionProvider value={{ routeIndex }}>
          <Reader />
        </CompositionProvider>
      </MemoryRouter>
    );

    expect(result.binding).toBeNull();
    expect(result.listHref).toBeNull();
    expect(result.createHref).toBeNull();
    expect(result.detailsHref({ id: "1" })).toBeNull();
    expect(result.navigateToList()).toBe(false);
    expect(result.navigateToDetails({ id: "1" })).toBe(false);
  });

  it("returns null for optional destinations that are not declared", () => {
    tableRouteBindingRegistry.reset();
    tableRouteBindingRegistry.registerBinding({
      tableId: "minimal",
      listRouteId: "products.list",
    });

    let result: any;
    function Reader() {
      result = useTableRoutes("minimal");
      return null;
    }

    render(
      <MemoryRouter>
        <CompositionProvider value={{ routeIndex }}>
          <Reader />
        </CompositionProvider>
      </MemoryRouter>
    );

    expect(result.listHref).toBe("/products");
    expect(result.detailsHref({ id: "1" })).toBeNull();
    expect(result.createHref).toBeNull();
    expect(result.navigateToCreate()).toBe(false);
  });
});
