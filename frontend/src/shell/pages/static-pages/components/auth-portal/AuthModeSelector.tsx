import React from "react";
import type { AuthPersona } from "../../configs/auth-personas";
import type { AuthMode } from "../../configs/auth-types";

export interface AuthModeSelectorProps {
  mode: AuthMode;
  persona: AuthPersona;
  onModeChange: (newMode: AuthMode) => void;
  signInLabel?: string;
  signUpLabel?: string;
}

export const AuthModeSelector: React.FC<AuthModeSelectorProps> = ({
  mode,
  persona,
  onModeChange,
  signInLabel = "Sign In",
  signUpLabel = "Sign Up",
}) => {
  // Staff registration is strictly disabled
  if (persona === "staff") {
    return null;
  }

  const isLogin = mode === "login";
  const effectiveSignUpLabel =
    persona === "partner" ? "Vendor Onboarding" : signUpLabel;

  return (
    <div className="w-full max-w-sm mx-auto mb-4 border-b border-border/60 pb-1">
      <div
        role="tablist"
        aria-label="Authentication Mode"
        className="grid grid-cols-2 p-1 bg-surface-raised/60 rounded-xl border border-border/40"
      >
        <button
          type="button"
          role="tab"
          aria-selected={isLogin}
          onClick={() => onModeChange("login")}
          className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer text-center ${
            isLogin
              ? "bg-surface text-foreground shadow-sm shadow-black/5"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {signInLabel}
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={!isLogin}
          onClick={() => onModeChange("signup")}
          className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer text-center ${
            !isLogin
              ? "bg-surface text-foreground shadow-sm shadow-black/5"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {effectiveSignUpLabel}
        </button>
      </div>
    </div>
  );
};

export default AuthModeSelector;
