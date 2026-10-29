/**
 * @fileoverview
 * This file registers and exports an array of Axios interceptor plugins.
 * Each plugin module is responsible for intercepting and modifying Axios requests or responses
 * according to a specific concern such as authentication, error handling, or logging.
 *
 * Interceptors are implemented as plugins conforming to the `PluginModule` type.
 * These plugins are later integrated into the Axios instance to extend or customize its behavior.
 *
 * Imported Plugins:
 * - AuthInterceptorPlugin: Handles authentication by injecting tokens or handling auth-related headers.
 * - ErrorInterceptorPlugin: Catches and processes response errors (e.g., global error handling, notifications).
 * - LoggingInterceptorPlugin: Logs request and response details for debugging or audit purposes.
 *
 * Usage:
 * The `interceptorPlugins` array is typically iterated over in the Axios configuration file,
 * and each plugin is applied to an Axios instance.
 *
 */
import type { PluginModule } from "@configs/type/interceptor";

import { AuthInterceptorPlugin } from "./axios.auth.interceptor";
import { ErrorInterceptorPlugin } from "./axios.error.interceptor";
import { LoggingInterceptorPlugin } from "./axios.log.interceptor";
import { RetryInterceptorPlugin } from "./axios.retry.interceptor";

// Array of registered Axios interceptor plugins
export const interceptorPlugins: PluginModule[] = [
  AuthInterceptorPlugin,
  RetryInterceptorPlugin,
  ErrorInterceptorPlugin,
  LoggingInterceptorPlugin,
];

