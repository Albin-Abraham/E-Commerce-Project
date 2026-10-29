import { describe, it, expect, vi, beforeEach } from "vitest";
import { RemoteOptionsManager } from "../modules/remote-options";

describe("Deterministic Asynchronous Behavior (Epochs & AbortController)", () => {
  let stateManager: any;
  let resolver: any;
  let runtime: any;
  let mockHttpClient: any;

  beforeEach(() => {
    stateManager = {
      state: {
        values: { country: "USA" },
        view: {},
        performance: {},
      },
      setPerformance: vi.fn(),
      notifyField: vi.fn(),
      notify: vi.fn(),
    };

    resolver = {
      resolveField: vi.fn().mockReturnValue({
        id: "city_field",
        name: "city",
        remoteOptions: {
          url: "/api/cities?country={{country}}",
          watch: ["country"],
          debounceMs: 0,
        },
      }),
      registry: {
        getAllFields: vi.fn().mockReturnValue([]),
        getDependenciesForField: vi.fn().mockReturnValue({
          remoteOptions: new Set(["city_field"]),
        }),
      },
    };

    runtime = {
      valueProxy: {
        getValue: vi.fn((values, path) => values[path]),
      },
    };

    mockHttpClient = {
      auth: {
        request: vi.fn(),
      },
    };

    vi.doMock("@services/http.instance", () => ({
      httpClient: mockHttpClient,
    }));
  });

  it("aborts in-flight request when a new query is initiated for the same field", async () => {
    const manager = new RemoteOptionsManager(stateManager, resolver, runtime);

    let firstSignal: AbortSignal | undefined;
    mockHttpClient.auth.request.mockImplementationOnce(async ({ signal }: any) => {
      firstSignal = signal;
      // Simulate slow response
      await new Promise((resolve) => setTimeout(resolve, 200));
      return {
        status: 200,
        headers: { "content-type": "application/json" },
        data: {
          detail: [{ id: "nyc", name: "New York" }],
        },
      };
    });

    // 1. First trigger
    manager.handleValueChange("country");

    // Give microtask time to start fetch
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(firstSignal).toBeDefined();
    expect(firstSignal!.aborted).toBe(false);

    // 2. Second trigger immediately (e.g., country switched to Canada)
    stateManager.state.values.country = "CAN";
    mockHttpClient.auth.request.mockResolvedValueOnce({
      status: 200,
      headers: { "content-type": "application/json" },
      data: {
        detail: [{ id: "tor", name: "Toronto" }],
      },
    });

    manager.handleValueChange("country");
    await new Promise((resolve) => setTimeout(resolve, 10));

    // The first signal must now be aborted!
    expect(firstSignal!.aborted).toBe(true);
  });

  it("drops stale out-of-order responses and preserves newest result", async () => {
    const manager = new RemoteOptionsManager(stateManager, resolver, runtime);

    // Request 1 takes 150ms to finish
    mockHttpClient.auth.request.mockImplementationOnce(async () => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      return {
        status: 200,
        headers: { "content-type": "application/json" },
        data: {
          detail: [{ id: "stale_1", name: "Stale City" }],
        },
      };
    });

    manager.handleValueChange("country");

    // After 10ms, user switches country, dispatching Request 2 which finishes in 30ms
    await new Promise((resolve) => setTimeout(resolve, 10));
    stateManager.state.values.country = "DE";

    mockHttpClient.auth.request.mockImplementationOnce(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
      return {
        status: 200,
        headers: { "content-type": "application/json" },
        data: {
          detail: [{ id: "berlin", name: "Berlin" }],
        },
      };
    });

    manager.handleValueChange("country");

    // Wait 250ms for both to settle
    await new Promise((resolve) => setTimeout(resolve, 250));

    // The active options MUST be Berlin, NOT Stale City!
    const finalView = stateManager.state.view["city_field"];
    expect(finalView?.options).toBeDefined();
    expect(finalView.options[0]?.value).toBe("berlin");
    expect(finalView.options[0]?.label).toBe("Berlin");
  });

  it("cancels pending requests and resets epoch on cancelPending", async () => {
    const manager = new RemoteOptionsManager(stateManager, resolver, runtime);

    let activeSignal: AbortSignal | undefined;
    mockHttpClient.auth.request.mockImplementationOnce(async ({ signal }: any) => {
      activeSignal = signal;
      await new Promise((resolve) => setTimeout(resolve, 200));
      return { data: [] };
    });

    manager.handleValueChange("country");
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(activeSignal?.aborted).toBe(false);

    manager.cancelPending("city_field");
    expect(activeSignal?.aborted).toBe(true);
  });
});
