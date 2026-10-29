import type { ReactNode } from "react";

import { resolveTranslation } from "@ui/form/utils/i18n.utils";
import type { PaginationContext, PaginationLabel } from "../types";

/**
 * Resolves a PaginationLabel (string template, function, or i18n key) to a final string/ReactNode.
 *
 * Template strings support {variable} placeholders:
 *   "Showing {from}-{to} of {total} records"
 *
 * Available variables: from, to, total, page, totalPages, pageSize, selectedCount
 */
export function resolvePaginationLabel(
  label: PaginationLabel | undefined,
  fallback: string,
  ctx: PaginationContext
): string | ReactNode {
  if (!label) {
    return resolveTranslation(fallback, "common/base", ctx as unknown as Record<string, unknown>);
  }
  if (typeof label === "function") return label(ctx);

  const rawText = resolveTranslation(label, "common/base", ctx as unknown as Record<string, unknown>);
  return rawText.replace(/\{(\w+)\}/g, (_, key: string) => {
    const val = ctx[key as keyof PaginationContext];
    if (val === undefined) return `{${key}}`;
    if (typeof val === "number") return val.toLocaleString();
    return String(val);
  });
}
