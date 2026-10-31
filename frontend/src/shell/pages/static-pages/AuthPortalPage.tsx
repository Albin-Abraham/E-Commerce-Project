import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { ApiErrorParser } from "@core/http";
import { Form } from "@ui/form/Form";
import { toastError, toastSuccess } from "@shared/ui/Toast";
import { useAuth } from "@shared/hooks/auth/useAuth";

import {
  buildLoginSchema,
  buildSignupSchema,
  buildForgotPasswordSchema,
} from "./configs/auth-schema";
import type { AuthModeToggleProps } from "./configs/auth-types";
import { useAuthPersona } from "./hooks/useAuthPersona";
import { useAuthNavigation } from "./hooks/useAuthNavigation";
import { AuthPortalHeader } from "./components/auth-portal/AuthPortalHeader";
import { PersonaSelectionView } from "./components/auth-portal/PersonaSelectionView";
import { AuthPortalFooter } from "./components/auth-portal/AuthPortalFooter";

/**
 * AuthPortalPage — Unified Multi-Persona Authentication Portal
 *
 * 2-Level Routing Architecture:
 * - Level 1: /login (no mode param) -> PersonaSelectionView (NO auth form rendered!)
 * - Level 2: /login?mode=customer|partner|staff -> Dedicated 50:50 Auth Surface
 *
 * Powered by ZenOS Clean Architecture:
 * - Backed by PlatformUrlPort & PlatformUrlAdapters (UrlSyncPlatform)
 * - Push history on deliberate persona selection (replace: false)
 * - Replace history on automatic redirects & normalization (replace: true)
 */
const AuthPortalPage: React.FC = () => {
  const { t } = useTranslation("screens/auth");
  const { login, register, registerVendor, forgotPassword } = useAuth();

  // 1. Synchronize Persona with UrlSyncPlatform
  const {
    persona,
    config,
    isPersonaSelection,
    selectPersona,
    clearPersona,
    urlPort,
  } = useAuthPersona();

  // 2. Manage Mode Navigation & Security Redirections
  const { mode, handleModeChange, navigatePostAuth, navigateGuestStorefront } =
    useAuthNavigation({ persona, urlPort });

  const [isSwapping, setIsSwapping] = useState(false);

  // Unconditional toggle props for form schema compiler
  const toggleProps: AuthModeToggleProps = {
    mode,
    persona: persona || "customer",
    isSwapping,
    onModeChange: (newMode) => {
      handleModeChange(newMode);
    },
    onPersonaChange: (newPersona) => {
      if (newPersona === persona) return;
      setIsSwapping(true);
      selectPersona(newPersona);
      setTimeout(() => {
        setIsSwapping(false);
      }, 200);
    },
    onGuestBypass: navigateGuestStorefront,
  };

  // Compile schema unconditionally so hook counts remain invariant
  const schema = React.useMemo(() => {
    if (!persona) return null;
    if (mode === "login") return buildLoginSchema(toggleProps, t);
    if (mode === "signup") return buildSignupSchema(toggleProps, t);
    return buildForgotPasswordSchema(toggleProps, t);
  }, [mode, persona, t, isSwapping]);

  // ── LEVEL 1: Persona Selection Page (/login) ──────────────────────────────
  // When no persona is selected, render ONLY the Persona Selection Screen!
  if (isPersonaSelection || !persona || !config || !schema) {
    return (
      <PersonaSelectionView
        onSelectPersona={selectPersona}
        onGuestBypass={navigateGuestStorefront}
      />
    );
  }

  // ── LEVEL 2: Persona Authentication Page (/login?mode=customer|partner|staff)
  const badgeTheme = {
    customer: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
    partner: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    staff: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
  }[persona];

  return (
    <div className="min-h-screen flex flex-col p-3 sm:p-6 bg-background text-foreground bg-architectural-grid overflow-y-auto overflow-x-hidden">
      {/* 1. Minimal Enterprise Brand Header */}
      <AuthPortalHeader />

      {/* 2. Level 2 Back to Portal Selection Navigation Bar */}
      <div className="w-full max-w-6xl mx-auto mb-3 sm:mb-4 flex items-center justify-between px-1">
        <button
          type="button"
          onClick={clearPersona}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg px-2 py-1"
        >
          <span aria-hidden="true" className="transition-transform group-hover:-translate-x-1">
            ←
          </span>
          <span>Back to Portal Selection</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Active Portal:
          </span>
          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${badgeTheme}`}>
            {config.icon} {config.title}
          </span>
        </div>
      </div>

      {/* 3. Professional 50:50 Authentication Surface */}
      <main className="w-full flex justify-center my-auto">
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
                navigatePostAuth();
              } else if (mode === "signup") {
                if (persona === "partner") {
                  // Dedicated Vendor Self-Service Registration
                  const partnerPayload = {
                    company_name: data.company_name || data.name,
                    representative_name: data.name,
                    name: data.name,
                    email: data.email || data.username,
                    username:
                      data.username || (data.email ? data.email.split("@")[0] : ""),
                    tax_id: data.tax_id,
                    phone: data.phone,
                    category: data.category || "DISTRIBUTOR",
                    password: data.password,
                    confirm_password: data.confirm_password,
                  };
                  if (registerVendor) {
                    await registerVendor(partnerPayload);
                  } else {
                    await register(partnerPayload as any);
                  }
                  toastSuccess(
                    "Vendor Application Submitted",
                    "Your business account has been initialized and submitted for compliance verification."
                  );
                  navigatePostAuth();
                } else {
                  // Standard Customer Registration
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
                    confirmPassword: data.confirm_password || data.confirmPassword,
                    confirm_password: data.confirm_password,
                  };
                  await register(registerPayload as any);
                  navigatePostAuth();
                }
              } else if (mode === "forgot-password") {
                const email = data.email || data.username;
                await forgotPassword(email);
                toastSuccess(
                  "Password Reset Dispatched",
                  "If an account exists for this email, recovery instructions have been sent."
                );
                handleModeChange("login");
              }
            } catch (err) {
              const apiError = ApiErrorParser.from(err);
              const fieldErrors: Record<string, string> = {};

              const nonFieldMessages: string[] = [
                ...(apiError.nonFieldErrors || []),
              ];

              if (apiError.fieldErrors && Object.keys(apiError.fieldErrors).length > 0) {
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

              if (Object.keys(fieldErrors).length > 0) {
                return fieldErrors;
              }

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
      </main>

      {/* 4. Minimal Enterprise Footer */}
      <AuthPortalFooter />
    </div>
  );
};

export default AuthPortalPage;
