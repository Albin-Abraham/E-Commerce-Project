import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { ApiErrorParser } from "@core/http";
import { AppPaths } from "@shell/paths";
import { Form } from "@ui/form/Form";

import { toastError } from "@shared/ui/Toast";

import { useAuth } from "@hooks/auth/useAuth";

import { buildLoginSchema, buildSignupSchema } from "./configs/auth-schema";
import type { AuthMode, AuthModeToggleProps } from "./configs/auth-types";

/**
 * AuthPortalPage — Flagship Login Showcase
 *
 * This component owns the V4 (View State): the `mode` toggle between
 * Sign In and Sign Up. It swaps a lean, server-clean Form schema based
 * on mode — zero UI-control variables leak into the form payload.
 *
 * All form chrome (mode toggle, header, divider, social buttons, footer
 * links, split brand panel, submit button) is schema-driven via fuseSchema.
 * The toggle is a typed `segmented` content primitive (radio semantics) in
 * the split container's `topContent`; the page only supplies its state routing.
 */
const AuthPortalPage: React.FC = () => {
  const { t } = useTranslation("screens/auth");
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>("login");
  const [isSwapping, setIsSwapping] = useState(false);

  const toggleProps: AuthModeToggleProps = {
    mode,
    isSwapping,
    onModeChange: (newMode) => {
      setIsSwapping(true);
      setTimeout(() => {
        setMode(newMode);
        setIsSwapping(false);
      }, 400); // Allow skeleton to mount and mask the form swap
    },
  };

  const schema = React.useMemo(
    () =>
      mode === "login"
        ? buildLoginSchema(toggleProps, t)
        : buildSignupSchema(toggleProps, t),
    [mode, t]
  ); // toggleProps is derived from mode and setMode (which is stable)

  return (
    <div className="min-h-screen flex flex-col p-3 sm:p-4 bg-background text-foreground bg-architectural-grid overflow-y-auto overflow-x-hidden">
      {/* m-auto centers vertically and horizontally without clipping the top when viewport is too small */}
      <div className="m-auto w-full flex justify-center">
        {/* Form Engine — receives clean, server-ready schema. The Sign In /
            Sign Up toggle is embedded on the card via the schema's topContent. */}
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
              } else {
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
              }
              navigate(AppPaths.Root, { replace: true });
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
