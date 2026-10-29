import { useMemo } from "react";

export type DescribedById = string | null | undefined | false;

/**
 * Pure utility function to merge multiple IDs into a space-separated aria-describedby attribute value.
 */
export function mergeAriaDescribedBy(...ids: DescribedById[]): string | undefined {
  const validIds = ids
    .flatMap((id) => (typeof id === "string" ? id.trim().split(/\s+/) : []))
    .filter(Boolean);

  if (validIds.length === 0) return undefined;
  return Array.from(new Set(validIds)).join(" ");
}

/**
 * Hook to memoize merged aria-describedby attributes.
 */
export function useAriaDescribedBy(...ids: DescribedById[]): string | undefined {
  return useMemo(() => mergeAriaDescribedBy(...ids), ids);
}
