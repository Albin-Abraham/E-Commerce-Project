import type {
  ContentDefinition,
  EntityDefinition,
} from "@ui/form/types/application";
import type { BehaviorDefinition } from "@ui/form/types/behavior";

import { AuthValidationRules } from "../validations/auth-rules";
import { buildAuthPresentation, buildAuthSurface } from "./auth-surface";
import type { AuthModeToggleProps, AuthPersona } from "./auth-types";

/*
 * Auth Logical MDAP Entities — Server-Side Contract
 *
 * Defines WHAT fields exist, their names (server payload keys),
 * their types, and their validation rules across:
 * - Customer (B2C / B2B Retail)
 * - Partner (B2B Vendor / Supplier)
 * - Staff (Enterprise Internal)
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
  company_name?: string;
  tax_id?: string;
  category?: string;
  phone?: string;
}

export interface ForgotPasswordFormData extends Record<string, any> {
  username: string;
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

const getGuestLinkField = () => ({
  id: "guest-link",
  type: "html",
  layout: { columnSpan: 12 },
  label: "",
  initialValue:
    `<div class="flex items-center justify-between text-xs py-1 px-2.5 mb-2 bg-surface-raised/60 border border-border/40 rounded-xl"><span class="text-foreground/70">Browsing as a Guest?</span><a href="/" class="text-primary font-bold hover:underline inline-flex items-center gap-1">Continue to Storefront →</a></div>`,
});

// ── Login MDAP Entity ───────────────────────────────────────────────────────

const buildLoginContent = (
  t?: AuthTranslator,
  persona: AuthPersona = "customer"
): ContentDefinition<AuthFormData> => {
  const sharedUI = getSharedFieldUI(t);
  const guestLink = getGuestLinkField();
  const currentYear = new Date().getFullYear();
  const footerCopyright = t
    ? t("common.footer", { year: currentYear })
    : `© ${currentYear} ZenOS Platform. All Rights Reserved`;
  const termsLabel = t ? t("common.terms") : "Terms";
  const privacyLabel = t ? t("common.privacy") : "Privacy";

  if (persona === "staff") {
    return {
      id: "auth-login-content-staff",
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
              label: "ZenOS Enterprise Terminal",
              description: "Internal employee authentication & audited gateway.",
              className: "mb-1 sm:mb-1.5",
              properties: { alignment: "center" },
              meta: { ui: { variant: "h2" } },
            },
            {
              id: "staff-badge",
              type: "html",
              layout: { columnSpan: 12 },
              label: "",
              initialValue:
                `<div class="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-2.5 text-xs text-indigo-400 font-medium flex items-center gap-2 mb-2"><span>🛡️</span><span>Restricted Corporate Gateway • Enterprise Session Audit Active</span></div>`,
            },
            {
              id: "username",
              name: "username",
              type: "text",
              label: "Enterprise Email or Corporate ID",
              required: true,
              aliases: ["login", "email", "user"],
              layout: { columnSpan: 12 },
              properties: {
                placeholder: "Enter corporate email or employee ID",
                labelPlacement: "outside",
                reserveErrorSpace: true,
              },
              meta: { ui: { component: "email", icon: "shield", classNames: { base: "mb-0.5" } } },
              validation: AuthValidationRules.validations.username,
              onChange: AuthValidationRules.events.username.onChange,
            },
            {
              id: "password",
              name: "password",
              type: "password",
              label: "Master Password",
              required: true,
              layout: { columnSpan: 12 },
              properties: {
                placeholder: "Enter enterprise credentials",
                labelPlacement: "outside",
                reserveErrorSpace: true,
              },
              meta: { ui: { icon: "lock", classNames: { base: "mb-0.5" } } },
              validation: AuthValidationRules.validations.password,
            },
            {
              id: "forgot-password-link",
              type: "html",
              layout: { columnSpan: 12 },
              label: "",
              initialValue:
                `<div class="flex justify-end -mt-1 mb-1"><a href="/forgot-password" class="text-xs font-semibold text-indigo-400 hover:underline">Trouble signing in?</a></div>`,
            },
            {
              id: "submit-btn",
              type: "button",
              label: "Authorize & Sign In",
              layout: { columnSpan: 12 },
              properties: { submit: true },
              meta: {
                ui: {
                  classNames: {
                    base: "mt-4 inline-flex items-center justify-center font-bold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none w-full py-2.5 sm:py-3 text-sm rounded-xl bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-500/25 text-white cursor-pointer",
                  },
                },
              },
            },
            {
              id: "enterprise-sso",
              type: "html",
              layout: { columnSpan: 12 },
              label: "",
              initialValue:
                `<div class="mt-4 pt-3 border-t border-slate-800 text-center"><div class="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">Enterprise Directory Authentication</div><div class="grid grid-cols-2 gap-2 text-xs"><button type="button" class="py-2 px-2.5 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-900 text-white font-semibold flex items-center justify-center gap-1.5 shadow-2xs"><span class="text-indigo-400 font-black">okta</span><span>SAML 2.0</span></button><button type="button" class="py-2 px-2.5 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-900 text-white font-semibold flex items-center justify-center gap-1.5 shadow-2xs"><span class="text-blue-400 font-bold">Entra ID</span><span>(Azure)</span></button></div></div>`,
            },
            {
              id: "auth-footer",
              type: "html",
              layout: { columnSpan: 12 },
              label: "",
              initialValue:
                `<div class="text-center text-xs font-semibold text-foreground/60 mt-3">Authorized personnel only. Need access? <a href="#" class="text-indigo-400 font-bold hover:underline">Contact IT Helpdesk</a></div>`,
            },
          ],
        },
      ],
    };
  }

  if (persona === "partner") {
    return {
      id: "auth-login-content-partner",
      title: "",
      sections: [
        {
          id: "login-fields",
          title: "",
          fields: [
            guestLink,
            {
              id: "partner-badge",
              type: "html",
              layout: { columnSpan: 12 },
              label: "",
              initialValue:
                `<div class="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-between mb-2"><span>🤝 Business Account</span><span class="text-[10px] font-bold uppercase tracking-wider">Supplier & Vendor Hub</span></div>`,
            },
            {
              id: "header",
              type: "header",
              layout: { columnSpan: 12 },
              label: "Partner & Vendor Portal",
              description: "Sign in to manage purchase orders, RFQs, and quotations.",
              className: "mb-1 sm:mb-1.5",
              properties: { alignment: "center" },
              meta: { ui: { variant: "h2" } },
            },
            {
              id: "username",
              name: "username",
              type: "text",
              label: "Business Email or Supplier Code",
              required: true,
              aliases: ["login", "email", "user"],
              layout: { columnSpan: 12 },
              properties: {
                placeholder: "procurement@company.com or SUP-CODE",
                labelPlacement: "outside",
                reserveErrorSpace: true,
              },
              meta: { ui: { component: "email", icon: "briefcase", classNames: { base: "mb-0.5" } } },
              validation: AuthValidationRules.validations.username,
              onChange: AuthValidationRules.events.username.onChange,
            },
            {
              id: "password",
              name: "password",
              type: "password",
              label: "Password",
              required: true,
              layout: { columnSpan: 12 },
              properties: {
                placeholder: "Enter partner password",
                labelPlacement: "outside",
                reserveErrorSpace: true,
              },
              meta: { ui: { icon: "lock", classNames: { base: "mb-0.5" } } },
              validation: AuthValidationRules.validations.password,
            },
            {
              id: "forgot-password-link",
              type: "html",
              layout: { columnSpan: 12 },
              label: "",
              initialValue:
                `<div class="flex justify-end -mt-1 mb-1"><a href="/forgot-password" class="text-xs font-semibold text-amber-500 hover:underline">Forgot password?</a></div>`,
            },
            {
              id: "submit-btn",
              type: "button",
              label: "Partner Sign In",
              layout: { columnSpan: 12 },
              properties: { submit: true },
              meta: {
                ui: {
                  classNames: {
                    base: "mt-4 inline-flex items-center justify-center font-bold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none w-full py-2.5 sm:py-3 text-sm rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-md shadow-amber-500/25 text-white cursor-pointer",
                  },
                },
              },
            },
            {
              id: "partner-sso",
              type: "html",
              layout: { columnSpan: 12 },
              label: "",
              initialValue:
                `<div class="mt-4 pt-3 border-t border-border/40 text-center"><div class="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mb-2">Corporate Supplier Single Sign-On</div><div class="grid grid-cols-2 gap-2 text-xs"><button type="button" class="py-2 px-2 rounded-xl border border-border/70 bg-surface-raised/40 hover:bg-surface text-foreground font-semibold flex items-center justify-center gap-1.5 shadow-2xs"><span class="text-emerald-500 font-black">okta</span><span>Verify SSO</span></button><button type="button" class="py-2 px-2 rounded-xl border border-border/70 bg-surface-raised/40 hover:bg-surface text-foreground font-semibold flex items-center justify-center gap-1.5 shadow-2xs"><span class="text-blue-500 font-bold">Microsoft</span><span>Azure AD</span></button></div></div>`,
            },
            {
              id: "auth-footer",
              type: "html",
              layout: { columnSpan: 12 },
              label: "",
              initialValue:
                `<div class="text-center text-xs font-semibold text-foreground/60 mt-2 space-x-1"><span>${footerCopyright}</span> • <a href="#" class="text-amber-500 font-bold hover:underline">${termsLabel}</a> • <a href="#" class="text-amber-500 font-bold hover:underline">${privacyLabel}</a></div>`,
            },
          ],
        },
      ],
    };
  }

  // Default: Customer Persona
  return {
    id: "auth-login-content",
    title: "",
    sections: [
      {
        id: "login-fields",
        title: "",
        fields: [
          guestLink,
          {
            id: "customer-badge",
            type: "html",
            layout: { columnSpan: 12 },
            label: "",
            initialValue:
              `<div class="rounded-xl border border-indigo-500/25 bg-indigo-500/10 p-2 text-xs text-indigo-600 dark:text-indigo-400 font-medium flex items-center justify-between mb-2"><span>🛍️ Personal Account</span><span class="text-[10px] font-bold uppercase tracking-wider">Shopper Portal</span></div>`,
          },
          {
            id: "header",
            type: "header",
            layout: { columnSpan: 12 },
            label: t ? t("login.header") : "Welcome Back",
            description: t ? t("login.subtitle") : "Sign in to access your Customer Portal.",
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
            id: "forgot-password-link",
            type: "html",
            layout: { columnSpan: 12 },
            label: "",
            initialValue:
              `<div class="flex justify-end -mt-1 mb-1"><a href="/forgot-password" class="text-xs font-semibold text-primary hover:underline">Forgot password?</a></div>`,
          },
          {
            id: "customer-security",
            type: "html",
            layout: { columnSpan: 12 },
            label: "",
            initialValue:
              `<div class="flex items-center justify-between text-2xs py-1.5 px-3 mb-1 rounded-xl bg-surface-raised/60 border border-border/40 text-muted-foreground"><span>🔒 TLS 1.3 256-bit Encrypted</span><span class="font-bold text-primary">Fast Checkout Pass</span></div>`,
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
                  base: "mt-3 inline-flex items-center justify-center font-bold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none w-full py-2.5 sm:py-3 text-sm rounded-xl bg-gradient-to-r from-primary to-primary/90 shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 hover:scale-[1.005] active:scale-[0.995] text-primary-foreground cursor-pointer",
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
  id: `entity-auth-login-${toggleProps.persona || "customer"}`,
  name: "Login Form",
  content: buildLoginContent(t, toggleProps.persona || "customer"),
  behavior: LoginBehavior,
  surface: buildAuthSurface("login", toggleProps, t),
  presentation: buildAuthPresentation(toggleProps.persona || "customer"),
});

// ── Sign Up MDAP Entity ─────────────────────────────────────────────────────

const buildSignupContent = (
  t?: AuthTranslator,
  persona: AuthPersona = "customer"
): ContentDefinition<SignupFormData> => {
  const sharedUI = getSharedFieldUI(t);
  const guestLink = getGuestLinkField();
  const currentYear = new Date().getFullYear();
  const footerCopyright = t
    ? t("common.footer", { year: currentYear })
    : `© ${currentYear} ZenOS Platform. All Rights Reserved`;
  const termsLabel = t ? t("common.terms") : "Terms";
  const privacyLabel = t ? t("common.privacy") : "Privacy";

  if (persona === "partner") {
    return {
      id: "auth-signup-content-partner",
      title: "",
      sections: [
        {
          id: "signup-fields",
          title: "",
          fields: [
            guestLink,
            {
              id: "header",
              type: "header",
              layout: { columnSpan: 12 },
              label: "Vendor & Supplier Onboarding",
              description: "Register your business entity to sell on the ZenOS marketplace.",
              className: "mb-1 sm:mb-1.5",
              properties: { alignment: "center" },
              meta: { ui: { variant: "h2" } },
            },
            {
              id: "partner-onboarding-badge",
              type: "html",
              layout: { columnSpan: 12 },
              label: "",
              initialValue:
                `<div class="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-300 font-medium flex items-center gap-2 mb-2"><span>📋</span><span>B2B Merchant Registration • Verified Supplier Network</span></div>`,
            },
            {
              id: "company_name",
              name: "company_name",
              type: "text",
              label: "Legal Company Name",
              required: true,
              layout: { columnSpan: { base: 12, sm: 6 } },
              properties: {
                placeholder: "e.g. Acme Components Ltd",
                labelPlacement: "outside",
                reserveErrorSpace: true,
              },
              meta: { ui: { icon: "briefcase", classNames: {} } },
              validation: AuthValidationRules.validations.company_name,
            },
            {
              id: "name",
              name: "name",
              type: "text",
              label: "Representative Full Name",
              required: true,
              layout: { columnSpan: { base: 12, sm: 6 } },
              properties: {
                placeholder: "e.g. Marcus Vance",
                labelPlacement: "outside",
                reserveErrorSpace: true,
              },
              meta: { ui: { icon: "user", classNames: {} } },
              validation: AuthValidationRules.validations.name,
            },
            {
              id: "tax_id",
              name: "tax_id",
              type: "text",
              label: "Tax / VAT / GST Registration",
              required: true,
              layout: { columnSpan: { base: 12, sm: 6 } },
              properties: {
                placeholder: "e.g. VAT-8829104",
                labelPlacement: "outside",
                reserveErrorSpace: true,
              },
              meta: { ui: { icon: "shield", classNames: {} } },
              validation: AuthValidationRules.validations.tax_id,
            },
            {
              id: "username",
              name: "username",
              type: "text",
              label: "Corporate Email Address",
              required: true,
              aliases: ["email"],
              layout: { columnSpan: { base: 12, sm: 6 } },
              properties: {
                placeholder: "procurement@company.com",
                labelPlacement: "outside",
                reserveErrorSpace: true,
              },
              meta: { ui: { component: "email", icon: "mail", classNames: {} } },
              validation: AuthValidationRules.validations.username,
              onChange: AuthValidationRules.events.username.onChange,
            },
            {
              id: "password",
              name: "password",
              type: "password",
              label: "Password",
              required: true,
              layout: { columnSpan: { base: 12, sm: 6 } },
              properties: {
                placeholder: "Create strong password",
                labelPlacement: "outside",
                reserveErrorSpace: true,
              },
              meta: { ui: { icon: "lock", classNames: {} } },
              validation: AuthValidationRules.validations.password,
            },
            {
              id: "confirm_password",
              name: "confirm_password",
              type: "password",
              label: "Confirm Password",
              required: true,
              aliases: ["confirmPassword"],
              layout: { columnSpan: { base: 12, sm: 6 } },
              properties: {
                placeholder: "Confirm your password",
                labelPlacement: "outside",
                reserveErrorSpace: true,
              },
              meta: { ui: { icon: "lock", classNames: {} } },
              validation: AuthValidationRules.validations.confirm_password,
            },
            {
              id: "partner-terms",
              type: "html",
              layout: { columnSpan: 12 },
              label: "",
              initialValue:
                `<div class="text-xs text-foreground/70 my-1"><label class="flex items-center gap-2 cursor-pointer"><input type="checkbox" required checked class="rounded border-border text-amber-500 focus:ring-amber-500"/><span>I certify this business entity and agree to the <strong>Supplier Terms</strong> and <strong>Merchant Code of Conduct</strong>.</span></label></div>`,
            },
            {
              id: "submit-btn",
              type: "button",
              label: "Complete Vendor Registration",
              layout: { columnSpan: 12 },
              properties: { submit: true },
              meta: {
                ui: {
                  classNames: {
                    base: "mt-4 inline-flex items-center justify-center font-bold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none w-full py-2 sm:py-2.5 text-sm rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-md shadow-amber-500/25 text-white",
                  },
                },
              },
            },
            {
              id: "auth-footer",
              type: "html",
              layout: { columnSpan: 12 },
              label: "",
              initialValue:
                `<div class="text-center text-xs font-semibold text-foreground/60 mt-2 space-x-1"><span>${footerCopyright}</span> • <a href="#" class="text-amber-500 font-bold hover:underline">${termsLabel}</a> • <a href="#" class="text-amber-500 font-bold hover:underline">${privacyLabel}</a></div>`,
            },
          ],
        },
      ],
    };
  }

  // Default: Customer Persona Sign Up
  return {
    id: "auth-signup-content",
    title: "",
    sections: [
      {
        id: "signup-fields",
        title: "",
        fields: [
          guestLink,
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
  id: `entity-auth-signup-${toggleProps.persona || "customer"}`,
  name: "Signup Form",
  content: buildSignupContent(t, toggleProps.persona || "customer"),
  behavior: SignupBehavior,
  surface: buildAuthSurface("signup", toggleProps, t),
  presentation: buildAuthPresentation(toggleProps.persona || "customer"),
});

// ── Forgot Password MDAP Entity ─────────────────────────────────────────────

const buildForgotPasswordContent = (
  t?: AuthTranslator
): ContentDefinition<ForgotPasswordFormData> => {
  const sharedUI = getSharedFieldUI(t);
  const currentYear = new Date().getFullYear();
  const footerCopyright = t
    ? t("common.footer", { year: currentYear })
    : `© ${currentYear} ZenOS Platform. All Rights Reserved`;

  return {
    id: "auth-forgot-password-content",
    title: "",
    sections: [
      {
        id: "forgot-password-fields",
        title: "",
        fields: [
          {
            id: "header",
            type: "header",
            layout: { columnSpan: 12 },
            label: "Reset Your Password",
            description:
              "Enter your account email to receive secure password recovery instructions.",
            className: "mb-1 sm:mb-1.5",
            properties: { alignment: "center" },
            meta: { ui: { variant: "h2" } },
          },
          {
            id: "username",
            name: "username",
            type: "text",
            label: "Registered Email Address",
            required: true,
            aliases: ["login", "email", "user"],
            ...sharedUI.username("login"),
            validation: AuthValidationRules.validations.username,
            onChange: AuthValidationRules.events.username.onChange,
          },
          {
            id: "submit-btn",
            type: "button",
            label: "Send Reset Link",
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
            id: "back-link",
            type: "html",
            layout: { columnSpan: 12 },
            label: "",
            initialValue:
              `<div class="text-center text-xs font-semibold text-foreground/80 mt-3"><a href="/login" class="text-primary font-bold hover:underline">← Return to Sign In</a></div>`,
          },
          {
            id: "auth-footer",
            type: "html",
            layout: { columnSpan: 12 },
            label: "",
            initialValue:
              `<div class="text-center text-xs font-semibold text-foreground/60 mt-4 space-x-1"><span>${footerCopyright}</span></div>`,
          },
        ],
      },
    ],
  };
};

const ForgotPasswordBehavior: BehaviorDefinition<ForgotPasswordFormData> = {
  pipeline: {
    middleware: [
      (formData) => {
        if (formData.username)
          formData.username = formData.username.toLowerCase();
      },
    ],
  },
};

export const buildForgotPasswordEntity = (
  toggleProps: AuthModeToggleProps,
  t?: AuthTranslator
): EntityDefinition<ForgotPasswordFormData> => ({
  id: "entity-auth-forgot-password",
  name: "Forgot Password Form",
  content: buildForgotPasswordContent(t),
  behavior: ForgotPasswordBehavior,
  surface: buildAuthSurface("forgot-password", toggleProps, t),
  presentation: buildAuthPresentation(toggleProps.persona || "customer"),
});
