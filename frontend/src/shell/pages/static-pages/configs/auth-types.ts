/*
 * Auth Portal Config Types — Multi-Persona V5 Contract
 *
 * Supports 4 platform user flows:
 * - Guest: Unauthenticated / public catalog bypass
 * - Customer: B2C / B2B shopper (Login + Register + Social SSO)
 * - Partner: B2B Supplier / Vendor (Login + Onboarding)
 * - Staff: Enterprise Internal (High-security Login only, No public register)
 */

export type { AuthPersona, AuthViewMode, PersonaConfig } from "./auth-personas";
export { AUTH_PERSONAS, resolveAuthPersona } from "./auth-personas";

export type AuthMode = "login" | "signup" | "forgot-password";
export type AuthSubMode = AuthMode;

export interface AuthModeToggleProps {
  mode: AuthMode;
  persona?: import("./auth-personas").AuthPersona;
  isSwapping?: boolean;
  onModeChange: (mode: AuthMode) => void;
  onPersonaChange?: (persona: import("./auth-personas").AuthPersona) => void;
  onGuestBypass?: () => void;
}

export interface PersonaModeToggleProps extends AuthModeToggleProps {
  persona: import("./auth-personas").AuthPersona;
  onPersonaChange: (persona: import("./auth-personas").AuthPersona) => void;
}
