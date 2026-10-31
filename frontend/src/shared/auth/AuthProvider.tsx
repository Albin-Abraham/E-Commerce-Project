/**
 * Shared Auth: Presentation Auth Provider
 */

import React, { createContext, useState, useEffect, useCallback, useMemo } from "react";
import {
  authAdapter,
  type UserProfile,
  type UserSession,
  type LoginCredentials,
} from "@platform/identity";
import { permissionEvaluator } from "@platform/authorization";

export interface AuthContextValue {
  user: UserProfile | null;
  session: UserSession;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<UserSession>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<UserSession>(authAdapter.getSession());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const syncEvaluator = useCallback((user: UserProfile | null) => {
    permissionEvaluator.setUser(user);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const profile = await authAdapter.fetchProfile();
        if (mounted) {
          const newSession: UserSession = {
            user: profile,
            isAuthenticated: true,
          };
          authAdapter.setSession(newSession);
          setSession(newSession);
          syncEvaluator(profile);
        }
      } catch {
        if (mounted) {
          // Dev fallback
          const current = authAdapter.getSession();
          setSession(current);
          syncEvaluator(current.user);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [syncEvaluator]);

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<UserSession> => {
      setIsLoading(true);
      try {
        const result = await authAdapter.login(credentials);
        setSession(result);
        syncEvaluator(result.user);
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [syncEvaluator]
  );

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authAdapter.logout();
      const empty = authAdapter.getSession();
      setSession(empty);
      syncEvaluator(null);
    } finally {
      setIsLoading(false);
    }
  }, [syncEvaluator]);

  const refreshProfile = useCallback(async (): Promise<void> => {
    try {
      const profile = await authAdapter.fetchProfile();
      const updated: UserSession = {
        ...session,
        user: profile,
        isAuthenticated: true,
      };
      authAdapter.setSession(updated);
      setSession(updated);
      syncEvaluator(profile);
    } catch {
      // Retain existing session on refresh error
    }
  }, [session, syncEvaluator]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session.user,
      session,
      isAuthenticated: session.isAuthenticated,
      isLoading,
      login,
      logout,
      refreshProfile,
    }),
    [session, isLoading, login, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
