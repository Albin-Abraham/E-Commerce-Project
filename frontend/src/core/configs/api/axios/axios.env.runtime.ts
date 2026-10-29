import { ViteEnvProvider } from "@configs/env/vite.env.provider";

import { type ApiEnvironment, createApiEnvironments } from "./axios.env";

const ENVIRONMENTS = createApiEnvironments(ViteEnvProvider);

const rawEnv = ViteEnvProvider.get("VITE_APP_ENV");

const isValidEnv = (env: unknown): env is ApiEnvironment =>
  typeof env === "string" && env in ENVIRONMENTS;

export const API_ENV: ApiEnvironment = isValidEnv(rawEnv)
  ? rawEnv
  : "development";

export const API_ENV_CONFIG = ENVIRONMENTS[API_ENV];

if (!API_ENV_CONFIG.baseURL) {
  throw new Error(
    `[AxiosEnv] Missing VITE_API_URL for environment: ${API_ENV}`
  );
}
