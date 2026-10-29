import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RemoteOptionsManager } from "./remote-options";

const mockAxios = {
  request: vi.fn(),
};

vi.mock(
  "@services/http.instance",
  () => {
    return {
      httpClient: {
        auth: mockAxios,
      },
    };
  }
);

describe("RemoteOptionsManager", () => {
  let stateManager: any;
  let resolver: any;
  let runtime: any;

  beforeEach(async () => {
    vi.useFakeTimers();

    stateManager = {
      state: {
        values: {},
        view: {},
      },
      setPerformance: vi.fn(),
      notify: vi.fn(),
      notifyField: vi.fn(),
    };

    resolver = {
      registry: {
        getAllFields: vi.fn().mockReturnValue([]),
      },
      resolveField: vi.fn(),
    };

    runtime = {
      valueProxy: {
        getValue: (values: any, path: string) => {
          return path
            .split(".")
            .reduce((acc, part) => acc && acc[part], values);
        },
      },
    };

    mockAxios.request.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should generate proper dependency keys and deduplicate fetches", async () => {
    const manager = new RemoteOptionsManager(stateManager, resolver, runtime);

    resolver.resolveField.mockReturnValue({
      id: "test_field",
      name: "test_field",
      remoteOptions: {
        url: "/api/test",
        watch: ["dep1"],
      },
    });

    stateManager.state.values = {
      dep1: "value1",
    };

    mockAxios.request.mockResolvedValueOnce({
      data: [{ id: 1, name: "Option 1" }],
    });

    // Initial fetch
    manager["fetchOptions"]("test_field");
    expect(stateManager.state.view["test_field"].isLoading).toBe(true);

    // Immediate second fetch with same dependencies (should deduplicate)
    manager["fetchOptions"]("test_field");

    await vi.runAllTimersAsync();

    expect(mockAxios.request).toHaveBeenCalledTimes(1);
    expect(stateManager.state.view["test_field"].options).toEqual([
      expect.objectContaining({ label: "Option 1", value: 1 }),
    ]);

    // Fetch again with same dependencies (should deduplicate)
    manager["fetchOptions"]("test_field");
    await vi.runAllTimersAsync();
    expect(mockAxios.request).toHaveBeenCalledTimes(1);

    // Fetch with different dependencies (should trigger new fetch)
    stateManager.state.values = {
      dep1: "value2",
    };
    mockAxios.request.mockResolvedValueOnce({
      data: [{ id: 2, name: "Option 2" }],
    });
    manager["fetchOptions"]("test_field");
    await vi.runAllTimersAsync();
    expect(mockAxios.request).toHaveBeenCalledTimes(2);
    expect(stateManager.state.view["test_field"].options).toEqual([
      expect.objectContaining({ label: "Option 2", value: 2 }),
    ]);
  });

  it("should interpolate url and include search query in api call", async () => {
    const manager = new RemoteOptionsManager(stateManager, resolver, runtime);

    resolver.resolveField.mockReturnValue({
      id: "test_field",
      name: "test_field",
      remoteOptions: {
        url: "/api/test/{dep1}",
        params: {
          filter: "{dep2}",
        },
      },
    });

    stateManager.state.values = {
      dep1: "user123",
      dep2: "active",
    };

    mockAxios.request.mockResolvedValueOnce({ data: [] });

    manager["fetchOptions"]("test_field", "search_term");
    await vi.runAllTimersAsync();

    expect(mockAxios.request).toHaveBeenCalledWith({
      method: "GET",
      url: "/api/test/user123?filter=active&search=search_term",
      headers: {
        "Content-Type": "application/json",
      },
      signal: expect.any(AbortSignal),
    });
  });

  it("should not fetch if watched dependencies are not met", async () => {
    const manager = new RemoteOptionsManager(stateManager, resolver, runtime);

    resolver.resolveField.mockReturnValue({
      id: "test_field",
      name: "test_field",
      remoteOptions: {
        url: "/api/test",
        watch: ["dep1"],
      },
    });

    stateManager.state.values = {
      dep1: "", // empty dependency
    };

    manager["fetchOptions"]("test_field");
    await vi.runAllTimersAsync();

    expect(mockAxios.request).not.toHaveBeenCalled();
    expect(stateManager.state.view["test_field"].options).toEqual([]);
    expect(stateManager.state.view["test_field"].isLoading).toBe(false);
  });

  it("should successfully unwrap and map options from backend detail envelope", async () => {
    const manager = new RemoteOptionsManager(stateManager, resolver, runtime);

    resolver.resolveField.mockReturnValue({
      id: "company_id",
      name: "company_id",
      remoteOptions: {
        url: "/api/v1/sessions/user/companies/",
        mapping: {
          labelPath: "name",
          valuePath: "id",
          descriptionPath: "code",
        },
      },
    });

    mockAxios.request.mockResolvedValueOnce({
      status: 200,
      headers: { "content-type": "application/json" },
      data: {
        status: 200,
        message: "Request successful",
        detail: [
          {
            id: "iwPuFpauWjEzXNTLnjvRUxKOaJhPCcit",
            name: "System",
            code: "sys-001",
          },
        ],
      },
    });

    manager["fetchOptions"]("company_id");
    await vi.runAllTimersAsync();

    expect(stateManager.state.view["company_id"].options).toEqual([
      {
        label: "System",
        value: "iwPuFpauWjEzXNTLnjvRUxKOaJhPCcit",
        description: "sys-001",
        icon: undefined,
        meta: {
          id: "iwPuFpauWjEzXNTLnjvRUxKOaJhPCcit",
          name: "System",
          code: "sys-001",
        },
      },
    ]);
  });
});
