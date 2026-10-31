/**
 * Platform Configuration: Environment Variables Loader
 */

export interface AppEnvironment {
  env: "development" | "production" | "staging" | "testing";
  apiUrl: string;
  apiTimeout: number;
  enableMocks: boolean;
}

export const environment: AppEnvironment = {
  env: (import.meta.env.VITE_APP_ENV as AppEnvironment["env"]) || "development",
  apiUrl: import.meta.env.VITE_API_URL || "/api/v1",
  apiTimeout: Number(import.meta.env.VITE_API_TIMEOUT) || 15000,
  enableMocks: import.meta.env.VITE_ENABLE_MOCKS === "true",
};
