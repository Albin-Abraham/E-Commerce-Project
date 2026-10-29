import React from "react";

import type { TableTaskStatus } from "../../types";

/**
 * TaskStatus — Headless component for displaying task status with summary.
 *
 * Renders created/updated/failed counts and error list.
 * Consumers provide their own layout via render props.
 */

export interface ImportSummary {
  created_count: number;
  updated_count: number;
  error_count: number;
}

export interface TaskError {
  row: number;
  message?: string;
  error?: string | Record<string, string[]>;
}

export function resolveTaskErrorMessage(err: TaskError): string {
  if (err.message) return err.message;
  if (typeof err.error === "string") return err.error;
  if (err.error && typeof err.error === "object") {
    return Object.entries(err.error)
      .map(([key, msgs]) => `${key}: ${msgs.join(", ")}`)
      .join("; ");
  }
  return "";
}

export interface TaskStatusRenderProps {
  summary: ImportSummary | null;
  errors: TaskError[];
  status: TableTaskStatus;
}

export interface TaskStatusProps {
  summary: ImportSummary | null;
  errors?: TaskError[];
  status: TableTaskStatus;
  /** Custom summary renderer */
  renderSummary?: (summary: ImportSummary) => React.ReactNode;
  /** Custom error list renderer */
  renderErrors?: (errors: TaskError[]) => React.ReactNode;
  /** Children as render prop */
  children?: (props: TaskStatusRenderProps) => React.ReactNode;
}

export function TaskStatus({
  summary,
  errors = [],
  status,
  renderSummary,
  renderErrors,
  children,
}: TaskStatusProps) {
  if (children) {
    return <>{children({ summary, errors, status })}</>;
  }

  const hasErrors = errors.length > 0 || (summary?.error_count ?? 0) > 0;
  const isTerminal = status === "completed" || status === "failed";

  return (
    <div className="flex flex-col gap-3">
      {/* Summary cards */}
      {isTerminal && summary && renderSummary && renderSummary(summary)}

      {/* Error list */}
      {isTerminal && hasErrors && renderErrors && renderErrors(errors)}
    </div>
  );
}

/**
 * DefaultSummary — Pre-built summary display with created/updated/failed cards.
 */
export function DefaultSummary({
  summary,
  labels = { created: "Created", updated: "Updated", failed: "Failed" },
}: {
  summary: ImportSummary;
  labels?: { created?: string; updated?: string; failed?: string };
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 flex flex-col items-center">
        <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
          {summary.created_count}
        </span>
        <span className="text-[10px] text-emerald-600/60 dark:text-emerald-400/60 uppercase font-semibold">
          {labels.created ?? "Created"}
        </span>
      </div>
      <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 flex flex-col items-center">
        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
          {summary.updated_count}
        </span>
        <span className="text-[10px] text-blue-600/60 dark:text-blue-400/60 uppercase font-semibold">
          {labels.updated ?? "Updated"}
        </span>
      </div>
      <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-800 flex flex-col items-center">
        <span className="text-xl font-bold text-red-600 dark:text-red-400">
          {summary.error_count}
        </span>
        <span className="text-[10px] text-red-600/60 dark:text-red-400/60 uppercase font-semibold">
          {labels.failed ?? "Failed"}
        </span>
      </div>
    </div>
  );
}

/**
 * DefaultErrorList — Pre-built scrollable error list.
 */
export function DefaultErrorList({
  errors,
  labels = { row: "Row" },
}: {
  errors: TaskError[];
  labels?: { row?: string };
}) {
  if (errors.length === 0) return null;

  return (
    <div className="max-h-[200px] overflow-y-auto border border-red-200 dark:border-red-800 rounded-xl bg-red-50/30 dark:bg-red-950/20">
      <div className="divide-y divide-red-100 dark:divide-red-900/50">
        {errors.map((err, idx) => (
          <div
            key={idx}
            className="px-3 py-2 text-xs text-red-700 dark:text-red-300"
          >
            <span className="font-bold">
              {labels.row ?? "Row"} {err.row}:
            </span>{" "}
            {resolveTaskErrorMessage(err)}
          </div>
        ))}
      </div>
    </div>
  );
}
