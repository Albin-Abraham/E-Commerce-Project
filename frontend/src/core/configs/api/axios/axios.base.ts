import { API_ENV_CONFIG } from "./axios.env.runtime";
import { stringifyQuery } from "@core/router/utils/url-serializer";

/**
 * Configuration object for API requests.
 * Pulls environment-specific settings from `CURRENT_ENV_CONFIG`.
 *
 * Query Parameter Serialization:
 * Backed by `qs` via `stringifyQuery` for RFC-compliant bracket notation,
 * array serialization, and unencoded colons.
 *
 * @constant
 */
export const API_CONFIG = {
  baseURL: API_ENV_CONFIG.baseURL,
  timeout: API_ENV_CONFIG.timeout,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
  paramsSerializer: {
    serialize: (params: Record<string, any>) =>
      stringifyQuery(params, { arrayFormat: "repeat" }),
  },
};

