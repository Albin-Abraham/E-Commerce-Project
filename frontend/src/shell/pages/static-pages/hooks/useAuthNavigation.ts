import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AppPaths } from "@shell/paths";
import { type AuthPersona, AUTH_PERSONAS } from "../configs/auth-personas";
import type { AuthMode } from "../configs/auth-types";
import type { PlatformUrlPort } from "@core/router/ports/PlatformUrlPort";

export interface UseAuthNavigationOptions {
  persona: AuthPersona | null;
  urlPort?: PlatformUrlPort;
}

export function useAuthNavigation({ persona, urlPort: _urlPort }: UseAuthNavigationOptions) {
  const navigate = useNavigate();
  const location = useLocation();

  const getInitialMode = (pathname: string): AuthMode => {
    if (pathname === AppPaths.Register) return "signup";
    if (pathname === AppPaths.ForgotPassword) return "forgot-password";
    return "login";
  };

  const [mode, setMode] = useState<AuthMode>(() => getInitialMode(location.pathname));

  useEffect(() => {
    const targetMode = getInitialMode(location.pathname);
    if (targetMode !== mode) {
      setMode(targetMode);
    }
  }, [location.pathname]);

  // Enforce staff registration lockout: Staff accounts are IT-provisioned only.
  useEffect(() => {
    if (persona === "staff" && mode === "signup") {
      setMode("login");
      navigate(`${AppPaths.Login}?mode=staff`, { replace: true });
    }
  }, [persona, mode, navigate]);

  const handleModeChange = useCallback(
    (newMode: AuthMode) => {
      setMode(newMode);
      const query = persona ? `?mode=${persona}` : "";
      if (newMode === "login" && location.pathname !== AppPaths.Login) {
        navigate(`${AppPaths.Login}${query}`, { replace: false });
      } else if (newMode === "signup" && location.pathname !== AppPaths.Register) {
        navigate(`${AppPaths.Register}${query}`, { replace: false });
      } else if (
        newMode === "forgot-password" &&
        location.pathname !== AppPaths.ForgotPassword
      ) {
        navigate(`${AppPaths.ForgotPassword}${query}`, { replace: false });
      }
    },
    [location.pathname, navigate, persona]
  );

  const navigatePostAuth = useCallback(() => {
    if (!persona) {
      navigate(AppPaths.Root, { replace: true });
      return;
    }
    const config = AUTH_PERSONAS[persona];
    navigate(config.redirectTo, { replace: true });
  }, [navigate, persona]);

  const navigateGuestStorefront = useCallback(() => {
    navigate(AppPaths.Root);
  }, [navigate]);

  return {
    mode,
    handleModeChange,
    navigatePostAuth,
    navigateGuestStorefront,
  };
}
