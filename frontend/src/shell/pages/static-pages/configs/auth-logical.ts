import type {
  ContentDefinition,
  EntityDefinition,
} from "@ui/form/types/application";
import type { BehaviorDefinition } from "@ui/form/types/behavior";

import { AuthValidationRules } from "../validations/auth-rules";
import { buildAuthPresentation, buildAuthSurface } from "./auth-surface";
import type { AuthModeToggleProps } from "./auth-types";

/*
 * Auth Logical MDAP Entities — Server-Side Contract
 *
 * Defines WHAT fields exist, their names (server payload keys),
 * their types, and their validation rules.
 */

export interface AuthFormData extends Record<string, any> {
  username: string;
  password: string;
}

export interface SignupFormData extends Record<string, any> {
  name: string;
  username: string;
  password: string;
  confirm_password: string;
}

export type AuthTranslator = (key: string, options?: any) => string;

// ── LAYER 1: UI FIELD TOKENS (Shared) ────────────────────────────────────────

const getSharedFieldUI = (t?: AuthTranslator) => ({
  name: {
    layout: { columnSpan: { base: 12, sm: 6 } },
    properties: {
      placeholder: t ? t("common.namePlaceholder") : "Enter your full name",
      labelPlacement: "outside",
      reserveErrorSpace: true,
    },
    meta: { ui: { icon: "user", classNames: {} } },
  },
  username: (mode: "login" | "signup") => ({
    layout: { columnSpan: mode === "login" ? 12 : { base: 12, sm: 6 } },
    properties: {
      placeholder: t ? t("common.emailPlaceholder") : "Enter your email address",
      labelPlacement: "outside",
      reserveErrorSpace: true,
    },
    // component override lives in meta.ui — decoupled from the domain type
    meta: {
      ui: {
        component: "email",
        icon: "mail",
        classNames: {
          base: "mb-0.5",
        },
      },
    },
  }),
  password: (mode: "login" | "signup") => ({
    layout: { columnSpan: mode === "login" ? 12 : { base: 12, sm: 6 } },
    properties: {
      placeholder: t ? t("common.passwordPlaceholder") : "Enter your password",
      labelPlacement: "outside",
      reserveErrorSpace: true,
    },
    meta: {
      ui: {
        icon: "lock",
        classNames: {
          base: "mb-0.5",
        },
      },
    },
  }),
  confirm_password: {
    layout: { columnSpan: { base: 12, sm: 6 } },
    properties: {
      placeholder: t ? t("common.confirmPasswordPlaceholder") : "Confirm your password",
      labelPlacement: "outside",
      reserveErrorSpace: true,
    },
    meta: { ui: { icon: "lock", classNames: {} } },
  },
});

// ── Login MDAP Entity ───────────────────────────────────────────────────────

const buildLoginContent = (t?: AuthTranslator): ContentDefinition<AuthFormData> => {
  const sharedUI = getSharedFieldUI(t);
  const currentYear = new Date().getFullYear();
  const footerCopyright = t
    ? t("common.footer", { year: currentYear })
    : `© ${currentYear} ZenOS Platform. All Rights Reserved`;
  const termsLabel = t ? t("common.terms") : "Terms";
  const privacyLabel = t ? t("common.privacy") : "Privacy";

  return {
    id: "auth-login-content",
    title: "",
    sections: [
      {
        id: "login-fields",
        title: "",
        fields: [
          {
            id: "header",
            type: "header",
            layout: { columnSpan: 12 },
            label: t ? t("login.header") : "Welcome to ZenOS",
            description: t ? t("login.subtitle") : "Sign in to your account to continue.",
            className: "mb-1 sm:mb-1.5",
            properties: { alignment: "center" },
            meta: { ui: { variant: "h2" } },
          },
          {
            id: "username",
            name: "username",
            type: "text",
            label: t ? t("login.email") : "Email Address",
            required: true,
            aliases: ["login", "email", "user"],
            ...sharedUI.username("login"),
            validation: AuthValidationRules.validations.username,
            onChange: AuthValidationRules.events.username.onChange,
          },
          {
            id: "password",
            name: "password",
            type: "password",
            label: t ? t("login.password") : "Password",
            required: true,
            validation: AuthValidationRules.validations.password,
            ...sharedUI.password("login"),
          },
          {
            id: "submit-btn",
            type: "button",
            label: t ? t("login.submit") : "Sign In",
            layout: { columnSpan: 12 },
            properties: { submit: true },
            meta: {
              ui: {
                classNames: {
                  base: "mt-4 inline-flex items-center justify-center font-bold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none w-full py-2 sm:py-2.5 text-sm rounded-xl bg-gradient-to-r from-primary to-primary/90 shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 hover:scale-[1.01] active:scale-[0.99] text-primary-foreground",
                },
              },
            },
          },
          {
            id: "auth-divider",
            type: "divider",
            layout: { columnSpan: 12 },
            label: t ? t("common.divider") : "Or continue with",
            meta: {
              ui: {
                classNames: {
                  base: "my-1 text-foreground/60 font-semibold text-xs tracking-wider uppercase",
                },
              },
            },
          },
          {
            id: "auth-social",
            type: "social",
            layout: { columnSpan: 12 },
            label: t ? t("common.socialAuth") : "Social Authentication",
            meta: { ui: { classNames: {} } },
          },
          {
            id: "auth-footer",
            type: "html",
            layout: { columnSpan: 12 },
            label: "",
            initialValue:
              `<div class="text-center text-xs font-semibold text-foreground/60 mt-1.5 space-x-1"><span>${footerCopyright}</span> • <a href="#" class="text-primary font-bold hover:underline">${termsLabel}</a> • <a href="#" class="text-primary font-bold hover:underline">${privacyLabel}</a></div>`,
          },
        ],
      },
    ],
  };
};

const LoginBehavior: BehaviorDefinition<AuthFormData> = {
  pipeline: {
    middleware: [
      (formData) => {
        if (formData.username)
          formData.username = formData.username.toLowerCase();
      },
    ],
  },
};

export const buildLoginEntity = (
  toggleProps: AuthModeToggleProps,
  t?: AuthTranslator
): EntityDefinition<AuthFormData> => ({
  id: "entity-auth-login",
  name: "Login Form",
  content: buildLoginContent(t),
  behavior: LoginBehavior,
  surface: buildAuthSurface("login", toggleProps, t),
  presentation: buildAuthPresentation(),
});

// ── Sign Up MDAP Entity ─────────────────────────────────────────────────────

const buildSignupContent = (t?: AuthTranslator): ContentDefinition<SignupFormData> => {
  const sharedUI = getSharedFieldUI(t);
  const currentYear = new Date().getFullYear();
  const footerCopyright = t
    ? t("common.footer", { year: currentYear })
    : `© ${currentYear} ZenOS Platform. All Rights Reserved`;
  const termsLabel = t ? t("common.terms") : "Terms";
  const privacyLabel = t ? t("common.privacy") : "Privacy";

  return {
    id: "auth-signup-content",
    title: "",
    sections: [
      {
        id: "signup-fields",
        title: "",
        fields: [
          {
            id: "header",
            type: "header",
            layout: { columnSpan: 12 },
            label: t ? t("register.header") : "Welcome to ZenOS",
            description: t ? t("register.subtitle") : "Create your account to get started.",
            className: "mb-1 sm:mb-1.5",
            properties: { alignment: "center" },
            meta: { ui: { variant: "h2" } },
          },
          {
            id: "name",
            name: "name",
            type: "text",
            label: t ? t("register.name") : "Full Name",
            required: true,
            validation: AuthValidationRules.validations.name,
            ...sharedUI.name,
          },
          {
            id: "username",
            name: "username",
            type: "text",
            label: t ? t("register.email") : "Email Address",
            required: true,
            aliases: ["login", "email", "user"],
            ...sharedUI.username("signup"),
            validation: AuthValidationRules.validations.username,
            onChange: AuthValidationRules.events.username.onChange,
          },
          {
            id: "password",
            name: "password",
            type: "password",
            label: t ? t("register.password") : "Password",
            required: true,
            validation: AuthValidationRules.validations.password,
            ...sharedUI.password("signup"),
          },
          {
            id: "confirm_password",
            name: "confirm_password",
            type: "password",
            label: t ? t("common.confirmPassword") : "Confirm Password",
            required: true,
            aliases: ["confirmPassword"],
            validation: AuthValidationRules.validations.confirm_password,
            ...sharedUI.confirm_password,
          },
          {
            id: "submit-btn",
            type: "button",
            label: t ? t("register.submit") : "Create Account",
            layout: { columnSpan: 12 },
            properties: { submit: true },
            meta: {
              ui: {
                classNames: {
                  base: "mt-4 inline-flex items-center justify-center font-bold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none w-full py-2 sm:py-2.5 text-sm rounded-xl bg-gradient-to-r from-primary to-primary/90 shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 hover:scale-[1.01] active:scale-[0.99] text-primary-foreground",
                },
              },
            },
          },
          {
            id: "auth-divider",
            type: "divider",
            layout: { columnSpan: 12 },
            label: t ? t("common.divider") : "Or continue with",
            meta: {
              ui: {
                classNames: {
                  base: "my-1 text-foreground/60 font-semibold text-xs tracking-wider uppercase",
                },
              },
            },
          },
          {
            id: "auth-social",
            type: "social",
            layout: { columnSpan: 12 },
            label: t ? t("common.socialAuth") : "Social Authentication",
            meta: { ui: { classNames: {} } },
          },
          {
            id: "auth-footer",
            type: "html",
            layout: { columnSpan: 12 },
            label: "",
            initialValue:
              `<div class="text-center text-xs font-semibold text-foreground/60 mt-1.5 space-x-1"><span>${footerCopyright}</span> • <a href="#" class="text-primary font-bold hover:underline">${termsLabel}</a> • <a href="#" class="text-primary font-bold hover:underline">${privacyLabel}</a></div>`,
          },
        ],
      },
    ],
  };
};

const SignupBehavior: BehaviorDefinition<SignupFormData> = {
  pipeline: {
    middleware: [
      (formData) => {
        if (formData.username)
          formData.username = formData.username.toLowerCase();
      },
    ],
  },
};

export const buildSignupEntity = (
  toggleProps: AuthModeToggleProps,
  t?: AuthTranslator
): EntityDefinition<SignupFormData> => ({
  id: "entity-auth-signup",
  name: "Signup Form",
  content: buildSignupContent(t),
  behavior: SignupBehavior,
  surface: buildAuthSurface("signup", toggleProps, t),
  presentation: buildAuthPresentation(),
});
