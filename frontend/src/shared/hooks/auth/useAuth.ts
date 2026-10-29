import { useCallback, useMemo } from "react";

import { useMutation, useQuery } from "@tanstack/react-query";

import { BaseAuthService } from "@features/auth/services/BaseAuthService";
import type {
  LoginRequest,
  RegisterRequest,
} from "@features/auth/services/auth.types";
import { useAuthStore } from "@features/auth/store/auth.store";

import { useHttp } from "@hooks/useHttp";

/**
 * useAuth Hook
 *
 * High-level domain hook for handling all authentication logic using BaseAuthService.
 */
export const useAuth = () => {
  const http = useHttp();
  const { user, isAuthenticated } = useAuthStore();

  const authService = useMemo(
    () => new BaseAuthService(http.public, http.auth),
    [http]
  );

  // 1. Mutation: Login
  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
  });

  // 2. Mutation: Register
  const registerMutation = useMutation({
    mutationFn: (credentials: RegisterRequest) =>
      authService.register(credentials),
  });

  // 3. Mutation: Logout
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
  });

  // 4. Query: Me (Profile)
  const profileQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authService.getCurrentUser(),
    enabled: isAuthenticated,
  });

  /**
   * Log into the application
   */
  const login = useCallback(
    async (credentials: LoginRequest) => {
      return await loginMutation.mutateAsync(credentials);
    },
    [loginMutation]
  );

  /**
   * Register a new account
   */
  const register = useCallback(
    async (credentials: RegisterRequest) => {
      return await registerMutation.mutateAsync(credentials);
    },
    [registerMutation]
  );

  /**
   * Log out and clear session
   */
  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  /**
   * Refresh current user profile
   */
  const refreshProfile = useCallback(async () => {
    return await profileQuery.refetch();
  }, [profileQuery]);

  return {
    // State
    user,
    isAuthenticated,
    isLoading:
      loginMutation.isPending ||
      logoutMutation.isPending ||
      registerMutation.isPending ||
      profileQuery.isLoading,
    error:
      loginMutation.error ||
      registerMutation.error ||
      logoutMutation.error ||
      profileQuery.error,

    // Actions
    login,
    register,
    logout,
    refreshProfile,

    // Low-level access
    loginState: loginMutation,
    meState: profileQuery,
  };
};
