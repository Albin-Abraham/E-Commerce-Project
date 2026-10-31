import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@shared/testing/test-utils";
import { AppPaths } from "@shell/paths";
import { useAuth } from "@hooks/auth/useAuth";

import AuthPortalPage from "../AuthPortalPage";

// Mock the useAuth hook
vi.mock("@hooks/auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

// Mock Toast
vi.mock("@shared/ui/Toast", () => ({
  toastError: vi.fn(),
  toastSuccess: vi.fn(),
}));

// Mock useNavigate to track routing calls
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

describe("AuthPortalPage Routing & UrlSyncPlatform Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      login: vi.fn(),
      register: vi.fn(),
      registerVendor: vi.fn(),
      forgotPassword: vi.fn(),
    });
  });

  it("renders Level 1 Persona Selection Screen on /login when no mode parameter is present", async () => {
    renderWithProviders(<AuthPortalPage />, { route: "/login" });

    expect(await screen.findByText(/Choose Your Portal/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continue to Customer Portal/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continue to Partner & Vendor/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continue to Staff Terminal/i })).toBeInTheDocument();

    // No form inputs on Level 1
    expect(screen.queryByPlaceholderText(/Enter your email address/i)).not.toBeInTheDocument();
  });

  it("navigates from Level 1 to Level 2 Customer when clicking Continue to Customer Portal", async () => {
    renderWithProviders(<AuthPortalPage />, { route: "/login" });
    const user = userEvent.setup();

    const customerBtn = await screen.findByRole("button", { name: /Continue to Customer Portal/i });
    await user.click(customerBtn);

    // Level 2 should now render with Back button and login form
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Back to Portal Selection/i })).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Enter your email address/i)).toBeInTheDocument();
    });
  });

  it("navigates back from Level 2 to Level 1 when clicking Back to Portal Selection", async () => {
    renderWithProviders(<AuthPortalPage />, { route: "/login?mode=customer" });
    const user = userEvent.setup();

    const backBtn = await screen.findByRole("button", { name: /Back to Portal Selection/i });
    await user.click(backBtn);

    // Should return to Level 1
    await waitFor(() => {
      expect(screen.getByText(/Choose Your Portal/i)).toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/Enter your email address/i)).not.toBeInTheDocument();
    });
  });

  it("deep-links directly to Partner portal from URL query parameter ?mode=partner", async () => {
    renderWithProviders(<AuthPortalPage />, { route: "/login?mode=partner" });

    expect(await screen.findByText(/Partner & Vendor Portal/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Back to Portal Selection/i })).toBeInTheDocument();
  });

  it("deep-links directly to Staff terminal from URL query parameter ?mode=staff", async () => {
    renderWithProviders(<AuthPortalPage />, { route: "/login?mode=staff" });

    expect(await screen.findByText(/ZenOS Enterprise Terminal/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Back to Portal Selection/i })).toBeInTheDocument();
  });

  it("enforces staff registration lockout by redirecting to /login?mode=staff", async () => {
    renderWithProviders(<AuthPortalPage />, { route: "/register?mode=staff" });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(`${AppPaths.Login}?mode=staff`, {
        replace: true,
      });
    });
  });
});
