import * as ReactRouterDom from "react-router-dom";

import { render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as LoadingHook from "@services/helpers/loading.hook";

import ProgressBar from "../ProgressBar";

// Mock usages
vi.mock("react-router-dom", () => ({
  useNavigation: vi.fn(),
}));

vi.mock("@services/helpers/loading.hook", () => ({
  useLoader: vi.fn(),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => {
  const mockComponent = (props: any) => (
    <div className={props.className} style={props.style} {...props}>
      {props.children}
    </div>
  );

  return {
    motion: new Proxy(
      {},
      {
        get: () => mockComponent,
      }
    ),
    m: new Proxy(
      {},
      {
        get: () => mockComponent,
      }
    ),
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

describe("ProgressBar", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when idle", () => {
    vi.mocked(ReactRouterDom.useNavigation).mockReturnValue({
      state: "idle",
    } as any);
    vi.mocked(LoadingHook.useLoader).mockReturnValue({
      isLoading: false,
    } as any);

    const { container } = render(<ProgressBar />);
    expect(container.firstChild).toBeNull();
  });

  it("should render when router is loading", async () => {
    vi.mocked(ReactRouterDom.useNavigation).mockReturnValue({
      state: "loading",
    } as any);
    vi.mocked(LoadingHook.useLoader).mockReturnValue({
      isLoading: false,
    } as any);

    const { container } = render(<ProgressBar />);
    await waitFor(() => {
      expect(container.querySelector(".fixed")).not.toBeNull();
    });
  });

  it("should render when global loader is loading", async () => {
    vi.mocked(ReactRouterDom.useNavigation).mockReturnValue({
      state: "idle",
    } as any);
    vi.mocked(LoadingHook.useLoader).mockReturnValue({
      isLoading: true,
    } as any);

    const { container } = render(<ProgressBar />);
    await waitFor(() => {
      expect(container.querySelector(".fixed")).not.toBeNull();
    });
  });

  it("should not render when idle after loading completes", async () => {
    vi.mocked(ReactRouterDom.useNavigation).mockReturnValue({
      state: "idle",
    } as any);
    vi.mocked(LoadingHook.useLoader).mockReturnValue({
      isLoading: false,
    } as any);

    const { container } = render(<ProgressBar />);

    // Should not be visible when idle
    expect(container.firstChild).toBeNull();
  });
});
