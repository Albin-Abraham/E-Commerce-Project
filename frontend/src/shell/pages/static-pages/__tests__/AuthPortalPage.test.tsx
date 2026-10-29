import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@shared/testing/test-utils";

import { HttpError } from "@core/http";
import { AppPaths } from "@shell/paths";
import { useAuth } from "@hooks/auth/useAuth";
import { toastError } from "@shared/ui/Toast";

import AuthPortalPage from "../AuthPortalPage";

// Mock the useAuth hook
vi.mock("@hooks/auth/useAuth", () => ({
  useAuth: vi.fn(),
}));

// Mock Toast
vi.mock("@shared/ui/Toast", () => ({
  toastError: vi.fn(),
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

describe("AuthPortalPage", () => {
  const mockLogin = vi.fn();
  const mockRegister = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      login: mockLogin,
      register: mockRegister,
    });
  });

  const renderComponent = () => renderWithProviders(<AuthPortalPage />);

  it("renders the Login form by default", async () => {
    renderComponent();

    // Expect the login schema fields to be present
    expect(await screen.findByText(/Welcome to ZenOS/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Enter your email address/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Enter your password/i)
    ).toBeInTheDocument();

    // The Signup-specific fields should NOT be present
    expect(
      screen.queryByPlaceholderText(/Enter your full name/i)
    ).not.toBeInTheDocument();
  });

  it("toggles to the Signup form when 'Sign Up' is clicked", async () => {
    renderComponent();
    const user = userEvent.setup();

    // The toggle is rendered using the segmented control.
    const signUpToggle = screen.getByRole("radio", { name: /Sign Up/i });
    expect(signUpToggle).toBeInTheDocument();

    await user.click(signUpToggle);

    // Now Signup-specific fields should be present
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/Enter your full name/i)
      ).toBeInTheDocument();
    });

    // Confirm password field should also appear
    expect(
      screen.getByPlaceholderText(/Confirm your password/i)
    ).toBeInTheDocument();
  });

  it("calls login function on successful form submission in login mode and navigates to Root", async () => {
    renderComponent();
    const user = userEvent.setup();

    // Fill in the form
    await user.type(
      screen.getByPlaceholderText(/Enter your email address/i),
      "test@example.com"
    );
    await user.type(
      screen.getByPlaceholderText(/Enter your password/i),
      "password123"
    );

    // Click submit
    const submitBtn = screen.getByRole("button", {
      name: /Sign In/i,
    });
    await user.click(submitBtn);

    // Form submission triggers onSubmit
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "test@example.com",
          username: "test@example.com",
          password: "password123",
        })
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith(AppPaths.Root, { replace: true });
  });

  it("calls register function on successful form submission in signup mode and navigates to Root", async () => {
    renderComponent();
    const user = userEvent.setup();

    // Switch to Signup mode
    const signUpToggle = screen.getByRole("radio", { name: /Sign Up/i });
    await user.click(signUpToggle);

    // Wait for signup form to appear
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/Enter your full name/i)
      ).toBeInTheDocument();
    });

    // Fill in the signup form
    await user.type(
      screen.getByPlaceholderText(/Enter your full name/i),
      "Test User"
    );
    await user.type(
      screen.getByPlaceholderText(/Enter your email address/i),
      "test2@example.com"
    );
    await user.type(
      screen.getByPlaceholderText(/Enter your password/i),
      "password123"
    );
    await user.type(
      screen.getByPlaceholderText(/Confirm your password/i),
      "password123"
    );

    // Click submit
    const submitBtn = screen.getByRole("button", {
      name: /Create Account/i,
    });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test User",
          firstName: "Test",
          lastName: "User",
          email: "test2@example.com",
          username: "test2@example.com",
          password: "password123",
          confirmPassword: "password123",
        })
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith(AppPaths.Root, { replace: true });
  });

  it("handles 422 server validation errors and displays them inline", async () => {
    const error422 = new HttpError(
      "Unprocessable Entity",
      422,
      "Unprocessable Entity",
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          metadata: {
            field_errors: {
              email: ["No account found with this email address."],
            },
          },
        },
      }
    );

    mockLogin.mockRejectedValueOnce(error422);

    renderComponent();
    const user = userEvent.setup();

    await user.type(
      screen.getByPlaceholderText(/Enter your email address/i),
      "notfound@example.com"
    );
    await user.type(
      screen.getByPlaceholderText(/Enter your password/i),
      "password123"
    );

    const submitBtn = screen.getByRole("button", {
      name: /Sign In/i,
    });
    await user.click(submitBtn);

    // Assert that the error is rendered inline on the email field
    await waitFor(() => {
      expect(
        screen.getByText(/No account found with this email address/i)
      ).toBeInTheDocument();
    });

    // Should NOT navigate
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("handles 400 Bad Request server validation errors and displays them inline", async () => {
    const error400 = new HttpError(
      "Bad Request",
      400,
      "Bad Request",
      {
        success: false,
        message: "Validation failed",
        details: {
          errors: {
            email: ["Email is not registered in our database."],
          },
        },
      }
    );

    mockLogin.mockRejectedValueOnce(error400);

    renderComponent();
    const user = userEvent.setup();

    await user.type(
      screen.getByPlaceholderText(/Enter your email address/i),
      "bad@example.com"
    );
    await user.type(
      screen.getByPlaceholderText(/Enter your password/i),
      "password123"
    );

    const submitBtn = screen.getByRole("button", {
      name: /Sign In/i,
    });
    await user.click(submitBtn);

    // Assert that the error is rendered inline on the email field
    await waitFor(() => {
      expect(
        screen.getByText(/Email is not registered in our database/i)
      ).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("handles non-field server errors by displaying toast and marking the field", async () => {
    const errorAuth = new HttpError(
      "Unauthorized",
      400,
      "Bad Request",
      {
        error: {
          code: "INVALID_CREDENTIALS",
          message: "Invalid credentials",
          metadata: {
            non_field_errors: ["Invalid email or password combination."],
          },
        },
      }
    );

    mockLogin.mockRejectedValueOnce(errorAuth);

    renderComponent();
    const user = userEvent.setup();

    await user.type(
      screen.getByPlaceholderText(/Enter your email address/i),
      "user@example.com"
    );
    await user.type(
      screen.getByPlaceholderText(/Enter your password/i),
      "wrongpassword"
    );

    const submitBtn = screen.getByRole("button", {
      name: /Sign In/i,
    });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(toastError).toHaveBeenCalledWith(
        "Login failed",
        "Invalid email or password combination."
      );
      expect(
        screen.getByText(/Invalid email or password combination/i)
      ).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
