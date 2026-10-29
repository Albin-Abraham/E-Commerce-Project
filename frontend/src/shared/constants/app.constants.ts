// constants/app.constants.ts
import { ViteEnvProvider } from "@configs/env/vite.env.provider";

/**
 * Converts a string value to a boolean.
 * Specifically checks if the value equals the string `'true'`.
 *
 * @param {string | undefined} val - The string value to convert.
 * @returns {boolean} - `true` if val is `'true'`, otherwise `false`.
 *
 * @example
 * ```typescript
 * getBoolean("true")  // returns true
 * getBoolean("false") // returns false
 * getBoolean(undefined) // returns false
 * ```
 */
const getBoolean = (val?: string) => val === "true";

/**
 * Global Application Configuration
 *
 * Central configuration object derived from environment variables.
 * These values configure runtime behavior of the application.
 *
 * Uses the EnvProvider abstraction to remain framework-agnostic,
 * though currently implemented with Vite's environment system.
 *
 * ## Usage
 *
 * ```typescript
 * import { CONFIG } from "@/constants/app.constants";
 *
 * if (CONFIG.MAINTENANCE_MODE) {
 *   showMaintenancePage();
 * }
 *
 * const apiUrl = CONFIG.API_URL;
 * const logLevel = CONFIG.LOG_LEVEL;
 * ```
 *
 * ## Environment Variables
 *
 * Required environment variables (set in `.env` file):
 * - `VITE_APP_ENV`: Application environment (development, production, staging)
 * - `VITE_API_URL`: Base URL for API requests
 * - `VITE_MAINTENANCE_MODE`: Whether app is in maintenance mode ("true"/"false")
 * - `VITE_LOG_LEVEL`: Logging verbosity (debug, info, warn, error)
 *
 * @constant
 * @type {Readonly<{
 *   APP_ENV: string;
 *   API_URL: string;
 *   MAINTENANCE_MODE: boolean;
 *   LOG_LEVEL: string;
 *   MODE: string;
 * }>}
 */
export const CONFIG = {
  /**
   * Application environment (e.g., 'development', 'production', 'staging')
   *
   * Used to determine which configuration and features to enable.
   */
  APP_ENV: ViteEnvProvider.get("VITE_APP_ENV") || "development",

  /**
   * Base URL for API requests
   *
   * All HTTP requests should be made relative to this URL.
   * Example: "https://api.example.com" or "http://localhost:8000"
   */
  API_URL: ViteEnvProvider.get("VITE_API_URL") || "",

  /**
   * Whether the application is in maintenance mode
   *
   * When true, the application should display a maintenance page
   * and prevent normal operations.
   */
  MAINTENANCE_MODE: getBoolean(ViteEnvProvider.get("VITE_MAINTENANCE_MODE")),

  /**
   * Logging verbosity level
   *
   * Controls which log messages are output to the console.
   * Levels: 'debug' | 'info' | 'warn' | 'error'
   *
   * @default 'info'
   */
  LOG_LEVEL: ViteEnvProvider.get("VITE_LOG_LEVEL") || "info",

  /**
   * Current Vite mode
   *
   * Automatically set by Vite based on the build mode.
   * Values: 'development' | 'production' | etc.
   */
  MODE: ViteEnvProvider.get("MODE") || "development",
} as const;

/**
 * Type-safe configuration keys
 */
export type ConfigKey = keyof typeof CONFIG;

/**
 * Type-safe configuration values
 */
export type ConfigValue = (typeof CONFIG)[ConfigKey];
