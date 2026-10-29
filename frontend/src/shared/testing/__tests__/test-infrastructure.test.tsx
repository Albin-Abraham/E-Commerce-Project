import { useLocation } from "react-router-dom";

import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";

import { server } from "../msw/server";
import { renderWithProviders } from "../test-utils";

const CurrentPath = () => {
  const location = useLocation();
  return <output data-testid="current-path">{location.pathname}</output>;
};

describe("shared test infrastructure", () => {
  let previousRender: HTMLElement | null = null;

  it("configures the initial router location", () => {
    const { getByTestId, router } = renderWithProviders(<CurrentPath />, {
      routerOptions: { initialEntries: ["/employees?active=true"] },
    });

    previousRender = getByTestId("current-path");
    expect(previousRender.textContent).toBe("/employees");
    expect(router.state.location.search).toBe("?active=true");
  });

  it("cleans up a previous render before the next test", () => {
    expect(previousRender).not.toBeNull();
    expect(document.body.contains(previousRender)).toBe(false);
  });

  it("creates an independent QueryClient for every render", () => {
    const first = renderWithProviders(<div />);
    const second = renderWithProviders(<div />);

    first.queryClient.setQueryData(["isolation-check"], "first render");

    expect(second.queryClient).not.toBe(first.queryClient);
    expect(
      second.queryClient.getQueryData(["isolation-check"])
    ).toBeUndefined();
  });

  it("allows scenario-specific MSW handlers", async () => {
    server.use(
      http.get("/api/health", () => HttpResponse.json({ status: "scenario" }))
    );

    const response = await fetch("/api/health");
    await expect(response.json()).resolves.toEqual({ status: "scenario" });
  });

  it("resets scenario handlers after each test", async () => {
    const response = await fetch("/api/health");
    const payload = await response.json();

    expect(payload.status).toBe("healthy");
  });

  it("fails requests that do not have an MSW handler", async () => {
    await expect(fetch("/api/unhandled-test-request")).rejects.toThrow();
  });
});
