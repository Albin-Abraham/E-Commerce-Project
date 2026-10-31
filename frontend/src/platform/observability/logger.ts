/**
 * Platform Observability: Structured Logger
 *
 * Provides leveled, namespaced logging suitable for debugging and telemetry.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export class Logger {
  constructor(private readonly namespace: string) {}

  public debug(message: string, ...context: unknown[]): void {
    this.log("debug", message, context);
  }

  public info(message: string, ...context: unknown[]): void {
    this.log("info", message, context);
  }

  public warn(message: string, ...context: unknown[]): void {
    this.log("warn", message, context);
  }

  public error(message: string, error?: unknown, ...context: unknown[]): void {
    const errorDetails = error instanceof Error ? { message: error.message, stack: error.stack } : error;
    this.log("error", message, [errorDetails, ...context]);
  }

  private log(level: LogLevel, message: string, context: unknown[]): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.namespace}]:`;

    if (level === "debug" && import.meta.env.PROD) {
      return;
    }

    if (level === "error") {
      console.error(prefix, message, ...context);
    } else if (level === "warn") {
      console.warn(prefix, message, ...context);
    } else if (level === "info") {
      console.info(prefix, message, ...context);
    } else {
      console.log(prefix, message, ...context);
    }
  }
}

export const createLogger = (namespace: string): Logger => new Logger(namespace);
