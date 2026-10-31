/*
 * Centralized Auth Persona Registry
 *
 * Single source of truth for all persona metadata, theming,
 * access controls, and brand positioning across the ZenOS Platform.
 */

export type AuthPersona = "customer" | "partner" | "staff";
export type AuthViewMode = "login" | "signup" | "forgot-password";

export interface PersonaConfig {
  id: AuthPersona;
  title: string;
  subtitle: string;
  badge: string;
  icon: string;
  accentColor: "indigo" | "emerald" | "slate";
  registrationEnabled: boolean;
  oauthEnabled: boolean;
  redirectTo: string;
  headline: string;
  supportingText: string;
}

export const AUTH_PERSONAS: Record<AuthPersona, PersonaConfig> = {
  customer: {
    id: "customer",
    title: "Customer Portal",
    subtitle: "Shopping, orders, wishlists and rewards",
    badge: "PERSONAL ACCOUNT",
    icon: "🛍️",
    accentColor: "indigo",
    registrationEnabled: true,
    oauthEnabled: true,
    redirectTo: "/",
    headline: "Your shopping journey starts here.",
    supportingText:
      "Discover products, manage orders, enjoy rewards and experience seamless shopping.",
  },
  partner: {
    id: "partner",
    title: "Partner & Vendor",
    subtitle: "Procurement, RFQ dispatches, and inventory fulfillment",
    badge: "BUSINESS ACCOUNT",
    icon: "🤝",
    accentColor: "emerald",
    registrationEnabled: true,
    oauthEnabled: false,
    redirectTo: "/vendor",
    headline: "Power your business partnerships.",
    supportingText:
      "Manage purchase orders, respond to RFQs and streamline your supplier operations.",
  },
  staff: {
    id: "staff",
    title: "Staff Terminal",
    subtitle: "Internal enterprise operations and administration",
    badge: "RESTRICTED ACCESS",
    icon: "🛡️",
    accentColor: "slate",
    registrationEnabled: false,
    oauthEnabled: false,
    redirectTo: "/workspace",
    headline: "Your enterprise. Securely connected.",
    supportingText:
      "Access internal operations through a secure, centralized enterprise gateway.",
  },
};

/**
 * Resolves query string parameter or string to a valid AuthPersona.
 * Returns null if no mode is provided or if invalid (indicates Level 1 Persona Selection).
 */
export function resolveAuthPersona(param: string | null | undefined): AuthPersona | null {
  if (!param) return null;
  const lower = param.toLowerCase().trim();
  if (lower === "staff" || lower === "admin" || lower === "employee") return "staff";
  if (lower === "partner" || lower === "vendor" || lower === "supplier") return "partner";
  if (lower === "customer" || lower === "user" || lower === "client") return "customer";
  return null;
}
