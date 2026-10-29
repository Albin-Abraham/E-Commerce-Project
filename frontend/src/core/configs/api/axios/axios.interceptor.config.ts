// src/configs/api/axios/axios.interceptor.config.ts
/**
 * @fileoverview Interceptor Configuration Getters
 *
 * Provides getter functions for retrieving interceptor configuration
 * from the current runtime environment. These functions are used by
 * interceptor plugins to determine which features are enabled.
 *
 * ## Feature-Based Configuration
 *
 * Interceptors can be toggled on/off based on environment:
 * - **Request Logs**: Log outgoing requests
 * - **Response Logs**: Log incoming responses
 * - **Error Logs**: Log error responses
 * - **Retry**: Enable automatic retry logic
 *
 * @module configs/api/axios/axios.interceptor.config
 */
import { API_ENV, API_ENV_CONFIG } from "./axios.env.runtime";

/**
 * Logging Configuration
 *
 * Feature flags for controlling logging interceptors.
 */
export interface LoggingConfig {
  /** Enable request logging interceptor */
  enableRequestLogs: boolean;
  /** Enable response logging interceptor */
  enableResponseLogs: boolean;
  /** Enable error logging interceptor */
  enableErrorLogs: boolean;
}

/**
 * Retry Toggle Configuration
 *
 * Feature flag for controlling retry interceptor.
 */
export interface RetryToggle {
  /** Enable retry interceptor */
  enableRetry: boolean;
}

/**
 * Interceptor Metadata
 *
 * Additional metadata provided to interceptors for context.
 */
export interface InterceptorMeta {
  /** Base URL for API requests */
  baseURL: string;
  /** Current environment mode */
  envMode: string;
}

/**
 * Get logging configuration for current environment
 *
 * Returns feature flags that control which logging interceptors
 * are enabled. Configuration varies by environment (dev/prod/staging/test).
 *
 * @returns Logging configuration object
 *
 * @example
 * ```typescript
 * const loggingConfig = getLoggingConfig();
 *
 * if (loggingConfig.enableRequestLogs) {
 *   console.log("Request logging is enabled");
 * }
 * ```
 */
export const getLoggingConfig = (): LoggingConfig => ({
  enableRequestLogs: API_ENV_CONFIG.interceptorConfig.enableRequestLogs,
  enableResponseLogs: API_ENV_CONFIG.interceptorConfig.enableResponseLogs,
  enableErrorLogs: API_ENV_CONFIG.interceptorConfig.enableErrorLogs,
});

/**
 * Get retry toggle for current environment
 *
 * Returns feature flag that controls whether the retry interceptor
 * is enabled. Typically enabled in all environments except testing.
 *
 * @returns Retry toggle configuration
 *
 * @example
 * ```typescript
 * const retryToggle = getRetryToggle();
 *
 * if (retryToggle.enableRetry) {
 *   console.log("Retry interceptor is enabled");
 * }
 * ```
 */
export const getRetryToggle = (): RetryToggle => ({
  enableRetry: API_ENV_CONFIG.interceptorConfig.enableRetry,
});

/**
 * Get interceptor metadata for current environment
 *
 * Returns additional context information that interceptors may need,
 * such as the base URL and environment mode.
 *
 * @returns Interceptor metadata object
 *
 * @example
 * ```typescript
 * const meta = getInterceptorMeta();
 *
 * console.log(`API Base URL: ${meta.baseURL}`);
 * console.log(`Environment: ${meta.envMode}`);
 * ```
 */
export const getInterceptorMeta = (): InterceptorMeta => ({
  baseURL: API_ENV_CONFIG.baseURL as string,
  envMode: API_ENV as string,
});
