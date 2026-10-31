/**
 * Platform Observability: Global Error Reporter Sink
 */

import { ApiError } from "../networking/api-error";
import { createLogger } from "./logger";

const log = createLogger("ErrorReporter");

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  type: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

class ErrorReporter {
  private reports: ErrorReport[] = [];

  public report(error: unknown, metadata?: Record<string, unknown>): ErrorReport {
    const id = `err-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const timestamp = new Date().toISOString();

    let message = "Unknown Error";
    let stack: string | undefined;
    let type = "GenericError";

    if (error instanceof ApiError) {
      message = error.message;
      type = `ApiError(${error.code})`;
    } else if (error instanceof Error) {
      message = error.message;
      stack = error.stack;
      type = error.name;
    } else if (typeof error === "string") {
      message = error;
    }

    const reportItem: ErrorReport = {
      id,
      message,
      stack,
      type,
      timestamp,
      metadata,
    };

    this.reports.push(reportItem);
    if (this.reports.length > 50) {
      this.reports.shift(); // retain last 50
    }

    log.error(`Reported error [${id}]: ${message}`, error, metadata);
    return reportItem;
  }

  public getRecentReports(): ReadonlyArray<ErrorReport> {
    return this.reports;
  }

  public clear(): void {
    this.reports = [];
  }
}

export const errorReporter = new ErrorReporter();
