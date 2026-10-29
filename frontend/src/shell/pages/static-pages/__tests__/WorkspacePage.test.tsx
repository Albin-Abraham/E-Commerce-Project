import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@shared/testing/test-utils";
import WorkspacePage from "../WorkspacePage";
import SessionContextPicker from "@features/auth/components/SessionContextPicker";

vi.mock("@features/auth/services/auth-manager", () => ({
  authManager: {
    resetContext: vi.fn(),
    selectCompany: vi.fn(),
    selectBusinessUnit: vi.fn(),
    selectBranch: vi.fn(),
  },
}));

vi.mock("@features/auth/services/useSessionFlow", () => ({
  useSessionFlow: () => ({
    companies: [
      { id: "c1", name: "Zenith Corp", code: "ZEN" },
      { id: "c2", name: "Apex Ltd", code: "APX" },
    ],
    isLoading: false,
    isAuthenticated: true,
    reset: vi.fn(),
  }),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>(
    "react-router-dom"
  );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("WorkspacePage & SessionContextPicker", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with theme background and layout classes", async () => {
    const { container } = renderWithProviders(<WorkspacePage />);

    const workspacePage = container.querySelector("#workspace-page");
    expect(workspacePage).toBeInTheDocument();
    expect(workspacePage?.className).toContain("bg-background");
    expect(workspacePage?.className).toContain("text-foreground");
    expect(workspacePage?.className).toContain("bg-architectural-grid");
  });

  it("renders the SessionContextPicker form card with semantic bg-surface and header", async () => {
    const { container } = renderWithProviders(<SessionContextPicker />);

    await waitFor(() => {
      const card = container.querySelector(".bg-surface");
      expect(card).toBeInTheDocument();
    });

    await waitFor(() => {
      const header = container.querySelector('[data-field-id="workspace-header"]');
      expect(header).toBeInTheDocument();
      expect(header?.innerHTML).toContain("bg-primary/10");
    });
  });
});
