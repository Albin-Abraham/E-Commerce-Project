import type { ReactNode } from "react";

import { MemoryRouter, useLocation } from "react-router-dom";
import { render, screen, act } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { CompositionProvider } from "../../composition/CompositionContext";
import type { AppRoute } from "../../route.types";
import {
  substituteParams,
  useRouteNavigation,
} from "../useRouteNavigation";

const routeIndex = new Map<string, AppRoute>([
  ["root", { id: "root", path: "/" }],
  ["products.list", { id: "products.list", path: "/products" }],
  [
    "products.detail",
    { id: "products.detail", path: "/products/:id" },
  ],
  ["home.index", { id: "home.index", index: true }],
]);

function Probe({ children }: { children: ReactNode }) {
  const location = useLocation();
  return (
    <div>
      <span data-testid="location">
        {location.pathname}
        {location.search}
      </span>
      {children}
    </div>
  );
}

function NavHarness() {
  const nav = useRouteNavigation();
  return (
    <div>
      <button
        data-testid="go-detail"
        onClick={() =>
          nav.navigateToRoute("products.detail", {
            params: { id: "42" },
            search: { tab: "specs" },
          })
        }
      >
        detail
      </button>
      <button
        data-testid="go-unknown"
        onClick={() => nav.navigateToRoute("does.not.exist")}
      >
        unknown
      </button>
      <button
        data-testid="replace-list"
        onClick={() =>
          nav.navigateToRoute("products.list", { replace: true })
        }
      >
        list
      </button>
    </div>
  );
}

function renderHarness() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <CompositionProvider value={{ routeIndex }}>
        <Probe>
          <NavHarness />
        </Probe>
      </CompositionProvider>
    </MemoryRouter>
  );
}

describe("substituteParams", () => {
  it("substitutes named params", () => {
    expect(substituteParams("/products/:id", { id: "42" })).toBe(
      "/products/42"
    );
  });

  it("substitutes multiple params and URL-encodes values", () => {
    expect(
      substituteParams("/a/:x/b/:y", { x: "1", y: "hello world" })
    ).toBe("/a/1/b/hello%20world");
  });

  it("returns null when a required param is missing", () => {
    expect(substituteParams("/products/:id", {})).toBeNull();
    expect(substituteParams("/products/:id")).toBeNull();
  });

  it("returns the path unchanged when there are no placeholders", () => {
    expect(substituteParams("/about", { id: "ignored" })).toBe("/about");
  });
});

describe("useRouteNavigation", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves a parameterized routeId into a concrete path", () => {
    let resolved: string | null = null;
    function Resolver() {
      const nav = useRouteNavigation();
      resolved = nav.resolveRoutePath("products.detail", { id: "7" });
      return null;
    }

    render(
      <MemoryRouter>
        <CompositionProvider value={{ routeIndex }}>
          <Resolver />
        </CompositionProvider>
      </MemoryRouter>
    );

    expect(resolved).toBe("/products/7");
  });

  it("returns null for unknown routeIds and warns", () => {
    let resolved: string | null | undefined;
    function Resolver() {
      const nav = useRouteNavigation();
      resolved = nav.resolveRoutePath("ghost");
      return null;
    }

    render(
      <MemoryRouter>
        <CompositionProvider value={{ routeIndex }}>
          <Resolver />
        </CompositionProvider>
      </MemoryRouter>
    );

    expect(resolved).toBeNull();
    expect(console.warn).toHaveBeenCalled();
  });

  it("returns null when required params are missing", () => {
    let resolved: string | null | undefined;
    function Resolver() {
      const nav = useRouteNavigation();
      resolved = nav.resolveRoutePath("products.detail");
      return null;
    }

    render(
      <MemoryRouter>
        <CompositionProvider value={{ routeIndex }}>
          <Resolver />
        </CompositionProvider>
      </MemoryRouter>
    );

    expect(resolved).toBeNull();
  });

  it("returns null for index routes (no path)", () => {
    let resolved: string | null | undefined;
    function Resolver() {
      const nav = useRouteNavigation();
      resolved = nav.resolveRoutePath("home.index");
      return null;
    }

    render(
      <MemoryRouter>
        <CompositionProvider value={{ routeIndex }}>
          <Resolver />
        </CompositionProvider>
      </MemoryRouter>
    );

    expect(resolved).toBeNull();
  });

  it("navigates with params and serialized search", async () => {
    const user = userEvent.setup();
    renderHarness();

    await act(async () => {
      await user.click(screen.getByTestId("go-detail"));
    });

    expect(screen.getByTestId("location").textContent).toBe(
      "/products/42?tab=specs"
    );
  });

  it("returns false and does not navigate for unknown routeIds", async () => {
    const user = userEvent.setup();
    renderHarness();

    await act(async () => {
      await user.click(screen.getByTestId("go-unknown"));
    });

    expect(screen.getByTestId("location").textContent).toBe("/");
    expect(console.warn).toHaveBeenCalled();
  });

  it("supports replace navigation", async () => {
    const user = userEvent.setup();
    renderHarness();

    await act(async () => {
      await user.click(screen.getByTestId("replace-list"));
    });

    expect(screen.getByTestId("location").textContent).toBe("/products");
  });
});
