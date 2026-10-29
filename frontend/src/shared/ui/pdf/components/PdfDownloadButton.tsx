/**
 * PdfDownloadButton — UI component for triggering PDF generation
 *
 * GoF — Command: onClick wraps the download command, button is the invoker.
 *
 * i18n — Headless translation: all user-visible strings are injected via the
 * `labels` prop. The consumer (feature layer) supplies translated strings via
 * `useTranslation`. This component never imports any i18n library directly,
 * keeping the shared/ui layer framework-agnostic.
 *
 * Context-Aware Labels: The `context` prop provides dynamic interpolation
 * values resolved against `{{token}}` placeholders in label strings.
 * This mirrors i18next interpolation syntax so the following are equivalent:
 *
 *   // Option A — let i18next resolve it
 *   labels={{ download: t("pdf.download", { docName: "Salary Slip" }) }}
 *
 *   // Option B — let the component resolve it
 *   labels={{ download: "Download {{docName}}" }}
 *   context={{ docName: "Salary Slip" }}
 *
 *   // Both produce: "Download Salary Slip"
 */
import React from "react";

// ── Label dictionary ────────────────────────────────────────────────────────

export interface PdfDownloadButtonLabels {
  /** Idle state label. Supports {{docName}} token. Default: "Download PDF" */
  download?: string;
  /** Generating state label. Supports {{docName}} token. Default: "Generating..." */
  generating?: string;
  /** Screen-reader aria-label. Default: same as resolved download label */
  ariaLabel?: string;
}

// ── Interpolation context ───────────────────────────────────────────────────

/** Dynamic values for resolving {{token}} placeholders in label strings */
export interface PdfDownloadButtonContext {
  /** Document name injected into {{docName}}. E.g. "Salary Slip", "Invoice #42" */
  docName?: string;
  /** Additional custom tokens */
  [key: string]: string | undefined;
}

// ── Component props ─────────────────────────────────────────────────────────

export interface PdfDownloadButtonProps {
  onClick: () => void | Promise<void>;
  loading?: boolean;
  className?: string;
  disabled?: boolean;
  variant?: "primary" | "outline" | "ghost";
  /** Translation labels — pass from useTranslation in the consumer layer */
  labels?: PdfDownloadButtonLabels;
  /**
   * Dynamic context for {{token}} interpolation in labels.
   * E.g. `context={{ docName: "Salary Slip" }}` + `labels.download="Download {{docName}}"`
   * resolves to "Download Salary Slip".
   */
  context?: PdfDownloadButtonContext;
  /** @deprecated Use `labels.download` instead. Kept for backwards compatibility. */
  label?: string;
}

// ── Interpolation utility ───────────────────────────────────────────────────

/**
 * Resolves {{token}} placeholders in a template string.
 * Mirrors i18next interpolation so pre-translated strings pass through unchanged.
 */
function interpolate(template: string, ctx: PdfDownloadButtonContext): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => ctx[key] ?? "");
}

// ── Component ───────────────────────────────────────────────────────────────

export const PdfDownloadButton: React.FC<PdfDownloadButtonProps> = ({
  onClick,
  loading = false,
  label,
  className = "",
  disabled = false,
  variant = "outline",
  labels = {},
  context = {},
}) => {
  const hasDocName = Boolean(context.docName);

  // Raw templates (before interpolation)
  const rawDownload =
    labels.download ??
    label ??
    (hasDocName ? "Download {{docName}}" : "Download PDF");
  const rawGenerating =
    labels.generating ??
    (hasDocName ? "Generating {{docName}}..." : "Generating...");

  // Resolved final strings
  const downloadLabel = hasDocName
    ? interpolate(rawDownload, context)
    : rawDownload;
  const generatingLabel = hasDocName
    ? interpolate(rawGenerating, context)
    : rawGenerating;
  const ariaLabel = labels.ariaLabel
    ? interpolate(labels.ariaLabel, context)
    : downloadLabel;

  const baseClass =
    "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  const variantClass = {
    primary: "bg-primary text-white hover:bg-primary/90",
    outline: "border border-border text-foreground hover:bg-surface",
    ghost: "text-foreground hover:bg-surface",
  }[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading}
      className={`${baseClass} ${variantClass} ${className}`}
    >
      {loading ? (
        <>
          <svg
            className="w-4 h-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          {generatingLabel}
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          {downloadLabel}
        </>
      )}
    </button>
  );
};
