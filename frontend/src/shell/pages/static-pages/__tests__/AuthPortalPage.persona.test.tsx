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

// Mock useNavigate
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

describe("AuthPortalPage 2-Level Multi-Persona Architecture", () => {
  const mockLogin = vi.fn();
  const mockRegister = vi.fn();
  const mockRegisterVendor = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      login: mockLogin,
      register: mockRegister,
      registerVendor: mockRegisterVendor,
      forgotPassword: vi.fn(),
    });
  });

  // ── LEVEL 1: Persona Selection Page (/login) ──────────────────────────────
  describe("Level 1: Persona Selection (/login)", () => {
    it("renders ONLY the Choose Your Portal cards and NO authentication form on /login", async () => {
      renderWithProviders(<AuthPortalPage />, { route: "/login" });

      // Title & Subtitle
      expect(await screen.findByText(/Choose Your Portal/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Select your organization role or account type/i)
      ).toBeInTheDocument();

      // 3 Persona Selection Cards (Headings)
      expect(
        screen.getByRole("heading", { name: /Customer Portal/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /Partner & Vendor/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /Staff Terminal/i })
      ).toBeInTheDocument();

      // Action Buttons
      expect(
        screen.getByRole("button", { name: /Continue to Customer Portal/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Continue to Partner & Vendor/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Continue to Staff Terminal/i })
      ).toBeInTheDocument();

      // Guest Storefront Bypass
      expect(screen.getByText(/Browsing as a Guest\?/i)).toBeInTheDocument();
      const guestLink = screen.getByRole("link", { name: /Continue Shopping/i });
      expect(guestLink).toHaveAttribute("href", "/");

      // CRITICAL CONTRACT: NO login form or credentials on /login
      expect(screen.queryByPlaceholderText(/Enter your email address/i)).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText(/Enter your password/i)).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /^Sign In$/i })).not.toBeInTheDocument();
    });
  });

  // ── LEVEL 2: Persona Authentication (/login?mode=...) ──────────────────────
  describe("Level 2: Persona Authentication", () => {
    it("renders Customer Authentication and Back link when ?mode=customer is passed", async () => {
      renderWithProviders(<AuthPortalPage />, { route: "/login?mode=customer" });

      // Back to Portal Selection
      expect(
        await screen.findByRole("button", { name: /Back to Portal Selection/i })
      ).toBeInTheDocument();

      // Form Header & Inputs
      expect(screen.getByText(/Welcome/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Enter your email address/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Enter your password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Sign In/i })).toBeInTheDocument();
    });

    it("renders Staff Enterprise Terminal when ?mode=staff is passed", async () => {
      renderWithProviders(<AuthPortalPage />, { route: "/login?mode=staff" });

      expect(await screen.findByText(/ZenOS Enterprise Terminal/i)).toBeInTheDocument();
      expect(screen.getByText(/Restricted Corporate Gateway/i)).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText(/Enter corporate email or employee ID/i)
      ).toBeInTheDocument();

      // Sign Up tab MUST be locked out for Staff
      expect(screen.queryByRole("radio", { name: /Sign Up/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("radio", { name: /Vendor Onboarding/i })).not.toBeInTheDocument();
    });

    it("navigates to /workspace on successful Staff login", async () => {
      renderWithProviders(<AuthPortalPage />, { route: "/login?mode=staff" });
      const user = userEvent.setup();

      await user.type(
        await screen.findByPlaceholderText(/Enter corporate email or employee ID/i),
        "staff@zenos.corp"
      );
      await user.type(
        screen.getByPlaceholderText(/Enter enterprise credentials/i),
        "EnterpriseSecret123!"
      );

      const submitBtn = screen.getByRole("button", { name: /Authorize & Sign In/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith(
          expect.objectContaining({
            username: "staff@zenos.corp",
            password: "EnterpriseSecret123!",
          })
        );
        expect(mockNavigate).toHaveBeenCalledWith(AppPaths.Workspace, { replace: true });
      });
    });

    it("renders Partner Portal when ?mode=partner is passed and supports vendor onboarding", async () => {
      renderWithProviders(<AuthPortalPage />, { route: "/login?mode=partner" });
      const user = userEvent.setup();

      expect(await screen.findByText(/Partner & Vendor Portal/i)).toBeInTheDocument();
      expect(screen.getByText(/Supplier & Vendor Hub/i)).toBeInTheDocument();

      // Toggle to Vendor Onboarding
      const onboardingTab = screen.getByRole("radio", { name: /Vendor Onboarding/i });
      expect(onboardingTab).toBeInTheDocument();

      await user.click(onboardingTab);

      // Vendor Onboarding fields should appear
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/e\.g\. Acme Components Ltd/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/e\.g\. Marcus Vance/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/e\.g\. VAT-8829104/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/procurement@company\.com/i)).toBeInTheDocument();
      });
    });

    it("submits partner registration to registerVendor in partner onboarding mode", async () => {
      renderWithProviders(<AuthPortalPage />, { route: "/register?mode=partner" });
      const user = userEvent.setup();

      await user.type(
        await screen.findByPlaceholderText(/e\.g\. Acme Components Ltd/i),
        "Apex Supply Chain Inc"
      );
      await user.type(
        screen.getByPlaceholderText(/e\.g\. Marcus Vance/i),
        "Kenji Sato"
      );
      await user.type(
        screen.getByPlaceholderText(/e\.g\. VAT-8829104/i),
        "JP-TAX-998811"
      );
      await user.type(
        screen.getByPlaceholderText(/procurement@company\.com/i),
        "partner@apexsupply.com"
      );
      await user.type(
        screen.getByPlaceholderText(/Create strong password/i),
        "PartnerPassword123!"
      );
      await user.type(
        screen.getByPlaceholderText(/Confirm your password/i),
        "PartnerPassword123!"
      );

      const submitBtn = screen.getByRole("button", { name: /Complete Vendor Registration/i });
      await user.click(submitBtn);

      await waitFor(() => {
        expect(mockRegisterVendor).toHaveBeenCalledWith(
          expect.objectContaining({
            company_name: "Apex Supply Chain Inc",
            representative_name: "Kenji Sato",
            tax_id: "JP-TAX-998811",
            email: "partner@apexsupply.com",
            password: "PartnerPassword123!",
          })
        );
      });
    });
  });
});
