// src/configs/api/axios/axios.instance.ts
/**
 * @fileoverview Axios Instance Factory
 *
 * Creates and configures Axios instances with feature-based interceptor attachment.
 * Provides two singleton instances for different authentication contexts.
 *
 * ## Instance Types
 *
 * - **Public**: For unauthenticated requests (login, registration, public data)
 * - **Auth**: For authenticated requests (user data, protected resources)
 *
 * ## Feature-Based Configuration
 *
 * Each instance is configured with:
 * - Base URL and timeout from environment
 * - Interceptors based on feature flags
 * - Retry logic with exponential backoff
 * - Logging based on environment
 *
 * ## Request-Response Cycle
 *
 * ```
 * Application Code
 *       ↓
 * Axios Instance (this file)
 *       ↓
 * Request Interceptors (auth, logging)
 *       ↓
 * Network Request
 *       ↓
 * Response Interceptors (logging, error, retry)
 *       ↓
 * Application Code
 * ```
 *
 * @module configs/api/axios/axios.instance
 */
import axios, { type AxiosInstance } from "axios";

import { API_CONFIG } from "@configs/api/axios/axios.base";
import { attachInterceptors } from "@configs/api/axios/utils/axios.attach.interceptors";

import { getInterceptorMeta } from "./axios.interceptor.config";
import { getRetryConfig } from "./axios.retry.config";

/**
 * Axios Instance Type
 *
 * Defines the type of Axios instance to create, which determines
 * which interceptors are attached.
 *
 * - `public`: For open/public API requests (no authentication)
 * - `auth`: For authenticated requests (requires valid token)
 *
 * @example
 * ```typescript
 * const type: AxiosInstanceType = "auth"; // ✅ Valid
 * const type: AxiosInstanceType = "admin"; // ❌ Type error
 * ```
 */
export type AxiosInstanceType = "public" | "auth";

/**
 * Create a configured Axios instance
 *
 * Factory function that creates an Axios instance with:
 * 1. Base configuration (URL, timeout, headers)
 * 2. Feature-based interceptors (auth, logging, retry, error)
 * 3. Environment-specific settings
 *
 * ## Interceptor Attachment
 *
 * Interceptors are attached based on instance type and environment:
 * - **Auth Interceptor**: Only on "auth" instances
 * - **Logging Interceptor**: Based on environment config
 * - **Error Interceptor**: Always attached
 * - **Retry Interceptor**: Based on environment config
 *
 * ## Configuration Sources
 *
 * - `API_CONFIG`: Base Axios configuration (URL, timeout, headers)
 * - `getInterceptorMeta()`: Metadata for interceptors
 * - `getRetryConfig()`: Retry configuration
 *
 * @param type - Type of instance to create ("public" or "auth")
 * @returns Configured Axios instance
 *
 * @example
 * ```typescript
 * // Create public instance (no auth)
 * const publicInstance = createAxiosInstance("public");
 *
 * // Create authenticated instance
 * const authInstance = createAxiosInstance("auth");
 *
 * // Make requests
 * const response = await authInstance.get("/api/users");
 * ```
 */
export const createAxiosInstance = (type: AxiosInstanceType): AxiosInstance => {
  // Create base instance with configuration
  const instance = axios.create(API_CONFIG);

  // Attach interceptors based on type and environment
  attachInterceptors(instance, type, {
    interceptorConfig: getInterceptorMeta(),
    retryConfig: getRetryConfig(),
  });

  return instance;
};

/**
 * Public Axios Instance (Singleton)
 *
 * Pre-configured instance for unauthenticated requests.
 *
 * ## Use Cases
 * - User login/registration
 * - Public data fetching
 * - Health checks
 * - Any endpoint that doesn't require authentication
 *
 * ## Interceptors
 * - ❌ Auth interceptor (no token injection)
 * - ✅ Logging interceptor (if enabled)
 * - ✅ Error interceptor
 * - ✅ Retry interceptor (if enabled)
 *
 * @example
 * ```typescript
 * import { AxiosPublicInstance } from "@configs/api/axios";
 *
 * // Login request (no auth required)
 * const response = await AxiosPublicInstance.post("/auth/login", {
 *   email: "user@example.com",
 *   password: "password"
 * });
 * ```
 */
export const AxiosPublicInstance = createAxiosInstance("public");

/**
 * Authenticated Axios Instance (Singleton)
 *
 * Pre-configured instance for authenticated requests.
 * Automatically injects Bearer token from token manager.
 *
 * ## Use Cases
 * - User profile data
 * - Protected resources
 * - Any endpoint requiring authentication
 *
 * ## Interceptors
 * - ✅ Auth interceptor (auto-injects Bearer token)
 * - ✅ Logging interceptor (if enabled)
 * - ✅ Error interceptor (handles 401/403)
 * - ✅ Retry interceptor (if enabled)
 *
 * ## Authentication Flow
 *
 * 1. Request interceptor checks token validity
 * 2. If valid, adds `Authorization: Bearer <token>` header
 * 3. If invalid or missing, request proceeds without token
 * 4. Response interceptor handles 401/403 errors
 * 5. Dispatches `auth:error` event for app to handle
 *
 * @example
 * ```typescript
 * import { AxiosAuthInstance } from "@configs/api/axios";
 *
 * // Fetch user data (requires auth)
 * const response = await AxiosAuthInstance.get("/api/user/profile");
 *
 * // Update user data (requires auth)
 * const updateResponse = await AxiosAuthInstance.put("/api/user/profile", {
 *   name: "John Doe"
 * });
 * ```
 */
export const AxiosAuthInstance = createAxiosInstance("auth");
