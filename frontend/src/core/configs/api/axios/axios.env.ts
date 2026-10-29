// src/configs/api/axios/axios.env.ts
/**
 * @fileoverview API Environment Configuration
 *
 * Provides environment-specific configuration for the HTTP client with feature-based
 * organization. Each environment (development, production, staging, testing) has its
 * own configuration for interceptors, retry logic, and request settings.
 *
 * ## Feature-Based Configuration
 *
 * Configuration is organized by features that can be toggled per environment:
 * - **Logging**: Request/response/error logging
 * - **Retry**: Automatic retry with exponential backoff
 * - **Timeout**: Request timeout limits
 * - **Base URL**: API endpoint configuration
 *
 * ## Environment Variables
 *
 * Required environment variables:
 * - `VITE_API_URL`: Base URL for API requests
 * - `VITE_API_TIMEOUT`: Request timeout in milliseconds (optional)
 * - `VITE_API_ENABLE_REQUEST_LOGS`: Enable request logging (optional)
 * - `VITE_API_ENABLE_RESPONSE_LOGS`: Enable response logging (optional)
 * - `VITE_API_ENABLE_ERROR_LOGS`: Enable error logging (optional)
 * - `VITE_API_MAX_RETRIES`: Maximum retry attempts (optional)
 * - `VITE_API_BASE_DELAY`: Base delay for retry backoff in ms (optional)
 * - `VITE_API_MAX_DELAY`: Maximum delay for retry backoff in ms (optional)
 *
 * @module configs/api/axios/axios.env
 */
import { retryCondition } from "@configs/api/axios/utils/retryCondition";
import type { EnvProvider } from "@configs/env/env.provider";
import type { RetryConfig } from "@configs/type/retry";

/* =======================
   Helpers (pure functions)
======================= */

/**
 * Parse boolean value from environment variable
 *
 * @param val - Environment variable value
 * @param fallback - Default value if parsing fails
 * @returns Parsed boolean value
 *
 * @example
 * ```typescript
 * parseBoolean("true", false)  // returns true
 * parseBoolean("false", true)  // returns false
 * parseBoolean(undefined, true) // returns true (fallback)
 * ```
 */
const parseBoolean = (val?: string, fallback = false) =>
  val ? val.toLowerCase() === "true" : fallback;

/**
 * Parse number value from environment variable
 *
 * @param val - Environment variable value
 * @param fallback - Default value if parsing fails
 * @returns Parsed number value
 *
 * @example
 * ```typescript
 * parseNumber("5000", 3000)     // returns 5000
 * parseNumber("invalid", 3000)  // returns 3000 (fallback)
 * parseNumber(undefined, 3000)  // returns 3000 (fallback)
 * ```
 */
const parseNumber = (val?: string, fallback = 0) => {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
};

/* =======================
   Environment Factory
======================= */

/**
 * API Environment Configuration
 *
 * Configuration object for a specific environment containing all
 * feature flags and settings for the HTTP client.
 */
export interface ApiEnvironmentConfig {
  /** Base URL for all API requests */
  baseURL: string;

  /** Request timeout in milliseconds */
  timeout: number;

  /** Interceptor feature flags */
  interceptorConfig: {
    /** Enable request logging interceptor */
    enableRequestLogs: boolean;
    /** Enable response logging interceptor */
    enableResponseLogs: boolean;
    /** Enable error logging interceptor */
    enableErrorLogs: boolean;
    /** Enable retry interceptor */
    enableRetry: boolean;
  };

  /** Retry configuration for failed requests */
  retryConfig: RetryConfig;
}

/**
 * Create environment-specific API configurations
 *
 * Factory function that creates configuration objects for each environment
 * based on environment variables. Each environment has different defaults
 * optimized for its use case.
 *
 * ## Environment Profiles
 *
 * ### Development
 * - **Purpose**: Local development with verbose logging
 * - **Logging**: All logs enabled
 * - **Retry**: Enabled with 3 attempts
 * - **Timeout**: 8 seconds
 *
 * ### Production
 * - **Purpose**: Live production environment
 * - **Logging**: Only error logs enabled
 * - **Retry**: Enabled with 2 attempts
 * - **Timeout**: 15 seconds
 *
 * ### Staging
 * - **Purpose**: Pre-production testing
 * - **Logging**: All logs enabled
 * - **Retry**: Enabled with 2 attempts
 * - **Timeout**: 10 seconds
 *
 * ### Testing
 * - **Purpose**: Automated testing
 * - **Logging**: All logs disabled
 * - **Retry**: Disabled
 * - **Timeout**: 5 seconds
 *
 * @param env - Environment provider for reading environment variables
 * @returns Configuration object for each environment
 *
 * @example
 * ```typescript
 * import { ViteEnvProvider } from "@configs/env/vite.env.provider";
 *
 * const configs = createApiEnvironments(ViteEnvProvider);
 * const devConfig = configs.development;
 *
 * console.log(devConfig.baseURL);  // "http://localhost:8000"
 * console.log(devConfig.timeout);  // 8000
 * ```
 */
export const createApiEnvironments = (env: EnvProvider) => ({
  /**
   * Development Environment Configuration
   *
   * Optimized for local development with verbose logging and
   * moderate retry attempts for debugging.
   */
  development: {
    baseURL: env.get("VITE_API_URL"),
    timeout: parseNumber(env.get("VITE_API_TIMEOUT"), 8000),
    interceptorConfig: {
      enableRequestLogs: parseBoolean(
        env.get("VITE_API_ENABLE_REQUEST_LOGS"),
        true
      ),
      enableResponseLogs: parseBoolean(
        env.get("VITE_API_ENABLE_RESPONSE_LOGS"),
        true
      ),
      enableErrorLogs: parseBoolean(
        env.get("VITE_API_ENABLE_ERROR_LOGS"),
        true
      ),
      enableRetry: true,
    },
    retryConfig: {
      maxRetries: parseNumber(env.get("VITE_API_MAX_RETRIES"), 3),
      baseDelay: parseNumber(env.get("VITE_API_BASE_DELAY"), 1000),
      maxDelay: parseNumber(env.get("VITE_API_MAX_DELAY"), 8000),
      retryCondition,
    } satisfies RetryConfig,
  },

  /**
   * Production Environment Configuration
   *
   * Optimized for production with minimal logging and
   * conservative retry attempts.
   */
  production: {
    baseURL: env.get("VITE_API_URL"),
    timeout: parseNumber(env.get("VITE_API_TIMEOUT"), 15000),
    interceptorConfig: {
      enableRequestLogs: false,
      enableResponseLogs: false,
      enableErrorLogs: true,
      enableRetry: true,
    },
    retryConfig: {
      maxRetries: parseNumber(env.get("VITE_API_MAX_RETRIES"), 2),
      baseDelay: parseNumber(env.get("VITE_API_BASE_DELAY"), 2000),
      maxDelay: parseNumber(env.get("VITE_API_MAX_DELAY"), 10000),
      retryCondition,
    } satisfies RetryConfig,
  },

  /**
   * Staging Environment Configuration
   *
   * Optimized for pre-production testing with full logging
   * and moderate retry attempts.
   */
  staging: {
    baseURL: env.get("VITE_API_URL"),
    timeout: parseNumber(env.get("VITE_API_TIMEOUT"), 10000),
    interceptorConfig: {
      enableRequestLogs: true,
      enableResponseLogs: true,
      enableErrorLogs: true,
      enableRetry: true,
    },
    retryConfig: {
      maxRetries: parseNumber(env.get("VITE_API_MAX_RETRIES"), 2),
      baseDelay: parseNumber(env.get("VITE_API_BASE_DELAY"), 1500),
      maxDelay: parseNumber(env.get("VITE_API_MAX_DELAY"), 9000),
      retryCondition,
    } satisfies RetryConfig,
  },

  /**
   * Testing Environment Configuration
   *
   * Optimized for automated testing with no logging,
   * no retries, and fast timeouts.
   */
  testing: {
    baseURL: env.get("VITE_API_URL"),
    timeout: parseNumber(env.get("VITE_API_TIMEOUT"), 5000),
    interceptorConfig: {
      enableRequestLogs: false,
      enableResponseLogs: false,
      enableErrorLogs: false,
      enableRetry: false,
    },
    retryConfig: {
      maxRetries: 0,
      baseDelay: 0,
      maxDelay: 0,
      retryCondition,
    } satisfies RetryConfig,
  },
});

/**
 * API Environment Type
 *
 * Union type of all supported environment names.
 * Used for type-safe environment selection.
 *
 * @example
 * ```typescript
 * const env: ApiEnvironment = "development"; // ✅ Valid
 * const env: ApiEnvironment = "invalid";     // ❌ Type error
 * ```
 */
export type ApiEnvironment = keyof ReturnType<typeof createApiEnvironments>;
