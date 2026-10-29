import React from "react";
import { MemoryRouter } from "react-router-dom";

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  usePlatformNavigation,
  usePlatformUrlParams,
} from "./usePlatformNavigation";

// Mock useNavigation to avoid "Data Router" requirement in MemoryRouter
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigation: vi.fn(() => ({ state: "idle", location: null })),
  };
});

// Wrapper for router context
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter initialEntries={["/test-path"]}>{children}</MemoryRouter>
);

describe("usePlatformNavigation", () => {
  it("provides navigation helpers", () => {
    const { result } = renderHook(() => usePlatformNavigation(), { wrapper });

    expect(result.current.goTo).toBeDefined();
    expect(result.current.isActive).toBeDefined();
    expect(result.current.goHome).toBeDefined();
  });

  it("isActive returns true for current path", () => {
    const { result } = renderHook(() => usePlatformNavigation(), { wrapper });
    expect(result.current.isActive("/test-path")).toBe(true);
  });
});

describe("usePlatformUrlParams", () => {
  it("returns empty search if no param exists", () => {
    const { result } = renderHook(
      () => usePlatformUrlParams({ isGlobal: true }),
      { wrapper }
    );
    expect(result.current.search).toBe("");
  });

  it("detects scope based on pathname by default", () => {
    const { result } = renderHook(() => usePlatformUrlParams(), { wrapper });
    expect(result.current.scope).toBe("test-path");
  });

  it("uses manual scope if provided", () => {
    const { result } = renderHook(
      () => usePlatformUrlParams({ scope: "manual" }),
      { wrapper }
    );
    expect(result.current.scope).toBe("manual");
  });

  it("sets and gets search params", async () => {
    const { result } = renderHook(
      () => usePlatformUrlParams({ isGlobal: true }),
      { wrapper }
    );

    act(() => {
      result.current.setSearch("new-search", true); // immediate = true
    });

    expect(result.current.search).toBe("new-search");
  });

  it("exposes universal PlatformUrlPort and parsed query via qs", () => {
    const customWrapper = ({ children }: { children: React.ReactNode }) => (
      <MemoryRouter initialEntries={["/test-path?tab=billing&filter[status]=active&count=5"]}>
        {children}
      </MemoryRouter>
    );

    const { result } = renderHook(
      () => usePlatformUrlParams({ isGlobal: true }),
      { wrapper: customWrapper }
    );

    expect(result.current.port).toBeDefined();
    expect(result.current.port.get("tab")).toBe("billing");
    expect(result.current.parsed).toEqual({
      tab: "billing",
      filter: { status: "active" },
      count: 5,
    });
  });
});

