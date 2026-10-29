import { useHttpContext } from "@contexts/HttpContext";

/**
 * Hook to access the HTTP services
 *
 * Provides access to both 'public' and 'auth' client instances
 * from the HttpContext.
 *
 * @returns Object containing public and auth HTTP services
 *
 * @example
 * ```typescript
 * const { public: publicHttp, auth: authHttp } = useHttp();
 *
 * const fetchUser = async (id: string) => {
 *   const response = await authHttp.get(`/api/users/${id}`);
 *   return response.data;
 * };
 * ```
 */
export const useHttp = () => {
  return useHttpContext();
};
