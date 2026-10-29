import React, { useCallback, useEffect } from "react";

import type { TableTaskStatus } from "../../types";

/**
 * ProgressModal — Headless modal container for task progress.
 *
 * Renderless: consumers provide their own UI via render props.
 * Handles overlay, dismiss prevention during processing, and keyboard escape.
 */

export type TaskStatus = TableTaskStatus;

const IN_FLIGHT: ReadonlySet<TableTaskStatus> = new Set([
  "uploading",
  "pending",
  "queued",
  "processing",
]);

export interface ProgressModalRenderProps {
  status: TaskStatus;
  progress: number;
  title: string;
  close: () => void;
}

export interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: TaskStatus;
  progress: number;
  title?: string;
  /** Prevent closing while processing — default: true */
  dismissable?: boolean;
  /** Render the modal content */
  children: (props: ProgressModalRenderProps) => React.ReactNode;
  /** Translation labels */
  labels?: {
    titleProcessing?: string;
    titleComplete?: string;
    titleFailed?: string;
  };
}

export function ProgressModal({
  isOpen,
  onClose,
  status,
  progress,
  title,
  dismissable = true,
  children,
  labels,
}: ProgressModalProps) {
  const isProcessing = IN_FLIGHT.has(status);
  const canDismiss = !isProcessing || dismissable;

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && canDismiss) {
        onClose();
      }
    },
    [canDismiss, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, handleEscape]);

  if (!isOpen) return null;

  const resolvedTitle =
    status === "completed"
      ? (labels?.titleComplete ?? "Complete")
      : status === "failed"
        ? (labels?.titleFailed ?? "Failed")
        : (title ?? labels?.titleProcessing ?? "Processing...");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={resolvedTitle}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={canDismiss ? onClose : undefined}
      />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {children({
          status,
          progress,
          title: resolvedTitle,
          close: onClose,
        })}
      </div>
    </div>
  );
}
