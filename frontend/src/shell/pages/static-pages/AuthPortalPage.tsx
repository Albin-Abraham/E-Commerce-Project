import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useLocation } from "react-router-dom";

import { ApiErrorParser } from "@core/http";
import { AppPaths } from "@shell/paths";
import { Form } from "@ui/form/Form";

import { toastError, toastSuccess } from "@shared/ui/Toast";

import { useAuth } from "@shared/hooks/auth/useAuth";

import {
  buildLoginSchema,
  buildSignupSchema,
  buildForgotPasswordSchema,
} from "./configs/auth-schema";
import type { AuthMode, AuthModeToggleProps } from "./configs/auth-types";

/**
 * AuthPortalPage — Flagship Login, Register & Forgot Password Showcase
 *
 * Uses the ZenOS Form Architecture and MDAP Entity compilation for all
 * identity flows. Zero ad-hoc form HTML or unmanaged state.
 */
const AuthPortalPage: React.FC = () => {
  const { t } = useTranslation("screens/auth");
  const { login, register, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getInitialMode = (pathname: string): AuthMode => {
    if (pathname === AppPaths.Register) return "signup";
    if (pathname === AppPaths.ForgotPassword) return "forgot-password";
    return "login";
  };

  const [mode, setMode] = useState<AuthMode>(() => getInitialMode(location.pathname));
  const [isSwapping, setIsSwapping] = useState(false);

  useEffect(() => {
    const targetMode = getInitialMode(location.pathname);
    if (targetMode !== mode) {
      setMode(targetMode);
    }
  }, [location.pathname]);

  const toggleProps: AuthModeToggleProps = {
    mode,
    isSwapping,
    onModeChange: (newMode) => {
      setIsSwapping(true);
      setTimeout(() => {
        setMode(newMode);
        setIsSwapping(false);
        if (newMode === "login" && location.pathname !== AppPaths.Login) {
          navigate(AppPaths.Login, { replace: true });
        } else if (newMode === "signup" && location.pathname !== AppPaths.Register) {
          navigate(AppPaths.Register, { replace: true });
        } else if (newMode === "forgot-password" && location.pathname !== AppPaths.ForgotPassword) {
          navigate(AppPaths.ForgotPassword, { replace: true });
        }
      }, 400); // Allow skeleton to mount and mask the form swap
    },
  };

  const schema = React.useMemo(() => {
    if (mode === "login") return buildLoginSchema(toggleProps, t);
    if (mode === "signup") return buildSignupSchema(toggleProps, t);
    return buildForgotPasswordSchema(toggleProps, t);
  }, [mode, t]);

  return (
    <div className="min-h-screen flex flex-col p-3 sm:p-4 bg-background text-foreground bg-architectural-grid overflow-y-auto overflow-x-hidden">
      {/* m-auto centers vertically and horizontally without clipping the top when viewport is too small */}
      <div className="m-auto w-full flex justify-center">
        {/* Form Engine — receives clean, server-ready schema */}
        <Form<any>
          definition={schema as any}
          onSubmit={async (data) => {
            try {
              if (mode === "login") {
                const credentials = {
                  ...data,
                  email: data.email || data.username,
                  username: data.username || data.email,
                  password: data.password,
                  rememberMe: data.rememberMe,
                };
                await login(credentials as any);
                navigate(AppPaths.Root, { replace: true });
              } else if (mode === "signup") {
                const nameParts = (data.name || "").trim().split(/\s+/);
                const firstName = nameParts[0] || "";
                const lastName = nameParts.slice(1).join(" ") || "";
                const registerPayload = {
                  ...data,
                  name: data.name,
                  firstName,
                  lastName,
                  email: data.email || data.username,
                  username: data.username || data.email,
                  password: data.password,
                  confirmPassword:
                    data.confirm_password || data.confirmPassword,
                  confirm_password: data.confirm_password,
                };
                await register(registerPayload as any);
                navigate(AppPaths.Root, { replace: true });
              } else if (mode === "forgot-password") {
                const email = data.email || data.username;
                await forgotPassword(email);
                toastSuccess(
                  "Password Reset Dispatched",
                  "If an account exists for this email, recovery instructions have been sent."
                );
                navigate(AppPaths.Login);
              }
            } catch (err) {
              const apiError = ApiErrorParser.from(err);
              const fieldErrors: Record<string, string> = {};

              // Accumulate non-field messages from both nonFieldErrors and any aliases in fieldErrors
              const nonFieldMessages: string[] = [
                ...(apiError.nonFieldErrors || []),
              ];

              // 1. Extract field errors with bidirectional email/username mapping
              if (
                apiError.fieldErrors &&
                Object.keys(apiError.fieldErrors).length > 0
              ) {
                for (const [key, val] of Object.entries(apiError.fieldErrors)) {
                  const messages = Array.isArray(val) ? val : [String(val)];
                  const firstMsg = messages.join(", ");
                  if (
                    key === "non_field_errors" ||
                    key === "nonFieldErrors" ||
                    key === "detail" ||
                    key === "details"
                  ) {
                    nonFieldMessages.push(...messages);
                  } else {
                    fieldErrors[key] = firstMsg;
                    if (key === "email") fieldErrors["username"] = firstMsg;
                    if (key === "username") fieldErrors["email"] = firstMsg;
                  }
                }
              }

              // 2. Extract non-field errors (e.g. invalid credentials)
              if (nonFieldMessages.length > 0) {
                const message = nonFieldMessages.join(", ");
                toastError(
                  mode === "login" ? "Login failed" : "Registration failed",
                  message
                );
                fieldErrors["username"] = message;
                fieldErrors["email"] = message;
                return fieldErrors;
              }

              // 3. If field errors exist, return them for inline display
              if (Object.keys(fieldErrors).length > 0) {
                return fieldErrors;
              }

              // 4. All other errors: toast and mark credential field
              const displayMsg =
                apiError.getDisplayMessage() ||
                "Authentication failed. Please check your credentials.";
              toastError(
                mode === "login" ? "Login failed" : "Registration failed",
                displayMsg
              );
              return { username: displayMsg, email: displayMsg };
            }
          }}
        />
      </div>
    </div>
  );
};

export default AuthPortalPage;
