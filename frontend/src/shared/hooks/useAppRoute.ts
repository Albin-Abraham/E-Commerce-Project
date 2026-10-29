/**
 * Stub for route resolution.
 *
 * Behaviour is not implemented yet. This used to call `useAppRoute()` at module
 * scope and export the result, which violated the Rules of Hooks; it is now a
 * plain custom hook so it can be imported and called safely.
 */
export interface AppRoute {
  path?: string;
}

const useAppRoute = (): AppRoute => ({});

export default useAppRoute;
