// src/configs/api/axios/axios.retry.config.ts
/**
 * @fileoverview Retry Configuration Getter
 *
 * Provides getter function for retrieving retry configuration
 * from the current runtime environment. This configuration is used
 * by the retry interceptor to determine retry behavior.
 *
 * ## Retry Strategy
 *
 * The retry interceptor uses **exponential backoff** with the following parameters:
 * - **maxRetries**: Maximum number of retry attempts
 * - **baseDelay**: Initial delay before first retry (ms)
 * - **maxDelay**: Maximum delay between retries (ms)
 * - **retryCondition**: Function to determine if request should be retried
 *
 * ## Environment-Specific Defaults
 *
 * - **Development**: 3 retries, 1s base delay, 8s max delay
 * - **Production**: 2 retries, 2s base delay, 10s max delay
 * - **Staging**: 2 retries, 1.5s base delay, 9s max delay
 * - **Testing**: 0 retries (disabled)
 *
 * @module configs/api/axios/axios.retry.config
 */
import type { RetryConfig } from "@configs/type/retry";

import { API_ENV_CONFIG } from "./axios.env.runtime";

/**
 * Get retry configuration for current environment
 *
 * Returns the complete retry configuration including max retries,
 * delay settings, and retry condition function. Configuration is
 * environment-specific and optimized for each use case.
 *
 * @returns Retry configuration object
 *
 * @example
 * ```typescript
 * const retryConfig = getRetryConfig();
 *
 * console.log(`Max retries: ${retryConfig.maxRetries}`);
 * console.log(`Base delay: ${retryConfig.baseDelay}ms`);
 * console.log(`Max delay: ${retryConfig.maxDelay}ms`);
 *
 * // Check if a request should be retried
 * const shouldRetry = retryConfig.retryCondition(error);
 * ```
 */
export const getRetryConfig = (): RetryConfig => ({
  ...API_ENV_CONFIG.retryConfig,
});
